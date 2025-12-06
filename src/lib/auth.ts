import crypto from 'crypto'
import { TelegramUser } from '@/lib/types'

export function validateTelegramData(data: TelegramUser, botToken: string): boolean {
    // 1. Create a data-check-string
    // Sort all fields alphabetically by key (except 'hash')
    // Format: key=value
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
