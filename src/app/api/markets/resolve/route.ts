import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/markets/resolve?id=XXX
 * 
 * Resolves a Polymarket market_id to its slug and title.
 * Uses local database cache first, then fetches from Polymarket API if not found.
 * This is the SINGLE SOURCE OF TRUTH for market link resolution.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    try {
        // Step 1: Check local cache
        const cached = await prisma.marketCache.findUnique({
            where: { id }
        });

        if (cached) {
            return NextResponse.json({
                id: cached.id,
                slug: cached.slug,
                title: cached.title,
                imageUrl: cached.imageUrl,
                cached: true
            });
        }

        // Step 2: Not in cache, fetch from Polymarket API
        console.log(`[MarketResolver] Cache miss for ${id}, fetching from Polymarket...`);

        const polyResponse = await fetch(`https://gamma-api.polymarket.com/markets/${id}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PolyGraalX-Bot/1.0'
            }
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

        // Step 3: Extract slug (may be nested in events)
        let slug = data.slug;
        let title = data.question || data.title || `Market #${id}`;
        let imageUrl = data.image || null;

        if (!slug && data.events && data.events.length > 0) {
            slug = data.events[0].slug;
            title = data.events[0].title || title;
            imageUrl = data.events[0].image || imageUrl;
        }

        if (!slug) {
            console.warn(`[MarketResolver] No slug found for ${id}`);
            return NextResponse.json({
                error: 'No slug found for this market',
                id,
                fallbackUrl: `https://polymarket.com/?s=${id}`
            }, { status: 404 });
        }

        // Step 4: Store in cache
        await prisma.marketCache.upsert({
            where: { id },
            update: {
                slug,
                title,
                imageUrl,
                resolved: true
            },
            create: {
                id,
                slug,
                title,
                imageUrl,
                resolved: true
            }
        });

        console.log(`[MarketResolver] Cached ${id} -> ${slug}`);

        return NextResponse.json({
            id,
            slug,
            title,
            imageUrl,
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
 * Body: { ids: ["id1", "id2", ...] }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const ids: string[] = body.ids || [];
        const preload: Record<string, { slug: string; title: string; imageUrl?: string }> = body.preload || {};

        // If preload data is provided, directly insert into cache
        if (Object.keys(preload).length > 0) {
            for (const [id, data] of Object.entries(preload)) {
                if (data.slug) {
                    await prisma.marketCache.upsert({
                        where: { id },
                        update: {
                            slug: data.slug,
                            title: data.title || `Market #${id}`,
                            imageUrl: data.imageUrl || null,
                            resolved: true
                        },
                        create: {
                            id,
                            slug: data.slug,
                            title: data.title || `Market #${id}`,
                            imageUrl: data.imageUrl || null,
                            resolved: true
                        }
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
                // Check cache first
                const cached = await prisma.marketCache.findUnique({ where: { id } });
                if (cached) {
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
                if (!slug && data.events?.length > 0) {
                    slug = data.events[0].slug;
                }

                if (slug) {
                    await prisma.marketCache.upsert({
                        where: { id },
                        update: { slug, title: data.question || `Market #${id}`, resolved: true },
                        create: { id, slug, title: data.question || `Market #${id}`, resolved: true }
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
