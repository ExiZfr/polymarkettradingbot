import { NextResponse } from 'next/server'
import { TelegramUser } from '@/lib/types'
import { validateTelegramData } from '@/lib/auth'
import { cookies } from 'next/headers'

// IMPORTANT: This comes from your env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

export async function POST(request: Request) {
    try {
        const data: TelegramUser = await request.json()
        const telegramId = Number(data.id);
        const ADMIN_ID = 7139453099;

        if (!BOT_TOKEN) {
            console.error("TELEGRAM_BOT_TOKEN is not defined")
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            )
        }

        // 1. Validate the cryptographic signature
        // DEV BYPASS: Allow admin to bypass signature check for testing web flow
        if (data.hash === "dev_bypass" && telegramId === ADMIN_ID) {
            console.log("Dev bypass used for admin login");
        } else {
            const isValid = validateTelegramData(data, BOT_TOKEN)
            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid authentication data" },
                    { status: 401 }
                )
            }
        }

        // 2. Check validity duration (optional but recommended)
        const now = Math.floor(Date.now() / 1000)
        if (data.hash !== "dev_bypass" && now - data.auth_date > 86400) { // 24 hours
            return NextResponse.json(
                { error: "Data is outdated" },
                { status: 401 }
            )
        }

        // 3. Simple Admin Check (Pending PostgreSQL Integration)
        if (telegramId !== ADMIN_ID) {
            console.log(`User ${data.id} denied (Not Admin)`);
            return NextResponse.json(
                { error: "Access Denied. You do not have a paid subscription." },
                { status: 403 }
            )
        }

        // 4. Set Session Cookie
        const cookieStore = await cookies()
        cookieStore.set('session', JSON.stringify({
            id: telegramId,
            username: data.username,
            photo_url: data.photo_url,
            is_admin: true
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Auth Error:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
