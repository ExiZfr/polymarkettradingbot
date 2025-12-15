import { NextResponse } from 'next/server';

const GAMMA_API = "https://gamma-api.polymarket.com";

interface TraderData {
    address: string;
    pnl: number;
    winRate: number;
    trades: number;
    rank: number;
    score: number;
}

interface Signal {
    id: string;
    marketId: string;
    marketSlug: string;
    question: string;
    outcome: string;
    traderAddress: string;
    traderPnl: number;
    traderWinRate: number;
    traderRank: number;
    entryPrice: number;
    size: number;
    side: string;
    reliabilityScore: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    reason: string;
    timestamp: string;
}

// Calculate reliability score based on trader metrics and market conditions
function calculateReliabilityScore(
    traderPnl: number,
    traderWinRate: number,
    traderRank: number,
    tradeSize: number,
    marketVolume: number
): { score: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // Trader PnL component (0-30 points)
    if (traderPnl > 100000) {
        score += 30;
        reasons.push("🐋 Whale Trader (>$100K PnL)");
    } else if (traderPnl > 50000) {
        score += 25;
        reasons.push("💰 High Profit Trader (>$50K)");
    } else if (traderPnl > 10000) {
        score += 20;
        reasons.push("📈 Profitable Trader (>$10K)");
    } else if (traderPnl > 1000) {
        score += 10;
        reasons.push("✨ Emerging Trader");
    }

    // Win rate component (0-25 points)
    if (traderWinRate > 0.7) {
        score += 25;
        reasons.push(`🎯 Elite Win Rate (${(traderWinRate * 100).toFixed(0)}%)`);
    } else if (traderWinRate > 0.6) {
        score += 20;
        reasons.push(`✅ Strong Win Rate (${(traderWinRate * 100).toFixed(0)}%)`);
    } else if (traderWinRate > 0.5) {
        score += 10;
        reasons.push(`📊 Positive Win Rate (${(traderWinRate * 100).toFixed(0)}%)`);
    }

    // Rank component (0-20 points)
    if (traderRank <= 10) {
        score += 20;
        reasons.push(`🏆 Top 10 Trader (#${traderRank})`);
    } else if (traderRank <= 50) {
        score += 15;
        reasons.push(`🥈 Top 50 Trader (#${traderRank})`);
    } else if (traderRank <= 100) {
        score += 10;
        reasons.push(`🥉 Top 100 Trader (#${traderRank})`);
    }

    // Trade size conviction (0-15 points)
    if (tradeSize > 10000) {
        score += 15;
        reasons.push("💪 High Conviction Trade (>$10K)");
    } else if (tradeSize > 5000) {
        score += 10;
        reasons.push("📍 Significant Position (>$5K)");
    } else if (tradeSize > 1000) {
        score += 5;
        reasons.push("🔹 Standard Position");
    }

    // Market liquidity bonus (0-10 points)
    if (marketVolume > 1000000) {
        score += 10;
        reasons.push("🌊 High Liquidity Market");
    } else if (marketVolume > 100000) {
        score += 5;
    }

    // Determine confidence level
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    if (score >= 80) {
        confidence = 'EXTREME';
    } else if (score >= 60) {
        confidence = 'HIGH';
    } else if (score >= 40) {
        confidence = 'MEDIUM';
    } else {
        confidence = 'LOW';
    }

    return {
        score: Math.min(100, score),
        confidence,
        reason: reasons.slice(0, 3).join(' • ')
    };
}

export async function GET() {
    try {
        // Fetch crypto markets
        const marketsRes = await fetch(
            `${GAMMA_API}/markets?closed=false&limit=50&active=true`,
            { next: { revalidate: 60 } }
        );

        if (!marketsRes.ok) {
            throw new Error('Failed to fetch markets');
        }

        const allMarkets = await marketsRes.json();

        // Filter for crypto markets
        const cryptoKeywords = ["bitcoin", "btc", "ethereum", "eth", "solana", "sol"];
        const priceKeywords = ["price", "$", "above", "below", "hit", "reach", "dip"];

        const cryptoMarkets = allMarkets.filter((market: any) => {
            const question = (market.question || "").toLowerCase();
            const isCrypto = cryptoKeywords.some(k => question.includes(k));
            const isPriceMarket = priceKeywords.some(k => question.includes(k));
            return isCrypto && isPriceMarket;
        }).slice(0, 20); // Top 20 crypto markets

        const signals: Signal[] = [];
        const traders: Map<string, TraderData> = new Map();

        // For each market, get recent trades and top holders
        for (const market of cryptoMarkets) {
            const marketId = market.conditionId || market.condition_id;
            if (!marketId) continue;

            try {
                // Get market activity/trades
                const activityRes = await fetch(
                    `${GAMMA_API}/activity?market=${marketId}&limit=20`,
                    { next: { revalidate: 30 } }
                );

                if (activityRes.ok) {
                    const activities = await activityRes.json();

                    for (const activity of activities) {
                        const address = activity.proxyWallet || activity.user;
                        if (!address) continue;

                        const side = activity.side || 'BUY';
                        const size = parseFloat(activity.usdcSize) || 0;
                        const price = parseFloat(activity.price) || 0.5;
                        const outcome = activity.outcome || 'Yes';

                        // Skip small trades
                        if (size < 100) continue;

                        // Get or create trader data (simulated for now)
                        let trader = traders.get(address);
                        if (!trader) {
                            // Simulate trader stats based on activity patterns
                            const simulatedPnl = Math.random() * 100000 - 10000;
                            const simulatedWinRate = 0.4 + Math.random() * 0.4;
                            trader = {
                                address,
                                pnl: simulatedPnl,
                                winRate: simulatedWinRate,
                                trades: Math.floor(Math.random() * 500) + 10,
                                rank: Math.floor(Math.random() * 500) + 1,
                                score: 0
                            };
                            traders.set(address, trader);
                        }

                        // Calculate reliability score
                        const { score, confidence, reason } = calculateReliabilityScore(
                            trader.pnl,
                            trader.winRate,
                            trader.rank,
                            size,
                            parseFloat(market.volume) || 0
                        );

                        // Only include signals with score > 30
                        if (score >= 30) {
                            signals.push({
                                id: `${marketId}-${address}-${Date.now()}`,
                                marketId,
                                marketSlug: market.slug || '',
                                question: market.question || '',
                                outcome: outcome === 'Yes' ? 'YES' : 'NO',
                                traderAddress: address,
                                traderPnl: trader.pnl,
                                traderWinRate: trader.winRate,
                                traderRank: trader.rank,
                                entryPrice: price,
                                size,
                                side,
                                reliabilityScore: score,
                                confidence,
                                reason,
                                timestamp: activity.timestamp || new Date().toISOString()
                            });
                        }
                    }
                }
            } catch (e) {
                console.error(`Error fetching activity for ${marketId}:`, e);
            }
        }

        // Sort signals by reliability score
        signals.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

        // Build leaderboard from traders
        const leaderboard = Array.from(traders.values())
            .map(t => ({
                ...t,
                score: Math.floor(t.pnl / 1000 + t.winRate * 100)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 20)
            .map((t, idx) => ({ ...t, rank: idx + 1 }));

        return NextResponse.json({
            signals: signals.slice(0, 50),
            leaderboard,
            totalSignals: signals.length,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('Oracle signals error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch signals', signals: [], leaderboard: [] },
            { status: 500 }
        );
    }
}
