'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tracker/watchlist - Fetch all tracked wallets with stats
export async function GET() {
    try {
        // Get all tracked wallets (from TrackedWallet) with their associated whale profile stats
        const trackedWallets = await prisma.trackedWallet.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        // Enrich with whale profile data
        const enrichedWallets = await Promise.all(
            trackedWallets.map(async (wallet) => {
                const whaleProfile = await prisma.whaleProfile.findUnique({
                    where: { address: wallet.address },
                });

                const recentTrades = await prisma.whaleTransaction.findMany({
                    where: { walletAddress: wallet.address },
                    orderBy: { timestamp: 'desc' },
                    take: 5,
                });

                return {
                    id: wallet.id,
                    address: wallet.address,
                    label: wallet.label,
                    trades: wallet.trades,
                    volume: wallet.volume,
                    createdAt: wallet.createdAt,
                    // From whale profile
                    tag: whaleProfile?.currentTag || 'Unknown',
                    winRate: whaleProfile?.winRate || 0,
                    totalPnl: whaleProfile?.totalPnl || 0,
                    totalTrades: whaleProfile?.totalTrades || wallet.trades,
                    lastSeen: whaleProfile?.lastSeen || wallet.createdAt,
                    // Recent trades preview
                    recentTrades: recentTrades.map(t => ({
                        market: t.marketQuestion,
                        outcome: t.outcome,
                        amount: t.amount,
                        timestamp: t.timestamp,
                    })),
                };
            })
        );

        return NextResponse.json({ wallets: enrichedWallets });
    } catch (error) {
        console.error('[Watchlist] Error fetching wallets:', error);
        return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }
}

// POST /api/tracker/watchlist - Add wallet to watchlist
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, label } = body;

        if (!address) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        // Normalize address to lowercase
        const normalizedAddress = address.toLowerCase();

        // Check if already tracked
        const existing = await prisma.trackedWallet.findUnique({
            where: { address: normalizedAddress },
        });

        if (existing) {
            return NextResponse.json({ error: 'Wallet already in watchlist', wallet: existing }, { status: 409 });
        }

        // Get whale profile for initial data
        const whaleProfile = await prisma.whaleProfile.findUnique({
            where: { address: normalizedAddress },
        });

        // Create tracked wallet
        const trackedWallet = await prisma.trackedWallet.create({
            data: {
                address: normalizedAddress,
                label: label || whaleProfile?.currentTag || null,
                trades: whaleProfile?.totalTrades || 0,
                volume: whaleProfile?.totalVolume || 0,
            },
        });

        return NextResponse.json({
            success: true,
            wallet: {
                ...trackedWallet,
                tag: whaleProfile?.currentTag || 'Unknown',
                winRate: whaleProfile?.winRate || 0,
                totalPnl: whaleProfile?.totalPnl || 0,
            }
        });
    } catch (error) {
        console.error('[Watchlist] Error adding wallet:', error);
        return NextResponse.json({ error: 'Failed to add wallet' }, { status: 500 });
    }
}

// DELETE /api/tracker/watchlist - Remove wallet from watchlist
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const normalizedAddress = address.toLowerCase();

        await prisma.trackedWallet.delete({
            where: { address: normalizedAddress },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Watchlist] Error removing wallet:', error);
        return NextResponse.json({ error: 'Failed to remove wallet' }, { status: 500 });
    }
}
