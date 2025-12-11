import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        // Server-side fetch to bypass CORS
        const response = await fetch(`https://gamma-api.polymarket.com/markets/${id}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PolyGraalX-Bot/1.0'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(`Polymarket API Error for ID ${id}: ${response.status}`);
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        const data = await response.json();

        // Extract slug logic based on API response structure
        let slug = data.slug;
        if (!slug && data.events && data.events.length > 0) {
            slug = data.events[0].slug;
        }

        if (slug) {
            return NextResponse.json({ slug });
        } else {
            return NextResponse.json({ error: 'No slug found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
