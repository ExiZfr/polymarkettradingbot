/**
 * PolyRadar Database Utilities
 * Reads whale signals from SQLite database
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'scripts', 'polyradar_whales.db');

export interface WhaleSignal {
    id: number;
    wallet_address: string;
    market_id: string;
    market_slug?: string | null;           // Enriched by API
    market_question?: string;              // Enriched by API
    market_description?: string | null;    // Enriched by API
    market_image?: string | null;          // Enriched by API
    outcome: 'YES' | 'NO';
    amount_usd: number;
    price: number;
    timestamp: number;
    tx_hash: string;
    gas_price: number | null;
    wallet_category: string | null;
    reputation_score: number | null;
    was_copied: number;
    copy_position_size: number;
    created_at: string;
}

export interface WhaleAnalytics {
    total_signals: number;
    unique_wallets: number;
    total_volume: number;
    avg_trade_size: number;
    copied_count: number;
    total_copied_volume: number;
    top_wallets: Array<{
        wallet_address: string;
        wallet_category: string | null;
        signal_count: number;
        avg_score: number | null;
        total_volume: number;
    }>;
    category_distribution: Array<{
        wallet_category: string;
        count: number;
        avg_amount: number;
        copied_count: number;
    }>;
}

/**
 * Get whale signals with optional filters
 */
export function getWhaleSignals(options: {
    limit?: number;
    minAmount?: number;
    category?: string;
    wallet?: string;
} = {}): WhaleSignal[] {
    const { limit = 100, minAmount = 0, category, wallet } = options;

    try {
        const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

        let query = 'SELECT * FROM whale_signals_history WHERE amount_usd >= ?';
        const params: any[] = [minAmount];

        if (category) {
            query += ' AND wallet_category = ?';
            params.push(category);
        }

        if (wallet) {
            query += ' AND wallet_address = ?';
            params.push(wallet);
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as WhaleSignal[];

        db.close();
        return rows;
    } catch (error) {
        // Database doesn't exist yet or query failed
        console.error('Error reading whale signals:', error);
        return [];
    }
}

/**
 * Get whale analytics
 */
export function getWhaleAnalytics(): WhaleAnalytics | null {
    try {
        const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

        // Main stats
        const statsQuery = `
      SELECT 
        COUNT(*) as total_signals,
        COUNT(DISTINCT wallet_address) as unique_wallets,
        COALESCE(SUM(amount_usd), 0) as total_volume,
        COALESCE(AVG(amount_usd), 0) as avg_trade_size,
        SUM(CASE WHEN was_copied = 1 THEN 1 ELSE 0 END) as copied_count,
        COALESCE(SUM(copy_position_size), 0) as total_copied_volume
      FROM whale_signals_history
    `;

        const stats = db.prepare(statsQuery).get() as any;

        // Top wallets
        const topWalletsQuery = `
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
    `;

        const topWallets = db.prepare(topWalletsQuery).all() as any[];

        // Category distribution
        const categoryQuery = `
      SELECT 
        wallet_category,
        COUNT(*) as count,
        AVG(amount_usd) as avg_amount,
        SUM(CASE WHEN was_copied = 1 THEN 1 ELSE 0 END) as copied_count
      FROM whale_signals_history
      WHERE wallet_category IS NOT NULL
      GROUP BY wallet_category
      ORDER BY count DESC
    `;

        const categoryDistribution = db.prepare(categoryQuery).all() as any[];

        db.close();

        return {
            ...stats,
            top_wallets: topWallets,
            category_distribution: categoryDistribution,
        };
    } catch (error) {
        console.error('Error reading whale analytics:', error);
        return null;
    }
}

/**
 * Check if radar bot is running (simplified - checks for recent signals)
 */
export function isRadarActive(): boolean {
    try {
        const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

        const query = `
      SELECT COUNT(*) as recent_count
      FROM whale_signals_history
      WHERE timestamp > ?
    `;

        // Check for signals in last 5 minutes
        const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
        const result = db.prepare(query).get(fiveMinutesAgo) as any;

        db.close();

        return result.recent_count > 0;
    } catch (error) {
        return false;
    }
}
