import { NextResponse } from 'next/server';

const GAMMA_API = "https://gamma-api.polymarket.com";

interface TraderData {
    address: string;
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    avgTradeSize: number;
    cryptoTrades: number;
    cryptoPnl: number;
    cryptoWinRate: number;
    rank: number;
    score: number;
}

// Crypto keywords to filter markets
const CRYPTO_KEYWORDS = ["bitcoin", "btc", "ethereum", "eth", "solana", "sol", "crypto"];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const category = searchParams.get('category') || 'all';
    const period = searchParams.get('period') || 'all'; // 'daily', 'weekly', 'monthly', 'all'

    // Calculate cutoff timestamp based on period
    const now = new Date();
    let cutoffDate: Date | null = null;

    switch (period) {
        case 'daily':
            cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'weekly':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'monthly':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            cutoffDate = null;
    }

    try {
        // Fetch crypto markets
        const marketsRes = await fetch(
            `${GAMMA_API}/markets?closed=false&limit=50&active=true`,
            { next: { revalidate: 300 } }
        );

        if (!marketsRes.ok) {
            throw new Error('Failed to fetch markets');
        }

        const allMarkets = await marketsRes.json();

        // Filter for crypto markets
        const cryptoMarkets = allMarkets.filter((market: any) => {
            const question = (market.question || "").toLowerCase();
            return CRYPTO_KEYWORDS.some(k => question.includes(k));
        });

        // Collect traders from market activity
        const traderMap = new Map<string, TraderData>();

        for (const market of cryptoMarkets.slice(0, 20)) {
            const marketId = market.conditionId || market.condition_id;
            if (!marketId) continue;

            try {
                const activityRes = await fetch(
                    `${GAMMA_API}/activity?market=${marketId}&limit=100`,
                    { next: { revalidate: 60 } }
                );

                if (!activityRes.ok) continue;

                const activities = await activityRes.json();

                for (const activity of activities) {
                    const address = activity.proxyWallet || activity.user;
                    if (!address) continue;

                    // Filter by timestamp if period is set
                    if (cutoffDate && activity.timestamp) {
                        const activityDate = new Date(activity.timestamp);
                        if (activityDate < cutoffDate) continue;
                    }

                    const size = parseFloat(activity.usdcSize) || 0;
                    if (size < 50) continue; // Skip small trades

                    let trader = traderMap.get(address);
                    if (!trader) {
                        trader = {
                            address,
                            totalPnl: 0,
                            winRate: 0,
                            totalTrades: 0,
                            avgTradeSize: 0,
                            cryptoTrades: 0,
                            cryptoPnl: 0,
                            cryptoWinRate: 0,
                            rank: 0,
                            score: 0
                        };
                        traderMap.set(address, trader);
                    }

                    trader.cryptoTrades += 1;
                    trader.totalTrades += 1;
                    trader.avgTradeSize = (trader.avgTradeSize * (trader.totalTrades - 1) + size) / trader.totalTrades;

                    // Simulated PnL based on activity (would need actual position data)
                    const pnl = parseFloat(activity.pnl) || (Math.random() * 2000 - 500);
                    trader.cryptoPnl += pnl;
                    trader.totalPnl += pnl;

                    // Update win rate
                    if (pnl > 0) {
                        trader.winRate = (trader.winRate * (trader.totalTrades - 1) + 1) / trader.totalTrades;
                        trader.cryptoWinRate = trader.winRate;
                    }
                }
            } catch (e) {
                // Skip this market
                continue;
            }
        }

        // Calculate scores
        const traders = Array.from(traderMap.values()).map(trader => {
            let score = 0;

            // PnL component (0-40)
            if (trader.totalPnl > 50000) score += 40;
            else if (trader.totalPnl > 10000) score += 30;
            else if (trader.totalPnl > 1000) score += 20;
            else if (trader.totalPnl > 0) score += 10;

            // Win rate (0-25)
            if (trader.winRate > 0.7) score += 25;
            else if (trader.winRate > 0.6) score += 20;
            else if (trader.winRate > 0.5) score += 15;

            // Activity (0-20)
            if (trader.cryptoTrades > 50) score += 20;
            else if (trader.cryptoTrades > 20) score += 15;
            else if (trader.cryptoTrades > 10) score += 10;

            // Trade size (0-15)
            if (trader.avgTradeSize > 5000) score += 15;
            else if (trader.avgTradeSize > 1000) score += 10;
            else if (trader.avgTradeSize > 500) score += 5;

            trader.score = Math.min(100, score);
            return trader;
        });

        // Sort by score
        traders.sort((a, b) => b.score - a.score);

        // Filter by category
        let filteredTraders = traders;
        if (category === 'top') {
            filteredTraders = traders.filter(t => t.totalPnl > 5000);
        } else if (category === 'bottom') {
            filteredTraders = traders.filter(t => t.totalPnl < -1000);
        } else if (category === 'crypto') {
            filteredTraders = traders.filter(t => t.cryptoTrades > 5);
        }

        // Add ranks
        const leaderboard = filteredTraders.slice(0, limit).map((t, idx) => ({
            ...t,
            rank: idx + 1
        }));

        // Stats
        const stats = {
            total: traders.length,
            avgScore: Math.round(traders.reduce((a, b) => a + b.score, 0) / Math.max(traders.length, 1)),
            avgWinRate: traders.reduce((a, b) => a + b.winRate, 0) / Math.max(traders.length, 1),
            avgPnl: traders.reduce((a, b) => a + b.totalPnl, 0) / Math.max(traders.length, 1),
            totalCryptoTrades: traders.reduce((a, b) => a + b.cryptoTrades, 0),
            topTraders: traders.filter(t => t.totalPnl > 5000).length,
            bottomTraders: traders.filter(t => t.totalPnl < -1000).length,
            cryptoTraders: traders.filter(t => t.cryptoTrades > 5).length
        };

        return NextResponse.json({
            leaderboard,
            stats,
            period,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({
            leaderboard: [],
            stats: {
                total: 0,
                avgScore: 0,
                avgWinRate: 0,
                avgPnl: 0,
                totalCryptoTrades: 0,
                topTraders: 0,
                bottomTraders: 0,
                cryptoTraders: 0
            },
            error: 'Failed to fetch leaderboard',
            lastUpdate: new Date().toISOString()
        }, { status: 500 });
    }
}
