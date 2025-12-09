import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { address: string } }) {
    try {
        const { address } = params;

        // Check if we are already tracking this wallet
        // const trackedWallet = await prisma.trackedWallet.findUnique({
        //   where: { address },
        //   include: { snapshots: true }
        // });

        // For now, generate realistic mock data based on the address
        const isMock = true;

        // Deterministic mock data based on address string length
        const seed = address.length;
        const pnl = seed * 1000 * (seed % 2 === 0 ? 1 : -1);
        const winRate = (seed % 100) / 100;

        // Mock History (Last 30 days)
        const history = Array.from({ length: 30 }).map((_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            pnl: Math.random() * 500 - 200 + (seed * 10), // Random daily fluctuation
            winRate: Math.random(),
            volume: Math.random() * 5000,
        }));

        // Mock Bets
        const bets = Array.from({ length: 10 }).map((_, i) => ({
            id: `bet-${i}`,
            market: `Market ${i} - Who will win?`,
            outcome: Math.random() > 0.5 ? 'YES' : 'NO',
            amount: Math.random() * 1000,
            pnl: Math.random() * 200 - 50,
            status: Math.random() > 0.5 ? 'CLOSED' : 'OPEN',
            date: new Date().toISOString(),
        }));

        return NextResponse.json({
            address,
            ens: seed % 2 === 0 ? 'whale.eth' : null,
            metrics: {
                totalPnl: pnl,
                winRate,
                totalVolume: seed * 50000,
                activePositions: 5,
                followers: seed * 10,
            },
            history,
            bets,
        });
    } catch (error) {
        console.error(`[API/copy-trading/wallet] Error fetching ${params.address}:`, error);
        return NextResponse.json({ error: 'Failed to fetch wallet contents' }, { status: 500 });
    }
}
