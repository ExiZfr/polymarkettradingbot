#!/usr/bin/env python3
"""
Real Trading Execution Wrapper
================================
Integrates PolymarketTrader with the Mean Reversion bot.
Allows toggling between paper trading and real execution via env variable.
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Import PolymarketTrader only if real trading is enabled
ENABLE_REAL_TRADING = os.getenv("ENABLE_REAL_TRADING", "false").lower() == "true"

if ENABLE_REAL_TRADING:
    try:
        from polymarket_trader import PolymarketTrader
        logger.info("🔴 REAL TRADING MODE ENABLED")
    except ImportError:
        logger.error("❌ polymarket_trader.py not found! Falling back to paper trading")
        ENABLE_REAL_TRADING = False
else:
    logger.info("📄 Paper Trading Mode (set ENABLE_REAL_TRADING=true for real execution)")


class TradingExecutor:
    """
    Wrapper that routes execution to either:
    - Real trading (PolymarketTrader)
    - Paper trading (existing API)
    """
    
    def __init__(self, api_base_url: str = "http://localhost:3000"):
        self.api_base_url = api_base_url
        self.real_trader: Optional[Any] = None
        
        if ENABLE_REAL_TRADING:
            # Initialize real trader
            try:
                self.real_trader = PolymarketTrader()
                logger.info("✅ PolymarketTrader initialized")
            except Exception as e:
                logger.error(f"❌ Failed to init real trader: {e}")
                logger.warning("⚠️ Falling back to paper trading")
    
    async def execute_trade(
        self,
        signal: Dict[str, Any],
        size_usd: float,
        market_id: str,
        outcome: str,  # "YES" or "NO"
        market_question: str = ""
    ) -> Dict[str, Any]:
        """
        Execute trade (real or paper).
        
        Args:
            signal: Trading signal data
            size_usd: Position size in USD
            market_id: Market/Token ID
            outcome: "YES" or "NO"
            market_question: Human-readable market name
        
        Returns:
            dict: Execution result
        """
        
        if ENABLE_REAL_TRADING and self.real_trader:
            return await self._execute_real(
                token_id=market_id,
                size_usd=size_usd,
                side="BUY",  # Mean reversion always buys
                outcome=outcome,
                signal=signal
            )
        else:
            return await self._execute_paper(
                signal=signal,
                size_usd=size_usd,
                market_id=market_id,
                outcome=outcome,
                market_question=market_question
            )
    
    async def _execute_real(
        self,
        token_id: str,
        size_usd: float,
        side: str,
        outcome: str,
        signal: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute REAL trade on Polymarket"""
        try:
            logger.info("=" * 60)
            logger.info("🔴 EXECUTING REAL TRADE")
            logger.info(f"   Market: {token_id}")
            logger.info(f"   Outcome: {outcome}")
            logger.info(f"   Size: ${size_usd:.2f}")
            logger.info(f"   Z-Score: {signal.get('zScore', 'N/A')}")
            logger.info("=" * 60)
            
            # Execute via PolymarketTrader
            result = await self.real_trader.execute_market_order(
                token_id=token_id,
                amount_usd=size_usd,
                side=side
            )
            
            if result.get("success"):
                logger.info("✅ REAL TRADE EXECUTED")
                logger.info(f"   Order ID: {result['order_id']}")
                
                return {
                    "success": True,
                    "mode": "REAL",
                    "order_id": result["order_id"],
                    "status": result["status"],
                    "amount_usd": size_usd
                }
            else:
                logger.error(f"❌ Trade failed: {result.get('error')}")
                return {
                    "success": False,
                    "mode": "REAL",
                    "error": result.get("error")
                }
                
        except Exception as e:
            logger.error(f"❌ Real trade execution error: {e}")
            return {
                "success": False,
                "mode": "REAL",
                "error": str(e)
            }
    
    async def _execute_paper(
        self,
        signal: Dict[str, Any],
        size_usd: float,
        market_id: str,
        outcome: str,
        market_question: str
    ) -> Dict[str, Any]:
        """Execute PAPER trade via existing API"""
        import requests
        
        try:
            logger.info("📄 Executing paper trade via API")
            
            payload = {
                'signal': signal,
                'size_usd': size_usd,
                'market_id': market_id,
                'outcome': outcome,
                'market_question': market_question
            }
            
            response = requests.post(
                f"{self.api_base_url}/api/oracle/execute",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "mode": "PAPER",
                    "message": result.get('message', 'Executed')
                }
            else:
                return {
                    "success": False,
                    "mode": "PAPER",
                    "error": f"API error: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"❌ Paper trade error: {e}")
            return {
                "success": False,
                "mode": "PAPER",
                "error": str(e)
            }
    
    async def get_balance(self) -> float:
        """Get current balance (real or paper)"""
        if ENABLE_REAL_TRADING and self.real_trader:
            return await self.real_trader.get_balance()
        else:
            # Return paper balance from API
            try:
                import requests
                response = requests.get(f"{self.api_base_url}/api/paper-orders/profiles")
                if response.ok:
                    profiles = response.json().get("profiles", [])
                    active = next((p for p in profiles if p.get("isActive")), None)
                    if active:
                        return active.get("balance", 1000.0)
            except:
                pass
            return 1000.0  # Default
    
    async def close(self):
        """Clean up"""
        if self.real_trader:
            await self.real_trader.close()


# ============================================================================
# USAGE EXAMPLE (for integration into mean_reversion_bot.py)
# ============================================================================

async def example_usage():
    """
    Example: How to integrate into mean_reversion_bot.py
    """
    
    # Initialize executor
    executor = TradingExecutor(api_base_url="http://localhost:3000")
    
    # Check balance
    balance = await executor.get_balance()
    print(f"Balance: ${balance:,.2f}")
    
    # Execute trade
    signal_data = {
        "zScore": -2.5,
        "direction": "LONG",
        "confidence": 0.85
    }
    
    result = await executor.execute_trade(
        signal=signal_data,
        size_usd=10.0,
        market_id="YOUR_MARKET_ID",
        outcome="YES",
        market_question="BTC/USDT Mean Reversion"
    )
    
    print(f"Result: {result}")
    
    # Clean up
    await executor.close()


if __name__ == "__main__":
    asyncio.run(example_usage())
