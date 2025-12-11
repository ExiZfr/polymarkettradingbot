"""
PolyRadar - Whale Trading Bot for Polymarket
============================================

MAIN ORCHESTRATOR
Integrates all 3 modules into a complete trading system.

Pipeline:
    Module 1 (Radar) → Module 2 (Intelligence) → Module 3 (Decision) → Execution

Usage:
    python polyradar_main.py --mode simulation --bankroll 10000

Author: Senior Algo Trading Developer
"""

import asyncio
import argparse
import signal
import sys
import logging
from typing import Optional
from datetime import datetime

# Import all modules
from polyradar_module1_radar import WhaleRadar, SimulatedWhaleRadar, WhaleSignal
from polyradar_module2_intelligence import WalletDatabase, WalletAnalyzer, WalletProfile
from polyradar_module3_decision import DecisionEngine, TradingDecision

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


class PolyRadar:
    """
    Complete PolyRadar System
    
    Orchestrates the entire whale-tracking and trading pipeline
    """
    
    def __init__(
        self,
        bankroll: float,
        rpc_url: Optional[str] = None,
        simulation_mode: bool = True
    ):
        """
        Args:
            bankroll: Trading capital in USD
            rpc_url: Polygon WebSocket RPC (if None, uses simulation)
            simulation_mode: If True, uses mock data and doesn't execute real trades
        """
        self.bankroll = bankroll
        self.simulation_mode = simulation_mode
        self.is_running = False
        
        # Initialize modules
        logger.info("🚀 Initializing PolyRadar modules...")
        
        # Module 1: Radar
        if simulation_mode or not rpc_url:
            self.radar = SimulatedWhaleRadar(callback=self._on_whale_signal)
            logger.info("📡 Radar: SIMULATION mode (mock blockchain data)")
        else:
            self.radar = WhaleRadar(rpc_url=rpc_url, callback=self._on_whale_signal)
            logger.info(f"📡 Radar: LIVE mode ({rpc_url[:50]}...)")
        
        # Module 2: Intelligence
        self.db = WalletDatabase()
        if simulation_mode:
            self.db.seed_mock_data()
        self.analyzer = WalletAnalyzer(self.db)
        logger.info("🧠 Intelligence: Wallet analyzer ready")
        
        # Module 3: Decision
        self.engine = DecisionEngine(
            bankroll=bankroll,
            mock_mode=simulation_mode
        )
        logger.info(f"🎯 Decision: Engine initialized (${bankroll:,.0f} bankroll)")
        
        # Stats
        self.stats = {
            'signals_received': 0,
            'signals_ignored': 0,
            'trades_executed': 0,
            'trades_skipped': 0,
            'total_exposure_usd': 0.0
        }
    
    async def _on_whale_signal(self, signal: WhaleSignal):
        """
        Callback when Radar detects a whale
        
        This is the MAIN PIPELINE that connects all modules
        """
        try:
            self.stats['signals_received'] += 1
            
            logger.info("\n" + "=" * 70)
            logger.info(f"🐋 WHALE SIGNAL #{self.stats['signals_received']}")
            logger.info(f"   Wallet: {signal.wallet_address[:10]}...")
            logger.info(f"   Amount: ${signal.amount_usd:,.0f} on {signal.outcome} @ {signal.price:.2f}")
            logger.info(f"   Market: {signal.market_id}")
            logger.info("=" * 70)
            
            # STEP 1: Analyze wallet (Module 2)
            logger.info("\n[STEP 1/3] 🔍 Analyzing wallet...")
            profile = await self.analyzer.analyze(signal)
            
            # Sauvegarder le signal dans l'historique (même si ignoré)
            self.db.save_whale_signal(
                signal=signal,
                profile=profile,
                was_copied=False,  # Sera mis à jour après exécution
                copy_size=0.0
            )
            
            if not profile:
                # Wallet ignored (e.g., Market Maker)
                self.stats['signals_ignored'] += 1
                logger.info("❌ Signal IGNORED (Market Maker detected)\n")
                return
            
            # STEP 2: Make decision (Module 3)
            logger.info("\n[STEP 2/3] 🧠 Making trading decision...")
            decision = await self.engine.decide(signal, profile)
            
            # STEP 3: Execute trade (if confidence is high enough)
            logger.info("\n[STEP 3/3] 🎯 Executing decision...")
            
            if decision.should_trade:
                result = await self.engine.execute_decision(decision)
                
                if result['status'] in ['mock_success', 'success']:
                    self.stats['trades_executed'] += 1
                    self.stats['total_exposure_usd'] += decision.position_size_usd
                    
                    # Mettre à jour l'historique: trade copié
                    self.db.save_whale_signal(
                        signal=signal,
                        profile=profile,
                        was_copied=True,
                        copy_size=decision.position_size_usd
                    )
                    
                    logger.info("✅ TRADE EXECUTED")
                    logger.info(f"   Position: ${decision.position_size_usd:,.2f}")
                    logger.info(f"   Limit Price: {decision.limit_price}")
                    logger.info(f"   Confidence: {decision.confidence_score}/100")
                else:
                    self.stats['trades_skipped'] += 1
                    logger.info(f"⏭️  TRADE SKIPPED: {result.get('status', 'unknown')}")
            else:
                self.stats['trades_skipped'] += 1
                logger.info(f"❌ TRADE REJECTED: {decision.reasoning}")
            
            self._print_stats()
            
        except Exception as e:
            logger.error(f"❌ Error processing signal: {e}", exc_info=True)
    
    def _print_stats(self):
        """Print current session statistics"""
        logger.info("\n" + "-" * 70)
        logger.info("📊 SESSION STATS")
        logger.info(f"   Signals Received: {self.stats['signals_received']}")
        logger.info(f"   Signals Ignored: {self.stats['signals_ignored']}")
        logger.info(f"   Trades Executed: {self.stats['trades_executed']}")
        logger.info(f"   Trades Skipped: {self.stats['trades_skipped']}")
        logger.info(f"   Total Exposure: ${self.stats['total_exposure_usd']:,.2f}")
        
        if self.stats['signals_received'] > 0:
            copy_rate = (self.stats['trades_executed'] / self.stats['signals_received']) * 100
            logger.info(f"   Copy Rate: {copy_rate:.1f}%")
        
        logger.info("-" * 70 + "\n")
    
    async def start(self):
        """Start the PolyRadar system"""
        logger.info("\n" + "=" * 70)
        logger.info("🎯 POLYRADAR - WHALE TRACKING BOT")
        logger.info("=" * 70)
        logger.info(f"Mode: {'SIMULATION' if self.simulation_mode else 'LIVE'}")
        logger.info(f"Bankroll: ${self.bankroll:,.0f}")
        logger.info(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70 + "\n")
        
        if not self.simulation_mode:
            logger.warning("\n⚠️  WARNING: Running in LIVE mode!")
            logger.warning("⚠️  Real money will be traded!")
            response = input("Type 'YES' to confirm: ")
            if response != "YES":
                logger.info("🛑 Cancelled by user")
                return
        
        try:
            # Connect to blockchain
            logger.info("🔌 Connecting to data source...")
            connected = await self.radar.connect()
            
            if not connected:
                logger.error("❌ Failed to connect. Exiting.")
                return
            
            # Start listening
            self.is_running = True
            logger.info("👂 Listening for whale transactions...\n")
            await self.radar.listen()
            
        except KeyboardInterrupt:
            logger.info("\n🛑 Shutdown requested by user")
        except Exception as e:
            logger.error(f"❌ Fatal error: {e}", exc_info=True)
        finally:
            await self.stop()
    
    async def stop(self):
        """Gracefully stop the system"""
        logger.info("\n🛑 Shutting down PolyRadar...")
        self.is_running = False
        self.radar.stop()
        
        # Final stats
        self._print_stats()
        
        # Whale analytics
        try:
            analytics = self.db.get_whale_analytics()
            
            logger.info("\n" + "=" * 70)
            logger.info("🐋 WHALE ANALYTICS")
            logger.info("=" * 70)
            logger.info(f"Total Signals Detected: {analytics['total_signals'] or 0}")
            logger.info(f"Unique Wallets: {analytics['unique_wallets'] or 0}")
            logger.info(f"Total Volume: ${analytics['total_volume'] or 0:,.2f}")
            logger.info(f"Avg Trade Size: ${analytics['avg_trade_size'] or 0:,.2f}")
            logger.info(f"Copied Trades: {analytics['copied_count'] or 0}")
            logger.info(f"Copied Volume: ${analytics['total_copied_volume'] or 0:,.2f}")
            
            if analytics.get('top_wallets'):
                logger.info("\nTop 5 Most Active Whales:")
                for i, wallet in enumerate(analytics['top_wallets'][:5], 1):
                    logger.info(
                        f"  {i}. {wallet['wallet_address'][:10]}... "
                        f"({wallet['wallet_category']}) - "
                        f"{wallet['signal_count']} signals, "
                        f"${wallet['total_volume']:,.0f} volume"
                    )
            
            logger.info(f"\n💾 Historique sauvegardé dans: whale_signals_history table")
            logger.info("=" * 70)
        except Exception as e:
            logger.error(f"Error displaying analytics: {e}")
        
        logger.info("\n✅ Shutdown complete\n")


def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    logger.info("\n🛑 Interrupt received, shutting down...")
    sys.exit(0)


async def main():
    """Main entry point"""
    # Parse arguments
    parser = argparse.ArgumentParser(description='PolyRadar - Whale Trading Bot')
    parser.add_argument(
        '--mode',
        choices=['simulation', 'live'],
        default='simulation',
        help='Run in simulation or live mode'
    )
    parser.add_argument(
        '--bankroll',
        type=float,
        default=10000.0,
        help='Trading bankroll in USD (default: $10,000)'
    )
    parser.add_argument(
        '--rpc',
        type=str,
        help='Polygon WebSocket RPC URL (required for live mode)'
    )
    
    args = parser.parse_args()
    
    # Validate
    if args.mode == 'live' and not args.rpc:
        logger.error("❌ --rpc is required for live mode")
        logger.info("Example: --rpc wss://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY")
        sys.exit(1)
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start PolyRadar
    polyradar = PolyRadar(
        bankroll=args.bankroll,
        rpc_url=args.rpc if args.mode == 'live' else None,
        simulation_mode=(args.mode == 'simulation')
    )
    
    await polyradar.start()


if __name__ == "__main__":
    # Run the async main
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n✅ Exited cleanly")
