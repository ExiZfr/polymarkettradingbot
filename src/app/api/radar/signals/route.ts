/**
 * API Route: GET /api/radar/signals
 * Returns whale signals with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhaleSignals } from '@/lib/polyradar-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const limit = parseInt(searchParams.get('limit') || '100');
        const minAmount = parseFloat(searchParams.get('minAmount') || '0');
        const category = searchParams.get('category') || undefined;
        const wallet = searchParams.get('wallet') || undefined;

        const signals = getWhaleSignals({
            limit,
            minAmount,
            category,
            wallet,
        });

        return NextResponse.json({
            success: true,
            count: signals.length,
            signals,
        });
    } catch (error) {
        console.error('Error fetching whale signals:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch whale signals',
                signals: [],
            },
            { status: 500 }
        );
    }
}
