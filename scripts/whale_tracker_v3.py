#!/usr/bin/env python3
"""
WHALE TRACKER v3.0 - POLYMARKET API
====================================
Poll Polymarket API for real whale transactions instead of blockchain events.
This is more reliable since most Polymarket activity is off-chain.
"""

import asyncio
import aiohttp
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

# Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Environment variables
MODE = os.getenv('WHALE_TRACKER_MODE', 'simulation')
MIN_WHALE_AMOUNT = float(os.getenv('MIN_WHALE_AMOUNT', '5000'))
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001')
POLYMARKET_API = "https://gamma-api.polymarket.com"

# Tracking
processed_trades = set()


@dataclass
class WhaleTransaction:
    wallet_address: str
    wallet_tag: str
    market_id: str
    market_question: str
    outcome: str
    amount: float
    price: float
    timestamp: str
    tx_hash: str


class WhaleTrackerV3:
    """Whale tracker using Polymarket API"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.wallet_cache: Dict[str, dict] = {}
    
    async def start(self):
        """Start the tracker"""
        logger.info("=" * 70)
        logger.info("🐋 WHALE TRACKER v3.0 - POLYMARKET API")
        logger.info("=" * 70)
        logger.info(f"Mode: {MODE.upper()}")
        logger.info(f"Min Amount: ${MIN_WHALE_AMOUNT:,.0f}")
        logger.info(f"API Endpoint: {API_BASE_URL}")
        logger.info("=" * 70)
        
        async with aiohttp.ClientSession() as session:
            self.session = session
            
            if MODE == 'simulation':
                await self.run_simulation()
            else:
                await self.run_production()
    
    async def run_production(self):
        """Poll Polymarket API for real trades"""
        logger.info("🔍 Polling Polymarket API for whale trades...")
        await self.send_log("🚀 Whale Tracker v3.0 started (PRODUCTION)", "INFO")
        
        while True:
            try:
                # Fetch recent trades from Polymarket
                trades = await self.fetch_recent_trades()
                
                for trade in trades:
                    # Skip if already processed
                    trade_id = trade.get('id', '')
                    if trade_id in processed_trades:
                        continue
                    
                    # Check if it's a whale trade
                    amount = float(trade.get('size', 0)) * float(trade.get('price', 0))
                    
                    if amount >= MIN_WHALE_AMOUNT:
                        # Process whale trade
                        await self.process_whale_trade(trade)
                        processed_trades.add(trade_id)
                
                # Poll every 5 seconds
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in production loop: {e}")
                await asyncio.sleep(10)
    
    async def fetch_recent_trades(self) -> List[dict]:
        """Fetch recent trades from Polymarket API"""
        try:
            url = f"{POLYMARKET_API}/trades"
            params = {
                'limit': 100,
                'offset': 0
            }
            
            async with self.session.get(url, params=params, timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data if isinstance(data, list) else []
                return []
                
        except Exception as e:
            logger.error(f"Failed to fetch trades: {e}")
            return []
    
    async def process_whale_trade(self, trade: dict):
        """Process a whale trade"""
        try:
            wallet = trade.get('maker', 'unknown')
            market_id = trade.get('market', '')
            outcome = trade.get('outcome', 'YES')
            size = float(trade.get('size', 0))
            price = float(trade.get('price', 0))
            amount = size * price
            
            # Fetch wallet profile and calculate tag
            profile = await self.get_wallet_profile(wallet)
            tag = self.calculate_tag(wallet, profile, trade)
            
            # Fetch market details
            market = await self.get_market_details(market_id)
            question = market.get('question', 'Unknown Market')
            
            # Create transaction
            transaction = WhaleTransaction(
                wallet_address=wallet,
                wallet_tag=tag,
                market_id=market_id,
                market_question=question,
                outcome=outcome,
                amount=amount,
                price=price,
                timestamp=datetime.utcnow().isoformat() + 'Z',
                tx_hash=trade.get('id', '')
            )
            
            # Send to API
            await self.send_to_api(transaction)
            
            # Log
            logger.info(f"🐋 {tag} | ${amount:,.0f} {outcome} @ {price:.2f}")
            logger.info(f"   Market: {question[:60]}...")
            
        except Exception as e:
            logger.error(f"Error processing trade: {e}")
    
    async def get_wallet_profile(self, address: str) -> dict:
        """Get wallet trading profile from Polymarket"""
        if address in self.wallet_cache:
            return self.wallet_cache[address]
        
        try:
            url = f"{POLYMARKET_API}/profile/{address}"
            async with self.session.get(url, timeout=5) as resp:
                if resp.status == 200:
                    profile = await resp.json()
                    self.wallet_cache[address] = profile
                    return profile
        except:
            pass
        
        return {}
    
    async def get_market_details(self, market_id: str) -> dict:
        """Get market details"""
        try:
            url = f"{POLYMARKET_API}/markets/{market_id}"
            async with self.session.get(url, timeout=5) as resp:
                if resp.status == 200:
                    return await resp.json()
        except:
            pass
        
        return {}
    
    def calculate_tag(self, wallet: str, profile: dict, trade: dict) -> str:
        """Calculate wallet tag based on trading history"""
        # Simplified tagging for now
        volume = float(profile.get('volume', 0))
        pnl = float(profile.get('pnl', 0))
        trades_count = int(profile.get('trades', 0))
        
        if trades_count == 0:
            return 'UNKNOWN'
        
        win_rate = float(profile.get('win_rate', 0.5))
        
        # Insider: Few trades, high conviction
        if trades_count <= 10 and float(trade.get('size', 0)) * float(trade.get('price', 0)) > 10000:
            return 'INSIDER'
        
        # Winner: High win rate
        if win_rate >= 0.65 and pnl > 10000:
            return 'WINNER'
        
        # Looser: Poor win rate
        if win_rate <= 0.40 and pnl < -5000:
            return 'LOOSER'
        
        # Smart Money
        if 0.55 <= win_rate < 0.70 and pnl > 0:
            return 'SMART_MONEY'
        
        # Dumb Money
        if win_rate < 0.45 and volume > 50000:
            return 'DUMB_MONEY'
        
        return 'UNKNOWN'
    
    async def send_to_api(self, transaction: WhaleTransaction):
        """Send transaction to dashboard API"""
        try:
            url = f"{API_BASE_URL}/api/radar/transactions"
            
            # Format data to match API expectations
            data = {
                "tx_hash": transaction.tx_hash,
                "block_number": 0,  # Not applicable for API-based tracking
                "timestamp": transaction.timestamp,
                "gas_price": 0.0,  # Not applicable for API-based tracking
                "wallet_address": transaction.wallet_address,
                "wallet_tag": transaction.wallet_tag,
                "market_id": transaction.market_id,
                "market_question": transaction.market_question,
                "market_slug": transaction.market_id,  # Use ID as slug for now
                "outcome": transaction.outcome,
                "amount": transaction.amount,
                "price": transaction.price,
                "shares": transaction.amount / transaction.price if transaction.price > 0 else 0
            }
            
            async with self.session.post(url, json=data, timeout=5) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"API error: {resp.status} - {error_text[:100]}")
                    
        except Exception as e:
            logger.error(f"Failed to send to API: {e}")

    
    async def send_log(self, message: str, level: str):
        """Send log to dashboard console"""
        try:
            url = f"{API_BASE_URL}/api/radar/logs"
            data = {
                "message": message,
                "level": level,
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
            
            async with self.session.post(url, json=data, timeout=5) as resp:
                pass
                
        except:
            pass
    
    async def run_simulation(self):
        """Generate simulated whale transactions"""
        logger.info("👂 Simulation mode started - generating mock transactions...")
        await self.send_log("🚀 Whale Tracker started (SIMULATION MODE)", "INFO")
        
        import random
        
        markets = [
            "Will Trump win 2024?",
            "Bitcoin above 100k in 2025?",
            "ETH to flip BTC?",
            "Fed rate cut in Q1?",
            "SPX new ATH by EOY?",
        ]
        
        tags = ['WINNER', 'INSIDER', 'SMART_MONEY', 'LOOSER', 'DUMB_MONEY', 'UNKNOWN']
        outcomes = ['YES', 'NO']
        
        count = 0
        while True:
            try:
                # Generate random whale
                tag = random.choice(tags)
                market = random.choice(markets)
                outcome = random.choice(outcomes)
                amount = random.randint(1000, 50000)
                price = round(random.uniform(0.30, 0.70), 2)
                
                transaction = WhaleTransaction(
                    wallet_address=f"0x{''.join(random.choices('0123456789abcdef', k=40))}",
                    wallet_tag=tag,
                    market_id=f"market_{count}",
                    market_question=market,
                    outcome=outcome,
                    amount=float(amount),
                    price=price,
                    timestamp=datetime.utcnow().isoformat() + 'Z',
                    tx_hash=f"sim_{count}"
                )
                
                await self.send_to_api(transaction)
                
                logger.info(f"🐋 [SIM] {tag} | ${amount:,.0f} {outcome} @ {price}")
                logger.info(f"   Market: {market}")
                
                count += 1
                
                # Random interval 5-20 seconds
                await asyncio.sleep(random.randint(5, 20))
                
            except Exception as e:
                logger.error(f"Simulation error: {e}")
                await asyncio.sleep(5)


async def main():
    """Main entry point"""
    tracker = WhaleTrackerV3()
    
    try:
        await tracker.start()
    except KeyboardInterrupt:
        logger.info("🛑 Stopping whale tracker...")
        logger.info("✅ Shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
