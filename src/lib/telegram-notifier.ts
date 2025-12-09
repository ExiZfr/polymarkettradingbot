import TelegramBot from 'node-telegram-bot-api';

// Your personal Telegram ID (owner)
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID || ''; // Set this in .env

class TelegramNotifier {
    private bot: TelegramBot | null = null;
    private isEnabled: boolean = false;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (token && OWNER_TELEGRAM_ID) {
            try {
                this.bot = new TelegramBot(token, { polling: false });
                this.isEnabled = true;
                console.log('✅ Telegram Notifier initialized');
            } catch (error) {
                console.error('❌ Failed to initialize Telegram bot:', error);
                this.isEnabled = false;
            }
        } else {
            console.warn('⚠️ Telegram bot not configured (missing token or owner ID)');
        }
    }

    /**
     * Send notification to the owner (you)
     */
    async notifyOwner(message: string, options?: { priority?: 'low' | 'medium' | 'high' }) {
        if (!this.isEnabled || !this.bot || !OWNER_TELEGRAM_ID) {
            console.log('[Telegram] Skipped (not configured):', message);
            return;
        }

        try {
            const emoji = options?.priority === 'high' ? '🔥' : options?.priority === 'medium' ? '⚡' : 'ℹ️';
            const formattedMessage = `${emoji} *Polymarket Alert*\n\n${message}`;

            await this.bot.sendMessage(OWNER_TELEGRAM_ID, formattedMessage, {
                parse_mode: 'Markdown',
            });

            console.log('✅ Telegram notification sent to owner');
        } catch (error) {
            console.error('❌ Failed to send Telegram notification:', error);
        }
    }

    /**
     * Send alert notification with market details
     */
    async sendAlert(alert: {
        alertName: string;
        marketTitle: string;
        marketId: string;
        score?: number;
        reason?: string;
    }) {
        const message = `
🎯 *Alert Triggered: ${alert.alertName}*

📊 Market: ${alert.marketTitle}

${alert.score ? `🔥 Score: ${alert.score}/100` : ''}
${alert.reason ? `💡 Reason: ${alert.reason}` : ''}

🔗 [View on Polymarket](https://polymarket.com/market/${alert.marketId})
`.trim();

        await this.notifyOwner(message, { priority: 'high' });
    }

    /**
     * Send signal notification
     */
    async sendSignal(signal: {
        marketTitle: string;
        score: number;
        volume: string;
        reason: string;
        slug: string;
    }) {
        const message = `
🔥 *High Score Signal*

📊 ${signal.marketTitle}

⚡ Score: *${signal.score}/100*
💰 Volume: ${signal.volume}
💡 ${signal.reason}

🔗 [View Market](https://polymarket.com/event/${signal.slug})
`.trim();

        await this.notifyOwner(message, { priority: 'high' });
    }

    /**
     * Quick test message
     */
    async sendTestMessage() {
        await this.notifyOwner('🚀 Smart Alert System is online and ready!', { priority: 'low' });
    }
}

// Singleton instance
export const telegramNotifier = new TelegramNotifier();
