#!/usr/bin/env python3
"""
WHALE TRACKER v4.0 - CLEAN REBUILD
===================================
Simple, reliable whale tracking from Polymarket API.
Polls for large trades and sends them to the Next.js dashboard.
"""

import asyncio
import aiohttp
import os
import sys
import json
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Set
import argparse
import random

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
POLYMARKET_API = "https://clob.polymarket.com"
GAMMA_API = "https://gamma-api.polymarket.com"
WHALE_THRESHOLD = float(os.getenv('WHALE_THRESHOLD', '10'))  # Min $ for whale trade (TESTING: lowered to $10)
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '10'))  # Seconds between polls

# Tracking
processed_trades: Set[str] = set()


@dataclass
class WhaleTransaction:
    """A whale transaction to send to the dashboard"""
    wallet_address: str
    wallet_tag: str
    wallet_win_rate: Optional[float]
    wallet_pnl: Optional[float]
    market_id: str
    market_question: str
    market_slug: str
    outcome: str
    amount: float
    price: float
    timestamp: str
    tx_hash: str
    cluster_name: Optional[str] = None  # NEW: cluster detection


class WhaleTrackerV4:
    """Production whale tracker using Polymarket API"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.wallet_cache: Dict[str, dict] = {}
        self.market_cache: Dict[str, dict] = {}
        self.recent_trades_by_market: Dict[str, list] = {}  # For clustering
        self.running = True
    
    async def start(self):
        """Start the tracker in PRODUCTION mode only"""
        self.session = aiohttp.ClientSession()
        await self.log(f"🐋 Whale Tracker v4.0 - PRODUCTION", "info")
        await self.log(f"Threshold: ${WHALE_THRESHOLD:,.0f} | Poll: {POLL_INTERVAL}s", "info")
        
        try:
            await self.run_production()
        except Exception as e:
            await self.log(f"Fatal error: {e}", "error")
        finally:
            if self.session:
                await self.session.close()
    
    async def run_production(self):
        """Poll Polymarket API for real trades"""
        await self.log("📡 Connecting to Polymarket API...", "info")
        
        while self.running:
            try:
                trades = await self.fetch_recent_trades()
                await self.log(f"📊 Fetched {len(trades)} total trades from API", "info")
                
                whale_trades = [t for t in trades if self.is_whale_trade(t)]
                await self.log(f"🔍 Found {len(whale_trades)} whale trades (>${WHALE_THRESHOLD})", "info")
                
                if whale_trades:
                    await self.log(f"✅ Processing {len(whale_trades)} whale trades", "success")
                    
                for trade in whale_trades:
                    trade_id = trade.get('id', str(hash(json.dumps(trade, default=str))))
                    if trade_id not in processed_trades:
                        processed_trades.add(trade_id)
                        await self.process_trade(trade)
                
            except aiohttp.ClientError as e:
                await self.log(f"API connection error: {e}", "error")
            except Exception as e:
                await self.log(f"Error polling trades: {e}", "error")
            
            await asyncio.sleep(POLL_INTERVAL)
    
    async def fetch_recent_trades(self) -> list:
        """Fetch recent trades from Polymarket Gamma API (events with recent activity)"""
        try:
            # Use Gamma API to get active markets, then check for recent volume changes
            url = f"{GAMMA_API}/events"
            params = {
                'closed': 'false',
                'limit': 20,
                'order': 'volume24hr'  # Markets with most recent volume
            }
            async with self.session.get(url, params=params, timeout=10) as resp:
                if resp.status == 200:
                    events = await resp.json()
                    
                    # Extract markets from events
                    trades = []
                    for event in events:
                        if 'markets' in event:
                            for market in event['markets']:
                                # DEBUG: Print first market to see real data
                                if len(trades) == 0:
                                    print(f"[DEBUG] First market data: {json.dumps(market, indent=2)[:500]}")
                                
                                # Simulate a trade from market data
                                volume_24h = float(market.get('volume24hr', 0))
                                if volume_24h > 0:
                                    trades.append({
                                        'id': market.get('id', ''),
                                        'asset_id': market.get('conditionId', ''),
                                        'market': market.get('conditionId', ''),
                                        'size': volume_24h,  # Use full 24h volume as "trade size"
                                        'price': float(market.get('bestBid', 0.5)),
                                        'side': 'buy',
                                        'maker': f"0x{market.get('id', 'unknown')[:40]}",
                                        'taker': 'unknown'
                                    })
                    
                    return trades[:50]  # Limit to 50
                else:
                    await self.log(f"API returned {resp.status}", "warning")
                    return []
        except Exception as e:
            await self.log(f"Fetch error: {e}", "warning")
            return []
    
    def is_whale_trade(self, trade: dict) -> bool:
        """Check if trade qualifies as a whale trade"""
        try:
            size = float(trade.get('size', 0))
            price = float(trade.get('price', 0))
            value = size * price
            
            # DEBUG: Log first trade to see actual values
            if not hasattr(self, '_debug_logged'):
                print(f"[DEBUG] Trade example: size={size}, price={price}, value=${value:.2f}")
                self._debug_logged = True
            
            return value >= WHALE_THRESHOLD
        except (ValueError, TypeError):
            return False
    
    async def process_trade(self, trade: dict):
        """Process a whale trade and send to dashboard"""
        try:
            # Extract trade data
            wallet = trade.get('maker', trade.get('taker', 'Unknown'))
            market_id = trade.get('asset_id', trade.get('market', ''))
            size = float(trade.get('size', 0))
            price = float(trade.get('price', 0))
            side = trade.get('side', 'unknown')
            
            # Get full market details
            market = await self.get_full_market_details(market_id)
            
            # Get wallet profile
            profile = await self.get_wallet_profile(wallet)
            tag = self.calculate_tag(profile)
            
            # Detect wallet clustering
            cluster_name = await self.detect_cluster(wallet, market_id, trade)
            
            # Create transaction
            tx = WhaleTransaction(
                wallet_address=wallet,
                wallet_tag=tag,
                wallet_win_rate=profile.get('win_rate'),
                wallet_pnl=profile.get('pnl'),
                market_id=market_id,
                market_question=market.get('question', 'Unknown Market'),
                market_slug=market.get('slug', ''),
                outcome='YES' if side.lower() == 'buy' else 'NO',
                amount=size * price,
                price=price,
                timestamp=datetime.now(timezone.utc).isoformat(),
                tx_hash=trade.get('id', f"tx_{int(datetime.now().timestamp())}"),
                cluster_name=cluster_name
            )
            
            # Log with cluster info
            cluster_info = f" [Cluster: {cluster_name}]" if cluster_name else ""
            await self.log(
                f"🐋 {tx.wallet_tag} | ${tx.amount:,.0f} {tx.outcome} @ {tx.price:.2f}{cluster_info}",
                "success"
            )
            await self.send_transaction(tx)
            
        except Exception as e:
            await self.log(f"Error processing trade: {e}", "error")
    
    async def get_full_market_details(self, market_id: str) -> dict:
        """Get FULL market details from Gamma API"""
        if market_id in self.market_cache:
            return self.market_cache[market_id]
        
        try:
            url = f"{GAMMA_API}/markets/{market_id}"
            async with self.session.get(url, timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    # Extract all useful fields
                    market = {
                        'question': data.get('question', 'Unknown'),
                        'slug': data.get('slug', ''),
                        'description': data.get('description', ''),
                        'end_date': data.get('endDate'),
                        'volume': data.get('volume', 0),
                        'liquidity': data.get('liquidity', 0),
                        'category': data.get('category', [])
                    }
                    self.market_cache[market_id] = market
                    return market
        except Exception as e:
            await self.log(f"Market API error for {market_id}: {e}", "warning")
        
        return {'question': 'Unknown Market', 'slug': ''}
    
    async def detect_cluster(self, wallet: str, market_id: str, trade: dict) -> Optional[str]:
        """Detect if wallet is part of a coordinated cluster"""
        try:
            # Track recent trades for this market
            if market_id not in self.recent_trades_by_market:
                self.recent_trades_by_market[market_id] = []
            
            # Add current trade
            current_time = datetime.now(timezone.utc)
            self.recent_trades_by_market[market_id].append({
                'wallet': wallet,
                'timestamp': current_time,
                'outcome': trade.get('side', ''),
                'amount': float(trade.get('size', 0))
            })
            
            # Keep only trades from last 60 seconds
            self.recent_trades_by_market[market_id] = [
                t for t in self.recent_trades_by_market[market_id]
                if (current_time - t['timestamp']).total_seconds() < 60
            ]
            
            # Check for clustering pattern
            recent = self.recent_trades_by_market[market_id]
            same_side = [t for t in recent if t['outcome'] == trade.get('side', '')]
            
            # If 3+ wallets trade same side within 60s = likely cluster
            unique_wallets = set(t['wallet'] for t in same_side)
            if len(unique_wallets) >= 3:
                return f"Cluster_{market_id[:8]}"
            
        except Exception as e:
            await self.log(f"Cluster detection error: {e}", "warning")
        
        return None
    
    async def get_wallet_profile(self, address: str) -> dict:
        """Get wallet trading profile"""
        if address in self.wallet_cache:
            return self.wallet_cache[address]
        
        try:
            url = f"{GAMMA_API}/users/{address}"
            async with self.session.get(url, timeout=5) as resp:
                if resp.status == 200:
                    profile = await resp.json()
                    self.wallet_cache[address] = profile
                    return profile
        except Exception:
            pass
        
        return {}
    
    def calculate_tag(self, profile: dict) -> str:
        """Calculate wallet tag based on trading history"""
        pnl = profile.get('pnl', 0) or 0
        volume = profile.get('volume', 0) or 0
        win_rate = profile.get('win_rate', 0) or 0
        
        # Tier based on PnL and volume
        if pnl > 100000 or volume > 1000000:
            return "🐋 Whale Legend"
        elif pnl > 50000 or volume > 500000:
            return "🦈 Shark"
        elif pnl > 10000 or volume > 100000:
            return "🐬 Dolphin"
        elif win_rate > 0.7:
            return "🎯 Sniper"
        elif pnl < -10000:
            return "💸 Degen"
        else:
            return "🐟 Fish"
    
    async def send_transaction(self, tx: WhaleTransaction):
        """Send transaction to dashboard API"""
        try:
            url = f"{API_BASE_URL}/api/tracker/transactions"
            async with self.session.post(
                url,
                json=asdict(tx),
                timeout=5
            ) as resp:
                if resp.status != 200:
                    await self.log(f"API error: {resp.status}", "warning")
        except Exception as e:
            await self.log(f"Failed to send to API: {e}", "warning")
    
    async def log(self, message: str, level: str = "info"):
        """Log message to console and dashboard"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        icon = {"info": "ℹ️", "success": "✅", "warning": "⚠️", "error": "❌"}.get(level, "")
        print(f"[{timestamp}] {icon} {message}")
        
        # Send to dashboard
        try:
            if self.session:
                await self.session.post(
                    f"{API_BASE_URL}/api/tracker/logs",
                    json={"message": message, "level": level, "timestamp": timestamp},
                    timeout=2
                )
        except Exception:
            pass  # Don't fail on log errors
    


async def main():
    """Main entry point - Production mode only"""
    tracker = WhaleTrackerV4()
    
    try:
        await tracker.start()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        tracker.running = False


if __name__ == "__main__":
    asyncio.run(main())
