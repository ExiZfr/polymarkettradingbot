import { NextResponse } from 'next/server'
import { TelegramUser } from '@/lib/types'
import { validateTelegramData } from '@/lib/auth'
import { cookies } from 'next/headers'

// IMPORTANT: This comes from your env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

export async function POST(request: Request) {
    try {
        const data: TelegramUser = await request.json()

        if (!BOT_TOKEN) {
            console.error("TELEGRAM_BOT_TOKEN is not defined")
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            )
        }

        // 1. Validate the cryptographic signature
        const isValid = validateTelegramData(data, BOT_TOKEN)
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid authentication data" },
                { status: 401 }
            )
        }

        // 2. Check validity duration (optional but recommended)
        // Auth date is unix timestamp in seconds
        const now = Math.floor(Date.now() / 1000)
        if (now - data.auth_date > 86400) { // 24 hours
            return NextResponse.json(
                { error: "Data is outdated" },
                { status: 401 }
            )
        }

        // 3. Check for specific Admin/Subscriber ID
        const ALLOWED_USERS = [7139453099]; // Votre ID Admin

        // Simulating DB check
        if (!ALLOWED_USERS.includes(data.id)) {
            console.log(`User ${data.id} tried to login but is not in allowed list.`);
            return NextResponse.json(
                { error: "Access Denied. You do not have a paid subscription." },
                { status: 403 }
            )
        }

        // 4. Set Session Cookie
        // In a real app, use a JWT or session ID encrypted library like 'jose' or 'iron-session'
        const cookieStore = await cookies()
        cookieStore.set('session', JSON.stringify({
            id: data.id,
            username: data.username,
            photo_url: data.photo_url
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
