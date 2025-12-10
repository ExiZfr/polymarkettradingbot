import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePositionSize } from '@/lib/copy-trading/algorithms';

/**
 * POST /api/copy-trading/position-size
 * Calculate optimal position size using Kelly Criterion or other methods
 */
export async function POST(req: Request) {
    try {
        const {
            walletAddress,
            capital,
            mode = 'kelly',
            fixedAmount,
            percentage
        } = await req.json();

        if (!walletAddress || !capital) {
            return NextResponse.json(
                { error: 'walletAddress and capital required' },
                { status: 400 }
            );
        }

        // Fetch wallet performance metrics
        const wallet = await prisma.trackedWallet.findUnique({
            where: { address: walletAddress },
            include: {
                performance: true,
                tradeExecutions: {
                    where: { status: 'CLOSED' },
                    orderBy: { exitTime: 'desc' },
                    take: 50 // Last 50 closed trades
                }
            }
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Calculate win rate and averages from recent trades
        const closedTrades = wallet.tradeExecutions;

        let winRate = 0.5; // Default
        let avgWin = 0;
        let avgLoss = 0;

        if (closedTrades.length > 0) {
            const winningTrades = closedTrades.filter(t => t.pnl > 0);
            const losingTrades = closedTrades.filter(t => t.pnl < 0);

            winRate = winningTrades.length / closedTrades.length;

            if (winningTrades.length > 0) {
                avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
            }

            if (losingTrades.length > 0) {
                avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length);
            }
        } else if (wallet.performance) {
            // Use cached performance metrics
            winRate = Number(wallet.performance.winStreak) > 0 ? 0.6 : 0.5; // Estimate
            avgWin = wallet.performance.avgWin;
            avgLoss = wallet.performance.avgLoss;
        }

        // Calculate position size
        const result = calculatePositionSize(
            capital,
            winRate,
            avgWin,
            avgLoss,
            mode as any,
            fixedAmount,
            percentage
        );

        // Add wallet context
        const response = {
            ...result,
            wallet: {
                address: wallet.address,
                label: wallet.label,
                winRate,
                avgWin,
                avgLoss,
                smartScore: wallet.performance?.smartScore || 0,
                sharpeRatio: wallet.performance?.sharpeRatio || 0,
                profitFactor: wallet.performance?.profitFactor || 0
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Failed to calculate position size:', error);
        return NextResponse.json({ error: 'Failed to calculate position size' }, { status: 500 });
    }
}
