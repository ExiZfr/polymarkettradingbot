import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/prices/history?id=XXX&interval=day
 * 
 * Fetches historical price data for a market token from Polymarket CLOB
 * Returns price history for charting
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const tokenId = searchParams.get('id');
    const interval = searchParams.get('interval') || 'day'; // day, hour, minute
    const fidelity = searchParams.get('fidelity') || '60'; // Minutes per data point

    if (!tokenId) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        // Fetch from Polymarket CLOB API prices-history endpoint
        const response = await fetch(
            `https://clob.polymarket.com/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'PolyGraalX-Bot/1.0'
                },
                next: { revalidate: 60 } // Cache for 1 minute
            }
        );

        if (!response.ok) {
            // Try alternative endpoint format
            const altResponse = await fetch(
                `https://clob.polymarket.com/prices-history?tokenId=${tokenId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'PolyGraalX-Bot/1.0'
                    }
                }
            );

            if (!altResponse.ok) {
                return NextResponse.json({
                    error: 'Price history not available',
                    tokenId
                }, { status: 404 });
            }

            const altData = await altResponse.json();
            return NextResponse.json({
                tokenId,
                history: altData.history || altData,
                source: 'alternative'
            });
        }

        const data = await response.json();

        // Format history data for charting
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
