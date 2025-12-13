import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/radar/whales
 * 
 * Retrieves whale profiles with metrics
 * Query params: tag, sortBy (pnl, winRate, volume), limit
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const tag = searchParams.get('tag') || undefined;
        const sortBy = searchParams.get('sortBy') || 'totalPnl';

        const where: any = {};

        if (tag && tag !== 'ALL') {
            where.currentTag = tag;
        }

        // Determine sort order
        let orderBy: any = { totalPnl: 'desc' };
        if (sortBy === 'winRate') {
            orderBy = { winRate: 'desc' };
        } else if (sortBy === 'volume') {
            orderBy = { totalVolume: 'desc' };
        }

        const whales = await prisma.whaleProfile.findMany({
            where,
            orderBy,
            take: limit,
            include: {
                transactions: {
                    take: 5,
                    orderBy: { timestamp: 'desc' },
                    select: {
                        id: true,
                        timestamp: true,
                        marketQuestion: true,
                        outcome: true,
                        amount: true,
                        price: true,
                    }
                }
            }
        });

        return NextResponse.json({ whales });
    } catch (error) {
        console.error('Error fetching whales:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
