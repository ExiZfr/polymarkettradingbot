import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';

// GET: List all profiles
export async function GET() {
    try {
        // CRITICAL: Ensure file exists before reading
        PaperWallet.ensureProfilesFileExists();
        const data = PaperWallet.getAllProfiles();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching profiles:', error);
        // Return safe default
        return NextResponse.json({
            activeProfileId: 'default',
            profiles: {}
        });
    }
}

// POST: Create new profile
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, balance, settings } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const profile = PaperWallet.createProfile(
            name,
            balance || 1000,
            settings || {}
        );

        return NextResponse.json(profile);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
