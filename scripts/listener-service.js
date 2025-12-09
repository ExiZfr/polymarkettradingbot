/**
 * PolyGraalX Listener Service
 * 
 * A persistent background service that runs on the VPS via PM2.
 * It continuously scans Polymarket for opportunities and can send
 * Telegram notifications when high-value markets are detected.
 * 
 * Usage:
 *   npm run listener        # Run once
 *   pm2 start scripts/listener-service.js --name polylistener  # Run persistently
 */

const GAMMA_API = 'https://gamma-api.polymarket.com';
const SCAN_INTERVAL_MS = 60000; // 60 seconds

// Telegram Bot Config (loaded from env)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7139453099';

// Keywords to prioritize (can be extended)
const PRIORITY_KEYWORDS = [
    'Trump', 'Biden', 'election', 'Bitcoin', 'ETH', 'GTA 6', 'Super Bowl',
    'World Cup', 'Fed', 'rate', 'recession', 'ChatGPT', 'AI', 'Taylor Swift',
    'Elon Musk', 'SpaceX', 'Apple', 'iPhone', 'Netflix', 'UFC'
];

// Category detection
function detectCategory(title) {
    const lower = title.toLowerCase();

    if (lower.match(/gta|playstation|xbox|nintendo|gaming|esports|twitch|fortnite|valorant/)) return 'Gaming';
    if (lower.match(/netflix|disney|movie|celebrity|taylor swift|kanye|youtube|tiktok/)) return 'Entertainment';
    if (lower.match(/apple|google|microsoft|openai|chatgpt|ai|tesla|spacex|nvidia/)) return 'Tech';
    if (lower.match(/bitcoin|btc|ethereum|eth|crypto|solana|nft|defi/)) return 'Crypto';
    if (lower.match(/trump|biden|election|president|congress|senate|vote/)) return 'Politics';
    if (lower.match(/nfl|nba|ufc|mma|super bowl|world cup|olympics/)) return 'Sports';
    if (lower.match(/stock|fed|rate|inflation|gdp|nasdaq|recession/)) return 'Finance';
    if (lower.match(/vaccine|covid|nasa|space|climate|fda/)) return 'Science';

    return 'Other';
}

// Calculate snipability score (simplified version)
function calculateScore(market) {
    let score = 10; // Base score

    // Volume score (0-30)
    const volume = parseFloat(market.volume) || 0;
    score += Math.min(30, (volume / 100000) * 30);

    // Liquidity score (0-25)
    const liquidity = parseFloat(market.liquidity) || 0;
    score += Math.min(25, (liquidity / 50000) * 25);

    // Time score (0-30) - closer end dates get higher scores
    const endDate = new Date(market.endDate || market.end_date_iso);
    const hoursUntilEnd = (endDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilEnd < 24) score += 30;
    else if (hoursUntilEnd < 72) score += 20;
    else if (hoursUntilEnd < 168) score += 10;

    // Keyword bonus (+10 for priority keywords)
    const title = market.question || market.description || '';
    const hasKeyword = PRIORITY_KEYWORDS.some(kw =>
        title.toLowerCase().includes(kw.toLowerCase())
    );
    if (hasKeyword) score += 10;

    return Math.min(100, Math.round(score));
}

// Send Telegram notification
async function sendTelegramAlert(market, score) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('[Telegram] No bot token configured, skipping notification');
        return;
    }

    const category = detectCategory(market.question || '');
    const emoji = {
        'Gaming': '🎮',
        'Entertainment': '🎬',
        'Tech': '💻',
        'Crypto': '₿',
        'Politics': '🏛️',
        'Sports': '⚽',
        'Finance': '📈',
        'Science': '🔬',
        'Other': '📊'
    }[category] || '📊';

    const message = `
🔥 *HIGH SCORE OPPORTUNITY* 🔥

${emoji} *${category}*
📌 ${market.question || market.description}

📊 Score: *${score}/100*
💰 Volume: $${formatVolume(parseFloat(market.volume) || 0)}
💧 Liquidity: $${formatVolume(parseFloat(market.liquidity) || 0)}

🔗 [View on Polymarket](https://polymarket.com/event/${market.slug || market.id})
    `.trim();

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });

        if (response.ok) {
            console.log(`[Telegram] Alert sent for: ${market.question?.slice(0, 50)}...`);
        } else {
            console.error('[Telegram] Failed to send:', await response.text());
        }
    } catch (err) {
        console.error('[Telegram] Error:', err.message);
    }
}

function formatVolume(vol) {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toFixed(0);
}

// Main scan function
async function scanMarkets() {
    console.log(`\n[${new Date().toISOString()}] Starting market scan...`);

    try {
        const response = await fetch(`${GAMMA_API}/markets?closed=false&limit=500`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PolyGraalX-Listener/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const markets = await response.json();
        console.log(`[Scan] Fetched ${markets.length} markets`);

        // Filter active markets with some volume
        const active = markets.filter(m => m.active && parseFloat(m.volume) > 100);
        console.log(`[Scan] ${active.length} active markets with volume`);

        // Score and sort
        const scored = active.map(m => ({
            ...m,
            score: calculateScore(m),
            category: detectCategory(m.question || m.description || '')
        })).sort((a, b) => b.score - a.score);

        // Top opportunities
        const top10 = scored.slice(0, 10);
        console.log(`\n[Top Opportunities]`);
        top10.forEach((m, i) => {
            console.log(`  ${i + 1}. [${m.score}] ${m.category}: ${(m.question || '').slice(0, 60)}...`);
        });

        // Send alerts for very high scores (>= 70)
        const highScoreMarkets = scored.filter(m => m.score >= 70);
        console.log(`\n[Alerts] ${highScoreMarkets.length} markets with score >= 70`);

        for (const market of highScoreMarkets.slice(0, 3)) { // Max 3 alerts per scan
            await sendTelegramAlert(market, market.score);
            await new Promise(r => setTimeout(r, 1000)); // Rate limit
        }

        // Stats
        const categoryStats = {};
        scored.forEach(m => {
            categoryStats[m.category] = (categoryStats[m.category] || 0) + 1;
        });
        console.log(`\n[Categories]`, categoryStats);

        return scored;

    } catch (err) {
        console.error(`[Scan Error] ${err.message}`);
        return [];
    }
}

// Main loop
async function main() {
    console.log('='.repeat(50));
    console.log('🚀 PolyGraalX Listener Service Started');
    console.log(`📡 Scan Interval: ${SCAN_INTERVAL_MS / 1000}s`);
    console.log(`📱 Telegram: ${TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured'}`);
    console.log('='.repeat(50));

    // Initial scan
    await scanMarkets();

    // Continuous loop
    setInterval(scanMarkets, SCAN_INTERVAL_MS);
}

// Run
main().catch(console.error);
