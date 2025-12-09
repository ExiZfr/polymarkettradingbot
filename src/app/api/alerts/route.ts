import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/alerts - Fetch user's alerts
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const isActive = searchParams.get('isActive');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const where: any = { userId: parseInt(userId) };
        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error('Failed to fetch alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

// POST /api/alerts - Create new alert
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, name, type, conditions, telegramEnabled, emailEnabled, webEnabled } = body;

        if (!userId || !name || !type || !conditions) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const alert = await prisma.alert.create({
            data: {
                userId: parseInt(userId),
                name,
                type,
                conditions,
                telegramEnabled: telegramEnabled || false,
                emailEnabled: emailEnabled || false,
                webEnabled: webEnabled !== false, // Default true
            },
        });

        return NextResponse.json(alert);
    } catch (error) {
        console.error('Failed to create alert:', error);
        return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }
}
