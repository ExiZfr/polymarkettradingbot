import crypto from 'crypto';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

export function verifyTelegramWebAppData(
    data: TelegramUser,
    botToken: string
): boolean {
    // 1. Create the data-check-string
    // The data-check-string is a concatenation of all received fields, 
    // sorted alphabetically, in the format key=value with a line feed character ('\n') as separator.
    // The hash field is not included.

    const dataCheckArr = [];
    for (const [key, value] of Object.entries(data)) {
        if (key !== 'hash') {
            dataCheckArr.push(`${key}=${value}`);
        }
    }

    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // 2. Compute the secret key
    // The secret key is the SHA256 hash of the bot token.
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // 3. Compute the hash
    // The hash is the HMAC-SHA256 of the data-check-string using the secret key.
    const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    // 4. Compare
    return hash === data.hash;
}
