import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';

// POST: Switch active profile
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { profileId } = body;

        if (!profileId) {
            return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        const success = PaperWallet.setActiveProfile(profileId);

        if (success) {
            return NextResponse.json({ success: true, activeProfileId: profileId });
        } else {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
