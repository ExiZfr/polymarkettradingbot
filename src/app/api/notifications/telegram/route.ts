import { NextRequest, NextResponse } from 'next/server';

interface TelegramNotificationPayload {
    type: 'copy_started' | 'trade_executed';
    data: {
        trader?: string;
        market?: string;
        side?: string;
        amount?: number;
        inverse?: boolean;
        copyMode?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const payload: TelegramNotificationPayload = await request.json();

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.warn('Telegram credentials not configured');
            return NextResponse.json({ success: false, message: 'Telegram not configured' });
        }

        let message = '';

        if (payload.type === 'copy_started') {
            const modeEmoji = payload.data.inverse ? '🔄' : '⚡';
            const modeText = payload.data.inverse ? 'INVERSE' : 'NORMAL';
            const amountText = payload.data.copyMode === 'percentage'
                ? `${payload.data.amount}% match`
                : `$${payload.data.amount}/trade`;

            message = `${modeEmoji} *Copy Trading Started*\n\n` +
                `📊 Trader: \`${payload.data.trader}\`\n` +
                `Mode: *${modeText}*\n` +
                `Amount: *${amountText}*\n` +
                `✅ Auto-copying enabled`;
        } else if (payload.type === 'trade_executed') {
            const sideEmoji = payload.data.side === 'YES' ? '📈' : '📉';
            const inverseTag = payload.data.inverse ? ' 🔄 INVERSE' : '';

            message = `${sideEmoji} *Trade Copied${inverseTag}*\n\n` +
                `Market: ${payload.data.market}\n` +
                `Side: *${payload.data.side}*\n` +
                `Amount: *$${payload.data.amount?.toFixed(2)}*\n` +
                `Trader: \`${payload.data.trader}\``;
        }

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            throw new Error('Telegram API error');
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Telegram] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
