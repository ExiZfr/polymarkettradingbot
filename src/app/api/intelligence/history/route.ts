import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/intelligence/history?marketId=xxx&period=24h
 * Fetch historical market data for trend analysis
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const marketId = searchParams.get('marketId');
        const period = searchParams.get('period') || '24h';

        if (!marketId) {
            return NextResponse.json({ error: 'marketId required' }, { status: 400 });
        }

        // Calculate time range
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case '1h':
                startDate.setHours(now.getHours() - 1);
                break;
            case '24h':
                startDate.setDate(now.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            default:
                startDate.setDate(now.getDate() - 1);
        }

        const snapshots = await prisma.marketSnapshot.findMany({
            where: {
                marketId,
                timestamp: {
                    gte: startDate,
                },
            },
            orderBy: { timestamp: 'asc' },
        });

        return NextResponse.json(snapshots);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

/**
 * POST /api/intelligence/history
 * Record a market snapshot (called by background listener)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { marketId, score, volume, liquidity, probability } = body;

        if (!marketId) {
            return NextResponse.json({ error: 'marketId required' }, { status: 400 });
        }

        const snapshot = await prisma.marketSnapshot.create({
            data: {
                marketId,
                score: score || 0,
                volume: parseFloat(volume) || 0,
                liquidity: parseFloat(liquidity) || 0,
                probability: parseFloat(probability) || 0,
            },
        });

        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('Failed to create snapshot:', error);
        return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }
}
