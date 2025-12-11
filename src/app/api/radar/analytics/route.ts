/**
 * API Route: GET /api/radar/analytics
 * Returns whale analytics and statistics
 */

import { NextResponse } from 'next/server';
import { getWhaleAnalytics, isRadarActive } from '@/lib/polyradar-db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const analytics = getWhaleAnalytics();
        const isActive = isRadarActive();

        if (!analytics) {
            return NextResponse.json({
                success: true,
                is_active: false,
                analytics: {
                    total_signals: 0,
                    unique_wallets: 0,
                    total_volume: 0,
                    avg_trade_size: 0,
                    copied_count: 0,
                    total_copied_volume: 0,
                    top_wallets: [],
                    category_distribution: [],
                },
            });
        }

        return NextResponse.json({
            success: true,
            is_active: isActive,
            analytics,
        });
    } catch (error) {
        console.error('Error fetching whale analytics:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch analytics',
            },
            { status: 500 }
        );
    }
}
