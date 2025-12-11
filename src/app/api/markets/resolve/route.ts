import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cache as fallback when DB is not available
const memoryCache = new Map<string, any>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * GET /api/markets/resolve?id=XXX
 * 
 * Resolves a Polymarket market_id to its slug, title, description, and other metadata.
 * Works WITHOUT database by using in-memory cache.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    try {
        // Step 1: Check memory cache
        const cached = memoryCache.get(id);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return NextResponse.json({
                id,
                ...cached,
                cached: true
            });
        }

        // Step 2: Fetch from Polymarket API
        console.log(`[MarketResolver] Fetching from Polymarket API for ${id}...`);

        const polyResponse = await fetch(`https://gamma-api.polymarket.com/markets/${id}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PolyGraalX-Bot/1.0'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!polyResponse.ok) {
            console.error(`[MarketResolver] Polymarket API error for ${id}: ${polyResponse.status}`);
            return NextResponse.json({
                error: 'Market not found on Polymarket',
                id,
                fallbackUrl: `https://polymarket.com/?s=${id}`
            }, { status: 404 });
        }

        const data = await polyResponse.json();

        // Step 3: Extract all useful data (may be nested in events)
        let slug = data.slug;
        let title = data.question || data.title || `Market #${id}`;
        let imageUrl = data.image || null;
        let description = data.description || '';
        let endDate = data.end_date_iso || data.endDate || null;
        let volume = data.volume || data.volume24hr || null;
        let liquidity = data.liquidity || null;

        if (!slug && data.events && data.events.length > 0) {
            const event = data.events[0];
            slug = event.slug;
            title = event.title || title;
            imageUrl = event.image || imageUrl;
            description = event.description || description;
            endDate = event.end_date_iso || endDate;
        }

        if (!slug) {
            console.warn(`[MarketResolver] No slug found for ${id}`);
            return NextResponse.json({
                error: 'No slug found for this market',
                id,
                fallbackUrl: `https://polymarket.com/?s=${id}`
            }, { status: 404 });
        }

        // Step 4: Store in memory cache with all enriched data
        const enrichedData = {
            slug,
            title,
            imageUrl: imageUrl || undefined,
            description,
            endDate,
            volume,
            liquidity,
            timestamp: Date.now()
        };

        memoryCache.set(id, enrichedData);
        console.log(`[MarketResolver] Cached ${id} -> ${slug}`);

        return NextResponse.json({
            id,
            slug,
            title,
            imageUrl,
            description,
            endDate,
            volume,
            liquidity,
            cached: false
        });

    } catch (error) {
        console.error('[MarketResolver] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            fallbackUrl: `https://polymarket.com/?s=${id}`
        }, { status: 500 });
    }
}

/**
 * POST /api/markets/resolve
 * 
 * Bulk resolve multiple market IDs (used by Sniper/Radar to pre-cache)
 * Body: { ids: ["id1", "id2", ...], preload: {...} }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const ids: string[] = body.ids || [];
        const preload: Record<string, any> = body.preload || {};

        // If preload data is provided, store in memory cache
        if (Object.keys(preload).length > 0) {
            for (const [id, data] of Object.entries(preload)) {
                if (data.slug) {
                    memoryCache.set(id, {
                        slug: data.slug,
                        title: data.title || `Market #${id}`,
                        imageUrl: data.imageUrl,
                        description: data.description,
                        endDate: data.endDate,
                        volume: data.volume,
                        timestamp: Date.now()
                    });
                }
            }
            return NextResponse.json({ preloaded: Object.keys(preload).length });
        }

        // Standard bulk resolve (fetch from Polymarket if not cached)
        if (!ids.length) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const results: { id: string; slug?: string; error?: string }[] = [];

        for (const id of ids.slice(0, 20)) { // Limit to 20 per request
            try {
                // Check memory cache first
                const cached = memoryCache.get(id);
                if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
                    results.push({ id, slug: cached.slug });
                    continue;
                }

                // Fetch from Polymarket
                const res = await fetch(`https://gamma-api.polymarket.com/markets/${id}`);
                if (!res.ok) {
                    results.push({ id, error: 'Not found' });
                    continue;
                }

                const data = await res.json();
                let slug = data.slug;
                let title = data.question || `Market #${id}`;

                if (!slug && data.events?.length > 0) {
                    slug = data.events[0].slug;
                    title = data.events[0].title || title;
                }

                if (slug) {
                    memoryCache.set(id, {
                        slug,
                        title,
                        description: data.description || data.events?.[0]?.description || '',
                        timestamp: Date.now()
                    });
                    results.push({ id, slug });
                } else {
                    results.push({ id, error: 'No slug' });
                }
            } catch (e) {
                results.push({ id, error: 'Fetch error' });
            }
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error('[MarketResolver] POST Error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
