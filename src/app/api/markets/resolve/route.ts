import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * GET /api/markets/resolve?id=XXX
 * 
 * Resolves a Polymarket market_id to its slug, title, description, and other metadata.
 * Uses PostgreSQL MarketCache for persistent storage.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    try {
        // Step 1: Check PostgreSQL MarketCache
        const cached = await prisma.marketCache.findUnique({
            where: { id }
        });

        if (cached) {
            console.log(`[MarketResolver] Cache hit for ${id}`);
            return NextResponse.json({
                id,
                slug: cached.slug,
                title: cached.title,
                description: cached.description || '',
                imageUrl: cached.imageUrl,
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

        // Step 4: Store in PostgreSQL MarketCache
        await prisma.marketCache.upsert({
            where: { id },
            update: {
                slug,
                title,
                description,
                imageUrl,
                updatedAt: new Date()
            },
            create: {
                id,
                slug,
                title,
                description,
                imageUrl,
                resolved: false
            }
        });

        console.log(`[MarketResolver] Cached ${id} -> ${slug} in PostgreSQL`);

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
    } finally {
        await prisma.$disconnect();
    }
}
