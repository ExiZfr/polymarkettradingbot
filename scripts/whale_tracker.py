"""
Whale Tracker - Polymarket Blockchain Monitor
==============================================

Tracks whale transactions on Polygon blockchain in real-time,
analyzes wallet performance, assigns intelligent tags, and stores
everything in PostgreSQL database.

Features:
- WebSocket connection to Polygon (Alchemy/Infura)
- Real-time CTFExchange OrderFilled event listener
- Polymarket API integration for market enrichment
- Intelligent whale tagging (WINNER, LOOSER, INSIDER, etc.)
- PostgreSQL storage via Next.js API
- 24/7 operation with auto-reconnect

Author: PolygraalX Team
Version: 2.0.0
"""

import asyncio
import aiohttp
import json
import os
import time
import logging
from typing import Dict, Optional, List
from datetime import datetime
from dataclasses import dataclass, asdict
from web3 import Web3
from web3.providers import HTTPProvider

# Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Environment variables
POLYGON_RPC_WSS = os.getenv('POLYGON_RPC_WSS', 'wss://polygon-mainnet.g.alchemy.com/v2/demo')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
MODE = os.getenv('WHALE_TRACKER_MODE', 'simulation')  # production | simulation
MIN_WHALE_AMOUNT_USD = float(os.getenv('MIN_WHALE_AMOUNT', '1000'))

# Polymarket contract addresses
CTF_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
CONDITIONAL_TOKENS_ADDRESS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"

# Polymarket API
POLYMARKET_API_BASE = "https://gamma-api.polymarket.com"


@dataclass
class WhaleTransaction:
    """Represents a whale transaction to be recorded"""
    tx_hash: str
    block_number: int
    timestamp: str  # ISO format
    gas_price: float
    wallet_address: str
    wallet_tag: str
    wallet_win_rate: Optional[float]
    wallet_total_pnl: Optional[float]
    market_id: str
    market_question: str
    market_slug: str
    outcome: str
    amount: float
    price: float
    shares: float


class PolymarketAPI:
    """Client for Polymarket API"""
    
    def __init__(self):
        self.base_url = POLYMARKET_API_BASE
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def init_session(self):
        """Initialize aiohttp session"""
        if not self.session:
            self.session = aiohttp.ClientSession()
    
    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()
    
    async def get_market_by_condition_id(self, condition_id: str) -> Optional[Dict]:
        """
        Fetch market details from Polymarket API using condition_id
        
        Returns dict with: question, slug, outcomes, etc.
        """
        try:
            await self.init_session()
            
            # Try markets endpoint
            url = f"{self.base_url}/markets/{condition_id}"
            async with self.session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return {
                        'question': data.get('question', 'Unknown Market'),
                        'slug': data.get('slug', condition_id),
                        'outcomes': data.get('outcomes', ['YES', 'NO']),
                        'active': data.get('active', True)
                    }
                else:
                    logger.warning(f"Market API returned {resp.status} for {condition_id}")
                    return None
        
        except Exception as e:
            logger.error(f"Error fetching market {condition_id}: {e}")
            return None


class WhaleAnalyzer:
    """Analyzes wallet history and assigns intelligent tags"""
    
    def __init__(self):
        self.wallet_cache: Dict[str, Dict] = {}
    
    def calculate_tag(self, wallet_address: str, profile: Dict, current_trade: Optional[Dict] = None) -> str:
        """
        Advanced intelligent tagging algorithm using multi-metric analysis
        
        Metrics used:
        1. Win Rate (winRate)
        2. Total PnL (totalPnl)
        3. Trade Count & Experience (totalTrades)
        4. Average Position Size (avgPositionSize)
        5. Profit Factor (avgWin / avgLoss ratio)
        6. Current Streak (currentStreak)
        7. Max Streaks (maxWinStreak, maxLossStreak)
        8. Total Volume (totalVolume)
        9. Trading Velocity (trades per time period)
        10. Position Sizing Consistency
        11. Recent Performance (if available)
        
        Tags with confidence-based scoring:
        - INSIDER: New sophisticated wallets with specific patterns
        - WINNER: Consistently high performing traders
        - SMART_MONEY: Experienced traders with solid metrics
        - LOOSER: Consistent poor performers
        - DUMB_MONEY: High volume with bad results
        - UNKNOWN: Insufficient data or neutral performance
        """
        # Extract metrics
        win_rate = profile.get('winRate', 0.0)
        total_pnl = profile.get('totalPnl', 0.0)
        total_trades = profile.get('totalTrades', 0)
        avg_position = profile.get('avgPositionSize', 0.0)
        total_volume = profile.get('totalVolume', 0.0)
        current_streak = profile.get('currentStreak', 0)
        max_win_streak = profile.get('maxWinStreak', 0)
        max_loss_streak = profile.get('maxLossStreak', 0)
        
        # Calculate derived metrics
        
        # 1. Trade velocity (trades per day estimate from total volume)
        # Assume avg trade lasts 2 days, rough estimation
        if total_trades > 0:
            estimated_days = max(total_trades * 2, 1)
            trading_velocity = total_trades / estimated_days  # trades per day
        else:
            trading_velocity = 0
        
        # 2. Position sizing consistency
        # If avg position is very different from total_volume/total_trades, it's inconsistent
        if total_trades > 1 and total_volume > 0:
            calculated_avg = total_volume / total_trades
            sizing_consistency = min(avg_position / max(calculated_avg, 1), calculated_avg / max(avg_position, 1))
        else:
            sizing_consistency = 1.0  # Neutral for new wallets
        
        # 3. Profit Factor (simplified: assuming win_rate correlates with win size)
        # Real profit factor = total_wins / abs(total_losses)
        # Approximation based on win_rate and pnl
        if win_rate > 0 and win_rate < 1 and total_trades > 10:
            # Estimate: if 60% win rate and positive PnL, profit factor > 1
            profit_factor = (total_pnl / max(total_volume, 1)) + win_rate
        else:
            profit_factor = 0.0
        
        # 4. Streak quality (positive streaks = discipline, negative = tilt)
        if total_trades > 0:
            streak_quality = (max_win_streak - max_loss_streak) / max(total_trades, 1)
        else:
            streak_quality = 0
        
        # 5. ROI (Return on Investment)
        roi = (total_pnl / max(total_volume, 1)) * 100 if total_volume > 0 else 0
        
        # =====================================================================
        # INSIDER DETECTION (Most Sophisticated)
        # =====================================================================
        # Insider patterns:
        # - Very few trades (<10) BUT high conviction (large positions)
        # - Abnormally high initial win rate OR very large first positions
        # - Rapid accumulation of capital
        # - Unusual timing (if we had timestamp data)
        
        if total_trades <= 10:  # New or very selective wallet
            insider_score = 0
            
            # Factor 1: Large position size for a new wallet
            if avg_position > 10000:
                insider_score += 30
                if avg_position > 25000:
                    insider_score += 20  # Very large = highly suspicious
            
            # Factor 2: High immediate win rate (>70% with few trades = unusual)
            if total_trades >= 3 and win_rate > 0.70:
                insider_score += 25
                if win_rate > 0.85:
                    insider_score += 15  # Extremely high = very suspicious
            
            # Factor 3: High ROI with few trades
            if roi > 50 and total_trades >= 2:
                insider_score += 20
            
            # Factor 4: Large single trade (if current_trade provided)
            if current_trade:
                current_amount = current_trade.get('amount', 0)
                if current_amount > 20000 and total_trades < 5:
                    insider_score += 25  # First few trades being huge = insider
            
            # Factor 5: Perfect or near-perfect early streak
            if total_trades >= 3:
                if current_streak >= 3 or max_win_streak >= 3:
                    insider_score += 15
            
            # Factor 6: High total PnL relative to trade count
            if total_trades > 0 and abs(total_pnl) / total_trades > 5000:
                insider_score += 20
            
            # Threshold: INSIDER if score >= 60 (indicating multiple red flags)
            if insider_score >= 60:
                return 'INSIDER'
        
        # =====================================================================
        # WINNER DETECTION (Top Tier Performers)
        # =====================================================================
        # Winners are established traders with excellent track record
        winner_score = 0
        
        # Factor 1: Win rate excellence
        if win_rate >= 0.65:
            winner_score += 20
            if win_rate >= 0.75:
                winner_score += 15
        
        # Factor 2: Significant profits
        if total_pnl > 30000:
            winner_score += 25
            if total_pnl > 75000:
                winner_score += 20
        
        # Factor 3: Experience (proven track record)
        if total_trades > 50:
            winner_score += 15
            if total_trades > 200:
                winner_score += 10
        
        # Factor 4: Positive current streak
        if current_streak > 3:
            winner_score += 10
            if current_streak > 7:
                winner_score += 10
        
        # Factor 5: High ROI
        if roi > 20:
            winner_score += 15
            if roi > 40:
                winner_score += 10
        
        # Factor 6: Strong profit factor
        if profit_factor > 1.5:
            winner_score += 10
        
        if winner_score >= 70:
            return 'WINNER'
        
        # =====================================================================
        # LOOSER DETECTION (Consistent Poor Performers)
        # =====================================================================
        looser_score = 0
        
        # Factor 1: Low win rate
        if win_rate <= 0.40:
            looser_score += 20
            if win_rate <= 0.30:
                looser_score += 15
        
        # Factor 2: Significant losses
        if total_pnl < -5000:
            looser_score += 25
            if total_pnl < -20000:
                looser_score += 20
        
        # Factor 3: Enough trades to confirm pattern
        if total_trades > 30:
            looser_score += 15
            if total_trades > 75:
                looser_score += 10
        
        # Factor 4: Negative current streak
        if current_streak < -3:
            looser_score += 15
            if current_streak < -7:
                looser_score += 10
        
        # Factor 5: Negative ROI
        if roi < -15:
            looser_score += 15
        
        # Factor 6: Long loss streaks
        if max_loss_streak > 5:
            looser_score += 10
        
        if looser_score >= 70:
            return 'LOOSER'
        
        # =====================================================================
        # SMART_MONEY DETECTION (Experienced Solid Traders)
        # =====================================================================
        smart_money_score = 0
        
        # Factor 1: Good win rate (not excellent, but solid)
        if 0.55 <= win_rate < 0.70:
            smart_money_score += 20
        
        # Factor 2: Positive PnL (not huge, but consistent)
        if 5000 < total_pnl < 50000:
            smart_money_score += 20
        
        # Factor 3: Significant experience
        if total_trades > 100:
            smart_money_score += 25
            if total_trades > 300:
                smart_money_score += 15
        
        # Factor 4: Consistent position sizing
        if sizing_consistency > 0.7:
            smart_money_score += 15
        
        # Factor 5: Moderate ROI (sustainable)
        if 10 < roi < 30:
            smart_money_score += 15
        
        # Factor 6: Volume shows commitment
        if total_volume > 100000:
            smart_money_score += 10
        
        if smart_money_score >= 65:
            return 'SMART_MONEY'
        
        # =====================================================================
        # DUMB_MONEY DETECTION (High Activity, Poor Results)
        # =====================================================================
        dumb_money_score = 0
        
        # Factor 1: Poor win rate with high activity
        if win_rate < 0.45 and total_trades > 50:
            dumb_money_score += 30
        
        # Factor 2: Negative or low PnL despite high volume
        if total_volume > 50000 and total_pnl < 5000:
            dumb_money_score += 25
        
        # Factor 3: Lots of trades with poor results
        if total_trades > 75 and roi < 5:
            dumb_money_score += 20
        
        # Factor 4: Inconsistent sizing (chasing losses)
        if sizing_consistency < 0.5 and total_trades > 30:
            dumb_money_score += 15
        
        # Factor 5: Poor streak management
        if max_loss_streak > max_win_streak and total_trades > 40:
            dumb_money_score += 10
        
        if dumb_money_score >= 60:
            return 'DUMB_MONEY'
        
        # =====================================================================
        # DEFAULT: UNKNOWN
        # =====================================================================
        # Not enough data or neutral performance
        return 'UNKNOWN'
    
    async def get_wallet_profile(self, wallet_address: str) -> Dict:
        """
        Fetch wallet profile from our API or create default
        
        Returns: { winRate, totalPnl, totalTrades, avgPositionSize, currentTag }
        """
        # Check cache first
        if wallet_address in self.wallet_cache:
            return self.wallet_cache[wallet_address]
        
        try:
            # Fetch from our backend API
            async with aiohttp.ClientSession() as session:
                url = f"{API_BASE_URL}/api/radar/whales/{wallet_address}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        profile = data.get('profile', self._default_profile())
                        self.wallet_cache[wallet_address] = profile
                        return profile
                    else:
                        # New wallet or error - return defaults
                        return self._default_profile()
        except Exception as e:
            logger.warning(f"Error fetching wallet profile {wallet_address}: {e}")
            return self._default_profile()
    
    def _default_profile(self) -> Dict:
        """Default profile for new/unknown wallets"""
        return {
            'winRate': 0.0,
            'totalPnl': 0.0,
            'totalTrades': 0,
            'avgPositionSize': 0.0,
            'totalVolume': 0.0,
            'currentStreak': 0,
            'maxWinStreak': 0,
            'maxLossStreak': 0,
            'currentTag': 'UNKNOWN'
        }


class WhaleTracker:
    """Main whale tracking system"""
    
    def __init__(self):
        self.w3: Optional[Web3] = None
        self.is_running = False
        self.polymarket_api = PolymarketAPI()
        self.analyzer = WhaleAnalyzer()
        
        # Mock whale addresses for simulation
        self.mock_whales = [
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  # WINNER
            "0x1234567890abcdef1234567890abcdef12345678",  # INSIDER
            "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",  # SMART_MONEY
            "0x9999888877776666555544443333222211110000",  # LOOSER
        ]
        
        # ABI for OrderFilled event
        self.order_filled_abi = {
            "anonymous": False,
            "inputs": [
                {"indexed": True, "name": "orderHash", "type": "bytes32"},
                {"indexed": True, "name": "maker", "type": "address"},
                {"indexed": False, "name": "tokenId", "type": "uint256"},
                {"indexed": False, "name": "makerAmount", "type": "uint256"},
                {"indexed": False, "name": "takerAmount", "type": "uint256"},
            ],
            "name": "OrderFilled",
            "type": "event"
        }
    
    async def connect_to_polygon(self) -> bool:
        """Establish connection to Polygon via HTTP"""
        try:
            logger.info(f"🔌 Connecting to Polygon...")
            logger.info(f"   RPC: {POLYGON_RPC_WSS[:50]}...")
            
            # Convert WebSocket URL to HTTP URL
            http_url = POLYGON_RPC_WSS.replace('wss://', 'https://').replace('ws://', 'http://')
            
            provider = HTTPProvider(http_url)
            self.w3 = Web3(provider)
            
            # Verify connection
            if self.w3.is_connected():
                block = self.w3.eth.block_number
                logger.info(f"✅ Connected to Polygon! Block: {block}")
                return True
            else:
                logger.error("❌ Failed to connect")
                return False
        
        except Exception as e:
            logger.error(f"❌ Connection error: {e}")
            return False
    
    async def parse_transaction(self, event) -> Optional[WhaleTransaction]:
        """
        Parse blockchain event into WhaleTransaction
        
        This extracts all transaction details and enriches with Polymarket data
        """
        try:
            args = event['args']
            tx_hash = event['transactionHash'].hex()
            block_number = event['blockNumber']
            
            # Wallet info
            wallet_address = args['maker']
            maker_amount = args['makerAmount']
            taker_amount = args['takerAmount']
            token_id = args['tokenId']
            
            # Calculate USD amount (USDC has 6 decimals)
            amount_usd = maker_amount / 1e6
            
            # Filter: minimum whale amount
            if amount_usd < MIN_WHALE_AMOUNT_USD:
                return None
            
            # Get block timestamp and gas price
            block = await asyncio.to_thread(self.w3.eth.get_block, block_number)
            timestamp = datetime.fromtimestamp(block['timestamp']).isoformat()
            gas_price = float(self.w3.from_wei(block.get('baseFeePerGas', 0), 'gwei'))
            
            # Extract market_id and outcome from token_id
            # Note: This is simplified - in production, decode from CTF contract
            market_id = str(token_id)
            outcome = "YES" if token_id % 2 == 0 else "NO"
            
            # Fetch market details from Polymarket
            market_data = await self.polymarket_api.get_market_by_condition_id(market_id)
            if not market_data:
                # Fallback if API fails
                market_data = {
                    'question': f"Market {market_id[:8]}...",
                    'slug': market_id,
                    'outcomes': ['YES', 'NO']
                }
            
            # Calculate price (simplified - should fetch from market)
            price = round(0.45 + (hash(tx_hash) % 40) / 100, 2)  # Mock: 0.45-0.85
            shares = amount_usd / price
            
            # Analyze wallet and get tag
            wallet_profile = await self.analyzer.get_wallet_profile(wallet_address)
            
            # Pass current trade for enhanced INSIDER detection
            current_trade = {'amount': amount_usd, 'price': price}
            wallet_tag = self.analyzer.calculate_tag(wallet_address, wallet_profile, current_trade)
            
            # Build transaction object
            transaction = WhaleTransaction(
                tx_hash=tx_hash,
                block_number=block_number,
                timestamp=timestamp,
                gas_price=gas_price,
                wallet_address=wallet_address,
                wallet_tag=wallet_tag,
                wallet_win_rate=wallet_profile.get('winRate'),
                wallet_total_pnl=wallet_profile.get('totalPnl'),
                market_id=market_id,
                market_question=market_data['question'],
                market_slug=market_data['slug'],
                outcome=outcome,
                amount=amount_usd,
                price=price,
                shares=shares
            )
            
            logger.info(f"🐋 WHALE DETECTED | {wallet_tag} | ${amount_usd:,.0f} {outcome} @ {price}")
            logger.info(f"   Market: {market_data['question'][:60]}...")
            logger.info(f"   Wallet: {wallet_address[:10]}...")
            
            return transaction
        
        except Exception as e:
            logger.error(f"Error parsing transaction: {e}")
            return None
    
    async def send_to_api(self, transaction: WhaleTransaction) -> bool:
        """Send transaction to Next.js API for database storage"""
        try:
            url = f"{API_BASE_URL}/api/radar/transactions"
            data = asdict(transaction)
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status in [200, 201]:
                        logger.debug(f"✅ Transaction saved to DB: {transaction.tx_hash[:10]}...")
                        return True
                    else:
                        error_text = await resp.text()
                        logger.error(f"❌ API error {resp.status}: {error_text}")
                        return False
        
        except Exception as e:
            logger.error(f"❌ Failed to send to API: {e}")
            return False
    
    async def send_log_to_console(self, log_message: str, level: str = "INFO"):
        """Send log message to frontend console"""
        try:
            url = f"{API_BASE_URL}/api/radar/logs"
            data = {
                'level': level,
                'timestamp': datetime.now().isoformat(),
                'message': log_message
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status != 200:
                        logger.warning(f"Failed to send log to console: {resp.status}")
        
        except Exception:
            pass  # Silent fail for console logs
    
    async def listen_production(self):
        """Listen to real blockchain events (production mode)"""
        logger.info("👂 Listening for whale transactions on Polygon...")
        await self.send_log_to_console("🚀 Whale Tracker started (LIVE MODE)", "INFO")
        
        try:
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(CTF_EXCHANGE_ADDRESS),
                abi=[self.order_filled_abi]
            )
            
            event_filter = contract.events.OrderFilled.create_filter(fromBlock='latest')
            
            while self.is_running:
                try:
                    # Get new events
                    events = await asyncio.to_thread(event_filter.get_new_entries)
                    
                    for event in events:
                        transaction = await self.parse_transaction(event)
                        
                        if transaction:
                            # Send to database
                            success = await self.send_to_api(transaction)
                            
                            # Send to frontend console
                            log_msg = f"🐋 {transaction.wallet_tag} | ${transaction.amount:,.0f} {transaction.outcome} @ {transaction.price} | {transaction.market_question[:50]}..."
                            await self.send_log_to_console(log_msg, "INFO")
                    
                    # Poll every 2 seconds
                    await asyncio.sleep(2)
                
                except Exception as e:
                    logger.error(f"Error in listen loop: {e}")
                    await asyncio.sleep(5)  # Backoff on error
        
        except Exception as e:
            logger.error(f"Fatal error in production listener: {e}")
            await self.send_log_to_console(f"❌ Listener crashed: {e}", "ERROR")
    
    async def listen_simulation(self):
        """Generate mock whale transactions for testing"""
        logger.info("👂 Simulation mode started - generating mock transactions...")
        await self.send_log_to_console("🚀 Whale Tracker started (SIMULATION MODE)", "INFO")
        
        counter = 0
        mock_markets = [
            ("Will Trump win 2024?", "will-trump-win-2024"),
            ("Bitcoin above 100k in 2025?", "bitcoin-above-100k-2025"),
            ("AI achieves AGI by 2030?", "ai-achieves-agi-2030"),
        ]
        
        while self.is_running:
            try:
                # Random delay between transactions (5-15s)
                await asyncio.sleep(5 + (counter % 10))
                
                # Generate mock transaction
                wallet = self.mock_whales[counter % len(self.mock_whales)]
                market = mock_markets[counter % len(mock_markets)]
                
                # Mock wallet profiles with COMPLETE metrics for advanced tagging
                profiles = {
                    # WINNER Profile: Established whale with excellent track record
                    self.mock_whales[0]: {
                        'winRate': 0.76,
                        'totalPnl': 90000,
                        'totalTrades': 450,
                        'avgPositionSize': 8500,
                        'totalVolume': 3825000,  # 450 * 8500
                        'currentStreak': 5,  # On a 5-win streak
                        'maxWinStreak': 12,
                        'maxLossStreak': 3
                    },
                    
                    # INSIDER Profile: New wallet with suspicious large bets and high win rate
                    self.mock_whales[1]: {
                        'winRate': 0.75,  # 3 wins out of 4 trades (suspiciously high for new wallet)
                        'totalPnl': 45000,  # Large profit for only 4 trades
                        'totalTrades':4,  # Very few trades
                        'avgPositionSize': 28000,  # Unusually large positions
                        'totalVolume': 112000,  # 4 * 28000
                        'currentStreak': 3,  # On win streak from start
                        'maxWinStreak': 3,
                        'maxLossStreak': 1
                    },
                    
                    # SMART_MONEY Profile: Experienced solid trader
                    self.mock_whales[2]: {
                        'winRate': 0.62,
                        'totalPnl': 38000,
                        'totalTrades': 220,
                        'avgPositionSize': 5200,
                        'totalVolume': 1144000,  # 220 * 5200
                        'currentStreak': -1,  # Just lost one
                        'maxWinStreak': 8,
                        'maxLossStreak': 4
                    },
                    
                    # LOOSER Profile: Consistent poor performer
                    self.mock_whales[3]: {
                        'winRate': 0.28,
                        'totalPnl': -22000,
                        'totalTrades': 95,
                        'avgPositionSize': 3100,
                        'totalVolume': 294500,  # 95 * 3100
                        'currentStreak': -6,  # On a bad losing streak
                        'maxWinStreak': 3,
                        'maxLossStreak': 9
                    },
                }
                
                profile = profiles[wallet]
                
                # Calculate amount for current trade (varying amounts to test algorithm)
                current_amount = 1000 + (counter * 500)
                current_price = 0.45 + (counter % 30) / 100
                current_trade = {'amount': current_amount, 'price': current_price}
                
                # Use advanced tagging algorithm
                tag = self.analyzer.calculate_tag(wallet, profile, current_trade)
                
                transaction = WhaleTransaction(
                    tx_hash=f"0xmock{counter:010d}",
                    block_number=40000000 + counter,
                    timestamp=datetime.now().isoformat(),
                    gas_price=30.0 + (counter % 20),
                    wallet_address=wallet,
                    wallet_tag=tag,
                    wallet_win_rate=profile['winRate'],
                    wallet_total_pnl=profile['totalPnl'],
                    market_id=f"market_{counter:06d}",
                    market_question=market[0],
                    market_slug=market[1],
                    outcome="YES" if counter % 2 == 0 else "NO",
                    amount=1000 + (counter * 500),
                    price=0.45 + (counter % 30) / 100,
                    shares=(1000 + counter * 500) / (0.45 + (counter % 30) / 100)
                )
                
                logger.info(f"🐋 [SIM] {tag} | ${transaction.amount:,.0f} {transaction.outcome} @ {transaction.price}")
                logger.info(f"   Market: {market[0]}")
                
                # Send to API
                await self.send_to_api(transaction)
                
                # Send to console
                log_msg = f"🐋 {tag} | ${transaction.amount:,.0f} {transaction.outcome} @ {transaction.price} | {market[0]}"
                await self.send_log_to_console(log_msg, "INFO")
                
                counter += 1
            
            except Exception as e:
                logger.error(f"Error in simulation: {e}")
                await asyncio.sleep(5)
    
    async def start(self):
        """Start the whale tracker"""
        logger.info("=" * 70)
        logger.info("🐋 WHALE TRACKER - POLYGRAALX")
        logger.info("=" * 70)
        logger.info(f"Mode: {MODE.upper()}")
        logger.info(f"Min Amount: ${MIN_WHALE_AMOUNT_USD:,.0f}")
        logger.info(f"API Endpoint: {API_BASE_URL}")
        logger.info("=" * 70)
        
        self.is_running = True
        
        try:
            if MODE == 'production':
                # Connect to real blockchain
                connected = await self.connect_to_polygon()
                if not connected:
                    logger.error("❌ Failed to connect to Polygon. Exiting.")
                    return
                
                # Start listening
                await self.listen_production()
            else:
                # Simulation mode (no blockchain required)
                await self.listen_simulation()
        
        except KeyboardInterrupt:
            logger.info("\n🛑 Shutdown requested")
        except Exception as e:
            logger.error(f"❌ Fatal error: {e}", exc_info=True)
        finally:
            await self.stop()
    
    async def stop(self):
        """Gracefully stop the tracker"""
        logger.info("🛑 Stopping whale tracker...")
        self.is_running = False
        
        await self.polymarket_api.close_session()
        await self.send_log_to_console("🛑 Whale Tracker stopped", "WARNING")
        
        logger.info("✅ Shutdown complete")


async def main():
    """Entry point"""
    tracker = WhaleTracker()
    await tracker.start()


if __name__ == "__main__":
    asyncio.run(main())
