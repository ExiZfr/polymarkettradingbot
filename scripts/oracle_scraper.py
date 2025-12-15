#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    CRYPTO ORACLE LEADERBOARD SCRAPER v1.0                      ║
║                      Scrapes Top 500+ Crypto Traders                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Runs continuously to:
1. Fetch Polymarket leaderboard data
2. Filter for crypto-focused traders
3. Calculate advanced metrics
4. Store in PostgreSQL database
"""

import os
import sys
import json
import time
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import hashlib

# Database
try:
    import psycopg2
    from psycopg2.extras import execute_values, RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("[WARN] psycopg2 not installed. Run: pip install psycopg2-binary")

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"

# Target: 500+ traders in each category
TARGET_TRADERS_PER_CATEGORY = 500

# Crypto market keywords
CRYPTO_KEYWORDS = ["bitcoin", "btc", "ethereum", "eth", "solana", "sol", "crypto", "xrp", "doge", "ada"]

# Scraping intervals
FULL_SCRAPE_INTERVAL = 3600  # Full scrape every hour
ACTIVITY_CHECK_INTERVAL = 60  # Check for new activity every minute

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "")

# ═══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class TraderProfile:
    address: str
    total_pnl: float = 0
    win_rate: float = 0
    total_trades: int = 0
    avg_trade_size: float = 0
    crypto_trades: int = 0
    crypto_pnl: float = 0
    crypto_win_rate: float = 0
    rank: int = 0
    score: int = 0
    category: str = "neutral"  # "top", "bottom", "neutral"
    last_trade_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

def setup_logging():
    logger = logging.getLogger("OracleScraper")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%H:%M:%S'
        ))
        logger.addHandler(handler)
        
        # File handler
        try:
            file_handler = logging.FileHandler("logs/oracle_scraper.log")
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s'
            ))
            logger.addHandler(file_handler)
        except:
            pass
    
    return logger

logger = setup_logging()

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

class Database:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None
    
    def connect(self):
        if not PSYCOPG2_AVAILABLE:
            logger.error("psycopg2 not available")
            return False
        
        try:
            self.conn = psycopg2.connect(self.database_url)
            logger.info("✅ Connected to database")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def ensure_tables(self):
        """Ensure Oracle tables exist"""
        if not self.conn:
            return False
        
        try:
            with self.conn.cursor() as cur:
                # Check if table exists
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'oracle_leaderboard'
                    )
                """)
                exists = cur.fetchone()[0]
                
                if not exists:
                    logger.warning("⚠️ oracle_leaderboard table doesn't exist. Run prisma db push.")
                    return False
                
                return True
        except Exception as e:
            logger.error(f"Error checking tables: {e}")
            return False
    
    def upsert_traders(self, traders: List[TraderProfile]) -> int:
        """Upsert trader profiles"""
        if not self.conn or not traders:
            return 0
        
        try:
            with self.conn.cursor() as cur:
                # Prepare data
                values = [
                    (
                        t.address,
                        t.total_pnl,
                        t.win_rate,
                        t.total_trades,
                        t.avg_trade_size,
                        t.crypto_trades,
                        t.crypto_pnl,
                        t.crypto_win_rate,
                        t.rank,
                        t.score,
                        t.last_trade_at,
                        datetime.now()
                    )
                    for t in traders
                ]
                
                # Upsert query
                query = """
                    INSERT INTO oracle_leaderboard (
                        id, "traderAddress", "totalPnl", "winRate", "totalTrades",
                        "avgTradeSize", "cryptoTrades", "cryptoPnl", "cryptoWinRate",
                        rank, score, "lastTradeAt", "updatedAt"
                    ) VALUES %s
                    ON CONFLICT ("traderAddress") DO UPDATE SET
                        "totalPnl" = EXCLUDED."totalPnl",
                        "winRate" = EXCLUDED."winRate",
                        "totalTrades" = EXCLUDED."totalTrades",
                        "avgTradeSize" = EXCLUDED."avgTradeSize",
                        "cryptoTrades" = EXCLUDED."cryptoTrades",
                        "cryptoPnl" = EXCLUDED."cryptoPnl",
                        "cryptoWinRate" = EXCLUDED."cryptoWinRate",
                        rank = EXCLUDED.rank,
                        score = EXCLUDED.score,
                        "lastTradeAt" = EXCLUDED."lastTradeAt",
                        "updatedAt" = EXCLUDED."updatedAt"
                """
                
                # Generate IDs
                values_with_ids = [
                    (hashlib.md5(v[0].encode()).hexdigest()[:25],) + v
                    for v in values
                ]
                
                execute_values(cur, query, values_with_ids, template="""(
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )""")
                
                self.conn.commit()
                return len(traders)
                
        except Exception as e:
            logger.error(f"Error upserting traders: {e}")
            self.conn.rollback()
            return 0
    
    def get_trader_count(self) -> int:
        if not self.conn:
            return 0
        
        try:
            with self.conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM oracle_leaderboard")
                return cur.fetchone()[0]
        except:
            return 0
    
    def close(self):
        if self.conn:
            self.conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
# SCRAPER
# ═══════════════════════════════════════════════════════════════════════════════

class OracleScraper:
    def __init__(self, db: Database):
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "PolyGraalX-Oracle/1.0"
        })
        self.crypto_markets: Dict[str, dict] = {}
        self.traders: Dict[str, TraderProfile] = {}
    
    def fetch_crypto_markets(self) -> Dict[str, dict]:
        """Fetch all active crypto markets"""
        logger.info("📊 Fetching crypto markets...")
        markets = {}
        
        try:
            response = self.session.get(
                f"{GAMMA_API}/markets",
                params={"closed": False, "limit": 200, "active": True},
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch markets: {response.status_code}")
                return markets
            
            all_markets = response.json()
            
            for market in all_markets:
                question = (market.get("question", "") + " " + market.get("description", "")).lower()
                
                if any(kw in question for kw in CRYPTO_KEYWORDS):
                    market_id = market.get("conditionId") or market.get("condition_id", "")
                    if market_id:
                        markets[market_id] = market
            
            logger.info(f"   Found {len(markets)} crypto markets")
            return markets
            
        except Exception as e:
            logger.error(f"Error fetching markets: {e}")
            return markets
    
    def fetch_global_leaderboard(self, limit: int = 500) -> List[dict]:
        """Fetch global Polymarket leaderboard from multiple sources"""
        logger.info(f"🏆 Fetching global leaderboard (top {limit})...")
        
        traders = []
        
        # Source 1: Gamma API users endpoint
        try:
            response = self.session.get(
                f"{GAMMA_API}/users",
                params={"limit": 100, "sortBy": "pnl", "order": "desc"},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    traders.extend(data)
                    logger.info(f"   Source 1 (users): {len(data)} traders")
        except Exception as e:
            logger.warning(f"   Source 1 failed: {e}")
        
        # Source 2: Gamma API profiles
        try:
            response = self.session.get(
                f"{GAMMA_API}/profiles",
                params={"limit": 100},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Filter unique addresses
                    existing = {t.get("address", t.get("user", "")) for t in traders}
                    new_traders = [t for t in data if t.get("address", t.get("user", "")) not in existing]
                    traders.extend(new_traders)
                    logger.info(f"   Source 2 (profiles): {len(new_traders)} traders")
        except Exception as e:
            logger.warning(f"   Source 2 failed: {e}")
        
        # Source 3: CLOB API recent trades (get unique traders)
        try:
            response = self.session.get(
                f"{CLOB_API}/trades",
                params={"limit": 500},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                trades = data if isinstance(data, list) else data.get("trades", [])
                
                # Extract unique traders
                existing = {t.get("address", t.get("user", "")) for t in traders}
                trader_addresses = set()
                
                for trade in trades:
                    addr = trade.get("maker", trade.get("taker", ""))
                    if addr and addr not in existing and addr not in trader_addresses:
                        trader_addresses.add(addr)
                        traders.append({
                            "address": addr,
                            "pnl": 0,
                            "trades": 1,
                            "from_trades": True
                        })
                
                logger.info(f"   Source 3 (CLOB trades): {len(trader_addresses)} traders")
        except Exception as e:
            logger.warning(f"   Source 3 failed: {e}")
        
        # Source 4: Activity feed across all markets
        try:
            response = self.session.get(
                f"{GAMMA_API}/activity",
                params={"limit": 500},
                timeout=30
            )
            if response.status_code == 200:
                activities = response.json()
                if isinstance(activities, list):
                    existing = {t.get("address", t.get("user", "")) for t in traders}
                    activity_traders = {}
                    
                    for act in activities:
                        addr = act.get("proxyWallet", act.get("user", ""))
                        if addr and addr not in existing:
                            if addr not in activity_traders:
                                activity_traders[addr] = {
                                    "address": addr,
                                    "pnl": 0,
                                    "trades": 0,
                                    "volume": 0
                                }
                            activity_traders[addr]["trades"] += 1
                            activity_traders[addr]["volume"] += float(act.get("usdcSize", 0) or 0)
                    
                    traders.extend(activity_traders.values())
                    logger.info(f"   Source 4 (activity): {len(activity_traders)} traders")
        except Exception as e:
            logger.warning(f"   Source 4 failed: {e}")
        
        logger.info(f"   Total: {len(traders)} traders from all sources")
        return traders[:limit]
    
    def fetch_market_activity(self, market_id: str, limit: int = 100) -> List[dict]:
        """Fetch recent activity for a market"""
        try:
            response = self.session.get(
                f"{GAMMA_API}/activity",
                params={"market": market_id, "limit": limit},
                timeout=15
            )
            
            if response.status_code == 200:
                return response.json()
            return []
            
        except Exception as e:
            logger.error(f"Error fetching activity for {market_id}: {e}")
            return []
    
    def fetch_user_profile(self, address: str) -> Optional[dict]:
        """Fetch detailed user profile"""
        try:
            response = self.session.get(
                f"{GAMMA_API}/users/{address}",
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except:
            return None
    
    def calculate_score(self, profile: TraderProfile) -> int:
        """Calculate composite score for ranking"""
        score = 0
        
        # PnL component (0-40 pts)
        if profile.total_pnl > 100000:
            score += 40
        elif profile.total_pnl > 50000:
            score += 35
        elif profile.total_pnl > 10000:
            score += 25
        elif profile.total_pnl > 1000:
            score += 15
        elif profile.total_pnl > 0:
            score += 5
        elif profile.total_pnl < -10000:
            score -= 20  # Negative for worst traders
        
        # Win rate component (0-25 pts)
        if profile.win_rate > 0.7:
            score += 25
        elif profile.win_rate > 0.6:
            score += 20
        elif profile.win_rate > 0.5:
            score += 10
        elif profile.win_rate < 0.4:
            score -= 10
        
        # Crypto specialization (0-20 pts)
        if profile.crypto_trades > 0:
            crypto_ratio = profile.crypto_trades / max(profile.total_trades, 1)
            score += int(crypto_ratio * 20)
        
        # Volume/activity (0-15 pts)
        if profile.total_trades > 100:
            score += 15
        elif profile.total_trades > 50:
            score += 10
        elif profile.total_trades > 20:
            score += 5
        
        return max(0, min(100, score))
    
    def scrape_from_market_activity(self) -> Dict[str, TraderProfile]:
        """Scrape traders from crypto market activity"""
        logger.info("🔍 Scraping traders from crypto market activity...")
        
        traders: Dict[str, TraderProfile] = {}
        
        for market_id, market in self.crypto_markets.items():
            activities = self.fetch_market_activity(market_id, limit=200)
            
            for activity in activities:
                address = activity.get("proxyWallet") or activity.get("user", "")
                if not address:
                    continue
                
                # Get or create profile
                if address not in traders:
                    traders[address] = TraderProfile(address=address)
                
                profile = traders[address]
                
                # Update stats
                profile.crypto_trades += 1
                
                # Parse activity data
                size = float(activity.get("usdcSize", 0) or 0)
                is_win = activity.get("outcome") == "won"
                pnl = float(activity.get("pnl", 0) or 0)
                
                profile.crypto_pnl += pnl
                profile.total_trades += 1
                profile.avg_trade_size = (profile.avg_trade_size * (profile.total_trades - 1) + size) / profile.total_trades
                
                # Update win rate
                if is_win:
                    profile.win_rate = (profile.win_rate * (profile.total_trades - 1) + 1) / profile.total_trades
                else:
                    profile.win_rate = (profile.win_rate * (profile.total_trades - 1)) / profile.total_trades
                
                # Last trade time
                try:
                    profile.last_trade_at = datetime.fromisoformat(activity.get("timestamp", "").replace("Z", "+00:00"))
                except:
                    profile.last_trade_at = datetime.now()
            
            time.sleep(0.2)  # Rate limiting
        
        logger.info(f"   Found {len(traders)} traders from market activity")
        return traders
    
    def scrape_from_leaderboard(self) -> Dict[str, TraderProfile]:
        """Scrape from global leaderboard and enrich with crypto data"""
        logger.info("🏅 Processing global leaderboard...")
        
        traders: Dict[str, TraderProfile] = {}
        leaderboard = self.fetch_global_leaderboard(limit=TARGET_TRADERS_PER_CATEGORY)
        
        for idx, entry in enumerate(leaderboard):
            address = entry.get("address") or entry.get("user", "")
            if not address:
                continue
            
            profile = TraderProfile(
                address=address,
                total_pnl=float(entry.get("pnl", 0) or entry.get("totalPnl", 0) or 0),
                win_rate=float(entry.get("winRate", 0) or entry.get("win_rate", 0) or 0),
                total_trades=int(entry.get("trades", 0) or entry.get("totalTrades", 0) or 0),
                avg_trade_size=float(entry.get("avgTradeSize", 0) or 0),
                rank=idx + 1
            )
            
            # Determine category
            if profile.total_pnl > 10000:
                profile.category = "top"
            elif profile.total_pnl < -5000:
                profile.category = "bottom"
            else:
                profile.category = "neutral"
            
            traders[address] = profile
        
        logger.info(f"   Processed {len(traders)} from leaderboard")
        return traders
    
    def enrich_with_crypto_data(self, traders: Dict[str, TraderProfile]):
        """Cross-reference traders with crypto market activity"""
        logger.info("🔗 Enriching profiles with crypto data...")
        
        # Get crypto activity traders
        crypto_traders = self.scrape_from_market_activity()
        
        # Merge data
        for address, crypto_profile in crypto_traders.items():
            if address in traders:
                # Merge crypto stats
                traders[address].crypto_trades = crypto_profile.crypto_trades
                traders[address].crypto_pnl = crypto_profile.crypto_pnl
                traders[address].crypto_win_rate = crypto_profile.win_rate
            else:
                # Add new crypto-only trader
                traders[address] = crypto_profile
        
        # Calculate scores
        for profile in traders.values():
            profile.score = self.calculate_score(profile)
        
        logger.info(f"   Total traders after enrichment: {len(traders)}")
    
    def run_full_scrape(self) -> int:
        """Run a full scraping cycle"""
        logger.info("=" * 60)
        logger.info("🚀 Starting full scrape cycle")
        logger.info("=" * 60)
        
        start_time = time.time()
        
        # 1. Fetch crypto markets
        self.crypto_markets = self.fetch_crypto_markets()
        
        if not self.crypto_markets:
            logger.warning("No crypto markets found, skipping")
            return 0
        
        # 2. Scrape from leaderboard
        traders = self.scrape_from_leaderboard()
        
        # 3. Enrich with crypto data
        self.enrich_with_crypto_data(traders)
        
        # 4. Sort and rank
        sorted_traders = sorted(
            traders.values(),
            key=lambda t: (t.crypto_trades > 0, t.score, t.total_pnl),
            reverse=True
        )
        
        # Update ranks
        for idx, profile in enumerate(sorted_traders):
            profile.rank = idx + 1
        
        # 5. Store in database
        stored = self.db.upsert_traders(sorted_traders)
        
        elapsed = time.time() - start_time
        
        logger.info("=" * 60)
        logger.info(f"✅ Scrape complete!")
        logger.info(f"   Traders found: {len(sorted_traders)}")
        logger.info(f"   Stored in DB: {stored}")
        logger.info(f"   Crypto traders: {sum(1 for t in sorted_traders if t.crypto_trades > 0)}")
        logger.info(f"   Top traders: {sum(1 for t in sorted_traders if t.category == 'top')}")
        logger.info(f"   Bottom traders: {sum(1 for t in sorted_traders if t.category == 'bottom')}")
        logger.info(f"   Duration: {elapsed:.1f}s")
        logger.info("=" * 60)
        
        return stored
    
    def run_loop(self):
        """Main scraping loop"""
        logger.info("🔮 Oracle Leaderboard Scraper starting...")
        
        last_full_scrape = 0
        
        while True:
            try:
                now = time.time()
                
                # Full scrape every hour
                if now - last_full_scrape > FULL_SCRAPE_INTERVAL:
                    self.run_full_scrape()
                    last_full_scrape = now
                
                # Sleep
                time.sleep(ACTIVITY_CHECK_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("👋 Shutting down...")
                break
            except Exception as e:
                logger.error(f"Loop error: {e}")
                time.sleep(30)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    CRYPTO ORACLE LEADERBOARD SCRAPER v1.0                      ║
║                      Scrapes Top 500+ Crypto Traders                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Check database URL
    if not DATABASE_URL:
        logger.error("❌ DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Connect to database
    db = Database(DATABASE_URL)
    if not db.connect():
        logger.error("❌ Failed to connect to database")
        sys.exit(1)
    
    # Check tables
    if not db.ensure_tables():
        logger.error("❌ Database tables not ready. Run: npx prisma db push")
        sys.exit(1)
    
    # Start scraper
    scraper = OracleScraper(db)
    
    try:
        scraper.run_loop()
    finally:
        db.close()


if __name__ == "__main__":
    main()
