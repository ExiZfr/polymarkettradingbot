
import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'real';

    try {
        let stats = {
            totalPnl: 0,
            winRate: 0,
            copiedWallets: 0,
            totalVolume: 0,
        };

        if (mode === 'paper') {
            // Fetch/Calculate Paper Stats
            PaperWallet.ensureProfilesFileExists();
            const profilesData = PaperWallet.getAllProfiles();
            const activeProfileId = profilesData.activeProfileId;
            const profile = profilesData.profiles[activeProfileId];

            if (profile) {
                // Copied Wallets
                stats.copiedWallets = Object.keys(profile.copySettings || {}).length;

                // Calculate PnL and Metrics from History
                // Note: This logic assumes 'history' contains executed paper trades.
                // Since this is a newly implemented feature, history might be empty initially.

                let winningTrades = 0;
                let totalTrades = 0;
                let realizedPnl = 0;
                let volume = 0;

                profile.history.forEach(order => {
                    totalTrades++;
                    // Approx volume: Use amount if available (USD), else shares * price
                    const tradeVol = order.amount || ((order.shares || 0) * (order.avgPrice || 0));
                    volume += tradeVol;
                    // Assuming order history tracks PnL on CLOSE orders or we calculate from closed positions
                    if (order.side === 'SELL' && order.realizedPnl) {
                        realizedPnl += order.realizedPnl;
                        if (order.realizedPnl > 0) winningTrades++;
                    }
                });

                // Add Unrealized PnL from Active Positions
                let unrealizedPnl = 0;
                Object.values(profile.positions).forEach(pos => {
                    unrealizedPnl += pos.pnl;
                });

                stats.totalPnl = realizedPnl + unrealizedPnl;
                stats.totalVolume = volume;
                stats.winRate = totalTrades > 0 ? (winningTrades / totalTrades) : 0;
            }

        } else {
            // Fetch Real Stats from Prisma
            // Currently, we don't have a 'UserTrades' table, so we will aggregate CopySettings
            // and maybe fetch some generic stats if available.
            // For now, we count active copy settings.

            // Get current user (Mocking ID 1 for now if no auth context, or use session)
            // TODO: Replace with actual session user ID
            const userId = 1;

            const copySettingsCount = await prisma.copySetting.count({
                where: {
                    userId: userId,
                    enabled: true
                }
            });

            stats.copiedWallets = copySettingsCount;

            // For PnL/Volume in Real Mode, we'd need to query the bot's trade database 
            // or the user's exchange account. Since that's external/not in schema, 
            // we'll return 0 or a placeholder for now to avoid crashing.
            stats.totalPnl = 0;
            stats.winRate = 0;
            stats.totalVolume = 0;
        }

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Error fetching copy trading stats:', error);
        return NextResponse.json({
            totalPnl: 0,
            winRate: 0,
            copiedWallets: 0,
            totalVolume: 0,
        }, { status: 500 });
    }
}
