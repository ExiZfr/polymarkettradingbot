import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/markets/check-resolution?ids=id1,id2,id3
 * 
 * Checks if any of the provided market IDs have been resolved.
 * Returns resolved markets with their winning outcome.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
        return NextResponse.json({ resolvedMarkets: [] });
    }

    const marketIds = idsParam.split(',').filter(id => id.trim());
    if (marketIds.length === 0) {
        return NextResponse.json({ resolvedMarkets: [] });
    }

    const resolvedMarkets: Array<{
        marketId: string;
        winningOutcome: 'YES' | 'NO' | null;
        resolutionPrice: number;
    }> = [];

    try {
        // Fetch each market's status from Gamma API
        // We do this in parallel with a concurrency limit
        const batchSize = 5;
        for (let i = 0; i < marketIds.length; i += batchSize) {
            const batch = marketIds.slice(i, i + batchSize);

            const batchResults = await Promise.allSettled(
                batch.map(async (marketId) => {
                    try {
                        const res = await fetch(
                            `https://gamma-api.polymarket.com/markets/${marketId}`,
                            {
                                next: { revalidate: 60 },
                                signal: AbortSignal.timeout(5000)
                            }
                        );

                        if (!res.ok) return null;

                        const data = await res.json();

                        // Check if market is resolved
                        // Polymarket uses different fields, check multiple possibilities
                        const isResolved =
                            data.closed === true ||
                            data.resolved === true ||
                            data.resolutionSource !== undefined;

                        if (!isResolved) return null;

                        // Determine winning outcome
                        let winningOutcome: 'YES' | 'NO' | null = null;
                        let resolutionPrice = 0;

                        // Check tokens array for winner
                        if (data.tokens && Array.isArray(data.tokens)) {
                            const yesToken = data.tokens.find((t: any) =>
                                t.outcome === 'Yes' || t.outcome === 'YES'
                            );
                            const noToken = data.tokens.find((t: any) =>
                                t.outcome === 'No' || t.outcome === 'NO'
                            );

                            if (yesToken?.winner === true) {
                                winningOutcome = 'YES';
                                resolutionPrice = 1;
                            } else if (noToken?.winner === true) {
                                winningOutcome = 'NO';
                                resolutionPrice = 1;
                            }
                        }

                        // Fallback: check outcome field
                        if (!winningOutcome && data.outcome) {
                            winningOutcome = data.outcome.toUpperCase() === 'YES' ? 'YES' : 'NO';
                            resolutionPrice = 1;
                        }

                        // Another fallback: check resolution
                        if (!winningOutcome && data.resolution !== undefined) {
                            if (data.resolution === 1 || data.resolution === '1') {
                                winningOutcome = 'YES';
                                resolutionPrice = 1;
                            } else if (data.resolution === 0 || data.resolution === '0') {
                                winningOutcome = 'NO';
                                resolutionPrice = 1;
                            }
                        }

                        if (winningOutcome) {
                            return {
                                marketId,
                                winningOutcome,
                                resolutionPrice
                            };
                        }

                        return null;
                    } catch (e) {
                        console.warn(`[CheckResolution] Failed to check ${marketId}:`, e);
                        return null;
                    }
                })
            );

            // Collect successful results
            for (const result of batchResults) {
                if (result.status === 'fulfilled' && result.value) {
                    resolvedMarkets.push(result.value);
                }
            }
        }

        return NextResponse.json({
            resolvedMarkets,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('[CheckResolution] Error:', error);
        return NextResponse.json({
            resolvedMarkets: [],
            error: 'Failed to check market resolutions'
        }, { status: 500 });
    }
}
