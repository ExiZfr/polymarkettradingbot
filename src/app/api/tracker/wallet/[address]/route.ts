'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tracker/wallet/[address] - Fetch all trades for a specific wallet
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;

        if (!address) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const normalizedAddress = address.toLowerCase();

        // Get wallet profile
        const whaleProfile = await prisma.whaleProfile.findUnique({
            where: { address: normalizedAddress },
        });

        // Get all transactions for this wallet
        const transactions = await prisma.whaleTransaction.findMany({
            where: { walletAddress: normalizedAddress },
            orderBy: { timestamp: 'desc' },
            take: 200,
        });

        // Check if in watchlist
        const trackedWallet = await prisma.trackedWallet.findUnique({
            where: { address: normalizedAddress },
        });

        return NextResponse.json({
            address: normalizedAddress,
            isWatched: !!trackedWallet,
            label: trackedWallet?.label || whaleProfile?.currentTag || 'Unknown',
            profile: whaleProfile ? {
                tag: whaleProfile.currentTag,
                winRate: whaleProfile.winRate,
                totalPnl: whaleProfile.totalPnl,
                totalTrades: whaleProfile.totalTrades,
                totalVolume: whaleProfile.totalVolume,
                avgPositionSize: whaleProfile.avgPositionSize,
                currentStreak: whaleProfile.currentStreak,
                maxWinStreak: whaleProfile.maxWinStreak,
                maxLossStreak: whaleProfile.maxLossStreak,
                firstSeen: whaleProfile.firstSeen,
                lastSeen: whaleProfile.lastSeen,
            } : null,
            transactions: transactions.map(t => ({
                id: t.id,
                txHash: t.txHash,
                timestamp: t.timestamp,
                marketId: t.marketId,
                marketQuestion: t.marketQuestion,
                marketSlug: t.marketSlug,
                marketUrl: t.marketUrl,
                marketImage: t.marketImage,
                outcome: t.outcome,
                amount: t.amount,
                price: t.price,
                shares: t.shares,
                clusterName: t.clusterName,
            })),
            totalTransactions: transactions.length,
        });
    } catch (error) {
        console.error('[WalletAPI] Error fetching wallet data:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
    }
}
