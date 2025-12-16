#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    POLYGRAALX PURE ARBITRAGE SCANNER v1.0                    ║
║                    Guaranteed Profit Detection on Polymarket                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Arbitrage Logic:
- For binary markets: YES + NO should = $1.00
- If YES + NO < $1.00 → ARBITRAGE! Buy both for guaranteed profit
- If YES + NO > $1.00 → Reverse arb (sell both) - rarely possible

This scanner monitors ALL active Polymarket markets for arbitrage opportunities.
"""

import asyncio
import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import requests
from dotenv import load_dotenv

load_dotenv()

# Configuration
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"
SCAN_INTERVAL = 30  # seconds between full scans
MIN_ARB_PERCENT = 0.5  # Minimum arbitrage opportunity in % (0.5% = $0.005 per $1)
MIN_LIQUIDITY = 1000  # Minimum USD liquidity to consider
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('ArbScanner')

@dataclass
class ArbOpportunity:
    """Detected arbitrage opportunity"""
    id: str
    market_id: str
    market_question: str
    market_slug: str
    market_image: str
    yes_price: float
    no_price: float
    total_price: float  # YES + NO
    arb_percent: float  # Profit percentage per $1 wagered
    arb_type: str  # 'CLASSIC' (buy both) or 'REVERSE' (sell both)
    guaranteed_profit: float  # Per $100 wagered
    liquidity: float
    volume_24h: float
    detected_at: str
    expires_at: str

@dataclass
class ScanStats:
    """Statistics for the current scan"""
    markets_scanned: int = 0
    opportunities_found: int = 0
    best_arb_percent: float = 0.0
    total_arb_value: float = 0.0
    last_scan: str = ""
    scan_duration_ms: int = 0


class ArbitrageScanner:
    """
    Scans Polymarket for arbitrage opportunities.
    """
    
    def __init__(self):
        self.opportunities: List[ArbOpportunity] = []
        self.stats = ScanStats()
        self.running = False
        self.cache_file = os.path.join(DATA_DIR, 'arbitrage_opportunities.json')
        
        # Ensure data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
    
    def fetch_all_markets(self) -> List[dict]:
        """Fetch all active markets from Polymarket"""
        all_markets = []
        offset = 0
        limit = 100
        
        while True:
            try:
                response = requests.get(
                    f"{GAMMA_API}/markets",
                    params={
                        "closed": False,
                        "active": True,
                        "limit": limit,
                        "offset": offset
                    },
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"API error: {response.status_code}")
                    break
                
                markets = response.json()
                if not markets:
                    break
                
                all_markets.extend(markets)
                offset += limit
                
                # Rate limiting
                time.sleep(0.2)
                
                # Safety limit
                if offset > 2000:
                    break
                    
            except Exception as e:
                logger.error(f"Fetch error: {e}")
                break
        
        logger.info(f"📊 Fetched {len(all_markets)} active markets")
        return all_markets
    
    def analyze_market(self, market: dict) -> Optional[ArbOpportunity]:
        """
        Analyze a single market for arbitrage opportunity.
        Returns ArbOpportunity if found, None otherwise.
        """
        try:
            market_id = market.get('conditionId', '')
            question = market.get('question', '')
            
            # Get outcome prices
            outcome_prices_str = market.get('outcomePrices', '[]')
            if isinstance(outcome_prices_str, str):
                outcome_prices = json.loads(outcome_prices_str)
            else:
                outcome_prices = outcome_prices_str
            
            if len(outcome_prices) < 2:
                return None
            
            yes_price = float(outcome_prices[0])
            no_price = float(outcome_prices[1])
            
            # Validate prices
            if yes_price <= 0 or no_price <= 0:
                return None
            if yes_price > 1 or no_price > 1:
                return None
            
            total_price = yes_price + no_price
            
            # Get liquidity
            liquidity = float(market.get('liquidityNum', 0) or 0)
            volume = float(market.get('volume24hr', 0) or 0)
            
            # Skip low liquidity markets (harder to execute arb)
            if liquidity < MIN_LIQUIDITY:
                return None
            
            # Calculate arbitrage
            if total_price < 1.0:
                # CLASSIC ARBITRAGE: Buy both YES and NO
                arb_percent = (1.0 - total_price) * 100
                arb_type = 'CLASSIC'
                guaranteed_profit = (1.0 - total_price) * 100  # Per $100 wagered
            elif total_price > 1.0:
                # REVERSE ARBITRAGE: If you could sell (rarely possible)
                arb_percent = (total_price - 1.0) * 100
                arb_type = 'REVERSE'
                guaranteed_profit = (total_price - 1.0) * 100
            else:
                return None
            
            # Filter by minimum opportunity
            if arb_percent < MIN_ARB_PERCENT:
                return None
            
            return ArbOpportunity(
                id=f"arb_{market_id}_{int(time.time())}",
                market_id=market_id,
                market_question=question,
                market_slug=market.get('slug', ''),
                market_image=market.get('image', '') or market.get('icon', ''),
                yes_price=yes_price,
                no_price=no_price,
                total_price=total_price,
                arb_percent=arb_percent,
                arb_type=arb_type,
                guaranteed_profit=guaranteed_profit,
                liquidity=liquidity,
                volume_24h=volume,
                detected_at=datetime.now().isoformat(),
                expires_at=market.get('endDate', '')
            )
            
        except Exception as e:
            logger.debug(f"Analysis error for {market.get('question', 'unknown')}: {e}")
            return None
    
    def scan(self) -> List[ArbOpportunity]:
        """Perform a full scan of all markets"""
        start_time = time.time()
        
        logger.info("🔍 Starting arbitrage scan...")
        
        markets = self.fetch_all_markets()
        opportunities = []
        
        for market in markets:
            opp = self.analyze_market(market)
            if opp:
                opportunities.append(opp)
        
        # Sort by arbitrage percentage (best first)
        opportunities.sort(key=lambda x: x.arb_percent, reverse=True)
        
        # Update stats
        scan_duration = int((time.time() - start_time) * 1000)
        self.stats = ScanStats(
            markets_scanned=len(markets),
            opportunities_found=len(opportunities),
            best_arb_percent=opportunities[0].arb_percent if opportunities else 0.0,
            total_arb_value=sum(o.guaranteed_profit for o in opportunities),
            last_scan=datetime.now().isoformat(),
            scan_duration_ms=scan_duration
        )
        
        self.opportunities = opportunities
        self.save_opportunities()
        
        if opportunities:
            logger.info(f"💰 Found {len(opportunities)} arbitrage opportunities!")
            for i, opp in enumerate(opportunities[:5]):
                logger.info(f"  {i+1}. {opp.market_question[:50]}... | +{opp.arb_percent:.2f}% | ${opp.guaranteed_profit:.2f}/100")
        else:
            logger.info("No arbitrage opportunities found in this scan.")
        
        return opportunities
    
    def save_opportunities(self):
        """Save opportunities to JSON file"""
        try:
            data = {
                'stats': asdict(self.stats),
                'opportunities': [asdict(o) for o in self.opportunities]
            }
            with open(self.cache_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save opportunities: {e}")
    
    async def start(self):
        """Start continuous scanning"""
        self.running = True
        logger.info("=" * 60)
        logger.info("🚀 POLYGRAALX ARBITRAGE SCANNER STARTED")
        logger.info(f"   Min Arb: {MIN_ARB_PERCENT}%")
        logger.info(f"   Min Liquidity: ${MIN_LIQUIDITY}")
        logger.info(f"   Scan Interval: {SCAN_INTERVAL}s")
        logger.info("=" * 60)
        
        while self.running:
            try:
                self.scan()
                
                logger.info(f"⏳ Next scan in {SCAN_INTERVAL}s...")
                await asyncio.sleep(SCAN_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("⛔ Interrupted by user")
                break
            except Exception as e:
                logger.error(f"Scan error: {e}")
                await asyncio.sleep(5)
        
        self.stop()
    
    def stop(self):
        """Stop the scanner"""
        self.running = False
        logger.info("🛑 Scanner stopped")
        logger.info(f"Final stats: {self.stats.opportunities_found} opportunities found in last scan")


def main():
    """Main entry point"""
    print()
    print("╔══════════════════════════════════════════════════════════════════════════════╗")
    print("║                    POLYGRAALX PURE ARBITRAGE SCANNER v1.0                    ║")
    print("║                    Detecting Guaranteed Profits on Polymarket                ║")
    print("╚══════════════════════════════════════════════════════════════════════════════╝")
    print()
    
    scanner = ArbitrageScanner()
    
    try:
        asyncio.run(scanner.start())
    except KeyboardInterrupt:
        scanner.stop()


if __name__ == "__main__":
    main()
