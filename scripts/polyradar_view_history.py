"""
PolyRadar - Whale History Viewer
=================================

Script utilitaire pour consulter l'historique des whales détectées.
Utile pour le futur module de copy trading.

Usage:
    python polyradar_view_history.py --last 50
    python polyradar_view_history.py --wallet 0x742d35C...
    python polyradar_view_history.py --stats
"""

import argparse
import sqlite3
from datetime import datetime
import json


class WhaleHistoryViewer:
    """Viewer pour l'historique des whales"""
    
    def __init__(self, db_path: str = "polyradar_whales.db"):
        """
        Args:
            db_path: Chemin vers la base SQLite
        """
        self.db_path = db_path
        try:
            self.conn = sqlite3.connect(db_path)
            self.conn.row_factory = sqlite3.Row
            print(f"✅ Connected to {db_path}")
        except Exception as e:
            print(f"❌ Error connecting to database: {e}")
            raise
    
    def view_recent(self, limit: int = 50, min_amount: float = 0):
        """Affiche les derniers signaux whale"""
        cursor = self.conn.execute("""
            SELECT * FROM whale_signals_history
            WHERE amount_usd >= ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (min_amount, limit))
        
        rows = cursor.fetchall()
        
        if not rows:
            print(f"\n❌ Aucun signal trouvé (min: ${min_amount})")
            return
        
        print(f"\n🐋 {len(rows)} DERNIERS SIGNAUX WHALE")
        print("=" * 100)
        
        for i, row in enumerate(rows, 1):
            timestamp = datetime.fromtimestamp(row['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            copied_mark = "✅ COPIÉ" if row['was_copied'] else "⏭️  Skip"
            
            print(f"\n#{i}. [{timestamp}] {row['wallet_address'][:10]}... | {row['wallet_category'] or 'UNKNOWN'}")
            print(f"   Market: {row['market_id']} | {row['outcome']} @ ${row['price']:.2f}")
            print(f"   Amount: ${row['amount_usd']:,.2f}")
            print(f"   Score: {row['reputation_score'] or 'N/A'}/100")
            print(f"   Status: {copied_mark}")
            if row['was_copied']:
                print(f"   Position: ${row['copy_position_size']:,.2f}")
    
    def view_wallet(self, wallet: str):
        """Affiche l'historique d'un wallet spécifique"""
        cursor = self.conn.execute("""
            SELECT * FROM whale_signals_history
            WHERE wallet_address = ?
            ORDER BY timestamp DESC
        """, (wallet,))
        
        rows = cursor.fetchall()
        
        if not rows:
            print(f"\n❌ Aucun signal pour le wallet {wallet}")
            return
        
        print(f"\n📊 HISTORIQUE WALLET: {wallet}")
        print("=" * 100)
        
        # Stats du wallet
        total_volume = sum(r['amount_usd'] for r in rows)
        copied_count = sum(1 for r in rows if r['was_copied'])
        
        print(f"\nStats:")
        print(f"  Total Signals: {len(rows)}")
        print(f"  Total Volume: ${total_volume:,.2f}")
        print(f"  Copied: {copied_count}/{len(rows)} ({copied_count/len(rows)*100:.1f}%)")
        
        # Liste des trades
        print(f"\nTrades:")
        for i, row in enumerate(rows, 1):
            timestamp = datetime.fromtimestamp(row['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            copied = "✅" if row['was_copied'] else "⏭️"
            print(f"  {i}. {timestamp} | {row['outcome']} @ {row['price']:.2f} | ${row['amount_usd']:,.0f} {copied}")
    
    def view_stats(self):
        """Affiche les statistiques globales"""
        cursor = self.conn.execute("""
            SELECT 
                COUNT(*) as total_signals,
                COUNT(DISTINCT wallet_address) as unique_wallets,
                SUM(amount_usd) as total_volume,
                AVG(amount_usd) as avg_trade_size,
                MIN(amount_usd) as min_trade,
                MAX(amount_usd) as max_trade,
                SUM(CASE WHEN was_copied = 1 THEN 1 ELSE 0 END) as copied_count,
                SUM(copy_position_size) as total_copied_volume
            FROM whale_signals_history
        """)
        
        stats = dict(cursor.fetchone())
        
        print("\n📊 STATISTIQUES GLOBALES")
        print("=" * 100)
        print(f"\nSignals:")
        print(f"  Total Détecté: {stats['total_signals'] or 0}")
        print(f"  Wallets Uniques: {stats['unique_wallets'] or 0}")
        print(f"  Volume Total: ${stats['total_volume'] or 0:,.2f}")
        print(f"  Taille Moyenne: ${stats['avg_trade_size'] or 0:,.2f}")
        print(f"  Range: ${stats['min_trade'] or 0:,.0f} - ${stats['max_trade'] or 0:,.0f}")
        
        print(f"\nCopy Trading:")
        print(f"  Trades Copiés: {stats['copied_count'] or 0}")
        print(f"  Copy Rate: {(stats['copied_count'] or 0)/(stats['total_signals'] or 1)*100:.1f}%")
        print(f"  Volume Copié: ${stats['total_copied_volume'] or 0:,.2f}")
        
        # Top wallets
        cursor = self.conn.execute("""
            SELECT 
                wallet_address,
                wallet_category,
                COUNT(*) as signal_count,
                AVG(reputation_score) as avg_score,
                SUM(amount_usd) as total_volume,
                SUM(CASE WHEN was_copied = 1 THEN 1 ELSE 0 END) as copied_count
            FROM whale_signals_history
            WHERE wallet_category IS NOT NULL
            GROUP BY wallet_address
            ORDER BY signal_count DESC
            LIMIT 10
        """)
        
        top_wallets = cursor.fetchall()
        
        if top_wallets:
            print(f"\nTop 10 Wallets:")
            for i, wallet in enumerate(top_wallets, 1):
                copy_rate = (wallet['copied_count'] / wallet['signal_count'] * 100) if wallet['signal_count'] > 0 else 0
                print(
                    f"  {i}. {wallet['wallet_address'][:10]}... "
                    f"[{wallet['wallet_category']}] - "
                    f"{wallet['signal_count']} signals, "
                    f"Score: {wallet['avg_score'] or 0:.1f}/100, "
                    f"${wallet['total_volume']:,.0f} volume, "
                    f"Copy: {copy_rate:.0f}%"
                )
        
        # Distribution par catégorie
        cursor = self.conn.execute("""
            SELECT 
                wallet_category,
                COUNT(*) as count,
                AVG(amount_usd) as avg_amount,
                SUM(CASE WHEN was_copied = 1 THEN 1 ELSE 0 END) as copied_count
            FROM whale_signals_history
            WHERE wallet_category IS NOT NULL
            GROUP BY wallet_category
            ORDER BY count DESC
        """)
        
        categories = cursor.fetchall()
        
        if categories:
            print(f"\nDistribution par Catégorie:")
            for cat in categories:
                copy_rate = (cat['copied_count'] / cat['count'] * 100) if cat['count'] > 0 else 0
                print(
                    f"  {cat['wallet_category']}: "
                    f"{cat['count']} signals, "
                    f"Avg: ${cat['avg_amount']:,.0f}, "
                    f"Copy: {copy_rate:.0f}%"
                )
    
    def export_json(self, output_file: str, limit: int = 1000):
        """Exporte l'historique en JSON"""
        cursor = self.conn.execute("""
            SELECT * FROM whale_signals_history
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        
        rows = [dict(r) for r in cursor.fetchall()]
        
        with open(output_file, 'w') as f:
            json.dump(rows, f, indent=2)
        
        print(f"\n✅ Exporté {len(rows)} signaux vers {output_file}")


def main():
    parser = argparse.ArgumentParser(description='View PolyRadar whale history')
    parser.add_argument('--db', default='polyradar_whales.db', help='Database path')
    parser.add_argument('--last', type=int, help='Show last N signals')
    parser.add_argument('--wallet', type=str, help='Show history for specific wallet')
    parser.add_argument('--stats', action='store_true', help='Show global statistics')
    parser.add_argument('--min-amount', type=float, default=0, help='Minimum trade amount')
    parser.add_argument('--export', help='Export to JSON file')
    
    args = parser.parse_args()
    
    try:
        viewer = WhaleHistoryViewer(args.db)
        
        if args.stats:
            viewer.view_stats()
        elif args.wallet:
            viewer.view_wallet(args.wallet)
        elif args.export:
            viewer.export_json(args.export, limit=args.last or 1000)
        else:
            viewer.view_recent(limit=args.last or 50, min_amount=args.min_amount)
        
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
