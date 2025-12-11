"""
PolyRadar - Whale Trading Bot for Polymarket
============================================

Module 1: RADAR (Blockchain Event Listener)
Detects whale transactions on Polygon blockchain in real-time.

Author: Senior Algo Trading Developer
Tech Stack: Web3.py, AsyncIO, WebSockets
"""

import asyncio
import time
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from web3 import Web3
from web3.providers import WebsocketProvider
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class WhaleSignal:
    """Data structure for whale transaction signals"""
    wallet_address: str
    market_id: str
    outcome: str  # "YES" or "NO"
    amount_usd: float
    price: float
    timestamp: int
    tx_hash: str
    gas_price: float
    
    def to_dict(self) -> Dict:
        return {
            "wallet_address": self.wallet_address,
            "market_id": self.market_id,
            "outcome": self.outcome,
            "amount_usd": self.amount_usd,
            "price": self.price,
            "timestamp": self.timestamp,
            "tx_hash": self.tx_hash,
            "gas_price": self.gas_price
        }


class ChainSplittingDetector:
    """
    Detects suspicious chain splitting behavior:
    Multiple small transactions from same wallet in short timeframe
    """
    
    def __init__(self, threshold_count: int = 10, timeframe_seconds: int = 60):
        self.threshold = threshold_count
        self.timeframe = timeframe_seconds
        self.wallet_txs: Dict[str, List[float]] = {}  # wallet -> [timestamps]
    
    def add_transaction(self, wallet: str, timestamp: float) -> bool:
        """
        Returns True if wallet is chain splitting
        """
        if wallet not in self.wallet_txs:
            self.wallet_txs[wallet] = []
        
        # Clean old timestamps
        cutoff = timestamp - self.timeframe
        self.wallet_txs[wallet] = [t for t in self.wallet_txs[wallet] if t > cutoff]
        
        # Add new timestamp
        self.wallet_txs[wallet].append(timestamp)
        
        # Check if threshold exceeded
        return len(self.wallet_txs[wallet]) >= self.threshold


class WhaleRadar:
    """
    Main Radar Module: Listens to Polygon blockchain for whale transactions
    
    Key Features:
    - WebSocket connection to Polygon RPC
    - Event filtering for CTFExchange contract
    - Chain splitting detection
    - Real-time signal emission
    """
    
    # Polymarket contract addresses on Polygon
    CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
    CONDITIONAL_TOKENS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"
    
    # Minimum whale transaction in USD
    MIN_WHALE_AMOUNT = 1000.0
    
    def __init__(self, rpc_url: str, callback: Optional[Callable] = None):
        """
        Args:
            rpc_url: WebSocket RPC endpoint (e.g., wss://polygon-mainnet.g.alchemy.com/v2/KEY)
            callback: Async function to call when whale detected
        """
        self.rpc_url = rpc_url
        self.callback = callback
        self.w3: Optional[Web3] = None
        self.is_running = False
        self.chain_detector = ChainSplittingDetector()
        
        # ABI for CTFExchange OrderFilled event
        # In production, load full ABI from file
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
    
    async def connect(self):
        """Establish WebSocket connection to Polygon"""
        try:
            logger.info(f"🔌 Connecting to Polygon RPC: {self.rpc_url[:50]}...")
            
            # Use WebSocket provider for real-time events
            provider = WebsocketProvider(self.rpc_url)
            self.w3 = Web3(provider)
            
            # Verify connection
            if await asyncio.to_thread(self.w3.is_connected):
                block_number = await asyncio.to_thread(self.w3.eth.block_number)
                logger.info(f"✅ Connected to Polygon! Current block: {block_number}")
                return True
            else:
                logger.error("❌ Failed to connect to Polygon")
                return False
                
        except Exception as e:
            logger.error(f"❌ Connection error: {e}")
            return False
    
    def _parse_order_event(self, event) -> Optional[WhaleSignal]:
        """
        Parse blockchain event into WhaleSignal
        
        This is a SIMPLIFIED version. In production:
        - Decode tokenId to get market_id and outcome
        - Fetch current price from Polymarket API
        - Convert amounts using proper decimals (USDC = 6 decimals)
        """
        try:
            args = event['args']
            tx_hash = event['transactionHash'].hex()
            
            # Extract data (MOCK - replace with real parsing)
            wallet = args['maker']
            maker_amount = args['makerAmount']
            taker_amount = args['takerAmount']
            
            # MOCK: In production, decode tokenId properly
            token_id = args['tokenId']
            market_id = str(token_id % 1000000)  # Mock market ID
            outcome = "YES" if token_id % 2 == 0 else "NO"  # Mock outcome
            
            # Calculate USD amount (assuming 6 decimals for USDC)
            amount_usd = maker_amount / 1e6
            
            # Mock price (in production, fetch from market data)
            price = 0.50 + (hash(tx_hash) % 40) / 100  # Random 0.50-0.90
            
            # Filter: Ignore small transactions
            if amount_usd < self.MIN_WHALE_AMOUNT:
                return None
            
            # Check for chain splitting
            timestamp = time.time()
            if self.chain_detector.add_transaction(wallet, timestamp):
                logger.warning(f"⚠️  Chain splitting detected: {wallet}")
                return None  # Suspicious behavior, ignore
            
            # Create signal
            signal = WhaleSignal(
                wallet_address=wallet,
                market_id=market_id,
                outcome=outcome,
                amount_usd=amount_usd,
                price=price,
                timestamp=int(timestamp),
                tx_hash=tx_hash,
                gas_price=0.0  # Mock
            )
            
            logger.info(f"🐋 WHALE DETECTED: {wallet[:10]}... | ${amount_usd:,.0f} on {outcome} @ {price:.2f}")
            return signal
            
        except Exception as e:
            logger.error(f"Error parsing event: {e}")
            return None
    
    async def listen(self):
        """
        Main event loop: Listen for OrderFilled events
        
        Uses web3.py event filters to catch transactions in real-time
        """
        if not self.w3:
            logger.error("Not connected! Call connect() first.")
            return
        
        try:
            self.is_running = True
            logger.info(f"👂 Listening for whale transactions on {self.CTF_EXCHANGE}...")
            
            # Create event filter for CTFExchange
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.CTF_EXCHANGE),
                abi=[self.order_filled_abi]
            )
            
            # Event filter for OrderFilled
            event_filter = contract.events.OrderFilled.create_filter(fromBlock='latest')
            
            while self.is_running:
                try:
                    # Get new events (non-blocking)
                    events = await asyncio.to_thread(event_filter.get_new_entries)
                    
                    for event in events:
                        signal = self._parse_order_event(event)
                        
                        if signal and self.callback:
                            # Emit signal to next module
                            await self.callback(signal)
                    
                    # Poll every 2 seconds
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error in event loop: {e}")
                    await asyncio.sleep(5)  # Back off on error
                    
        except Exception as e:
            logger.error(f"Fatal error in listen(): {e}")
        finally:
            self.is_running = False
            logger.info("🛑 Radar stopped")
    
    def stop(self):
        """Stop the radar"""
        self.is_running = False


# ============================================================================
# SIMULATION MODE (For testing without real blockchain)
# ============================================================================

class SimulatedWhaleRadar(WhaleRadar):
    """
    Test version that generates mock whale signals
    Use this for development before connecting to real blockchain
    """
    
    def __init__(self, callback: Optional[Callable] = None):
        super().__init__(rpc_url="mock://localhost", callback=callback)
        self.mock_wallets = [
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  # Known smart money
            "0x1234567890123456789012345678901234567890",  # Insider
            "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",  # Market maker
        ]
    
    async def connect(self):
        """Mock connection"""
        logger.info("🔌 Using SIMULATED radar (no real blockchain)")
        await asyncio.sleep(1)
        return True
    
    async def listen(self):
        """Generate random whale signals for testing"""
        self.is_running = True
        logger.info("👂 Simulated radar started. Generating mock signals...")
        
        signal_count = 0
        while self.is_running:
            # Random whale transaction every 5-15 seconds
            await asyncio.sleep(5 + (signal_count % 10))
            
            wallet = self.mock_wallets[signal_count % len(self.mock_wallets)]
            
            signal = WhaleSignal(
                wallet_address=wallet,
                market_id=str(100000 + signal_count),
                outcome="YES" if signal_count % 2 == 0 else "NO",
                amount_usd=1000 + (signal_count * 500),
                price=0.45 + (signal_count % 30) / 100,
                timestamp=int(time.time()),
                tx_hash=f"0xmock{signal_count:010d}",
                gas_price=30.0
            )
            
            logger.info(f"🐋 [SIM] Whale: ${signal.amount_usd:,.0f} on {signal.outcome}")
            
            if self.callback:
                await self.callback(signal)
            
            signal_count += 1


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_signal_handler(signal: WhaleSignal):
    """Example callback function"""
    print(f"📨 Received signal: {signal.to_dict()}")


async def main_radar_only():
    """Test radar module independently"""
    print("=" * 60)
    print("PolyRadar Module 1: WHALE RADAR")
    print("=" * 60)
    
    # Use simulated radar for testing
    radar = SimulatedWhaleRadar(callback=example_signal_handler)
    
    # For real blockchain, use:
    # radar = WhaleRadar(
    #     rpc_url="wss://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY",
    #     callback=example_signal_handler
    # )
    
    await radar.connect()
    
    # Listen for 30 seconds
    listen_task = asyncio.create_task(radar.listen())
    await asyncio.sleep(30)
    radar.stop()
    await listen_task
    
    print("\n✅ Radar test completed")


if __name__ == "__main__":
    asyncio.run(main_radar_only())
