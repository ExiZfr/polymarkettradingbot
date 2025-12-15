#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           CRYPTO ORACLE v1.0                                   ║
║                  Smart Money + Volatility Mean Reversion                       ║
║                    For Long-Term Crypto Price Markets                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Strategy Fusion:
  A) Smart Money Tracking → Determines DIRECTION (Bullish/Bearish Bias)
  B) Volatility Mean Reversion → Executes ENTRY during panic dips

Target Markets: "Bitcoin > $X by 2025", "ETH > $Y in 2025", etc.
"""

import os
import sys
import json
import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Literal
from dataclasses import dataclass, field
from enum import Enum

import requests
import numpy as np
import pandas as pd

# Optional imports with fallback
try:
    import ccxt
    CCXT_AVAILABLE = True
except ImportError:
    CCXT_AVAILABLE = False
    print("[WARN] ccxt not installed. Run: pip install ccxt")

try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import OrderArgs, OrderType
    CLOB_AVAILABLE = True
except ImportError:
    CLOB_AVAILABLE = False
    print("[WARN] py_clob_client not installed. Run: pip install py-clob-client")

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class OracleConfig:
    """Configuration for CryptoOracle"""
    # API Endpoints
    gamma_api: str = "https://gamma-api.polymarket.com"
    clob_api: str = "https://clob.polymarket.com"
    
    # Execution Settings
    private_key: str = field(default_factory=lambda: os.getenv("POLY_PRIVATE_KEY", ""))
    chain_id: int = 137  # Polygon Mainnet
    
    # Strategy Parameters
    min_smart_wallet_profit: float = 10000  # $10k min profit to be "smart"
    sentiment_threshold: float = 0.5  # Bullish if > 0.5
    overreaction_spot_drop: float = 0.02  # 2% spot drop
    overreaction_poly_drop: float = 0.10  # 10% poly drop = overreaction
    
    # Position Management
    take_profit_threshold: float = 0.20  # 20% profit to start hedging
    hedge_percentage: float = 0.5  # Sell 50% to recover cost basis
    max_position_size: float = 1000  # Max $1000 per trade
    
    # Risk Management
    max_daily_trades: int = 5
    cooldown_after_trade: int = 300  # 5 min cooldown
    
    # Polling
    loop_interval: int = 10  # Check every 10 seconds


class Bias(Enum):
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"


@dataclass
class SentimentResult:
    """Result from smart money analysis"""
    bias: Bias
    score: float  # -1 to 1
    smart_wallets_count: int
    total_yes_exposure: float
    total_no_exposure: float
    confidence: float
    

@dataclass
class DiscrepancySignal:
    """Signal from spot vs poly comparison"""
    is_overreaction: bool
    spot_price: float
    spot_change_pct: float
    poly_price: float
    poly_change_pct: float
    fair_value_estimate: float
    alpha: float  # Difference between fair value and current poly price


@dataclass
class Position:
    """Active position tracking"""
    market_id: str
    token_id: str
    outcome: str
    entry_price: float
    current_price: float
    shares: float
    cost_basis: float
    is_hedged: bool = False
    hedge_amount: float = 0
    entry_time: datetime = field(default_factory=datetime.now)


# ═══════════════════════════════════════════════════════════════════════════════
# CRYPTO ORACLE CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class CryptoOracle:
    """
    Main CryptoOracle trading bot.
    Combines Smart Money Tracking + Volatility Mean Reversion.
    """
    
    def __init__(self, config: OracleConfig = None):
        self.config = config or OracleConfig()
        self.logger = self._setup_logging()
        
        # Exchange for spot prices
        self.exchange = None
        if CCXT_AVAILABLE:
            self.exchange = ccxt.binance({
                'enableRateLimit': True,
                'options': {'defaultType': 'spot'}
            })
        
        # CLOB client for execution
        self.clob_client = None
        if CLOB_AVAILABLE and self.config.private_key:
            try:
                self.clob_client = ClobClient(
                    self.config.clob_api,
                    key=self.config.private_key,
                    chain_id=self.config.chain_id
                )
                self.logger.info("✅ CLOB client initialized")
            except Exception as e:
                self.logger.error(f"❌ Failed to init CLOB client: {e}")
        
        # State
        self.positions: Dict[str, Position] = {}
        self.price_history: Dict[str, List[Dict]] = {}  # market_id -> price snapshots
        self.daily_trades: int = 0
        self.last_trade_time: Optional[datetime] = None
        
        # Cache for smart wallet analysis
        self.smart_wallet_cache: Dict[str, List[str]] = {}
        
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger("CryptoOracle")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s',
                datefmt='%H:%M:%S'
            ))
            logger.addHandler(handler)
            
            # Also log to file
            file_handler = logging.FileHandler("crypto_oracle.log")
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s'
            ))
            logger.addHandler(file_handler)
        
        return logger

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 1: THESIS BUILDER (Smart Money Tracking)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_smart_wallets(self, min_profit: float = None) -> List[str]:
        """
        Identify smart wallets based on historical crypto market performance.
        Returns list of wallet addresses that have > min_profit in crypto markets.
        """
        min_profit = min_profit or self.config.min_smart_wallet_profit
        
        try:
            # Get all crypto-related markets
            response = requests.get(
                f"{self.config.gamma_api}/markets",
                params={"tag": "crypto", "closed": True, "limit": 100},
                timeout=30
            )
            response.raise_for_status()
            markets = response.json()
            
            wallet_profits: Dict[str, float] = {}
            
            for market in markets:
                market_id = market.get("condition_id")
                if not market_id:
                    continue
                
                # Get top holders for this market
                try:
                    holders_resp = requests.get(
                        f"{self.config.gamma_api}/markets/{market_id}/holders",
                        timeout=10
                    )
                    if holders_resp.status_code == 200:
                        holders = holders_resp.json()
                        for holder in holders:
                            addr = holder.get("address", "").lower()
                            pnl = holder.get("realized_pnl", 0)
                            wallet_profits[addr] = wallet_profits.get(addr, 0) + pnl
                except:
                    continue
            
            # Filter for profitable wallets
            smart_wallets = [
                addr for addr, profit in wallet_profits.items()
                if profit >= min_profit
            ]
            
            self.logger.info(f"📊 Found {len(smart_wallets)} smart wallets (>{min_profit}$ profit)")
            return smart_wallets
            
        except Exception as e:
            self.logger.error(f"Error fetching smart wallets: {e}")
            return []
    
    def analyze_smart_sentiment(self, market_slug: str) -> SentimentResult:
        """
        Analyze smart money sentiment for a specific market.
        Returns SentimentScore from -1 (ultra bearish) to +1 (ultra bullish).
        """
        try:
            # Get market details
            response = requests.get(
                f"{self.config.gamma_api}/markets",
                params={"slug": market_slug},
                timeout=10
            )
            response.raise_for_status()
            markets = response.json()
            
            if not markets:
                return SentimentResult(
                    bias=Bias.NEUTRAL, score=0, smart_wallets_count=0,
                    total_yes_exposure=0, total_no_exposure=0, confidence=0
                )
            
            market = markets[0]
            market_id = market.get("condition_id")
            
            # Get smart wallets (with caching)
            if "smart_wallets" not in self.smart_wallet_cache:
                self.smart_wallet_cache["smart_wallets"] = self.get_smart_wallets()
            smart_wallets = set(self.smart_wallet_cache["smart_wallets"])
            
            # Get current holders
            holders_resp = requests.get(
                f"{self.config.gamma_api}/markets/{market_id}/holders",
                timeout=10
            )
            
            if holders_resp.status_code != 200:
                return SentimentResult(
                    bias=Bias.NEUTRAL, score=0, smart_wallets_count=0,
                    total_yes_exposure=0, total_no_exposure=0, confidence=0
                )
            
            holders = holders_resp.json()
            
            # Calculate smart money exposure
            total_yes = 0
            total_no = 0
            smart_count = 0
            
            for holder in holders:
                addr = holder.get("address", "").lower()
                if addr in smart_wallets:
                    smart_count += 1
                    # Assume positive shares = YES, negative = NO
                    shares = holder.get("shares", 0)
                    if shares > 0:
                        total_yes += abs(shares)
                    else:
                        total_no += abs(shares)
            
            # Calculate sentiment score
            total_exposure = total_yes + total_no
            if total_exposure == 0:
                score = 0
                confidence = 0
            else:
                # Score from -1 to +1
                score = (total_yes - total_no) / total_exposure
                # Confidence based on smart wallet participation
                confidence = min(1.0, smart_count / 10)  # Max confidence at 10+ smart wallets
            
            # Determine bias
            if score > self.config.sentiment_threshold:
                bias = Bias.BULLISH
            elif score < -self.config.sentiment_threshold:
                bias = Bias.BEARISH
            else:
                bias = Bias.NEUTRAL
            
            result = SentimentResult(
                bias=bias,
                score=score,
                smart_wallets_count=smart_count,
                total_yes_exposure=total_yes,
                total_no_exposure=total_no,
                confidence=confidence
            )
            
            self.logger.info(
                f"🧠 Sentiment for {market_slug}: {bias.value} "
                f"(Score: {score:.2f}, Smart Wallets: {smart_count})"
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error analyzing sentiment: {e}")
            return SentimentResult(
                bias=Bias.NEUTRAL, score=0, smart_wallets_count=0,
                total_yes_exposure=0, total_no_exposure=0, confidence=0
            )

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 2: DISCREPANCY SCANNER (Spot vs Poly)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_spot_price(self, symbol: str = "BTC/USDT") -> Optional[float]:
        """Fetch real-time spot price from Binance via CCXT"""
        if not self.exchange:
            self.logger.warning("CCXT not available, using fallback")
            return self._get_spot_price_fallback(symbol)
        
        try:
            ticker = self.exchange.fetch_ticker(symbol)
            return ticker['last']
        except Exception as e:
            self.logger.error(f"Error fetching spot price: {e}")
            return self._get_spot_price_fallback(symbol)
    
    def _get_spot_price_fallback(self, symbol: str) -> Optional[float]:
        """Fallback to CoinGecko API for spot prices"""
        coin_map = {
            "BTC/USDT": "bitcoin",
            "ETH/USDT": "ethereum",
            "SOL/USDT": "solana"
        }
        coin_id = coin_map.get(symbol, "bitcoin")
        
        try:
            response = requests.get(
                f"https://api.coingecko.com/api/v3/simple/price",
                params={"ids": coin_id, "vs_currencies": "usd"},
                timeout=10
            )
            data = response.json()
            return data.get(coin_id, {}).get("usd")
        except:
            return None
    
    def get_poly_price(self, market_id: str, outcome: str = "YES") -> Optional[float]:
        """Fetch current Polymarket price for an outcome"""
        try:
            response = requests.get(
                f"{self.config.gamma_api}/markets/{market_id}",
                timeout=10
            )
            response.raise_for_status()
            market = response.json()
            
            if outcome == "YES":
                return market.get("outcomePrices", [0.5, 0.5])[0]
            else:
                return market.get("outcomePrices", [0.5, 0.5])[1]
        except Exception as e:
            self.logger.error(f"Error fetching poly price: {e}")
            return None
    
    def calculate_implied_probability(
        self, 
        spot_price: float, 
        strike_price: float, 
        days_left: int,
        volatility: float = 0.60  # Annual volatility (60% for crypto)
    ) -> float:
        """
        Simplified Black-Scholes-ish probability estimate.
        Calculates P(Spot > Strike) by expiry.
        
        Uses a simplified log-normal assumption.
        """
        if days_left <= 0:
            return 1.0 if spot_price > strike_price else 0.0
        
        # Time to expiry in years
        T = days_left / 365.0
        
        # Simplified model: assume log-normal distribution
        # d = (ln(S/K) + 0.5 * σ² * T) / (σ * √T)
        import math
        
        try:
            sigma = volatility
            S = spot_price
            K = strike_price
            
            if S <= 0 or K <= 0:
                return 0.5
            
            d = (math.log(S / K) + 0.5 * sigma**2 * T) / (sigma * math.sqrt(T))
            
            # Use standard normal CDF (approximation)
            # Φ(d) ≈ 0.5 * (1 + tanh(sqrt(2/π) * d))
            probability = 0.5 * (1 + math.tanh(math.sqrt(2 / math.pi) * d))
            
            return max(0.01, min(0.99, probability))  # Clamp to realistic range
            
        except Exception as e:
            self.logger.error(f"Error calculating probability: {e}")
            return 0.5
    
    def monitor_fair_value(
        self,
        market_id: str,
        strike_price: float,
        expiry_date: datetime,
        symbol: str = "BTC/USDT"
    ) -> DiscrepancySignal:
        """
        Compare Spot price movement vs Polymarket price movement.
        Detects overreactions when Poly drops more than Spot justifies.
        """
        # Get current prices
        spot_price = self.get_spot_price(symbol)
        poly_price = self.get_poly_price(market_id)
        
        if spot_price is None or poly_price is None:
            return DiscrepancySignal(
                is_overreaction=False, spot_price=0, spot_change_pct=0,
                poly_price=0, poly_change_pct=0, fair_value_estimate=0.5, alpha=0
            )
        
        # Get price history for comparison
        history_key = f"{market_id}_{symbol}"
        if history_key not in self.price_history:
            self.price_history[history_key] = []
        
        # Add current snapshot
        self.price_history[history_key].append({
            "timestamp": datetime.now(),
            "spot": spot_price,
            "poly": poly_price
        })
        
        # Keep only last 1 hour of data
        cutoff = datetime.now() - timedelta(hours=1)
        self.price_history[history_key] = [
            p for p in self.price_history[history_key]
            if p["timestamp"] > cutoff
        ]
        
        # Calculate changes (need at least 2 data points)
        history = self.price_history[history_key]
        if len(history) < 2:
            return DiscrepancySignal(
                is_overreaction=False, spot_price=spot_price, spot_change_pct=0,
                poly_price=poly_price, poly_change_pct=0, 
                fair_value_estimate=poly_price, alpha=0
            )
        
        # Compare to 5 minutes ago (or oldest available)
        lookback_time = datetime.now() - timedelta(minutes=5)
        baseline = None
        for p in history:
            if p["timestamp"] <= lookback_time:
                baseline = p
                break
        
        if baseline is None:
            baseline = history[0]
        
        spot_change = (spot_price - baseline["spot"]) / baseline["spot"]
        poly_change = (poly_price - baseline["poly"]) / baseline["poly"] if baseline["poly"] > 0 else 0
        
        # Calculate fair value
        days_left = (expiry_date - datetime.now()).days
        fair_value = self.calculate_implied_probability(spot_price, strike_price, days_left)
        
        # Alpha = Difference between fair value and current poly price
        alpha = fair_value - poly_price
        
        # Detect overreaction
        # If spot drops 2% but poly drops 10% → OVERREACTION
        is_overreaction = (
            spot_change > -self.config.overreaction_spot_drop and  # Spot didn't drop much
            poly_change < -self.config.overreaction_poly_drop and  # But poly dropped a lot
            alpha > 0.05  # Fair value suggests underpriced by 5%+
        )
        
        signal = DiscrepancySignal(
            is_overreaction=is_overreaction,
            spot_price=spot_price,
            spot_change_pct=spot_change * 100,
            poly_price=poly_price,
            poly_change_pct=poly_change * 100,
            fair_value_estimate=fair_value,
            alpha=alpha
        )
        
        if is_overreaction:
            self.logger.warning(
                f"🚨 OVERREACTION DETECTED!\n"
                f"   Spot: ${spot_price:,.0f} ({spot_change*100:+.2f}%)\n"
                f"   Poly: ${poly_price:.3f} ({poly_change*100:+.2f}%)\n"
                f"   Fair Value: ${fair_value:.3f} | Alpha: {alpha*100:+.1f}%"
            )
        
        return signal

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 3: SNIPER EXECUTION (Panic Entry)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def execute_dip_buy(
        self,
        market_id: str,
        token_id: str,
        sentiment: SentimentResult,
        discrepancy: DiscrepancySignal,
        size: float = None
    ) -> Optional[str]:
        """
        Execute a LIMIT BUY order when conditions are met:
        1. Smart money is bullish
        2. Overreaction detected
        
        Places order at bid to be a maker (not taker).
        """
        # Validate conditions
        if sentiment.bias != Bias.BULLISH:
            self.logger.info("❌ Skipping: Smart money not bullish")
            return None
        
        if not discrepancy.is_overreaction:
            self.logger.info("❌ Skipping: No overreaction detected")
            return None
        
        # Check risk limits
        if self.daily_trades >= self.config.max_daily_trades:
            self.logger.warning("⚠️ Daily trade limit reached")
            return None
        
        if self.last_trade_time:
            cooldown = (datetime.now() - self.last_trade_time).seconds
            if cooldown < self.config.cooldown_after_trade:
                self.logger.info(f"⏳ Cooldown: {self.config.cooldown_after_trade - cooldown}s remaining")
                return None
        
        # Calculate position size
        size = size or min(
            self.config.max_position_size,
            self.config.max_position_size * sentiment.confidence
        )
        
        # Calculate limit price (slightly below current to be maker)
        limit_price = discrepancy.poly_price * 0.98  # 2% below current
        
        self.logger.info(
            f"🎯 SNIPING OPPORTUNITY:\n"
            f"   Market: {market_id}\n"
            f"   Bias: {sentiment.bias.value} (Score: {sentiment.score:.2f})\n"
            f"   Alpha: {discrepancy.alpha*100:+.1f}%\n"
            f"   Size: ${size:.2f}\n"
            f"   Limit Price: ${limit_price:.4f}"
        )
        
        if not self.clob_client:
            self.logger.warning("⚠️ CLOB client not available - DRY RUN")
            return "DRY_RUN_ORDER"
        
        try:
            # Create order
            order = self.clob_client.create_order(
                OrderArgs(
                    token_id=token_id,
                    price=limit_price,
                    size=size / limit_price,  # Convert to shares
                    side="BUY"
                ),
                OrderType.GTC  # Good till cancelled
            )
            
            order_id = order.get("orderID")
            self.logger.info(f"✅ Order placed: {order_id}")
            
            # Track position
            self.positions[market_id] = Position(
                market_id=market_id,
                token_id=token_id,
                outcome="YES",
                entry_price=limit_price,
                current_price=discrepancy.poly_price,
                shares=size / limit_price,
                cost_basis=size
            )
            
            # Update state
            self.daily_trades += 1
            self.last_trade_time = datetime.now()
            
            return order_id
            
        except Exception as e:
            self.logger.error(f"❌ Order failed: {e}")
            return None

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 4: POSITION MANAGEMENT (Free Ride / Partial Hedge)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def manage_position(self, market_id: str) -> Optional[str]:
        """
        Manage existing position:
        - If profit > 20%, sell 50% to recover cost basis
        - Keep rest as "moonbag" (risk-free position)
        """
        if market_id not in self.positions:
            return None
        
        position = self.positions[market_id]
        
        # Already hedged
        if position.is_hedged:
            return None
        
        # Get current price
        current_price = self.get_poly_price(market_id)
        if current_price is None:
            return None
        
        position.current_price = current_price
        
        # Calculate P&L
        current_value = position.shares * current_price
        pnl_pct = (current_value - position.cost_basis) / position.cost_basis
        
        self.logger.info(
            f"📈 Position {market_id}: "
            f"Entry ${position.entry_price:.3f} → ${current_price:.3f} "
            f"({pnl_pct*100:+.1f}%)"
        )
        
        # Check if we should hedge
        if pnl_pct >= self.config.take_profit_threshold:
            self.logger.info(
                f"🔒 HEDGING: Profit {pnl_pct*100:.1f}% > {self.config.take_profit_threshold*100}% threshold"
            )
            
            # Calculate shares to sell (recover cost basis)
            shares_to_sell = position.cost_basis / current_price
            shares_to_sell = min(shares_to_sell, position.shares * self.config.hedge_percentage)
            
            if not self.clob_client:
                self.logger.warning("⚠️ CLOB client not available - DRY RUN HEDGE")
                position.is_hedged = True
                position.hedge_amount = shares_to_sell * current_price
                return "DRY_RUN_HEDGE"
            
            try:
                order = self.clob_client.create_order(
                    OrderArgs(
                        token_id=position.token_id,
                        price=current_price * 1.01,  # Slightly above to be maker
                        size=shares_to_sell,
                        side="SELL"
                    ),
                    OrderType.GTC
                )
                
                order_id = order.get("orderID")
                self.logger.info(
                    f"✅ Hedge order placed: {order_id}\n"
                    f"   Sold {shares_to_sell:.2f} shares @ ${current_price:.3f}\n"
                    f"   Recovered: ${shares_to_sell * current_price:.2f}\n"
                    f"   Remaining moonbag: {position.shares - shares_to_sell:.2f} shares"
                )
                
                position.is_hedged = True
                position.hedge_amount = shares_to_sell * current_price
                position.shares -= shares_to_sell
                
                return order_id
                
            except Exception as e:
                self.logger.error(f"❌ Hedge order failed: {e}")
                return None
        
        return None

    # ═══════════════════════════════════════════════════════════════════════════
    # MAIN LOOP
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def run_loop(self, markets: List[Dict]):
        """
        Main async loop monitoring markets.
        
        markets: List of dicts with keys:
            - market_id: Polymarket condition ID
            - token_id: Token ID for the YES outcome
            - slug: Market slug
            - symbol: Crypto symbol (BTC/USDT, ETH/USDT)
            - strike_price: Target price (e.g., 100000 for BTC > $100k)
            - expiry: Expiry datetime
        """
        self.logger.info("=" * 60)
        self.logger.info("🔮 CRYPTO ORACLE v1.0 STARTING")
        self.logger.info(f"   Monitoring {len(markets)} markets")
        self.logger.info("=" * 60)
        
        while True:
            try:
                for market in markets:
                    market_id = market["market_id"]
                    
                    # Phase 1: Get insider bias
                    sentiment = self.analyze_smart_sentiment(market["slug"])
                    
                    # Phase 2: Check for discrepancy
                    discrepancy = self.monitor_fair_value(
                        market_id=market_id,
                        strike_price=market["strike_price"],
                        expiry_date=market["expiry"],
                        symbol=market["symbol"]
                    )
                    
                    # Phase 3: Execute if conditions met
                    if sentiment.bias == Bias.BULLISH and discrepancy.is_overreaction:
                        self.execute_dip_buy(
                            market_id=market_id,
                            token_id=market["token_id"],
                            sentiment=sentiment,
                            discrepancy=discrepancy
                        )
                    
                    # Phase 4: Manage existing positions
                    if market_id in self.positions:
                        self.manage_position(market_id)
                    
                    # Small delay between markets
                    await asyncio.sleep(1)
                
                # Main loop delay
                await asyncio.sleep(self.config.loop_interval)
                
                # Reset daily counter at midnight
                if datetime.now().hour == 0 and datetime.now().minute == 0:
                    self.daily_trades = 0
                    self.logger.info("🔄 Daily trade counter reset")
                    
            except KeyboardInterrupt:
                self.logger.info("👋 Shutting down...")
                break
            except Exception as e:
                self.logger.error(f"Loop error: {e}")
                await asyncio.sleep(30)

    def get_insider_bias(self, keyword: str) -> Bias:
        """
        Quick helper to get bias for a market by keyword.
        Searches for markets matching the keyword.
        """
        try:
            response = requests.get(
                f"{self.config.gamma_api}/markets",
                params={"search": keyword, "limit": 5},
                timeout=10
            )
            markets = response.json()
            
            if not markets:
                return Bias.NEUTRAL
            
            # Use first matching market
            sentiment = self.analyze_smart_sentiment(markets[0].get("slug", ""))
            return sentiment.bias
            
        except:
            return Bias.NEUTRAL


    def scan_crypto_markets(self, keywords: List[str] = None) -> List[Dict]:
        """
        Scan Polymarket for all crypto price markets.
        Returns list of markets with their details.
        """
        keywords = keywords or ["bitcoin", "btc", "ethereum", "eth", "solana", "sol"]
        
        found_markets = []
        seen_ids = set()
        
        print(f"\n🔍 Scanning for crypto markets...")
        
        for keyword in keywords:
            try:
                response = requests.get(
                    f"{self.config.gamma_api}/markets",
                    params={
                        "closed": False,
                        "limit": 50,
                        "active": True
                    },
                    timeout=15
                )
                
                if response.status_code != 200:
                    continue
                
                markets = response.json()
                
                for market in markets:
                    question = market.get("question", "").lower()
                    description = market.get("description", "").lower()
                    slug = market.get("slug", "")
                    market_id = market.get("conditionId") or market.get("condition_id", "")
                    
                    # Check if it's a crypto price market
                    is_crypto = any(k in question or k in description for k in keywords)
                    is_price_market = any(word in question for word in ["price", "$", "above", "below", "hit", "reach"])
                    
                    if is_crypto and is_price_market and market_id not in seen_ids:
                        seen_ids.add(market_id)
                        
                        # Determine which crypto
                        if "bitcoin" in question or "btc" in question:
                            symbol = "BTC/USDT"
                        elif "ethereum" in question or "eth" in question:
                            symbol = "ETH/USDT"
                        elif "solana" in question or "sol" in question:
                            symbol = "SOL/USDT"
                        else:
                            symbol = "BTC/USDT"
                        
                        # Try to extract strike price from question
                        import re
                        price_match = re.search(r'\$?([\d,]+)k?', question.replace(",", ""))
                        strike_price = 0
                        if price_match:
                            strike_str = price_match.group(1).replace(",", "")
                            strike_price = float(strike_str)
                            if "k" in question.lower():
                                strike_price *= 1000
                        
                        # Get current prices - handle string or list format
                        outcome_prices = market.get("outcomePrices", [])
                        yes_price = 0.5
                        try:
                            if isinstance(outcome_prices, str):
                                import json
                                outcome_prices = json.loads(outcome_prices)
                            if outcome_prices and len(outcome_prices) > 0:
                                yes_price = float(outcome_prices[0])
                        except:
                            yes_price = 0.5
                        
                        found_markets.append({
                            "market_id": market_id,
                            "slug": slug,
                            "question": market.get("question", ""),
                            "symbol": symbol,
                            "strike_price": strike_price,
                            "yes_price": yes_price,
                            "volume": market.get("volume", 0),
                            "liquidity": market.get("liquidity", 0)
                        })
                        
            except Exception as e:
                self.logger.error(f"Error scanning for {keyword}: {e}")
                continue
        
        # Sort by volume
        found_markets.sort(key=lambda x: float(x.get("volume", 0) or 0), reverse=True)
        
        return found_markets
    
    def analyze_all_crypto_markets(self) -> None:
        """Scan and analyze all crypto markets."""
        markets = self.scan_crypto_markets()
        
        if not markets:
            print("❌ No crypto markets found")
            return
        
        print(f"\n📊 Found {len(markets)} crypto price markets\n")
        print("=" * 100)
        
        # Get spot prices once
        btc_price = self.get_spot_price("BTC/USDT")
        eth_price = self.get_spot_price("ETH/USDT")
        sol_price = self.get_spot_price("SOL/USDT")
        
        spot_prices = {
            "BTC/USDT": btc_price,
            "ETH/USDT": eth_price,
            "SOL/USDT": sol_price
        }
        
        print(f"💰 Spot Prices: BTC ${btc_price:,.0f} | ETH ${eth_price:,.0f} | SOL ${sol_price:,.0f}\n")
        
        for i, market in enumerate(markets[:20], 1):  # Top 20 by volume
            question = market["question"][:60] + "..." if len(market["question"]) > 60 else market["question"]
            slug = market["slug"]
            yes_price = market["yes_price"]
            volume = float(market.get("volume", 0) or 0)
            symbol = market["symbol"]
            strike = market["strike_price"]
            spot = spot_prices.get(symbol, 0)
            
            # Calculate fair value if we have strike price
            if strike > 0 and spot > 0:
                # Simple estimate: if spot > strike, should be > 50%
                distance_pct = (spot - strike) / strike * 100
                if distance_pct > 0:
                    fair_estimate = min(0.95, 0.5 + distance_pct / 100)
                else:
                    fair_estimate = max(0.05, 0.5 + distance_pct / 200)
                alpha = fair_estimate - yes_price
            else:
                fair_estimate = 0.5
                alpha = 0
            
            # Analyze sentiment (quick version - just print, don't fetch for each)
            alpha_str = f"{alpha*100:+.1f}%" if alpha != 0 else "N/A"
            alpha_color = "🟢" if alpha > 0.05 else "🔴" if alpha < -0.05 else "⚪"
            
            print(f"{i:2}. {question}")
            print(f"    📈 YES: ${yes_price:.2f} | Vol: ${volume:,.0f} | {symbol} Strike: ${strike:,.0f}")
            print(f"    {alpha_color} Alpha: {alpha_str} (Fair: ${fair_estimate:.2f})")
            print(f"    🔗 Slug: {slug}")
            print()
        
        print("=" * 100)
        print("\n💡 Use --analyze <slug> to get detailed sentiment analysis for a specific market")


# ═══════════════════════════════════════════════════════════════════════════════
# CLI / MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="CryptoOracle - Smart Money + Mean Reversion Bot")
    parser.add_argument("--dry-run", action="store_true", help="Run without executing trades")
    parser.add_argument("--analyze", type=str, help="Analyze a specific market slug")
    parser.add_argument("--spot", type=str, help="Check spot price for symbol (BTC/USDT, ETH/USDT)")
    parser.add_argument("--scan", action="store_true", help="Scan all BTC/ETH markets")
    args = parser.parse_args()
    
    oracle = CryptoOracle()
    
    if args.scan:
        oracle.analyze_all_crypto_markets()
    
    elif args.analyze:
        print(f"\n🔍 Analyzing market: {args.analyze}")
        sentiment = oracle.analyze_smart_sentiment(args.analyze)
        print(f"   Bias: {sentiment.bias.value}")
        print(f"   Score: {sentiment.score:.2f}")
        print(f"   Smart Wallets: {sentiment.smart_wallets_count}")
        print(f"   YES Exposure: ${sentiment.total_yes_exposure:,.0f}")
        print(f"   NO Exposure: ${sentiment.total_no_exposure:,.0f}")
        print(f"   Confidence: {sentiment.confidence:.1%}")
        
    elif args.spot:
        price = oracle.get_spot_price(args.spot)
        print(f"\n💰 {args.spot}: ${price:,.2f}" if price else f"❌ Failed to get {args.spot}")
        
    else:
        print("\n🔮 CryptoOracle v1.0")
        print("=" * 40)
        print("Usage:")
        print("  --scan            Scan all BTC/ETH markets")
        print("  --analyze <slug>  Analyze market sentiment")
        print("  --spot <symbol>   Check spot price (BTC/USDT, ETH/USDT)")
        print("  --dry-run         Run bot without execution")
        print("\nExamples:")
        print("  python crypto_oracle.py --scan")
        print("  python crypto_oracle.py --analyze will-bitcoin-hit-100k-2025")
        print("  python crypto_oracle.py --spot BTC/USDT")
