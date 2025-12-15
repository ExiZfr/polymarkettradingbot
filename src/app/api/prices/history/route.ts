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

    if (!tokenId) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        // Step 1: Resolve Token ID if outcome is provided (assuming id is Market/Condition ID)
        if (outcome) {
            try {
                // Try to fetch market details from Gamma API to get clobTokenIds
                // Note: The ID passed might be a condition ID or a slug, but Gamma API usually accepts Condition ID as ID ?
                // Actually Gamma API /markets/:id usually takes the ID string.
                const marketRes = await fetch(`https://gamma-api.polymarket.com/markets/${tokenId}`, {
                    next: { revalidate: 3600 } // Cache market details for 1 hour
                });

                if (marketRes.ok) {
                    const marketData = await marketRes.json();

                    // Logic to find Token ID
                    // marketData.clobTokenIds is an array [token0, token1]
                    // Standard Binary Market: 0 = NO, 1 = YES? 
                    // Typically on Polymarket (CTF): outcome 0 -> NO, outcome 1 -> YES

                    if (marketData.clobTokenIds && marketData.clobTokenIds.length >= 2) {
                        // User passes 'YES' or 'NO'
                        const targetIndex = outcome.toUpperCase() === 'YES' ? 1 : 0;

                        // Safety check
                        if (marketData.clobTokenIds[targetIndex]) {
                            tokenId = marketData.clobTokenIds[targetIndex];
                        }
                    } else if (marketData.tokens && marketData.tokens.length >= 2) {
                        // Fallback to tokens array if clobTokenIds missing (older markets?)
                        const targetToken = marketData.tokens.find((t: any) =>
                            (outcome.toUpperCase() === 'YES' && (t.outcome === 'YES' || t.winner === true)) ||
                            (outcome.toUpperCase() === 'NO' && (t.outcome === 'NO' || t.winner === false))
                        );
                        if (targetToken?.tokenId) {
                            tokenId = targetToken.tokenId;
                        }
                    }
                }
            } catch (resolveError) {
                console.warn('Failed to resolve Token ID explicitly:', resolveError);
            }
        }

        // Step 2: Fetch History from CLOB
        const clobUrl = `https://clob.polymarket.com/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`;

        const response = await fetch(clobUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PolyGraalX-Bot/1.0'
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            return NextResponse.json({
                error: 'Price history not available',
                tokenId
            }, { status: 404 });
        }

        const data = await response.json();

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
