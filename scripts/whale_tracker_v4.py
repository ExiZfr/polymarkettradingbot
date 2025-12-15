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
    market_url: Optional[str]  # NEW: Full Polymarket URL
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
        self.processed_trades: Dict[str, float] = {}  # FIX: Trade IDs with timestamp
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
                    
                # Clean old processed trades (older than 5 minutes)
                current_time = datetime.now().timestamp()
                self.processed_trades = {k: v for k, v in self.processed_trades.items() if current_time - v < 300}
                
                for trade in whale_trades:
                    # Use actual trade ID from CLOB API
                    trade_id = trade.get('id', '')
                    
                    if trade_id and trade_id not in self.processed_trades:
                        self.processed_trades[trade_id] = current_time
                        await self.process_trade(trade)
                
            except aiohttp.ClientError as e:
                await self.log(f"API connection error: {e}", "error")
            except Exception as e:
                await self.log(f"Error polling trades: {e}", "error")
            
            await asyncio.sleep(POLL_INTERVAL)
    
    async def fetch_recent_trades(self) -> list:
        """Fetch REAL trades from Polymarket Data-API (public, no auth)"""
        try:
            # Public Data-API endpoint - no authentication required!
            url = "https://data-api.polymarket.com/trades"
            params = {
                'limit': 100,  # Last 100 trades
            }
            
            async with self.session.get(url, params=params, timeout=10) as resp:
                if resp.status == 200:
                    trades_data = await resp.json()
                    
                    # Transform real trades to our format
                    trades = []
                    for trade in trades_data:
                        try:
                            # Data-API structure - market data is at TOP LEVEL, not nested!
                            event_slug = trade.get('eventSlug', trade.get('slug', ''))
                            market_url = f"https://polymarket.com/{event_slug}" if event_slug else None
                            
                            trades.append({
                                'id': trade.get('transactionHash', ''),
                                'maker': trade.get('proxyWallet', ''),
                                'taker': trade.get('proxyWallet', ''),  # proxyWallet is the trader
                                'asset_id': trade.get('conditionId', ''),
                                'market': trade.get('slug', ''),
                                'size': float(trade.get('size', 0)),
                                'price': float(trade.get('price', 0)),
                                'side': trade.get('side', 'BUY').upper(),
                                'timestamp': trade.get('timestamp', ''),
                                'market_question': trade.get('title', 'Unknown Market'),
                                'market_slug': trade.get('slug', ''),
                                'market_url': market_url,
                                'outcome': trade.get('outcome', '')
                            })
                        except (ValueError, KeyError) as e:
                            # Skip malformed trades
                            continue
                    
                    return trades
                else:
                    await self.log(f"Data-API returned {resp.status}", "warning")
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
            
            return value >= WHALE_THRESHOLD
        except (ValueError, TypeError):
            return False
    
    async def process_trade(self, trade: dict):
        """Process a whale trade and send to dashboard"""
        try:
            # Extract trade data - taker is the trade initiator
            wallet = trade.get('taker', trade.get('maker', 'Unknown'))
            market_id = trade.get('asset_id', '')
            size = float(trade.get('size', 0))
            price = float(trade.get('price', 0))
            side = trade.get('side', 'UNKNOWN')
            
            # Use market data DIRECTLY from trade (already extracted from Data-API)
            market_question = trade.get('market_question', 'Unknown Market')
            market_slug = trade.get('market_slug', '')
            market_url = trade.get('market_url')
            
            # Get wallet profile
            profile = await self.get_wallet_profile(wallet)
            tag = self.calculate_tag(profile)
            
            # Detect wallet clustering
            cluster_name = await self.detect_cluster(wallet, market_id, trade)
            
            # Generate unique tx_hash from wallet + market + timestamp
            unique_str = f"{wallet}_{market_id}_{datetime.now().timestamp()}"
            tx_hash = f"0x{hash(unique_str) & 0xFFFFFFFFFFFFFFFF:016x}"
            
            # Create transaction
            tx = WhaleTransaction(
                wallet_address=wallet,
                wallet_tag=tag,
                wallet_win_rate=profile.get('win_rate'),
                wallet_pnl=profile.get('pnl'),
                market_id=market_id,
                market_question=market_question,
                market_slug=market_slug,
                market_url=market_url,
                outcome='YES' if side.upper() == 'BUY' else 'NO',
                amount=size * price,
                price=price,
                timestamp=datetime.now(timezone.utc).isoformat(),
                tx_hash=tx_hash,
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
        """Calculate wallet tag using advanced multi-factor scoring system"""
        try:
            # Extract metrics with safe defaults
            pnl = float(profile.get('profit', 0) or profile.get('pnl', 0) or 0)
            volume = float(profile.get('volume', 0) or 0)
            win_rate = float(profile.get('winSplit', 0) or profile.get('win_rate', 0) or 0)
            trade_count = int(profile.get('tradeCount', 0) or 0)
        except (ValueError, TypeError):
            return "🐟 Fish"
        
        # Insufficient data fallback
        if trade_count == 0 or volume == 0:
            return "🐟 Fish"
        
        # Calculate derived metrics
        avg_trade_size = volume / trade_count if trade_count > 0 else 0
        roi = (pnl / volume * 100) if volume > 0 else 0  # Return on Investment %
        profit_per_trade = pnl / trade_count if trade_count > 0 else 0
        
        # === SCORING SYSTEM ===
        scores = {
            'insider': 0,
            'smart_money': 0,
            'winner': 0,
            'dumb_money': 0,
            'loser': 0
        }
        
        # --- INSIDER SCORE ---
        # New accounts with exceptional performance
        if trade_count <= 15:
            if win_rate >= 0.75:
                scores['insider'] += 50
            if win_rate >= 0.85:
                scores['insider'] += 30
            if volume > 1000:
                scores['insider'] += 20
            if avg_trade_size > 500:  # Large bets confidence
                scores['insider'] += 25
            if roi > 20:  # High ROI early on
                scores['insider'] += 30
        
        # --- SMART MONEY SCORE ---
        # Consistent profitable performance over time
        if trade_count >= 10:
            if win_rate >= 0.55:
                scores['smart_money'] += 30
            if win_rate >= 0.65:
                scores['smart_money'] += 40
            if roi > 10:
                scores['smart_money'] += 35
            if pnl > 0:
                scores['smart_money'] += 25
            if pnl > 5000:
                scores['smart_money'] += 20
            # Bonus for volume + profitability combo
            if volume > 10000 and roi > 5:
                scores['smart_money'] += 30
        
        # --- WINNER SCORE ---
        # Absolute profit dominance
        if pnl > 5000:
            scores['winner'] += 40
        if pnl > 15000:
            scores['winner'] += 50
        if pnl > 30000:
            scores['winner'] += 40
        if win_rate >= 0.60 and pnl > 10000:
            scores['winner'] += 30
        
        # --- DUMB MONEY SCORE ---
        # High activity but poor results
        if volume > 5000:
            if win_rate < 0.45:
                scores['dumb_money'] += 40
            if win_rate < 0.35:
                scores['dumb_money'] += 30
            if roi < -10:
                scores['dumb_money'] += 35
            if pnl < -5000:
                scores['dumb_money'] += 40
            # Chasing losses pattern
            if trade_count > 20 and roi < -5:
                scores['dumb_money'] += 25
        
        # --- LOSER SCORE ---
        # Consistent negative performance
        if pnl < -1000:
            scores['loser'] += 30
        if pnl < -5000:
            scores['loser'] += 40
        if pnl < -10000:
            scores['loser'] += 40
        if roi < -15:
            scores['loser'] += 35
        if win_rate < 0.40 and pnl < -2000:
            scores['loser'] += 30
        
        # === DETERMINE TAG FROM HIGHEST SCORE ===
        max_score = max(scores.values())
        
        # Require minimum score threshold to assign "smart" tags
        if max_score >= 80:
            for tag, score in scores.items():
                if score == max_score:
                    if tag == 'insider':
                        return "👁️ Insider"
                    elif tag == 'smart_money':
                        return "🧠 Smart Money"
                    elif tag == 'winner':
                        return "🏆 Winner"
                    elif tag == 'dumb_money':
                        return "🤡 Dumb Money"
                    elif tag == 'loser':
                        return "💀 Loser"
        
        # === FALLBACK: VOLUME-BASED TIERS ===
        if volume > 100000:
            return "🐋 Whale"
        elif volume > 20000:
            return "🦈 Shark"
        elif volume > 5000:
            return "🐬 Dolphin"
        
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
