
import { NextResponse } from 'next/server';
import { PaperWallet, PaperCopySetting } from '@/lib/trading-engine/paper-wallet';

// GET: List all copy settings for the active profile
export async function GET() {
    try {
        PaperWallet.ensureProfilesFileExists();
        const profilesData = PaperWallet.getAllProfiles();
        const activeProfileId = profilesData.activeProfileId;
        const activeProfile = profilesData.profiles[activeProfileId];

        if (!activeProfile) {
            return NextResponse.json({ copySettings: {} });
        }

        return NextResponse.json({
            profileId: activeProfileId,
            copySettings: activeProfile.copySettings || {}
        });
    } catch (error: any) {
        console.error('Error fetching paper copy settings:', error);
        return NextResponse.json({ copySettings: {} });
    }
}

// POST: Add or Update a copy setting
export async function POST(request: Request) {
    try {
        const body = await request.json();
        /*
          Expected Body:
          {
            walletAddress: string;
            label?: string;
            copyMode: 'fixed' | 'percentage' | 'smart_mirror';
            fixedAmount?: number;
            percentageAmount?: number;
            maxCap?: number;
            stopLoss?: number;
            inverse?: boolean;
            enabled?: boolean;
          }
        */
        const { walletAddress, ...updates } = body;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const profilesData = PaperWallet.getAllProfiles();
        const activeProfileId = profilesData.activeProfileId;
        const activeProfile = profilesData.profiles[activeProfileId];

        if (!activeProfile) {
            return NextResponse.json({ error: 'Active profile not found' }, { status: 404 });
        }

        // Initialize copySettings if missing (legacy support)
        if (!activeProfile.copySettings) {
            activeProfile.copySettings = {};
        }

        const existingSetting = activeProfile.copySettings[walletAddress];

        const newSetting: PaperCopySetting = {
            walletAddress,
            createdAt: existingSetting?.createdAt || new Date().toISOString(),
            enabled: updates.enabled ?? existingSetting?.enabled ?? true,
            label: updates.label || existingSetting?.label || '',
            copyMode: updates.copyMode || existingSetting?.copyMode || 'fixed',
            fixedAmount: updates.fixedAmount ?? existingSetting?.fixedAmount ?? 10,
            percentageAmount: updates.percentageAmount ?? existingSetting?.percentageAmount,
            maxCap: updates.maxCap ?? existingSetting?.maxCap,
            stopLoss: updates.stopLoss ?? existingSetting?.stopLoss,
            inverse: updates.inverse ?? existingSetting?.inverse ?? false,
        };

        activeProfile.copySettings[walletAddress] = newSetting;

        // Save using the internal mechanics (simulating a save by overwriting the file)
        // Since PaperWallet static methods don't expose a direct "save specific profile" easily without instantiating,
        // we will manually use the fs logic implicitly via a helper or just re-save everything.
        // Actually, PaperWallet has no static 'saveProfilesData', so we need to instantiate or replicate save logic.
        // For safety/speed, let's instantiate.

        const wallet = new PaperWallet(activeProfileId);
        // We need to inject the changes. Since `wallet.profile` is a copy, we modify it then save.
        // But `wallet.profile` is private.
        // Workaround: We will use the fact that we read the data, modified it in memory, and now we need to write it back.
        // We can't use the `PaperWallet` class easily for *this* specific field without extending the class methods.
        // IMPORTANT: Let's extend the class first in the previous step? 
        // No, I can just use `fs` effectively here or use the public method if I add one.
        // I'll assume I can just use the `fs` approach similar to the class for now to avoid hopping back and forth too much,
        // OR better, I will quickly add a static `updateProfile` method to PaperWallet in a follow-up if needed, 
        // but for now I'll just re-implement the save logic here as it's simple JSON write.

        // Actually, I can just use `PaperWallet` instance if I add a public method to set the settings.
        // BUT, I can't add methods to the instance from here.
        // So I will write to the file directly.

        const fs = require('fs');
        const path = require('path');
        const PROFILES_FILE = path.join(process.cwd(), 'data', 'paper-profiles.json');
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(profilesData, null, 2));

        return NextResponse.json({ success: true, setting: newSetting });
    } catch (error: any) {
        console.error('Error saving paper copy setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a copy setting
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('address');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        const profilesData = PaperWallet.getAllProfiles();
        const activeProfileId = profilesData.activeProfileId;
        const activeProfile = profilesData.profiles[activeProfileId];

        if (activeProfile && activeProfile.copySettings && activeProfile.copySettings[walletAddress]) {
            delete activeProfile.copySettings[walletAddress];

            const fs = require('fs');
            const path = require('path');
            const PROFILES_FILE = path.join(process.cwd(), 'data', 'paper-profiles.json');
            fs.writeFileSync(PROFILES_FILE, JSON.stringify(profilesData, null, 2));
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
