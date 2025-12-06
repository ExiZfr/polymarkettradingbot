import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { decrypt } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await decrypt(sessionCookie);

        const client = await pool.connect();
        try {
            // Disable ALL strategies for this user
            await client.query(
                'UPDATE copy_strategies SET is_active = FALSE WHERE user_id = $1',
                [session.user_id]
            );
            return NextResponse.json({ success: true, message: "All strategies disabled." });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
