import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/prices?ids=id1,id2,id3
 * 
 * Fetches current prices for multiple market condition IDs from Polymarket
 * Returns: { prices: { [conditionId]: { yes: number, no: number } } }
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids');

    if (!ids) {
        return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
    }

    const conditionIds = ids.split(',').filter(id => id.trim());

    if (conditionIds.length === 0 || conditionIds.length > 50) {
        return NextResponse.json({ error: 'Provide 1-50 market IDs' }, { status: 400 });
    }

    const prices: Record<string, { yes: number; no: number; lastUpdate: string }> = {};

    try {
        // Fetch prices in parallel (batch of 10 to avoid rate limits)
        const batchSize = 10;
        for (let i = 0; i < conditionIds.length; i += batchSize) {
            const batch = conditionIds.slice(i, i + batchSize);

            await Promise.all(
                batch.map(async (id) => {
                    try {
                        // Use Polymarket CLOB API for real-time prices
                        const response = await fetch(
                            `https://clob.polymarket.com/markets/${id}`,
                            {
                                headers: {
                                    'Accept': 'application/json',
                                    'User-Agent': 'PolyGraalX-Bot/1.0'
                                },
                                next: { revalidate: 5 } // Cache for 5 seconds
                            }
                        );

                        if (response.ok) {
                            const data = await response.json();
                            // CLOB API returns best bid/ask
                            const yesPrice = data.tokens?.[0]?.price || data.outcome_prices?.[0] || 0.5;
                            const noPrice = data.tokens?.[1]?.price || data.outcome_prices?.[1] || 0.5;

                            prices[id] = {
                                yes: parseFloat(yesPrice),
                                no: parseFloat(noPrice),
                                lastUpdate: new Date().toISOString()
                            };
                        }
                    } catch (error) {
                        // Use fallback price
                        prices[id] = { yes: 0.5, no: 0.5, lastUpdate: new Date().toISOString() };
                    }
                })
            );
        }

        return NextResponse.json({
            prices,
            fetchedAt: new Date().toISOString(),
            count: Object.keys(prices).length
        });

    } catch (error) {
        console.error('[Prices API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
