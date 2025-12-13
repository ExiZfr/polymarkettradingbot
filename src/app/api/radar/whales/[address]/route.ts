import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/radar/whales/[address]
 * 
 * Retrieves detailed profile and transaction history for a specific whale
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;

        const whale = await prisma.whaleProfile.findUnique({
            where: { address },
            include: {
                transactions: {
                    orderBy: { timestamp: 'desc' },
                    take: 100, // Last 100 transactions
                }
            }
        });

        if (!whale) {
            return NextResponse.json(
                { error: 'Whale not found' },
                { status: 404 }
            );
        }

        // Calculate additional analytics
        const analytics = {
            recentTrades24h: whale.transactions.filter(tx =>
                new Date(tx.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length,

            avgTradeSize7d: (() => {
                const last7days = whale.transactions.filter(tx =>
                    new Date(tx.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                );
                if (last7days.length === 0) return 0;
                return last7days.reduce((sum, tx) => sum + tx.amount, 0) / last7days.length;
            })(),

            favoriteMarkets: (() => {
                const marketCounts: Record<string, number> = {};
                whale.transactions.forEach(tx => {
                    marketCounts[tx.marketQuestion] = (marketCounts[tx.marketQuestion] || 0) + 1;
                });
                return Object.entries(marketCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([market, count]) => ({ market, count }));
            })(),
        };

        return NextResponse.json({
            profile: whale,
            analytics,
        });
    } catch (error) {
        console.error('Error fetching whale details:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
