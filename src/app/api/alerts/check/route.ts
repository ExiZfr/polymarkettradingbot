import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/alerts/check
 * Evaluate all active alerts against current market data
 * This endpoint is called by the background listener or cron job
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { marketData } = body; // Array of current market states

        if (!marketData || !Array.isArray(marketData)) {
            return NextResponse.json({ error: 'marketData required' }, { status: 400 });
        }

        // Fetch all active alerts
        const alerts = await prisma.alert.findMany({
            where: { isActive: true },
        });

        const triggeredAlerts = [];

        for (const alert of alerts) {
            const conditions = alert.conditions as any;

            for (const market of marketData) {
                let triggered = false;

                // Evaluate based on alert type
                switch (alert.type) {
                    case 'SCORE_TRIGGER':
                        if (conditions.minScore && market.score >= conditions.minScore) {
                            triggered = true;
                        }
                        if (conditions.maxScore && market.score <= conditions.maxScore) {
                            triggered = true;
                        }
                        break;

                    case 'PRICE_THRESHOLD':
                        if (conditions.minPrice && market.probability >= conditions.minPrice * 100) {
                            triggered = true;
                        }
                        if (conditions.maxPrice && market.probability <= conditions.maxPrice * 100) {
                            triggered = true;
                        }
                        break;

                    case 'VOLUME_SPIKE':
                        if (conditions.minVolume && market.volume >= conditions.minVolume) {
                            triggered = true;
                        }
                        break;

                    case 'KEYWORD':
                        if (conditions.keywords && Array.isArray(conditions.keywords)) {
                            const title = market.title?.toLowerCase() || '';
                            const hasKeyword = conditions.keywords.some((kw: string) =>
                                title.includes(kw.toLowerCase())
                            );
                            if (hasKeyword) triggered = true;
                        }
                        break;

                    case 'WALLET_ACTIVITY':
                        // TODO: Implement wallet tracking integration
                        break;
                }

                if (triggered) {
                    // Update alert stats
                    await prisma.alert.update({
                        where: { id: alert.id },
                        data: {
                            triggeredCount: { increment: 1 },
                            lastTriggered: new Date(),
                        },
                    });

                    const triggerData = {
                        alertId: alert.id,
                        alertName: alert.name,
                        userId: alert.userId,
                        market,
                        telegramEnabled: alert.telegramEnabled,
                        emailEnabled: alert.emailEnabled,
                        webEnabled: alert.webEnabled,
                    };

                    triggeredAlerts.push(triggerData);

                    // Send Telegram notification if enabled
                    if (alert.telegramEnabled) {
                        try {
                            const { telegramNotifier } = await import('@/lib/telegram-notifier');
                            await telegramNotifier.sendAlert({
                                alertName: alert.name,
                                marketTitle: market.title || 'Unknown Market',
                                marketId: market.id,
                                score: market.score,
                                reason: `Alert type: ${alert.type}`,
                            });
                        } catch (error) {
                            console.error('Failed to send Telegram notification:', error);
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            checked: alerts.length,
            triggered: triggeredAlerts.length,
            alerts: triggeredAlerts,
        });
    } catch (error) {
        console.error('Failed to check alerts:', error);
        return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 });
    }
}
