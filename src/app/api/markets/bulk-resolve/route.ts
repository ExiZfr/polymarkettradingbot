import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * POST /api/markets/bulk-resolve
 * 
 * Bulk resolve multiple market IDs efficiently
 * Body: { ids: ["id1", "id2", ...] }
 * Returns: { results: [{ id, slug, title, description }] }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const ids: string[] = body.ids || [];

        if (!ids.length || ids.length > 50) {
            return NextResponse.json(
                { error: 'Provide 1-50 market IDs' },
                { status: 400 }
            );
        }

        console.log(`[BulkResolve] Resolving ${ids.length} market IDs...`);

        // Fetch all from PostgreSQL cache
        const cached = await prisma.marketCache.findMany({
            where: { id: { in: ids } }
        });

        const cachedMap = new Map(cached.map(c => [c.id, c]));
        const results = [];
        const toFetch = [];

        // Separate cached vs. need-to-fetch
        for (const id of ids) {
            if (cachedMap.has(id)) {
                const market = cachedMap.get(id)!;
                results.push({
                    id,
                    slug: market.slug,
                    title: market.title,
                    description: market.description,
                    imageUrl: market.imageUrl,
                    cached: true
                });
            } else {
                toFetch.push(id);
            }
        }

        console.log(`[BulkResolve] ${cached.length} from cache, ${toFetch.length} to fetch`);

        // Fetch missing from Polymarket API
        for (const id of toFetch) {
            try {
                const res = await fetch(`https://gamma-api.polymarket.com/markets/${id}`, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'PolyGraalX-Bot/1.0'
                    }
                });

                if (!res.ok) {
                    results.push({ id, error: 'Not found' });
                    continue;
                }

                const data = await res.json();
                let slug = data.slug;
                let title = data.question || `Market #${id}`;
                let description = data.description || '';
                let imageUrl = data.image || null;

                if (!slug && data.events?.length > 0) {
                    slug = data.events[0].slug;
                    title = data.events[0].title || title;
                    description = data.events[0].description || description;
                    imageUrl = data.events[0].image || imageUrl;
                }

                if (slug) {
                    // Cache it in PostgreSQL
                    await prisma.marketCache.upsert({
                        where: { id },
                        update: { slug, title, description, imageUrl, updatedAt: new Date() },
                        create: { id, slug, title, description, imageUrl, resolved: false }
                    });

                    console.log(`[BulkResolve] Cached ${id} -> ${slug}`);

                    results.push({
                        id,
                        slug,
                        title,
                        description,
                        imageUrl,
                        cached: false
                    });
                } else {
                    results.push({ id, error: 'No slug' });
                }
            } catch (e) {
                console.error(`[BulkResolve] Error fetching ${id}:`, e);
                results.push({ id, error: 'Fetch error' });
            }
        }

        console.log(`[BulkResolve] Complete: ${results.length} results`);

        return NextResponse.json({ results });

    } catch (error) {
        console.error('[BulkResolve] Error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } finally {
        await prisma.$disconnect();
    }
}
