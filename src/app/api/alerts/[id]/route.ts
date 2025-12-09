import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/alerts/[id] - Update alert
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { id } = params;

        const alert = await prisma.alert.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(alert);
    } catch (error) {
        console.error('Failed to update alert:', error);
        return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }
}

// DELETE /api/alerts/[id] - Delete alert
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        await prisma.alert.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete alert:', error);
        return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
    }
}
