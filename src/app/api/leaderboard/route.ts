import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/services/leaderboard-service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = (searchParams.get('period') || '7d') as '24h' | '7d' | '30d';
        const type = searchParams.get('type') || 'all';
        const forceRefresh = searchParams.get('refresh') === 'true';

        const data = await getLeaderboardData(period, forceRefresh);

        if (type === 'top') {
            return NextResponse.json({ traders: data.top, period });
        } else if (type === 'worst') {
            return NextResponse.json({ traders: data.worst, period });
        }

        return NextResponse.json({
            top: data.top,
            worst: data.worst,
            period
        });
    } catch (error: any) {
        console.error('[API/leaderboard] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
