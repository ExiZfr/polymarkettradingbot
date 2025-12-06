import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { decrypt } from '@/lib/session';

// GET: List strategies
export async function GET(request: NextRequest) {
    try {
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await decrypt(sessionCookie);

        const client = await pool.connect();
        try {
            const res = await client.query(
                'SELECT * FROM copy_strategies WHERE user_id = $1 ORDER BY created_at DESC',
                [session.user_id]
            );
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// POST: Create strategy
export async function POST(request: NextRequest) {
    try {
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const session = await decrypt(sessionCookie);

        const body = await request.json();

        const client = await pool.connect();
        try {
            const res = await client.query(
                `INSERT INTO copy_strategies 
         (user_id, target_wallet, fixed_amount, max_slippage, is_inverse, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
                [
                    session.user_id,
                    body.target_wallet,
                    body.fixed_amount,
                    body.max_slippage,
                    body.is_inverse,
                    true
                ]
            );
            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
    }
}
