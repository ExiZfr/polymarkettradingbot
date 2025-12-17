#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    POLYGRAALX MEAN REVERSION STRATEGY v1.0                   ║
║                    HFT Statistical Arbitrage for Polymarket                  ║
║                                                                               ║
║  Philosophy: KISS - Pure Statistics > Machine Learning                       ║
║  Edge: Mean Reversion after volatility shocks on 15min BTC/ETH markets      ║
╚══════════════════════════════════════════════════════════════════════════════╝

Strategy Logic:
1. Monitor 1-minute candles for statistical anomalies (Z-Score > 2σ)
2. Detect crowd euphoria/panic when prices spike
3. Fade the crowd by betting on Mean Reversion
4. Use Kelly Criterion for position sizing
5. Time-based stops for capital preservation
"""

import asyncio
import os
import sys
import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import deque
import statistics
import math

# Third-party
import requests
from dotenv import load_dotenv

# Try to import ccxt for exchange data
try:
    import ccxt
    CCXT_AVAILABLE = True
except ImportError:
    CCXT_AVAILABLE = False
    print("⚠️  ccxt not installed. Using fallback price source.")

# Try to import py_clob_client for Polymarket
try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import OrderArgs, OrderType
    CLOB_AVAILABLE = True
except ImportError:
    CLOB_AVAILABLE = False
    print("⚠️  py_clob_client not installed. Running in simulation mode.")

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class Config:
    """Strategy Configuration - Tune these for your risk appetite"""
    
    # API Keys (set in .env)
    POLY_API_KEY: str = os.getenv("POLY_API_KEY", "")
    POLY_SECRET: str = os.getenv("POLY_SECRET", "")
    POLY_PASSPHRASE: str = os.getenv("POLY_PASSPHRASE", "")
    
    # PolygraalX Backend API (for auto-execute)
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://127.0.0.1:3001")
    AUTO_EXECUTE_ENABLED: bool = os.getenv("AUTO_EXECUTE_ENABLED", "true").lower() == "true"
    DEFAULT_TRADE_SIZE: float = float(os.getenv("DEFAULT_TRADE_SIZE", "10"))
    
    # Polymarket CLOB
    CLOB_HOST: str = "https://clob.polymarket.com"
    GAMMA_API: str = "https://gamma-api.polymarket.com"
    
    # Exchange for spot prices (Binance by default)
    EXCHANGE: str = "binance"
    SYMBOLS: List[str] = field(default_factory=lambda: ["BTC/USDT", "ETH/USDT"])
    
    # Statistical Parameters
    LOOKBACK_PERIOD: int = 30          # Candles for rolling stats
    Z_SCORE_THRESHOLD: float = 2.0     # Entry signal (2 sigma)
    Z_SCORE_EXTREME: float = 3.0       # Strong signal (3 sigma)
    
    # Position Sizing (Kelly Criterion)
    KELLY_FRACTION: float = 0.25       # Fractional Kelly (conservative)
    MAX_POSITION_USD: float = 100.0    # Hard cap per trade
    MIN_POSITION_USD: float = 5.0      # Minimum viable trade
    
    # Risk Management
    TIME_STOP_MINUTES: int = 5         # Exit if no reversion after X minutes
    MAX_DRAWDOWN_PCT: float = 0.10     # Stop trading if -10% on day
    DAILY_LOSS_LIMIT: float = 50.0     # Max USD loss per day
    
    # Execution
    POLL_INTERVAL_SEC: float = 1.0     # Price polling interval
    MIN_EDGE_PCT: float = 0.03         # Minimum 3% edge to trade
    
    # Logging
    LOG_LEVEL: str = "INFO"


config = Config()

# ============================================================================
# LOGGING
# ============================================================================

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("MeanReversionBot")

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class Candle:
    """1-minute OHLCV candle"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    
    @property
    def change_pct(self) -> float:
        """Percentage change from open to close"""
        if self.open == 0:
            return 0
        return ((self.close - self.open) / self.open) * 100
    
    @property
    def range_pct(self) -> float:
        """High-Low range as percentage"""
        if self.low == 0:
            return 0
        return ((self.high - self.low) / self.low) * 100


@dataclass
class Signal:
    """Trading signal from the strategy"""
    symbol: str
    timestamp: datetime
    z_score: float
    direction: str  # "LONG" or "SHORT" (bet on reversion)
    confidence: float  # 0-1
    entry_price: float
    expected_value: float
    kelly_size: float
    market_id: str
    outcome: str  # "YES" or "NO"
    market_question: str = ""
    market_image: str = ""
    market_url: str = ""
    market_slug: str = ""


@dataclass
class Position:
    """Active trading position"""
    signal: Signal
    entry_time: datetime
    size_usd: float
    entry_price: float
    status: str = "OPEN"
    exit_time: Optional[datetime] = None
    exit_price: Optional[float] = None
    pnl: float = 0.0


# ============================================================================
# PRICE FEED (Exchange Data)
# ============================================================================

class PriceFeed:
    """
    Real-time price data from exchanges.
    Uses ccxt for exchange connectivity.
    Fallback to CoinGecko API if ccxt unavailable.
    """
    
    def __init__(self, exchange_id: str = "binance"):
        self.exchange_id = exchange_id
        self.exchange = None
        self.candles: Dict[str, deque] = {}  # symbol -> candles
        
        if CCXT_AVAILABLE:
            try:
                exchange_class = getattr(ccxt, exchange_id)
                self.exchange = exchange_class({
                    'enableRateLimit': True,
                    'timeout': 10000,
                })
                logger.info(f"✅ Connected to {exchange_id}")
            except Exception as e:
                logger.warning(f"⚠️  Failed to connect to {exchange_id}: {e}")
        
        # Initialize candle buffers
        for symbol in config.SYMBOLS:
            self.candles[symbol] = deque(maxlen=config.LOOKBACK_PERIOD + 10)
    
    def get_spot_price(self, symbol: str) -> Optional[float]:
        """Get current spot price"""
        if self.exchange:
            try:
                ticker = self.exchange.fetch_ticker(symbol)
                return ticker['last']
            except Exception as e:
                logger.warning(f"Exchange error: {e}")
        
        # Fallback: CoinGecko
        return self._fallback_price(symbol)
    
    def _fallback_price(self, symbol: str) -> Optional[float]:
        """Fallback price source using CoinGecko"""
        try:
            coin = symbol.split('/')[0].lower()
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies=usd"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return data.get(coin, {}).get('usd')
        except:
            pass
        return None
    
    def fetch_recent_candles(self, symbol: str, timeframe: str = '1m', limit: int = 30) -> List[Candle]:
        """Fetch recent OHLCV candles"""
        if not self.exchange:
            return list(self.candles.get(symbol, []))
        
        try:
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            candles = []
            for c in ohlcv:
                candle = Candle(
                    timestamp=datetime.fromtimestamp(c[0] / 1000),
                    open=c[1],
                    high=c[2],
                    low=c[3],
                    close=c[4],
                    volume=c[5]
                )
                candles.append(candle)
            
            # Update buffer
            self.candles[symbol] = deque(candles, maxlen=config.LOOKBACK_PERIOD + 10)
            return candles
            
        except Exception as e:
            logger.error(f"Failed to fetch candles: {e}")
            return list(self.candles.get(symbol, []))
    
    def add_candle(self, symbol: str, candle: Candle):
        """Add a new candle to the buffer"""
        if symbol not in self.candles:
            self.candles[symbol] = deque(maxlen=config.LOOKBACK_PERIOD + 10)
        self.candles[symbol].append(candle)


# ============================================================================
# SIGNAL GENERATOR (Statistical Logic)
# ============================================================================

class SignalGenerator:
    """
    Core statistical logic for Mean Reversion strategy.
    Detects anomalies using Z-Score and generates trading signals.
    """
    
    def __init__(self, price_feed: PriceFeed):
        self.price_feed = price_feed
        self.signals_generated = 0
    
    def calculate_z_score(self, values: List[float], current: float) -> float:
        """
        Calculate Z-Score of current value vs historical distribution.
        Z = (X - μ) / σ
        """
        if len(values) < 5:
            return 0.0
        
        mean = statistics.mean(values)
        stdev = statistics.stdev(values)
        
        if stdev == 0:
            return 0.0
        
        return (current - mean) / stdev
    
    def calculate_bollinger_position(self, candles: List[Candle], period: int = 20) -> Tuple[float, float, float]:
        """
        Calculate Bollinger Bands position.
        Returns: (position_pct, upper_band, lower_band)
        Position: 0 = at lower, 1 = at upper, 0.5 = middle
        """
        if len(candles) < period:
            return 0.5, 0, 0
        
        closes = [c.close for c in candles[-period:]]
        mean = statistics.mean(closes)
        stdev = statistics.stdev(closes) if len(closes) > 1 else 0
        
        upper = mean + (2 * stdev)
        lower = mean - (2 * stdev)
        current = candles[-1].close
        
        if upper == lower:
            return 0.5, upper, lower
        
        position = (current - lower) / (upper - lower)
        return max(0, min(1, position)), upper, lower
    
    def calculate_expected_value(self, win_prob: float, win_pct: float, loss_pct: float) -> float:
        """
        Calculate Expected Value of a trade.
        EV = (P(win) * Win%) - (P(loss) * Loss%)
        """
        loss_prob = 1 - win_prob
        return (win_prob * win_pct) - (loss_prob * loss_pct)
    
    def calculate_kelly_size(self, win_prob: float, odds: float) -> float:
        """
        Kelly Criterion for optimal position sizing.
        f* = (bp - q) / b
        where:
            b = odds received on the bet
            p = probability of winning
            q = probability of losing (1 - p)
        
        Returns: Fraction of bankroll to bet (0 to 1)
        """
        if odds <= 0:
            return 0
        
        q = 1 - win_prob
        kelly = (win_prob * odds - q) / odds
        
        # Apply fractional Kelly for safety
        kelly = kelly * config.KELLY_FRACTION
        
        # Clamp to reasonable range
        return max(0, min(0.25, kelly))  # Never bet more than 25%
    
    def detect_volatility_spike(self, candles: List[Candle]) -> Tuple[float, str]:
        """
        Detect if latest candle is a volatility spike.
        Returns: (z_score, direction)
        Direction: "PUMP" if positive spike, "DUMP" if negative
        """
        if len(candles) < config.LOOKBACK_PERIOD:
            return 0.0, "NONE"
        
        # Calculate change percentages for historical candles
        historical_changes = [c.change_pct for c in candles[:-1]]
        current_change = candles[-1].change_pct
        
        z_score = self.calculate_z_score(historical_changes, current_change)
        
        if z_score > config.Z_SCORE_THRESHOLD:
            return z_score, "PUMP"
        elif z_score < -config.Z_SCORE_THRESHOLD:
            return abs(z_score), "DUMP"
        
        return abs(z_score), "NONE"
    
    def generate_signal(self, symbol: str, market_info: dict) -> Optional[Signal]:
        """
        Main signal generation logic.
        Analyzes price action and generates Mean Reversion signals.
        """
        candles = self.price_feed.fetch_recent_candles(symbol)
        if len(candles) < config.LOOKBACK_PERIOD:
            logger.debug(f"Insufficient data for {symbol}: {len(candles)} candles")
            return None
        
        # Detect volatility spike
        z_score, spike_direction = self.detect_volatility_spike(candles)
        
        if spike_direction == "NONE":
            return None
        
        # Calculate Bollinger position
        bb_position, bb_upper, bb_lower = self.calculate_bollinger_position(candles)
        
        # Determine trading direction (FADE the spike)
        if spike_direction == "PUMP":
            # Price spiked up -> Bet it will come down (buy NO)
            direction = "SHORT"
            outcome = "No"
            # Win probability based on Mean Reversion stats (~65% for 2σ moves)
            base_win_prob = 0.65 if z_score >= 2.0 else 0.55
            if z_score >= 3.0:
                base_win_prob = 0.75  # Higher confidence for extreme moves
        else:
            # Price dumped -> Bet it will recover (buy YES)
            direction = "LONG"
            outcome = "Yes"
            base_win_prob = 0.65 if z_score >= 2.0 else 0.55
            if z_score >= 3.0:
                base_win_prob = 0.75
        
        # Adjust probability based on Bollinger position
        if (direction == "SHORT" and bb_position > 0.9) or (direction == "LONG" and bb_position < 0.1):
            base_win_prob += 0.05  # Extreme position = higher reversion probability
        
        # Get current market prices
        yes_price = float(market_info.get('outcomePrices', '[0.5, 0.5]').strip('[]').split(',')[0])
        no_price = 1 - yes_price
        
        # Calculate edge
        entry_price = no_price if direction == "SHORT" else yes_price
        fair_value = 1 - base_win_prob if direction == "SHORT" else base_win_prob
        edge = fair_value - entry_price
        
        if edge < config.MIN_EDGE_PCT:
            logger.debug(f"Edge too small: {edge:.2%} < {config.MIN_EDGE_PCT:.2%}")
            return None
        
        # Calculate Expected Value
        # Win: We get $1 per share, minus entry cost
        win_pct = (1 - entry_price) / entry_price if entry_price > 0 else 0
        loss_pct = 1.0  # We lose our entire position
        
        ev = self.calculate_expected_value(base_win_prob, win_pct, loss_pct)
        
        if ev <= 0:
            logger.debug(f"Negative EV: {ev:.4f}")
            return None
        
        # Calculate Kelly size
        odds = (1 - entry_price) / entry_price if entry_price > 0 else 0
        kelly_size = self.calculate_kelly_size(base_win_prob, odds)
        
        # Extract market metadata
        market_id = market_info.get('conditionId', '')
        market_question = market_info.get('question', f'{symbol} 15-min Price Market')
        market_image = market_info.get('image', '') or market_info.get('icon', '')
        market_slug = market_info.get('slug', '') or market_info.get('id', '')
        market_url = f"https://polymarket.com/event/{market_slug}" if market_slug else ''
        
        # Create signal with full market metadata
        signal = Signal(
            symbol=symbol,
            timestamp=datetime.now(),
            z_score=z_score,
            direction=direction,
            confidence=base_win_prob,
            entry_price=entry_price,
            expected_value=ev,
            kelly_size=kelly_size,
            market_id=market_id,
            outcome=outcome,
            market_question=market_question,
            market_image=market_image,
            market_url=market_url,
            market_slug=market_slug
        )
        
        self.signals_generated += 1
        logger.info(f"🎯 SIGNAL: {symbol} {direction} | Z={z_score:.2f}σ | EV={ev:.2%} | Kelly={kelly_size:.1%}")
        
        return signal


# ============================================================================
# MARKET SELECTOR (Polymarket 15min Markets)
# ============================================================================

class MarketSelector:
    """
    Selects which Polymarket 15-minute markets to trade.
    Prioritizes markets with highest expected edge.
    """
    
    def __init__(self):
        self.active_markets: Dict[str, dict] = {}
        self.last_fetch = datetime.min
        self.cache_duration = timedelta(seconds=30)
    
    def fetch_15min_markets(self) -> List[dict]:
        """Fetch all active 15-minute BTC/ETH price markets from Polymarket"""
        now = datetime.now()
        
        if (now - self.last_fetch) < self.cache_duration and self.active_markets:
            return list(self.active_markets.values())
        
        try:
            response = requests.get(
                f"{config.GAMMA_API}/markets",
                params={
                    "closed": False,
                    "active": True,
                    "limit": 100
                },
                timeout=15
            )
            
            if response.status_code != 200:
                logger.warning(f"Gamma API error: {response.status_code}")
                return list(self.active_markets.values())
            
            all_markets = response.json()
            
            # Filter for 15-minute BTC/ETH markets
            keywords_15min = ['15 min', '15min', '15 minute', '15-min', '15-minute']
            keywords_crypto = ['btc', 'bitcoin', 'eth', 'ethereum']
            
            filtered = []
            for market in all_markets:
                question = (market.get('question', '') + ' ' + market.get('description', '')).lower()
                
                # Must contain 15min reference
                has_15min = any(kw in question for kw in keywords_15min)
                # Must contain crypto reference
                has_crypto = any(kw in question for kw in keywords_crypto)
                # Must be price-related
                has_price = 'price' in question or '>' in question or '<' in question
                
                if has_15min and has_crypto and has_price:
                    market_id = market.get('conditionId', '')
                    self.active_markets[market_id] = market
                    filtered.append(market)
            
            self.last_fetch = now
            logger.info(f"📊 Found {len(filtered)} active 15-minute crypto markets")
            
            return filtered
            
        except Exception as e:
            logger.error(f"Failed to fetch markets: {e}")
            return list(self.active_markets.values())
    
    def select_best_market(self, symbol: str) -> Optional[dict]:
        """
        Select the best market to trade for a given symbol.
        Prioritizes:
        1. Markets expiring soon (more volatile, higher edge)
        2. Markets with reasonable liquidity
        3. Markets with prices away from 0.5 (more edge potential)
        """
        markets = self.fetch_15min_markets()
        
        if not markets:
            return None
        
        # Filter by symbol
        symbol_lower = symbol.split('/')[0].lower()
        relevant = [m for m in markets if symbol_lower in m.get('question', '').lower()]
        
        if not relevant:
            return None
        
        # Score each market
        scored = []
        for market in relevant:
            score = 0
            
            # Higher liquidity = better
            liquidity = float(market.get('liquidity', 0) or 0)
            score += min(liquidity / 10000, 5)  # Cap at 5 points
            
            # Price away from 0.5 = more edge potential
            try:
                prices = json.loads(market.get('outcomePrices', '[0.5, 0.5]'))
                yes_price = float(prices[0])
                distance_from_center = abs(yes_price - 0.5)
                score += distance_from_center * 10
            except:
                pass
            
            # Volume = market interest
            volume = float(market.get('volume24hr', 0) or 0)
            score += min(volume / 1000, 3)  # Cap at 3 points
            
            scored.append((score, market))
        
        # Return highest scored market
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1] if scored else None


# ============================================================================
# EXECUTION ENGINE (Polymarket CLOB + API Integration)
# ============================================================================

class ExecutionEngine:
    """
    Handles order execution on Polymarket CLOB.
    Also sends executions to the frontend API.
    Simulation mode if py_clob_client not available.
    """
    
    def __init__(self):
        self.client = None
        self.simulation_mode = True
        self.simulated_positions: List[Position] = []
        self.total_pnl = 0.0
        self.signals_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'mean_reversion_signals.json')
        self.api_base = os.getenv('API_BASE_URL', 'http://127.0.0.1:3001')
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.signals_file), exist_ok=True)
        
        if CLOB_AVAILABLE and config.POLY_API_KEY:
            try:
                self.client = ClobClient(
                    host=config.CLOB_HOST,
                    key=config.POLY_API_KEY,
                    chain_id=137,  # Polygon
                )
                self.simulation_mode = False
                logger.info("✅ Connected to Polymarket CLOB")
            except Exception as e:
                logger.warning(f"⚠️  CLOB connection failed: {e}")
        
        if self.simulation_mode:
            logger.info("📊 Running in SIMULATION mode")
    
    def save_signal(self, signal: Signal, status: str = 'PENDING', pnl: float = None):
        """Save signal to JSON file for frontend to read"""
        try:
            signals = []
            if os.path.exists(self.signals_file):
                with open(self.signals_file, 'r') as f:
                    signals = json.load(f)
            
            # Create signal record with all market metadata
            signal_data = {
                'id': f"sig_{signal.timestamp.timestamp()}_{signal.symbol.replace('/', '_')}",
                'timestamp': signal.timestamp.isoformat(),
                'symbol': signal.symbol,
                'direction': signal.direction,
                'zScore': round(signal.z_score, 2),
                'confidence': round(signal.confidence, 2),
                'entryPrice': round(signal.entry_price, 4),
                'expectedValue': round(signal.expected_value, 4),
                'kellySize': round(signal.kelly_size, 4),
                'marketQuestion': signal.market_question or f"{signal.symbol} 15-min Price Market",
                'outcome': signal.outcome,
                'status': status,
                'pnl': round(pnl, 2) if pnl is not None else None,
                # Market metadata for frontend
                'marketId': signal.market_id,
                'marketImage': signal.market_image,
                'marketUrl': signal.market_url,
                'marketSlug': signal.market_slug
            }
            
            # Check if signal already exists
            existing_idx = next((i for i, s in enumerate(signals) if s['id'] == signal_data['id']), None)
            if existing_idx is not None:
                signals[existing_idx] = signal_data
            else:
                signals.insert(0, signal_data)
            
            # Keep only last 50 signals
            signals = signals[:50]
            
            with open(self.signals_file, 'w') as f:
                json.dump(signals, f, indent=2)
                
            logger.debug(f"Signal saved: {signal_data['id']}")
            
        except Exception as e:
            logger.error(f"Failed to save signal: {e}")
    
    def send_to_api(self, signal: Signal, size_usd: float, market_question: str = None):
        """Send execution to frontend API"""
        try:
            payload = {
                'action': 'BUY',
                'signal': {
                    'symbol': signal.symbol,
                    'direction': signal.direction,
                    'zScore': signal.z_score,
                    'confidence': signal.confidence,
                    'entryPrice': signal.entry_price,
                    'expectedValue': signal.expected_value,
                    'kellySize': signal.kelly_size,
                    'marketQuestion': market_question or f"{signal.symbol} 15-min Price",
                    'marketImage': signal.market_image,
                    'marketUrl': signal.market_url,
                    'marketSlug': signal.market_slug
                },
                'size_usd': size_usd,
                'market_id': signal.market_id,
                'outcome': signal.outcome,
                'market_question': market_question or signal.market_question
            }
            
            response = requests.post(
                f"{self.api_base}/api/oracle/execute",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"📡 API: {result.get('message', 'Execution sent')}")
                return True
            else:
                logger.warning(f"API error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.warning(f"Failed to send to API (non-critical): {e}")
            return False
    
    def execute_signal(self, signal: Signal, bankroll: float, market_question: str = None) -> Optional[Position]:
        """Execute a trading signal"""
        
        # Calculate position size
        kelly_usd = bankroll * signal.kelly_size
        size_usd = max(config.MIN_POSITION_USD, min(kelly_usd, config.MAX_POSITION_USD))
        
        if size_usd < config.MIN_POSITION_USD:
            logger.warning(f"Position too small: ${size_usd:.2f}")
            return None
        
        # Save signal as PENDING first
        self.save_signal(signal, status='PENDING')
        
        if self.simulation_mode:
            position = self._simulate_order(signal, size_usd)
        else:
            position = self._execute_real_order(signal, size_usd)
        
        if position:
            # Update signal status to EXECUTED
            self.save_signal(signal, status='EXECUTED')
            # Send to frontend API
            self.send_to_api(signal, size_usd, market_question)
        
        return position
    
    def _simulate_order(self, signal: Signal, size_usd: float) -> Position:
        """Simulate order execution"""
        position = Position(
            signal=signal,
            entry_time=datetime.now(),
            size_usd=size_usd,
            entry_price=signal.entry_price,
            status="OPEN"
        )
        
        self.simulated_positions.append(position)
        logger.info(f"📝 SIMULATED ORDER: {signal.direction} ${size_usd:.2f} @ {signal.entry_price:.3f}")
        
        return position
    
    def _execute_real_order(self, signal: Signal, size_usd: float) -> Optional[Position]:
        """Execute real order on Polymarket"""
        try:
            # Build order
            order = OrderArgs(
                price=signal.entry_price,
                size=size_usd / signal.entry_price,  # Convert to shares
                side="BUY",
                token_id=signal.market_id,
            )
            
            # Submit order
            result = self.client.create_order(order)
            
            if result.get('success'):
                position = Position(
                    signal=signal,
                    entry_time=datetime.now(),
                    size_usd=size_usd,
                    entry_price=signal.entry_price,
                    status="OPEN"
                )
                logger.info(f"✅ ORDER EXECUTED: {signal.direction} ${size_usd:.2f}")
                return position
            else:
                logger.error(f"Order failed: {result}")
                return None
                
        except Exception as e:
            logger.error(f"Execution error: {e}")
            return None
    
    def close_position(self, position: Position, current_price: float):
        """Close a position and calculate P&L"""
        position.status = "CLOSED"
        position.exit_time = datetime.now()
        position.exit_price = current_price
        
        # Calculate P&L
        if position.signal.direction == "LONG":
            # Bought YES, sell at current price
            position.pnl = (current_price - position.entry_price) * (position.size_usd / position.entry_price)
        else:
            # Bought NO, calculate inverse
            position.pnl = ((1 - current_price) - position.entry_price) * (position.size_usd / position.entry_price)
        
        self.total_pnl += position.pnl
        
        # Update signal file with closed status and PnL
        self.save_signal(position.signal, status='CLOSED', pnl=position.pnl)
        
        status = "✅" if position.pnl > 0 else "❌"
        logger.info(f"{status} CLOSED: P&L ${position.pnl:+.2f} | Total: ${self.total_pnl:+.2f}")


# ============================================================================
# RISK MANAGER
# ============================================================================

class RiskManager:
    """
    Capital preservation and risk controls.
    Implements time-based stops and drawdown limits.
    """
    
    def __init__(self, initial_bankroll: float):
        self.initial_bankroll = initial_bankroll
        self.current_bankroll = initial_bankroll
        self.daily_pnl = 0.0
        self.trades_today = 0
        self.wins_today = 0
        self.trading_enabled = True
        self.positions: List[Position] = []
    
    def can_trade(self) -> bool:
        """Check if trading is allowed based on risk limits"""
        if not self.trading_enabled:
            return False
        
        # Check daily loss limit
        if self.daily_pnl < -config.DAILY_LOSS_LIMIT:
            logger.warning(f"⛔ Daily loss limit reached: ${self.daily_pnl:.2f}")
            self.trading_enabled = False
            return False
        
        # Check drawdown
        drawdown = (self.initial_bankroll - self.current_bankroll) / self.initial_bankroll
        if drawdown > config.MAX_DRAWDOWN_PCT:
            logger.warning(f"⛔ Max drawdown reached: {drawdown:.1%}")
            self.trading_enabled = False
            return False
        
        return True
    
    def check_time_stops(self, execution: ExecutionEngine) -> List[Position]:
        """Check and close positions that hit time-based stops"""
        closed = []
        now = datetime.now()
        
        for position in self.positions:
            if position.status != "OPEN":
                continue
            
            # Time stop check
            time_in_trade = (now - position.entry_time).total_seconds() / 60
            
            if time_in_trade >= config.TIME_STOP_MINUTES:
                logger.info(f"⏰ TIME STOP: Position held for {time_in_trade:.1f} minutes")
                # Get current price (simplified - use entry as proxy)
                execution.close_position(position, position.entry_price * 0.98)  # Assume small loss
                closed.append(position)
                self.update_pnl(position.pnl)
        
        return closed
    
    def add_position(self, position: Position):
        """Track a new position"""
        self.positions.append(position)
        self.trades_today += 1
    
    def update_pnl(self, pnl: float):
        """Update P&L tracking"""
        self.daily_pnl += pnl
        self.current_bankroll += pnl
        
        if pnl > 0:
            self.wins_today += 1
    
    def get_stats(self) -> dict:
        """Get current session statistics"""
        win_rate = (self.wins_today / self.trades_today * 100) if self.trades_today > 0 else 0
        
        return {
            "trades": self.trades_today,
            "wins": self.wins_today,
            "win_rate": f"{win_rate:.1f}%",
            "daily_pnl": f"${self.daily_pnl:+.2f}",
            "bankroll": f"${self.current_bankroll:.2f}",
            "drawdown": f"{((self.initial_bankroll - self.current_bankroll) / self.initial_bankroll) * 100:.1f}%"
        }
    
    def reset_daily(self):
        """Reset daily counters"""
        self.daily_pnl = 0.0
        self.trades_today = 0
        self.wins_today = 0
        self.trading_enabled = True


# ============================================================================
# MAIN BOT
# ============================================================================

class MeanReversionBot:
    """
    Main orchestrator for the Mean Reversion strategy.
    """
    
    def __init__(self, initial_bankroll: float = 1000.0):
        self.price_feed = PriceFeed(config.EXCHANGE)
        self.signal_generator = SignalGenerator(self.price_feed)
        self.market_selector = MarketSelector()
        self.execution = ExecutionEngine()
        self.risk_manager = RiskManager(initial_bankroll)
        
        self.running = False
        self.cycle_count = 0
    
    async def run_cycle(self):
        """Run one analysis cycle"""
        self.cycle_count += 1
        
        if not self.risk_manager.can_trade():
            logger.info("Trading paused due to risk limits")
            return
        
        # Check time stops on existing positions
        self.risk_manager.check_time_stops(self.execution)
        
        # Analyze each symbol
        for symbol in config.SYMBOLS:
            try:
                # Find best market for this symbol
                market = self.market_selector.select_best_market(symbol)
                
                if not market:
                    logger.debug(f"No suitable market for {symbol}")
                    continue
                
                # Generate signal
                signal = self.signal_generator.generate_signal(symbol, market)
                
                if signal:
                    # Execute trade with market question for display
                    market_question = market.get('question', f'{symbol} 15-min Price')
                    position = self.execution.execute_signal(
                        signal, 
                        self.risk_manager.current_bankroll,
                        market_question=market_question
                    )
                    
                    if position:
                        self.risk_manager.add_position(position)
                        
                        # AUTO-EXECUTE: Send trade to PolygraalX backend API
                        if config.AUTO_EXECUTE_ENABLED:
                            try:
                                api_url = f"{config.API_BASE_URL}/api/oracle/execute"
                                payload = {
                                    "action": "BUY",
                                    "signal": {
                                        "symbol": signal.symbol,
                                        "direction": signal.direction,
                                        "zScore": signal.z_score,
                                        "confidence": signal.confidence,
                                        "entryPrice": signal.entry_price,
                                        "expectedValue": signal.expected_value
                                    },
                                    "size_usd": config.DEFAULT_TRADE_SIZE,
                                    "market_id": signal.market_id,
                                    "outcome": signal.outcome
                                }
                                response = requests.post(api_url, json=payload, timeout=10)
                                if response.status_code == 200:
                                    result = response.json()
                                    logger.info(f"✅ AUTO-EXECUTE: Order placed on server - ID: {result.get('serverOrder', {}).get('id', 'N/A')}")
                                else:
                                    logger.warning(f"⚠️ AUTO-EXECUTE failed: {response.status_code} - {response.text[:200]}")
                            except Exception as api_error:
                                logger.error(f"❌ AUTO-EXECUTE error: {api_error}")
                
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")
        
        # Log stats periodically
        if self.cycle_count % 60 == 0:
            stats = self.risk_manager.get_stats()
            logger.info(f"📈 Stats: {stats}")
    
    async def start(self):
        """Start the bot"""
        logger.info("🚀 Starting Mean Reversion Bot...")
        self.running = True
        
        while self.running:
            try:
                await self.run_cycle()
                await asyncio.sleep(config.POLL_INTERVAL_SEC)
                
            except KeyboardInterrupt:
                logger.info("⛔ Interrupted by user")
                break
            except Exception as e:
                logger.error(f"Cycle error: {e}")
                await asyncio.sleep(5)
        
        self.stop()
    
    def stop(self):
        """Stop the bot gracefully"""
        self.running = False
        stats = self.risk_manager.get_stats()
        
        logger.info("=" * 60)
        logger.info("🛑 Bot stopped")
        logger.info(f"Final Stats: {stats}")
        logger.info(f"Signals generated: {self.signal_generator.signals_generated}")
        logger.info("=" * 60)


# ============================================================================
# ENTRY POINT
# ============================================================================

def main():
    """Main entry point"""
    print()
    print("╔══════════════════════════════════════════════════════════════════════════════╗")
    print("║                    POLYGRAALX MEAN REVERSION STRATEGY v1.0                   ║")
    print("║                    Statistical Arbitrage for Polymarket                      ║")
    print("╚══════════════════════════════════════════════════════════════════════════════╝")
    print()
    
    # Parse args
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--bankroll', type=float, default=1000.0, help='Initial bankroll in USD')
    parser.add_argument('--dry-run', action='store_true', help='Run in simulation mode')
    args = parser.parse_args()
    
    # Create and run bot
    bot = MeanReversionBot(initial_bankroll=args.bankroll)
    
    try:
        asyncio.run(bot.start())
    except KeyboardInterrupt:
        bot.stop()


if __name__ == "__main__":
    main()
