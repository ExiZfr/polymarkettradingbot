import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCorrelationMatrix, detectHighCorrelation } from '@/lib/copy-trading/algorithms';

/**
 * GET /api/copy-trading/correlation
 * Calculate correlation matrix between tracked wallets
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const threshold = parseFloat(searchParams.get('threshold') || '0.7');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        // Get user's copy settings
        const copySettings = await prisma.copySetting.findMany({
            where: {
                userId: parseInt(userId),
                enabled: true
            },
            include: {
                trackedWallet: {
                    include: {
                        tradeExecutions: {
                            where: { status: 'CLOSED' },
                            orderBy: { exitTime: 'desc' },
                            take: 50 // Last 50 trades for correlation
                        }
                    }
                }
            }
        });

        if (copySettings.length < 2) {
            return NextResponse.json({
                message: 'Need at least 2 wallets to calculate correlation',
                matrix: {},
                highCorrelations: []
            });
        }

        // Build returns array for each wallet
        const walletsReturns: { [walletAddress: string]: number[] } = {};

        for (const setting of copySettings) {
            const wallet = setting.trackedWallet;
            const trades = wallet.tradeExecutions;

            if (trades.length > 0) {
                // Calculate returns (% PnL)
                const returns = trades.map(t => (t.pnl / t.amount) * 100);
                walletsReturns[wallet.address] = returns;
            }
        }

        // Filter out wallets with no trades
        const validWallets = Object.keys(walletsReturns);

        if (validWallets.length < 2) {
            return NextResponse.json({
                message: 'Not enough wallets with trade history',
                matrix: {},
                highCorrelations: []
            });
        }

        // Calculate correlation matrix
        const matrix = buildCorrelationMatrix(walletsReturns);

        // Detect high correlations
        const highCorrelations = detectHighCorrelation(matrix, threshold);

        // Add wallet labels
        const enrichedCorrelations = highCorrelations.map(pair => {
            const walletA = copySettings.find(s => s.trackedWallet.address === pair.walletA);
            const walletB = copySettings.find(s => s.trackedWallet.address === pair.walletB);

            return {
                ...pair,
                walletALabel: walletA?.trackedWallet.label || 'Unknown',
                walletBLabel: walletB?.trackedWallet.label || 'Unknown'
            };
        });

        return NextResponse.json({
            matrix,
            highCorrelations: enrichedCorrelations,
            walletsAnalyzed: validWallets.length,
            threshold
        });
    } catch (error) {
        console.error('Failed to calculate correlation:', error);
        return NextResponse.json({ error: 'Failed to calculate correlation' }, { status: 500 });
    }
}
