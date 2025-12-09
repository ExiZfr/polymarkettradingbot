import { NextRequest, NextResponse } from 'next/server';
import { getTraderDetail } from '@/lib/services/leaderboard-service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;

        if (!address || !address.startsWith('0x')) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        const detail = await getTraderDetail(address);

        if (!detail) {
            return NextResponse.json({ error: 'Trader not found' }, { status: 404 });
        }

        return NextResponse.json(detail);
    } catch (error: any) {
        console.error('[API/leaderboard/trader] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch trader details' }, { status: 500 });
    }
}
