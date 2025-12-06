import crypto from 'crypto'
import { TelegramUser } from '@/lib/types'

export function validateTelegramData(data: TelegramUser | any, botToken: string): boolean {
    // Case 1: Mini App (initData string)
    // The frontend sends the full 'initData' string as 'hash' property in our modified login page
    // We need to validate this string against the bot token key (WebAppData style)
    if (data.hash && data.hash.includes('auth_date=')) {
        const initData = new URLSearchParams(data.hash);
        const hash = initData.get('hash');
        initData.delete('hash');

        // Items must be sorted alphabetically
        const dataCheckString = Array.from(initData.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // WebApp validation uses HMAC-SHA256(WebAppData, token) differently
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return signature === hash;
    }

    // Case 2: Standard Login Widget (Object)
    // 1. Create a data-check-string
    const checkString = Object.keys(data)
        .filter((key) => key !== 'hash')
        .sort()
        .map((key) => `${key}=${data[key as keyof TelegramUser]}`)
        .join('\n')

    // 2. Create a secret key using SHA256 of the bot token
    const secretKey = crypto
        .createHash('sha256')
        .update(botToken)
        .digest()

    // 3. Calculate HMAC-SHA256 signature
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(checkString)
        .digest('hex')

    // 4. Compare with the received hash
    return signature === data.hash
}
