import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/signals - Fetch signals with pagination/filtering
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');

        const where = status ? { status } : {};

        const signals = await prisma.signal.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return NextResponse.json(signals);
    } catch (error) {
        console.error('Failed to fetch signals:', error);
        return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
    }
}

// POST /api/signals - Create or Update a signal (Listener usage)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { marketId, question, slug, score, reason, volume, liquidity, newsCorrelation } = body;

        if (!marketId || !question) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert signal: Update if exists (e.g. score changed), Create if new
        const signal = await prisma.signal.upsert({
            where: { marketId },
            update: {
                score,
                reason,
                volume: parseFloat(volume),
                liquidity: parseFloat(liquidity),
                newsCorrelation: !!newsCorrelation,
                timestamp: new Date(), // Update timestamp on refresh
                status: 'NEW' // Re-open signal if it was dismissed
            },
            create: {
                marketId,
                question,
                slug,
                score,
                reason,
                volume: parseFloat(volume),
                liquidity: parseFloat(liquidity),
                newsCorrelation: !!newsCorrelation
            }
        });

        return NextResponse.json(signal);
    } catch (error) {
        console.error('Failed to save signal:', error);
        return NextResponse.json({ error: 'Failed to save signal' }, { status: 500 });
    }
}
