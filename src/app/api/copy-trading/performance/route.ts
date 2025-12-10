import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateWalletMetrics, TradeRecord } from '@/lib/copy-trading/algorithms';

/**
 * GET /api/copy-trading/performance
 * Calculate and return advanced performance metrics for all tracked wallets
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const walletAddress = searchParams.get('wallet');
        const forceRecalculate = searchParams.get('recalculate') === 'true';

        if (walletAddress) {
            // Get single wallet performance
            const performance = await getWalletPerformance(walletAddress, forceRecalculate);
            return NextResponse.json(performance);
        }

        // Get all wallets with performance
        const wallets = await prisma.trackedWallet.findMany({
            include: {
                performance: true,
                tradeExecutions: {
                    orderBy: { entryTime: 'desc' },
                    take: 100
                }
            }
        });

        const walletsWithMetrics = await Promise.all(
            wallets.map(async (wallet) => {
                if (!wallet.performance || forceRecalculate) {
                    await calculateAndSavePerformance(wallet.id, wallet.address);
                }

                return {
                    ...wallet,
                    performance: await prisma.walletPerformance.findUnique({
                        where: { walletId: wallet.id }
                    })
                };
            })
        );

        return NextResponse.json(walletsWithMetrics);
    } catch (error) {
        console.error('Failed to fetch wallet performance:', error);
        return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
    }
}

/**
 * POST /api/copy-trading/performance
 * Force recalculation of performance metrics for a wallet
 */
export async function POST(req: Request) {
    try {
        const { walletAddress } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
        }

        const wallet = await prisma.trackedWallet.findUnique({
            where: { address: walletAddress }
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        const performance = await calculateAndSavePerformance(wallet.id, wallet.address);

        return NextResponse.json(performance);
    } catch (error) {
        console.error('Failed to recalculate performance:', error);
        return NextResponse.json({ error: 'Failed to recalculate performance' }, { status: 500 });
    }
}

// ==================== HELPER FUNCTIONS ====================

async function getWalletPerformance(walletAddress: string, forceRecalculate: boolean = false) {
    const wallet = await prisma.trackedWallet.findUnique({
        where: { address: walletAddress },
        include: {
            performance: true,
            tradeExecutions: {
                orderBy: { entryTime: 'desc' }
            }
        }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    // Check if we need to recalculate
    const shouldRecalculate = forceRecalculate ||
        !wallet.performance ||
        (wallet.performance.lastCalculated &&
            Date.now() - wallet.performance.lastCalculated.getTime() > 3600000); // 1 hour

    if (shouldRecalculate) {
        return await calculateAndSavePerformance(wallet.id, wallet.address);
    }

    return wallet.performance;
}

async function calculateAndSavePerformance(walletId: string, walletAddress: string) {
    // Fetch trade executions
    const tradeExecutions = await prisma.copyTradeExecution.findMany({
        where: { walletId },
        orderBy: { entryTime: 'asc' }
    });

    if (tradeExecutions.length === 0) {
        // Create default performance record
        return await prisma.walletPerformance.upsert({
            where: { walletId },
            update: { lastCalculated: new Date() },
            create: {
                walletId,
                lastCalculated: new Date()
            }
        });
    }

    // Convert to TradeRecord format
    const trades: TradeRecord[] = tradeExecutions.map(te => ({
        pnl: te.pnl,
        amount: te.amount,
        holdTime: te.exitTime
            ? (te.exitTime.getTime() - te.entryTime.getTime()) / (1000 * 60 * 60) // hours
            : (Date.now() - te.entryTime.getTime()) / (1000 * 60 * 60),
        category: te.category,
        timestamp: te.entryTime
    }));

    // Calculate metrics using our advanced algorithms
    const metrics = calculateWalletMetrics(trades, { address: walletAddress, username: '' });

    // Save to database
    const performance = await prisma.walletPerformance.upsert({
        where: { walletId },
        update: {
            sharpeRatio: metrics.sharpeRatio,
            sortinoRatio: metrics.sortinoRatio,
            calmarRatio: metrics.calmarRatio,
            maxDrawdown: metrics.maxDrawdown,
            profitFactor: metrics.profitFactor,
            kellyPercentage: metrics.kellyPercentage,
            riskOfRuin: metrics.riskOfRuin,
            winStreak: metrics.winStreak,
            lossStreak: metrics.lossStreak,
            maxWinStreak: metrics.maxWinStreak,
            maxLossStreak: metrics.maxLossStreak,
            avgHoldTime: metrics.avgHoldTime,
            avgTradeSize: metrics.avgTradeSize,
            avgWin: metrics.avgWin,
            avgLoss: metrics.avgLoss,
            smartScore: metrics.smartScore,
            farmScore: metrics.farmScore,
            lastCalculated: new Date()
        },
        create: {
            walletId,
            sharpeRatio: metrics.sharpeRatio,
            sortinoRatio: metrics.sortinoRatio,
            calmarRatio: metrics.calmarRatio,
            maxDrawdown: metrics.maxDrawdown,
            profitFactor: metrics.profitFactor,
            kellyPercentage: metrics.kellyPercentage,
            riskOfRuin: metrics.riskOfRuin,
            winStreak: metrics.winStreak,
            lossStreak: metrics.lossStreak,
            maxWinStreak: metrics.maxWinStreak,
            maxLossStreak: metrics.maxLossStreak,
            avgHoldTime: metrics.avgHoldTime,
            avgTradeSize: metrics.avgTradeSize,
            avgWin: metrics.avgWin,
            avgLoss: metrics.avgLoss,
            smartScore: metrics.smartScore,
            farmScore: metrics.farmScore,
            lastCalculated: new Date()
        }
    });

    return performance;
}
