import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTelegramWebAppData } from '@/lib/telegram-auth';
import pool from '@/lib/db';
import { encrypt } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const botToken = process.env.BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify HMAC
        const isValid = verifyTelegramWebAppData(data, botToken);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid authentication data' }, { status: 401 });
        }

        // 2. Check/Upsert User in PostgreSQL
        const client = await pool.connect();
        try {
            // Check if user exists
            const checkRes = await client.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [data.id]
            );

            let dbUser = checkRes.rows[0];

            if (!dbUser) {
                // Create new user
                const insertRes = await client.query(
                    `INSERT INTO users (telegram_id, username, first_name, is_premium)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
                    [data.id, data.username, data.first_name, false]
                );
                dbUser = insertRes.rows[0];
            } else {
                // Update existing user info
                await client.query(
                    `UPDATE users 
           SET username = $1, first_name = $2, updated_at = NOW()
           WHERE id = $3`,
                    [data.username, data.first_name, dbUser.id]
                );
            }

            // 3. Create Session (JWT)
            const session = await encrypt({
                user_id: dbUser.id,
                telegram_id: dbUser.telegram_id,
                is_premium: dbUser.is_premium
            });

            // 4. Set Cookie
            cookies().set('session', session, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24, // 24 hours
            });

            return NextResponse.json({ success: true });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
