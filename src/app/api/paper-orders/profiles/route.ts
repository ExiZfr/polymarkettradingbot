import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Server-Side Paper Trading Profiles API
 * 
 * Manages multiple trading profiles/wallets on the server.
 * 
 * GET - List all profiles
 * POST - Create new profile
 * PATCH - Update profile (switch active, rename, update settings)
 * DELETE - Delete a profile
 */

const PROFILES_FILE = path.join(process.cwd(), 'data', 'server_paper_profiles.json');

interface ServerProfile {
    id: string;
    name: string;
    balance: number;
    initialBalance: number;
    totalPnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    settings: {
        riskPerTrade: number;
        autoStopLoss: number;
        autoTakeProfit: number;
        maxOpenPositions: number;
        allowShorts: boolean;
    };
}

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readProfiles(): ServerProfile[] {
    try {
        ensureDataDir();
        if (fs.existsSync(PROFILES_FILE)) {
            return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('[Profiles] Error reading:', e);
    }
    // Return default profile if none exist
    const defaultProfile = createDefaultProfile();
    writeProfiles([defaultProfile]);
    return [defaultProfile];
}

function writeProfiles(profiles: ServerProfile[]) {
    ensureDataDir();
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

function createDefaultProfile(): ServerProfile {
    return {
        id: 'default',
        name: 'Paper Trading',
        balance: 10000,
        initialBalance: 10000,
        totalPnL: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
            riskPerTrade: 5,
            autoStopLoss: 20,
            autoTakeProfit: 50,
            maxOpenPositions: 10,
            allowShorts: true
        }
    };
}

function generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// GET - List all profiles
export async function GET() {
    try {
        const profiles = readProfiles();
        const activeProfile = profiles.find(p => p.isActive) || profiles[0];

        return NextResponse.json({
            profiles,
            activeProfileId: activeProfile?.id || 'default',
            count: profiles.length
        });
    } catch (error) {
        console.error('[Profiles] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
}

// POST - Create new profile
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, initialBalance = 1000, settings } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
        }

        const profiles = readProfiles();

        const newProfile: ServerProfile = {
            id: generateId(),
            name: name.trim(),
            balance: initialBalance,
            initialBalance,
            totalPnL: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            isActive: true, // Auto-switch to new profile
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            settings: settings || {
                riskPerTrade: 5,
                autoStopLoss: 20,
                autoTakeProfit: 50,
                maxOpenPositions: 10,
                allowShorts: true
            }
        };

        // Deactivate all other profiles
        profiles.forEach(p => p.isActive = false);
        profiles.push(newProfile);
        writeProfiles(profiles);

        return NextResponse.json({
            success: true,
            profile: newProfile,
            message: `Profile "${name}" created and activated`
        });
    } catch (error) {
        console.error('[Profiles] POST error:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }
}

// PATCH - Update profile (switch active, rename, update settings, update balance)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { profileId, action, name, settings, balance, pnlDelta, tradeResult } = body;

        if (!profileId) {
            return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        const profiles = readProfiles();
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex === -1) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const profile = profiles[profileIndex];

        switch (action) {
            case 'SWITCH':
                // Deactivate all, activate this one
                profiles.forEach(p => p.isActive = false);
                profile.isActive = true;
                break;

            case 'RENAME':
                if (name?.trim()) {
                    profile.name = name.trim();
                }
                break;

            case 'UPDATE_SETTINGS':
                if (settings) {
                    profile.settings = { ...profile.settings, ...settings };
                }
                break;

            case 'UPDATE_BALANCE':
                if (typeof balance === 'number') {
                    profile.balance = balance;
                }
                if (typeof pnlDelta === 'number') {
                    profile.totalPnL += pnlDelta;
                    profile.totalTrades += 1;
                    if (tradeResult === 'WIN') profile.winningTrades += 1;
                    if (tradeResult === 'LOSS') profile.losingTrades += 1;
                }
                break;

            case 'RESET':
                profile.balance = profile.initialBalance;
                profile.totalPnL = 0;
                profile.totalTrades = 0;
                profile.winningTrades = 0;
                profile.losingTrades = 0;
                break;

            default:
                // Allow generic updates
                if (name?.trim()) profile.name = name.trim();
                if (settings) profile.settings = { ...profile.settings, ...settings };
        }

        profile.updatedAt = new Date().toISOString();
        profiles[profileIndex] = profile;
        writeProfiles(profiles);

        return NextResponse.json({
            success: true,
            profile,
            message: `Profile updated`
        });
    } catch (error) {
        console.error('[Profiles] PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

// DELETE - Delete a profile
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get('profileId');

        if (!profileId) {
            return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        let profiles = readProfiles();

        if (profiles.length <= 1) {
            return NextResponse.json({ error: 'Cannot delete the last profile' }, { status: 400 });
        }

        const wasActive = profiles.find(p => p.id === profileId)?.isActive;
        profiles = profiles.filter(p => p.id !== profileId);

        // If deleted profile was active, activate another
        if (wasActive && profiles.length > 0) {
            profiles[0].isActive = true;
        }

        writeProfiles(profiles);

        return NextResponse.json({
            success: true,
            message: 'Profile deleted',
            activeProfileId: profiles.find(p => p.isActive)?.id
        });
    } catch (error) {
        console.error('[Profiles] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }
}
