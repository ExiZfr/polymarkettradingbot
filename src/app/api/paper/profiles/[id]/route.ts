import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';

// DELETE: Remove a profile
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (id === 'default') {
        return NextResponse.json({ error: 'Cannot delete default profile' }, { status: 400 });
    }

    const success = PaperWallet.deleteProfile(id);

    if (success) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
}
