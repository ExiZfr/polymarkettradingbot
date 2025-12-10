```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/alerts/[id]
 * Update an alert
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const alert = await prisma.alert.update({
            where: { id },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(alert);
    } catch (error) {
        console.error('Failed to update alert:', error);
        return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }
}

/**
 * GET /api/alerts/[id]
 * Get a specific alert by ID
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const alert = await prisma.alert.findUnique({
            where: { id }
        });

        if (!alert) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        return NextResponse.json(alert);
    } catch (error) {
        console.error('Failed to fetch alert:', error);
        return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 });
    }
}
/**
 * DELETE /api/alerts/[id]
 * Delete an alert
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        await prisma.alert.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete alert:', error);
        return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
    }
}
