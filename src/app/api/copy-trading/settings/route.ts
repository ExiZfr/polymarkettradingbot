import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, walletAddress, settings } = body; // settings: { enabled, fixedAmount, ... }

        if (!userId || !walletAddress) {
            return NextResponse.json({ error: 'Missing userId or walletAddress' }, { status: 400 });
        }

        // Upsert TrackedWallet first
        const trackedWallet = await prisma.trackedWallet.upsert({
            where: { address: walletAddress },
            update: {},
            create: {
                address: walletAddress,
                isMonitored: true,
                tags: ['Copied'],
            },
        });

        // Upsert CopySetting
        const copySetting = await prisma.copySetting.upsert({
            where: {
                userId_walletId: {
                    userId: parseInt(userId),
                    walletId: trackedWallet.id
                }
            },
            update: {
                ...settings,
                updatedAt: new Date(),
            },
            create: {
                userId: parseInt(userId),
                walletId: trackedWallet.id,
                ...settings,
            },
        });

        return NextResponse.json({ success: true, data: copySetting });
    } catch (error) {
        console.error('[API/copy-trading/settings] Error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const settings = await prisma.copySetting.findMany({
            where: { userId: parseInt(userId) },
            include: { trackedWallet: true }
        });
        return NextResponse.json(settings);
    } catch (error) {
        console.error('[API/copy-trading/settings] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
