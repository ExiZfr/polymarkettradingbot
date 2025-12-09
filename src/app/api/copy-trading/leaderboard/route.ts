import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Ensure this path is correct based on your project structure

export async function GET() {
    try {
        // In a real scenario, we might fetch this from an external API (Polymarket Leaderboard)
        // or from our own database of tracked wallets.
        // For now, we will return some mock data mixed with DB data if available.

        // Mock Top Traders
        const topTraders = [
            {
                rank: 1,
                address: '0x1234...5678',
                ens: 'whale.eth',
                pnl: 154000,
                winRate: 0.85,
                volume: 5000000,
                trades: 120,
            },
            {
                rank: 2,
                address: '0x8765...4321',
                ens: 'alpha.eth',
                pnl: 98000,
                winRate: 0.78,
                volume: 2500000,
                trades: 340,
            },
            {
                rank: 3,
                address: '0xabcd...ef01',
                ens: 'genius.eth',
                pnl: 75000,
                winRate: 0.92,
                volume: 1200000,
                trades: 45,
            },
            {
                rank: 4,
                address: '0x7890...1234',
                ens: 'predict.eth',
                pnl: 65000,
                winRate: 0.65,
                volume: 3200000,
                trades: 890,
            },
            {
                rank: 5,
                address: '0x4321...0987',
                ens: 'ninja.eth',
                pnl: 55000,
                winRate: 0.70,
                volume: 1500000,
                trades: 210,
            },
        ];

        // Mock Worst Traders (inverse sorting usually)
        const worstTraders = [
            {
                rank: 1,
                address: '0xdead...beef',
                ens: 'rekt.eth',
                pnl: -50000,
                winRate: 0.20,
                volume: 100000,
                trades: 500,
            },
            {
                rank: 2,
                address: '0xbad...c0de',
                ens: 'fomo.eth',
                pnl: -30000,
                winRate: 0.35,
                volume: 50000,
                trades: 120,
            }
        ];

        return NextResponse.json({
            top: topTraders,
            worst: worstTraders,
        });
    } catch (error) {
        console.error('[API/copy-trading/leaderboard] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
