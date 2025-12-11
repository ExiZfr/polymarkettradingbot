"""
PolyRadar - Whale Trading Bot for Polymarket
============================================

Module 2: INTELLIGENCE (Wallet Analyzer)
Enriches whale signals with reputation scoring and categorization.

Key Features:
- Mock database for wallet history
- Smart Money vs Dumb Money classification
- Reputation scoring algorithm
- Market Maker detection
"""

import sqlite3
import time
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

# Import from Module 1
from polyradar_module1_radar import WhaleSignal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class WalletProfile:
    """Enriched wallet data with reputation metrics"""
    address: str
    first_seen: datetime
    total_trades: int
    wins: int
    losses: int
    total_pnl_usd: float
    avg_position_size: float
    win_rate: float
    category: str  # INSIDER, SMART_MONEY, MARKET_MAKER, UNKNOWN
    reputation_score: float  # 0-100
    last_updated: datetime
    
    def age_days(self) -> int:
        """Wallet age in days"""
        return (datetime.now() - self.first_seen).days


class WalletDatabase:
    """
    Mock database for wallet history
    
    In production, replace with:
    - PostgreSQL for scalability
    - Redis for caching
    - Polymarket Subgraph for historical data
    """
    
    def __init__(self, db_path: str = ":memory:"):
        """
        Args:
            db_path: SQLite database path (:memory: for in-RAM)
        """
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self._init_schema()
    
    def _init_schema(self):
        """Create tables"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS wallet_history (
                address TEXT PRIMARY KEY,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_trades INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                total_pnl_usd REAL DEFAULT 0.0,
                avg_position_size REAL DEFAULT 0.0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS recent_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet TEXT,
                market_id TEXT,
                outcome TEXT CHECK(outcome IN ('YES', 'NO')),
                amount_usd REAL,
                timestamp INTEGER,
                FOREIGN KEY (wallet) REFERENCES wallet_history(address)
            )
        """)
        
        # NEW: Historique complet des whales détectées
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS whale_signals_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL,
                market_id TEXT NOT NULL,
                outcome TEXT CHECK(outcome IN ('YES', 'NO')),
                amount_usd REAL NOT NULL,
                price REAL NOT NULL,
                timestamp INTEGER NOT NULL,
                tx_hash TEXT UNIQUE,
                gas_price REAL,
                wallet_category TEXT,
                reputation_score REAL,
                was_copied INTEGER DEFAULT 0,
                copy_position_size REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wallet_address) REFERENCES wallet_history(address)
            )
        """)
        
        # Index pour requêtes rapides
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_whale_signals_wallet 
            ON whale_signals_history(wallet_address)
        """)
        
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_whale_signals_timestamp 
            ON whale_signals_history(timestamp DESC)
        """)
        
        self.conn.commit()
        logger.info("✅ Database initialized")
    
    def get_wallet(self, address: str) -> Optional[Dict]:
        """Fetch wallet data"""
        cursor = self.conn.execute(
            "SELECT * FROM wallet_history WHERE address = ?",
            (address,)
        )
        row = cursor.fetchone()
        
        if row:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, row))
        return None
    
    def upsert_wallet(self, address: str, **kwargs):
        """Insert or update wallet data"""
        wallet = self.get_wallet(address)
        
        if wallet:
            # Update existing
            set_clause = ", ".join([f"{k} = ?" for k in kwargs.keys()])
            values = list(kwargs.values()) + [address]
            
            self.conn.execute(
                f"UPDATE wallet_history SET {set_clause}, last_updated = CURRENT_TIMESTAMP WHERE address = ?",
                values
            )
        else:
            # Insert new
            columns = ", ".join(kwargs.keys())
            placeholders = ", ".join(["?" for _ in kwargs])
            values = list(kwargs.values())
            
            self.conn.execute(
                f"INSERT INTO wallet_history (address, {columns}) VALUES (?, {placeholders})",
                [address] + values
            )
        
        self.conn.commit()
    
    def add_recent_order(self, wallet: str, market_id: str, outcome: str, amount_usd: float):
        """Track recent orders for Market Maker detection"""
        self.conn.execute(
            "INSERT INTO recent_orders (wallet, market_id, outcome, amount_usd, timestamp) VALUES (?, ?, ?, ?, ?)",
            (wallet, market_id, outcome, amount_usd, int(time.time()))
        )
        self.conn.commit()
    
    def get_recent_orders(self, wallet: str, minutes: int = 5) -> list:
        """Get orders from last N minutes"""
        cutoff = int(time.time()) - (minutes * 60)
        cursor = self.conn.execute(
            "SELECT * FROM recent_orders WHERE wallet = ? AND timestamp > ? ORDER BY timestamp DESC",
            (wallet, cutoff)
        )
        return cursor.fetchall()
    
    def seed_mock_data(self):
        """
        Populate database with mock wallets for testing
        
        This simulates known whales with different profiles
        """
        mock_wallets = [
            # The Smart Money - High win rate, big PnL
            {
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "total_trades": 450,
                "wins": 310,
                "losses": 140,
                "total_pnl_usd": 185000.0,
                "avg_position_size": 8500.0
            },
            # The Insider - New wallet, single big bet
            {
                "address": "0x1234567890123456789012345678901234567890",
                "total_trades": 1,
                "wins": 0,
                "losses": 0,
                "total_pnl_usd": 0.0,
                "avg_position_size": 25000.0
            },
            # The Market Maker - Many trades, neutral PnL
            {
                "address": "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
                "total_trades": 1200,
                "wins": 600,
                "losses": 600,
                "total_pnl_usd": 2500.0,
                "avg_position_size": 1500.0
            },
            # The Dumb Money - Bad win rate
            {
                "address": "0x9999999999999999999999999999999999999999",
                "total_trades": 85,
                "wins": 28,
                "losses": 57,
                "total_pnl_usd": -12000.0,
                "avg_position_size": 3000.0
            }
        ]
        
        for wallet in mock_wallets:
            self.upsert_wallet(**wallet)
        
        logger.info(f"✅ Seeded {len(mock_wallets)} mock wallets")
    
    def save_whale_signal(self, signal: WhaleSignal, profile: Optional[WalletProfile] = None, 
                         was_copied: bool = False, copy_size: float = 0.0):
        """
        Sauvegarde un signal whale dans l'historique
        
        Args:
            signal: Signal de whale détecté
            profile: Profil du wallet analysé (optionnel)
            was_copied: Si le trade a été copié
            copy_size: Taille de la position copiée en USD
        """
        try:
            self.conn.execute("""
                INSERT INTO whale_signals_history 
                (wallet_address, market_id, outcome, amount_usd, price, timestamp, 
                 tx_hash, gas_price, wallet_category, reputation_score, 
                 was_copied, copy_position_size)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                signal.wallet_address,
                signal.market_id,
                signal.outcome,
                signal.amount_usd,
                signal.price,
                signal.timestamp,
                signal.tx_hash,
                signal.gas_price,
                profile.category if profile else None,
                profile.reputation_score if profile else None,
                1 if was_copied else 0,
                copy_size
            ))
            self.conn.commit()
            logger.debug(f"💾 Whale signal saved: {signal.tx_hash}")
        except Exception as e:
            logger.error(f"Error saving whale signal: {e}")
    
    def get_whale_history(self, limit: int = 100, min_amount: float = 0) -> list:
        """
        Récupère l'historique des whales
        
        Args:
            limit: Nombre maximum de résultats
            min_amount: Montant minimum en USD
            
        Returns:
            Liste de dicts avec les signaux whale
        """
        cursor = self.conn.execute("""
            SELECT * FROM whale_signals_history 
            WHERE amount_usd >= ?
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (min_amount, limit))
        
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_wallet_whale_history(self, wallet: str) -> list:
        """
        Récupère tous les signaux d'un wallet spécifique
        
        Args:
            wallet: Adresse du wallet
            
        Returns:
            Liste de signaux pour ce wallet
        """
        cursor = self.conn.execute("""
            SELECT * FROM whale_signals_history 
            WHERE wallet_address = ?
            ORDER BY timestamp DESC
        """, (wallet,))
        
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_whale_analytics(self) -> Dict:
        """
        Génère des statistiques sur les whales détectées
        
        Returns:
            Dict avec métriques clés
        """
        cursor = self.conn.execute("""
            SELECT 
                COUNT(*) as total_signals,
                COUNT(DISTINCT wallet_address) as unique_wallets,
                SUM(amount_usd) as total_volume,
                AVG(amount_usd) as avg_trade_size,
                SUM(CASE WHEN was_copied = 1 THEN 1 ELSE 0 END) as copied_count,
                SUM(copy_position_size) as total_copied_volume
            FROM whale_signals_history
        """)
        
        row = cursor.fetchone()
        columns = [desc[0] for desc in cursor.description]
        stats = dict(zip(columns, row))
        
        # Top wallets
        cursor = self.conn.execute("""
            SELECT 
                wallet_address,
                wallet_category,
                COUNT(*) as signal_count,
                AVG(reputation_score) as avg_score,
                SUM(amount_usd) as total_volume
            FROM whale_signals_history
            WHERE wallet_category IS NOT NULL
            GROUP BY wallet_address
            ORDER BY signal_count DESC
            LIMIT 10
        """)
        
        stats['top_wallets'] = [dict(zip([d[0] for d in cursor.description], row)) 
                               for row in cursor.fetchall()]
        
        return stats


class WalletAnalyzer:
    """
    Main Intelligence Module
    
    Analyzes wallet behavior and assigns reputation scores
    """
    
    def __init__(self, database: WalletDatabase):
        self.db = database
    
    def _detect_market_maker(self, wallet: str, signal: WhaleSignal) -> bool:
        """
        Detect if wallet is a Market Maker
        
        Logic: Check if wallet has simultaneously placed orders on BOTH YES and NO
        in the same market within the last 5 minutes
        """
        recent = self.db.get_recent_orders(wallet, minutes=5)
        
        # Track which outcomes they traded in this market
        outcomes_in_market = set()
        for order in recent:
            if order[2] == signal.market_id:  # market_id column
                outcomes_in_market.add(order[3])  # outcome column
        
        # If they traded BOTH YES and NO = Market Maker
        has_both = "YES" in outcomes_in_market and "NO" in outcomes_in_market
        
        if has_both:
            logger.warning(f"🤖 Market Maker detected: {wallet[:10]}... (both YES/NO)")
        
        return has_both
    
    def _calculate_reputation_score(self, wallet_data: Dict, signal: WhaleSignal) -> float:
        """
        Reputation Score Algorithm (0-100)
        
        Formula:
            score = (win_rate * 50) + (pnl_factor * 30) + (experience * 20)
        
        Where:
            - win_rate: wins / total_trades (capped at 1.0)
            - pnl_factor: min(total_pnl / 100k, 1.0)
            - experience: min(total_trades / 1000, 1.0)
        """
        total_trades = wallet_data.get('total_trades', 0)
        wins = wallet_data.get('wins', 0)
        pnl = wallet_data.get('total_pnl_usd', 0.0)
        
        # Avoid division by zero
        if total_trades == 0:
            win_rate = 0.0
        else:
            win_rate = wins / total_trades
        
        # PnL factor (capped at 100k = 1.0)
        pnl_factor = min(pnl / 100_000, 1.0) if pnl > 0 else 0.0
        
        # Experience factor (capped at 1000 trades = 1.0)
        experience = min(total_trades / 1000, 1.0)
        
        # Weighted sum
        score = (win_rate * 50) + (pnl_factor * 30) + (experience * 20)
        
        return round(score, 2)
    
    def _categorize_wallet(self, wallet_data: Dict, signal: WhaleSignal) -> str:
        """
        Classify wallet into categories
        
        Categories:
            INSIDER: New wallet (< 7 days), large position (>10k)
            SMART_MONEY: Win rate > 60%, PnL > 50k
            DUMB_MONEY: Win rate < 40%
            UNKNOWN: Doesn't fit other categories
        """
        total_trades = wallet_data.get('total_trades', 0)
        wins = wallet_data.get('wins', 0)
        pnl = wallet_data.get('total_pnl_usd', 0.0)
        
        # Check if wallet is new (mock: trades < 5 = new)
        is_new = total_trades < 5
        
        # Win rate
        win_rate = (wins / total_trades) if total_trades > 0 else 0.0
        
        # Categorize
        if is_new and signal.amount_usd > 10_000:
            return "INSIDER"
        elif win_rate > 0.60 and pnl > 50_000:
            return "SMART_MONEY"
        elif win_rate < 0.40 and total_trades > 20:
            return "DUMB_MONEY"
        else:
            return "UNKNOWN"
    
    async def analyze(self, signal: WhaleSignal) -> Optional[WalletProfile]:
        """
        Main analysis pipeline
        
        Args:
            signal: Whale transaction from Radar module
        
        Returns:
            WalletProfile with enriched data, or None if wallet should be ignored
        """
        wallet = signal.wallet_address
        
        logger.info(f"🔍 Analyzing wallet: {wallet[:10]}...")
        
        # 1. Check for Market Maker behavior
        if self._detect_market_maker(wallet, signal):
            logger.info(f"⏭️  Ignoring Market Maker")
            return None
        
        # 2. Fetch wallet history
        wallet_data = self.db.get_wallet(wallet)
        
        if not wallet_data:
            # New wallet - create minimal profile
            logger.info(f"🆕 New wallet detected")
            wallet_data = {
                'address': wallet,
                'total_trades': 0,
                'wins': 0,
                'losses': 0,
                'total_pnl_usd': 0.0,
                'avg_position_size': signal.amount_usd
            }
            self.db.upsert_wallet(wallet, **wallet_data)
        
        # 3. Update recent orders
        self.db.add_recent_order(
            wallet, 
            signal.market_id, 
            signal.outcome, 
            signal.amount_usd
        )
        
        # 4. Calculate metrics
        total_trades = wallet_data['total_trades']
        wins = wallet_data['wins']
        win_rate = (wins / total_trades) if total_trades > 0 else 0.0
        
        # 5. Categorize
        category = self._categorize_wallet(wallet_data, signal)
        
        # 6. Calculate reputation score
        reputation = self._calculate_reputation_score(wallet_data, signal)
        
        # 7. Build profile
        profile = WalletProfile(
            address=wallet,
            first_seen=datetime.now(),  # Mock - should use DB timestamp
            total_trades=total_trades,
            wins=wins,
            losses=wallet_data['losses'],
            total_pnl_usd=wallet_data['total_pnl_usd'],
            avg_position_size=wallet_data['avg_position_size'],
            win_rate=win_rate,
            category=category,
            reputation_score=reputation,
            last_updated=datetime.now()
        )
        
        logger.info(
            f"📊 Profile: {category} | "
            f"WR: {win_rate*100:.1f}% | "
            f"PnL: ${wallet_data['total_pnl_usd']:,.0f} | "
            f"Score: {reputation}/100"
        )
        
        return profile


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def main_intelligence():
    """Test intelligence module independently"""
    print("=" * 60)
    print("PolyRadar Module 2: WALLET INTELLIGENCE")
    print("=" * 60)
    
    # Setup database
    db = WalletDatabase()
    db.seed_mock_data()
    
    # Create analyzer
    analyzer = WalletAnalyzer(db)
    
    # Test with mock signals
    test_signals = [
        WhaleSignal(
            wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  # Smart Money
            market_id="100001",
            outcome="YES",
            amount_usd=12000,
            price=0.62,
            timestamp=int(time.time()),
            tx_hash="0xtest1",
            gas_price=30.0
        ),
        WhaleSignal(
            wallet_address="0x1234567890123456789012345678901234567890",  # Insider
            market_id="100002",
            outcome="NO",
            amount_usd=25000,
            price=0.35,
            timestamp=int(time.time()),
            tx_hash="0xtest2",
            gas_price=30.0
        ),
        WhaleSignal(
            wallet_address="0x9999999999999999999999999999999999999999",  # Dumb Money
            market_id="100003",
            outcome="YES",
            amount_usd=5000,
            price=0.55,
            timestamp=int(time.time()),
            tx_hash="0xtest3",
            gas_price=30.0
        ),
    ]
    
    for signal in test_signals:
        print(f"\n📨 Signal: {signal.wallet_address[:10]}... | ${signal.amount_usd:,.0f}")
        profile = await analyzer.analyze(signal)
        
        if profile:
            print(f"✅ Category: {profile.category}")
            print(f"   Reputation: {profile.reputation_score}/100")
            print(f"   Win Rate: {profile.win_rate*100:.1f}%")
        else:
            print("⏭️  Skipped (Market Maker)")
    
    print("\n✅ Intelligence module test completed")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main_intelligence())
