import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/prices/history?id=XXX&outcome=YES|NO&interval=day&fidelity=60
 * 
 * Fetches historical price data for a market token from Polymarket CLOB.
 * Automatically resolves Market/Condition ID to Token ID if 'outcome' is provided.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    let tokenId = searchParams.get('id');
    const outcome = searchParams.get('outcome'); // YES or NO
    const interval = searchParams.get('interval') || 'day';
    const fidelity = searchParams.get('fidelity') || '60';

    // Debug Log
    console.log(`[PriceHistory] Request: id=${tokenId}, outcome=${outcome}, interval=${interval}`);

    if (!tokenId) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        // Step 1: Resolve Token ID if outcome is provided (assuming id is Market/Condition ID)
        if (outcome) {
            try {
                // Try to fetch market details from Gamma API to get clobTokenIds
                // Note: The ID passed might be a condition ID or a slug.
                const gammaUrl = `https://gamma-api.polymarket.com/markets/${tokenId}`;
                // console.log(`[PriceHistory] Fetching Gamma: ${gammaUrl}`);

                const marketRes = await fetch(gammaUrl, {
                    next: { revalidate: 3600 } // Cache market details for 1 hour
                });

                if (marketRes.ok) {
                    const marketData = await marketRes.json();
                    // console.log(`[PriceHistory] Gamma Data found for ${tokenId}`);

                    // Logic to find Token ID
                    // marketData.clobTokenIds is an array [token0, token1]
                    // Standard Binary Market: 0 = NO, 1 = YES
                    if (marketData.clobTokenIds && marketData.clobTokenIds.length >= 2) {
                        const targetIndex = outcome.toUpperCase() === 'YES' ? 1 : 0;
                        if (marketData.clobTokenIds[targetIndex]) {
                            tokenId = marketData.clobTokenIds[targetIndex];
                            console.log(`[PriceHistory] Resolved TokenID (clobTokenIds): ${tokenId}`);
                        }
                    } else if (marketData.tokens && marketData.tokens.length >= 2) {
                        // Fallback to tokens array if clobTokenIds missing
                        const targetToken = marketData.tokens.find((t: any) =>
                            (outcome.toUpperCase() === 'YES' && (t.outcome === 'YES' || t.winner === true)) ||
                            (outcome.toUpperCase() === 'NO' && (t.outcome === 'NO' || t.winner === false))
                        );
                        if (targetToken?.tokenId) {
                            tokenId = targetToken.tokenId;
                            console.log(`[PriceHistory] Resolved TokenID (tokens fallback): ${tokenId}`);
                        }
                    } else {
                        console.warn(`[PriceHistory] Market data found but no tokens/clobTokenIds for ${tokenId}`);
                    }
                } else {
                    console.warn(`[PriceHistory] Gamma API returned ${marketRes.status} for ${tokenId}`);
                }
            } catch (resolveError) {
                console.warn('[PriceHistory] Failed to resolve Token ID explicitly:', resolveError);
            }
        }

        // Step 2: Fetch History from CLOB
        const clobUrl = `https://clob.polymarket.com/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`;
        // console.log(`[PriceHistory] Fetching CLOB: ${clobUrl}`);

        const response = await fetch(clobUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PolyGraalX-Bot/1.0'
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            console.error(`[PriceHistory] CLOB Error ${response.status} for ${tokenId}`);
            return NextResponse.json({
                error: 'Price history not available',
                tokenId,
                clobStatus: response.status
            }, { status: 404 });
        }

        const data = await response.json();
        // console.log(`[PriceHistory] Success. Points: ${(data.history || []).length}`);

        // Format
        const history = (data.history || data || []).map((point: any) => ({
            timestamp: point.t || point.timestamp,
            price: point.p || point.price,
        }));

        return NextResponse.json({
            tokenId,
            interval,
            history,
            count: history.length,
            fetchedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('[PriceHistory] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });
    }
}
