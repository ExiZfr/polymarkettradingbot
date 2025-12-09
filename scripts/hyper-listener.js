/**
 * PolyGraalX Hyper-Listener Engine
 * 
 * High-performance, multi-threaded market intelligence engine.
 * continuously scans Polymarket, RSS Feeds, and Reddit for snipe opportunities.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const pLimit = require('p-limit');

// -- Configuration --
const CONFIG_PATH = path.join(__dirname, '..', 'listener-config.json');
const GAMMA_API = 'https://gamma-api.polymarket.com';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7139453099';

// -- State --
let settings = {
    enabled: true,
    scanInterval: 10,
    minScore: 15,
    maxMarkets: 150,
    turboMode: false,
    enableRss: false,
    rssUrls: [],
    customKeywords: []
};
const parser = new Parser();
const limit = pLimit(20); // Concurrency limit

// -- Load Settings --
function loadSettings() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            settings = { ...settings, ...JSON.parse(data) };
            // Adjust scan interval based on Turbo Mode
            if (settings.turboMode) settings.scanInterval = 10;
        }
    } catch (e) {
        console.error('Failed to load settings:', e.message);
    }
}

// -- Source Adapters --

// 1. Polymarket Adapter
async function fetchPolymarket() {
    console.log('[Polymarket] Scanning...');
    try {
        const response = await axios.get(`${GAMMA_API}/markets?closed=false&limit=500&active=true`);
        return response.data;
    } catch (e) {
        console.error('[Polymarket] Error:', e.message);
        return [];
    }
}

// 2. RSS Adapter
async function fetchRSS() {
    if (!settings.enableRss || !settings.rssUrls?.length) return [];

    console.log(`[RSS] Scanning ${settings.rssUrls.length} feeds...`);
    const promises = settings.rssUrls.map(url => limit(async () => {
        try {
            const feed = await parser.parseURL(url);
            return feed.items.map(item => ({
                source: 'rss',
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                feedTitle: feed.title
            }));
        } catch (e) {
            console.error(`[RSS] Error fetching ${url}: ${e.message}`);
            return [];
        }
    }));

    const results = await Promise.all(promises);
    return results.flat();
}

// -- Analysis Engine --

function normalizeMarkets(polyMarkets, rssItems) {
    // 1. Identify keywords from RSS/News to boost relevant markets
    const trendingKeywords = new Set();
    rssItems.forEach(item => {
        const words = item.title.toLowerCase().split(/\s+/);
        words.forEach(w => {
            if (w.length > 4) trendingKeywords.add(w);
        });
    });

    // 2. Score Markets
    return polyMarkets.map(m => {
        let score = 10; // Base
        const volume = parseFloat(m.volume) || 0;
        const liquidity = parseFloat(m.liquidity) || 0;

        // Liquidity/Volume Score
        score += Math.min(30, (volume / 100000) * 30);
        score += Math.min(25, (liquidity / 50000) * 25);

        // Keyword Boost
        const title = (m.question || m.description || '').toLowerCase();

        // Custom Keywords Boost
        if (settings.customKeywords?.some(k => title.includes(k.toLowerCase()))) {
            score += 20;
        }

        // RSS/News Correlation Boost
        let newsMatches = 0;
        trendingKeywords.forEach(kw => {
            if (title.includes(kw)) newsMatches++;
        });
        score += Math.min(30, newsMatches * 5);

        return {
            ...m,
            score: Math.round(score),
            newsCorrelation: newsMatches > 0
        };
    });
}

// -- Notification System --
async function sendTelegramAlert(market) {
    if (!TELEGRAM_BOT_TOKEN) return;

    const message = `
🚀 *HYPER-LISTENER ALERT* 🚀

📌 ${market.question}
📊 Score: *${market.score}/100*
${market.newsCorrelation ? '🔥 Validated by News/RSS' : ''}

💰 Vol: $${(parseFloat(market.volume) / 1000).toFixed(1)}k
💧 Liq: $${(parseFloat(market.liquidity) / 1000).toFixed(1)}k

🔗 [Polymarket](https://polymarket.com/event/${market.slug || market.id})
    `.trim();

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        console.log(`[Telegram] Sent alert for: ${market.question.slice(0, 30)}...`);
    } catch (e) {
        console.error('[Telegram] Error:', e.message);
    }
}

// -- Main Loop --
async function run() {
    console.log('⚡ Hyper-Listener Engine Started');

    // Initial Load
    loadSettings();

    // Loop
    setInterval(async () => {
        loadSettings(); // Reload settings hot

        const [markets, rssData] = await Promise.all([
            fetchPolymarket(),
            fetchRSS()
        ]);

        const opportunities = normalizeMarkets(markets, rssData);
        const topPicks = opportunities
            .filter(m => m.score >= 70) // High threshold
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        console.log(`[Scan] Processed ${markets.length} markets. Found ${topPicks.length} high-potential opportunities.`);

        for (const pick of topPicks) {
            // Simple dedupe check could be added here
            await sendTelegramAlert(pick);
        }

    }, settings.scanInterval * 1000);
}

run();
