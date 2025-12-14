/**
 * Whale Tracker API - Stats Endpoint
 * GET: Return aggregated statistics
 */

import { NextResponse } from 'next/server';

// Import from transactions route (shared store)
// Note: In production, use a proper shared store (Redis, DB)
interface StatsData {
    totalTransactions: number;
    totalVolume: number;
    uniqueWhales: number;
    avgTradeSize: number;
    tagDistribution: Record<string, number>;
    topWhales: Array<{
        address: string;
        tag: string;
        totalVolume: number;
        tradeCount: number;
    }>;
}

// We need to access the transactions from the other route
// For now, use a simple fetch approach
export async function GET() {
    try {
        // Fetch transactions from our own API
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
        const txResponse = await fetch(`${baseUrl}/api/tracker/transactions?limit=500`, {
            cache: 'no-store'
        });

        if (!txResponse.ok) {
            return NextResponse.json({
                totalTransactions: 0,
                totalVolume: 0,
                uniqueWhales: 0,
                avgTradeSize: 0,
                tagDistribution: {},
                topWhales: []
            });
        }

        const transactions = await txResponse.json();

        // Calculate stats
        const totalTransactions = transactions.length;
        const totalVolume = transactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);

        // Unique whales
        const whaleMap = new Map<string, { tag: string; volume: number; count: number }>();
        transactions.forEach((tx: { wallet_address: string; wallet_tag: string; amount: number }) => {
            const existing = whaleMap.get(tx.wallet_address);
            if (existing) {
                existing.volume += tx.amount;
                existing.count++;
            } else {
                whaleMap.set(tx.wallet_address, { tag: tx.wallet_tag, volume: tx.amount, count: 1 });
            }
        });

        // Tag distribution
        const tagDistribution: Record<string, number> = {};
        transactions.forEach((tx: { wallet_tag: string }) => {
            tagDistribution[tx.wallet_tag] = (tagDistribution[tx.wallet_tag] || 0) + 1;
        });

        // Top whales by volume
        const topWhales = Array.from(whaleMap.entries())
            .map(([address, data]) => ({
                address,
                tag: data.tag,
                totalVolume: data.volume,
                tradeCount: data.count
            }))
            .sort((a, b) => b.totalVolume - a.totalVolume)
            .slice(0, 10);

        const stats: StatsData = {
            totalTransactions,
            totalVolume,
            uniqueWhales: whaleMap.size,
            avgTradeSize: totalTransactions > 0 ? totalVolume / totalTransactions : 0,
            tagDistribution,
            topWhales
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[Tracker Stats] Error:', error);
        return NextResponse.json({
            totalTransactions: 0,
            totalVolume: 0,
            uniqueWhales: 0,
            avgTradeSize: 0,
            tagDistribution: {},
            topWhales: []
        });
    }
}
