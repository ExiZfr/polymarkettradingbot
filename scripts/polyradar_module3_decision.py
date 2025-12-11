"""
PolyRadar - Whale Trading Bot for Polymarket
============================================

Module 3: DECISION ENGINE (The Brain)
Makes trade decisions based on confidence scoring and executes orders.

Key Features:
- Multi-factor confidence scoring (0-100)
- Kelly Criterion position sizing
- Timing and liquidity analysis
- Limit-only order execution
- Front-running protection
"""

import asyncio
import time
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# Import from previous modules
from polyradar_module1_radar import WhaleSignal
from polyradar_module2_intelligence import WalletProfile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TradingDecision:
    """Final decision with all metadata"""
    should_trade: bool
    confidence_score: float
    position_size_usd: float
    limit_price: float
    reasoning: str
    signal: WhaleSignal
    profile: WalletProfile
    timestamp: datetime


class ConfidenceScorer:
    """
    Calculates confidence score (0-100) based on multiple factors
    
    Scoring Components:
        1. WIN RATE (30 pts): Wallet's historical success rate
        2. PNL (20 pts): Wallet's profit history
        3. TIMING (-30 pts): Penalty if price moved >5% since whale order
        4. VOLUME (+10 pts): Bonus if order >5% of market liquidity
        5. MARKET MATURITY (+5 pts): Bonus if market >48h old
    """
    
    def __init__(self):
        self.weights = {
            'win_rate': 30,
            'pnl': 20,
            'timing': 30,  # Penalty
            'volume': 10,  # Bonus
            'maturity': 5   # Bonus
        }
    
    def calculate(self, profile: WalletProfile, signal: WhaleSignal, 
                  current_price: float, market_liquidity: float) -> Dict:
        """
        Calculate comprehensive confidence score
        
        Args:
            profile: Wallet analysis from Intelligence module
            signal: Original whale transaction
            current_price: Current market price (fetched from API)
            market_liquidity: Total available liquidity in market
        
        Returns:
            Dict with score breakdown
        """
        scores = {}
        
        # 1. WIN RATE component (0-30 pts)
        # Maps 0-100% win rate to 0-30 points
        scores['win_rate'] = profile.win_rate * self.weights['win_rate']
        
        # 2. PNL component (0-20 pts)
        # Maps $0-100k PnL to 0-20 points
        pnl_factor = min(profile.total_pnl_usd / 100_000, 1.0) if profile.total_pnl_usd > 0 else 0.0
        scores['pnl'] = pnl_factor * self.weights['pnl']
        
        # 3. TIMING penalty (0 to -30 pts)
        # If price moved >5% since whale order = bad timing
        price_change = abs(current_price - signal.price) / signal.price
        if price_change > 0.05:
            penalty = min(price_change * 100, self.weights['timing'])
            scores['timing'] = -penalty
            logger.warning(f"⏰ Timing penalty: Price moved {price_change*100:.1f}% → -{penalty:.1f} pts")
        else:
            scores['timing'] = 0
        
        # 4. VOLUME bonus (0 to +10 pts)
        # If whale order is >5% of liquidity = significant
        volume_ratio = signal.amount_usd / market_liquidity if market_liquidity > 0 else 0
        if volume_ratio > 0.05:
            bonus = min(volume_ratio * 100, self.weights['volume'])
            scores['volume'] = bonus
            logger.info(f"💪 Volume bonus: {volume_ratio*100:.1f}% of liquidity → +{bonus:.1f} pts")
        else:
            scores['volume'] = 0
        
        # 5. MARKET MATURITY bonus (0 to +5 pts)
        # Mock: Assume market is mature (in production, check creation date)
        scores['maturity'] = 5  # Mock bonus
        
        # TOTAL SCORE
        total = sum(scores.values())
        total = max(0, min(100, total))  # Clamp 0-100
        
        return {
            'total': round(total, 2),
            'breakdown': scores
        }


class PositionSizer:
    """
    Calculates optimal position size using Kelly Criterion
    
    Kelly Formula (simplified):
        f* = (p * b - q) / b
    
    Where:
        p = win probability (from confidence score)
        q = loss probability (1 - p)
        b = odds (payoff ratio)
    
    We use a simplified version:
        fraction = (confidence/100 - 0.5) * 2
    
    Capped at 10% max for risk management
    """
    
    def __init__(self, max_position_pct: float = 0.10):
        self.max_position = max_position_pct
    
    def calculate(self, confidence_score: float, bankroll: float) -> float:
        """
        Calculate position size in USD
        
        Args:
            confidence_score: 0-100 confidence
            bankroll: Total available capital
        
        Returns:
            Position size in USD
        """
        # Convert confidence to probability (0-1)
        p = confidence_score / 100
        
        # Kelly fraction (simplified)
        # If confidence = 50% → kelly = 0
        # If confidence = 75% → kelly = 0.5
        # If confidence = 100% → kelly = 1.0
        kelly = (p - 0.5) * 2
        
        # Cap at max_position for safety
        kelly = max(0, min(kelly, self.max_position))
        
        # Calculate dollar amount
        position_usd = bankroll * kelly
        
        logger.info(f"💰 Kelly: {kelly*100:.1f}% of ${bankroll:,.0f} = ${position_usd:,.2f}")
        
        return position_usd


class OrderExecutor:
    """
    Handles order execution with anti-front-running protection
    
    Key Safety Features:
        - LIMIT ORDERS ONLY (never market orders)
        - 1% max slippage from whale price
        - Post-only to avoid taking liquidity
        - Time decay: Skip if >30s since signal
    """
    
    MAX_SLIPPAGE = 0.01  # 1%
    MAX_TIME_DELAY_SECONDS = 30
    
    def __init__(self, mock_mode: bool = True):
        """
        Args:
            mock_mode: If True, simulate orders without real execution
        """
        self.mock_mode = mock_mode
    
    def calculate_limit_price(self, whale_price: float, outcome: str) -> float:
        """
        Calculate limit price with slippage protection
        
        For YES bets: Buy at whale_price + 1% max
        For NO bets: Buy at whale_price + 1% max
        """
        limit = whale_price * (1 + self.MAX_SLIPPAGE)
        return round(limit, 4)  # 4 decimals for price
    
    async def execute(self, decision: TradingDecision) -> Dict:
        """
        Execute the trade decision
        
        Returns:
            Order confirmation dict
        """
        if not decision.should_trade:
            return {"status": "skipped", "reason": decision.reasoning}
        
        # Check time decay
        elapsed = (datetime.now() - decision.timestamp).total_seconds()
        if elapsed > self.MAX_TIME_DELAY_SECONDS:
            logger.warning(f"⏱️  Order too old ({elapsed:.1f}s). Skipping to avoid stale price.")
            return {"status": "expired", "elapsed": elapsed}
        
        # Prepare order
        order = {
            "market_id": decision.signal.market_id,
            "outcome": decision.signal.outcome,
            "side": "BUY",
            "type": "LIMIT",
            "price": decision.limit_price,
            "size_usd": decision.position_size_usd,
            "post_only": True,  # Maker order only
            "whale_wallet": decision.profile.address,
            "confidence": decision.confidence_score
        }
        
        if self.mock_mode:
            logger.info(f"🎯 [MOCK] LIMIT ORDER: ${order['size_usd']:,.2f} on {order['outcome']} @ {order['price']}")
            logger.info(f"   Confidence: {order['confidence']}/100 | Whale: {order['whale_wallet'][:10]}...")
            
            return {
                "status": "mock_success",
                "order_id": f"MOCK-{int(time.time() * 1000)}",
                "order": order
            }
        else:
            # In production: Call Polymarket CLOB API
            # response = await polymarket_api.place_limit_order(order)
            # return response
            raise NotImplementedError("Real order execution not implemented")


class DecisionEngine:
    """
    Main Decision Module (The Brain)
    
    Pipeline:
        Signal + Profile → Scoring → Position Sizing → Decision → Execution
    """
    
    def __init__(self, bankroll: float, mock_mode: bool = True):
        """
        Args:
            bankroll: Total trading capital in USD
            mock_mode: If True, don't execute real orders
        """
        self.bankroll = bankroll
        self.scorer = ConfidenceScorer()
        self.sizer = PositionSizer(max_position_pct=0.10)
        self.executor = OrderExecutor(mock_mode=mock_mode)
        
        # Execution thresholds
        self.MIN_CONFIDENCE = 50  # Don't trade below 50/100
    
    async def decide(self, signal: WhaleSignal, profile: WalletProfile) -> TradingDecision:
        """
        Main decision pipeline
        
        Args:
            signal: Whale transaction from Radar
            profile: Wallet analysis from Intelligence
        
        Returns:
            TradingDecision with full metadata
        """
        logger.info(f"🧠 Making decision for {profile.category} wallet...")
        
        # Mock current price (in production, fetch from Polymarket API)
        current_price = signal.price + 0.01  # Simulate slight price movement
        
        # Mock market liquidity (in production, fetch from orderbook)
        market_liquidity = 150_000  # $150k available liquidity
        
        # 1. Calculate confidence score
        score_result = self.scorer.calculate(
            profile, 
            signal, 
            current_price, 
            market_liquidity
        )
        confidence = score_result['total']
        
        logger.info(f"📊 Confidence Score: {confidence}/100")
        for factor, value in score_result['breakdown'].items():
            logger.info(f"   {factor}: {value:+.1f}")
        
        # 2. Check if confidence meets threshold
        if confidence < self.MIN_CONFIDENCE:
            reasoning = f"Confidence {confidence} < {self.MIN_CONFIDENCE} threshold"
            logger.info(f"❌ {reasoning}")
            
            return TradingDecision(
                should_trade=False,
                confidence_score=confidence,
                position_size_usd=0.0,
                limit_price=0.0,
                reasoning=reasoning,
                signal=signal,
                profile=profile,
                timestamp=datetime.now()
            )
        
        # 3. Calculate position size (Kelly Criterion)
        position_usd = self.sizer.calculate(confidence, self.bankroll)
        
        # 4. Calculate limit price
        limit_price = self.executor.calculate_limit_price(signal.price, signal.outcome)
        
        # 5. Create decision
        reasoning = f"Score {confidence}/100 → ${position_usd:,.2f} position"
        
        decision = TradingDecision(
            should_trade=True,
            confidence_score=confidence,
            position_size_usd=position_usd,
            limit_price=limit_price,
            reasoning=reasoning,
            signal=signal,
            profile=profile,
            timestamp=datetime.now()
        )
        
        logger.info(f"✅ Decision: TRADE (${position_usd:,.2f} @ {limit_price})")
        
        return decision
    
    async def execute_decision(self, decision: TradingDecision) -> Dict:
        """
        Execute the trading decision
        
        Returns:
            Order result
        """
        return await self.executor.execute(decision)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def main_decision():
    """Test decision engine independently"""
    print("=" * 60)
    print("PolyRadar Module 3: DECISION ENGINE")
    print("=" * 60)
    
    # Setup engine with $10k bankroll
    engine = DecisionEngine(bankroll=10_000, mock_mode=True)
    
    # Mock signal (Smart Money wallet)
    signal = WhaleSignal(
        wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        market_id="100001",
        outcome="YES",
        amount_usd=15000,
        price=0.62,
        timestamp=int(time.time()),
        tx_hash="0xtest1",
        gas_price=30.0
    )
    
    # Mock profile (from Intelligence module)
    from polyradar_module2_intelligence import WalletProfile
    
    profile = WalletProfile(
        address=signal.wallet_address,
        first_seen=datetime.now(),
        total_trades=450,
        wins=310,
        losses=140,
        total_pnl_usd=185000,
        avg_position_size=8500,
        win_rate=0.69,  # 69% win rate
        category="SMART_MONEY",
        reputation_score=85,
        last_updated=datetime.now()
    )
    
    # Make decision
    decision = await engine.decide(signal, profile)
    
    # Execute if decided to trade
    if decision.should_trade:
        result = await engine.execute_decision(decision)
        print(f"\n📜 Order Result: {result['status']}")
    else:
        print(f"\n⏭️  Skipped: {decision.reasoning}")
    
    print("\n✅ Decision engine test completed")


if __name__ == "__main__":
    asyncio.run(main_decision())
