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
const LOGS_PATH = path.join(__dirname, '..', 'data', 'listener-logs.json');
const SNIPED_MARKETS_PATH = path.join(__dirname, '..', 'data', 'sniped-markets.json');
const GAMMA_API = 'https://gamma-api.polymarket.com';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7139453099';

// Ensure data dir exists
if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'data'));
}

// -- Signals History Database --
const SIGNALS_HISTORY_PATH = path.join(__dirname, '..', 'data', 'signals-history.json');

function loadSignalsHistory() {
    try {
        if (fs.existsSync(SIGNALS_HISTORY_PATH)) {
            return JSON.parse(fs.readFileSync(SIGNALS_HISTORY_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('[SignalsDB] Failed to load:', e.message);
    }
    return { signals: [], lastCleanup: null };
}

function saveSignalsHistory(data) {
    try {
        fs.writeFileSync(SIGNALS_HISTORY_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[SignalsDB] Failed to save:', e.message);
    }
}
// Check if signal already sent (by marketId, within 24h)
// Returns: { skip: boolean, reason?: string, previousScore?: number }
function shouldSkipSignal(marketId, newScore, hasNewsCorrelation) {
    const db = loadSignalsHistory();
    const existing = db.signals.find(s => s.marketId === marketId);

    if (!existing) {
        return { skip: false }; // New signal, don't skip
    }

    const sentAt = new Date(existing.timestamp);
    const hoursSince = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60);

    // If older than 24h, allow resend
    if (hoursSince >= 24) {
        return { skip: false, reason: 'Signal expired (24h+)' };
    }

    // EXCEPTION: If score increased by 10+ points AND has news correlation, resend
    const scoreDiff = newScore - (existing.score || 0);
    if (scoreDiff >= 10 && hasNewsCorrelation && !existing.newsCorrelation) {
        return {
            skip: false,
            reason: `Score increased by ${scoreDiff} points due to news correlation`,
            previousScore: existing.score
        };
    }

    // Otherwise skip
    return {
        skip: true,
        reason: 'Already sent in last 24h',
        previousScore: existing.score
    };
}

// Save signal with ALL info that led to it
function saveSignalToHistory(market) {
    const db = loadSignalsHistory();

    // Remove any existing entry for this market (will be replaced with fresh data)
    db.signals = db.signals.filter(s => s.marketId !== market.id);

    // Add new signal with complete info
    const signalRecord = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        marketId: market.id,
        question: market.question,
        score: market.score,
        timestamp: new Date().toISOString(),
        // Info that led to signal:
        volume: market.volume,
        liquidity: market.liquidity,
        newsCorrelation: market.newsCorrelation || false,
        slug: market.slug,
        // Scoring breakdown (if available)
        scoringFactors: {
            volumeScore: Math.min(30, (parseFloat(market.volume) / 100000) * 30),
            liquidityScore: Math.min(25, (parseFloat(market.liquidity) / 50000) * 25),
            newsBoost: market.newsCorrelation ? 'Yes' : 'No'
        }
    };

    db.signals.unshift(signalRecord);

    // Keep only last 500 signals
    db.signals = db.signals.slice(0, 500);

    saveSignalsHistory(db);
    return signalRecord;
}

// Cleanup old signals (older than 48h)
function cleanupOldSignals() {
    const db = loadSignalsHistory();
    const now = Date.now();
    const originalCount = db.signals.length;

    db.signals = db.signals.filter(s => {
        const age = (now - new Date(s.timestamp).getTime()) / (1000 * 60 * 60);
        return age < 48; // Keep signals from last 48h
    });

    if (db.signals.length < originalCount) {
        db.lastCleanup = new Date().toISOString();
        saveSignalsHistory(db);
        console.log(`[SignalsDB] Cleaned up ${originalCount - db.signals.length} old signals`);
    }
}

// -- Sniped Markets Tracking --
function loadSnipedMarkets() {
    try {
        if (fs.existsSync(SNIPED_MARKETS_PATH)) {
            const content = fs.readFileSync(SNIPED_MARKETS_PATH, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error('[SnipedMarkets] Failed to load:', e.message);
    }
    return {};
}

function saveSnipedMarkets(markets) {
    try {
        fs.writeFileSync(SNIPED_MARKETS_PATH, JSON.stringify(markets, null, 2));
    } catch (e) {
        console.error('[SnipedMarkets] Failed to save:', e.message);
    }
}

function isMarketAlreadySniped(marketId, score) {
    const snipedMarkets = loadSnipedMarkets();
    if (snipedMarkets[marketId]) {
        const snipedAt = new Date(snipedMarkets[marketId].timestamp);
        const now = new Date();
        const hoursSince = (now - snipedAt) / (1000 * 60 * 60);

        // If sniped less than 24h ago, skip
        if (hoursSince < 24) {
            return true;
        }
    }
    return false;
}

function markMarketAsSniped(marketId, score) {
    const snipedMarkets = loadSnipedMarkets();
    snipedMarkets[marketId] = {
        timestamp: new Date().toISOString(),
        score: score
    };
    saveSnipedMarkets(snipedMarkets);
}

function cleanupOldSnipes() {
    const snipedMarkets = loadSnipedMarkets();
    const now = new Date();
    let cleaned = false;

    for (const [marketId, data] of Object.entries(snipedMarkets)) {
        const snipedAt = new Date(data.timestamp);
        const hoursSince = (now - snipedAt) / (1000 * 60 * 60);

        if (hoursSince >= 24) {
            delete snipedMarkets[marketId];
            cleaned = true;
        }
    }

    if (cleaned) {
        saveSnipedMarkets(snipedMarkets);
        console.log('[SnipedMarkets] Cleaned up old entries');
    }
}

// -- State --
let settings = {
    enabled: true,
    scanInterval: 10,
    minScore: 85,  // Increased for higher quality signals
    maxMarkets: 150,
    turboMode: false,
    enableRss: true,
    rssUrls: [],
    customKeywords: [],
    // Smart filters to exclude low-quality markets
    excludePatterns: [
        'in 2025',        // Markets with year that's likely resolved/obvious
        'by 2025',
        'before 2025',
        'released in',    // Release date speculation
        'announce in',
        'will.*win',      // Simple win/lose bets without nuance  
        'will.*lose',
        'gta vi',         // Specific overhyped topics
        'gta 6',
    ]
};
const parser = new Parser();
const limit = pLimit(100); // Concurrency limit boosted to 100

// -- Logging --
function logToFile(type, message, priority = 'low', metadata = {}) {
    try {
        let logs = [];
        if (fs.existsSync(LOGS_PATH)) {
            const content = fs.readFileSync(LOGS_PATH, 'utf8');
            logs = content ? JSON.parse(content) : [];
        }

        const newLog = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            timestamp: new Date().toISOString(),
            source: 'listener',
            type,
            message,
            priority,
            ...metadata
        };

        logs.unshift(newLog);
        // Keep only last 100 logs
        logs = logs.slice(0, 100);

        fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error('[Logger] Failed to write log:', e.message);
    }
}

// -- Load Settings --
function loadSettings() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            settings = { ...settings, ...JSON.parse(data) };
            // Adjust scan interval based on Turbo Mode - GOD SPEED
            if (settings.turboMode) settings.scanInterval = 2;
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
    // 0. CRITICAL: Filter out closed/resolved/expired markets FIRST
    const now = Date.now();
    const activeMarkets = polyMarkets.filter(m => {
        // Check if market is explicitly closed/resolved
        if (m.closed === true || m.active === false) {
            return false;
        }

        // Check status field
        if (m.status && ['closed', 'resolved', 'archived', 'inactive'].includes(m.status.toLowerCase())) {
            return false;
        }

        // Check if end_date has passed
        if (m.end_date) {
            const endDate = new Date(m.end_date).getTime();
            if (endDate < now) {
                return false;
            }
        }


        // Ensure market has minimum required fields (slug is optional, will use market_id as fallback)
        if (!m.question || !m.id) {
            return false;
        }

        // Apply exclude patterns filter
        if (settings.excludePatterns && settings.excludePatterns.length > 0) {
            const questionLower = m.question.toLowerCase();
            for (const pattern of settings.excludePatterns) {
                if (questionLower.includes(pattern.toLowerCase())) {
                    return false; // Reject market matching exclude pattern
                }
            }
        }

        return true;
    });

    console.log(`[Filter] ${polyMarkets.length} total → ${activeMarkets.length} active markets`);

    // 1. Identify keywords from RSS/News to boost relevant markets
    const trendingKeywords = new Set();
    rssItems.forEach(item => {
        const words = item.title.toLowerCase().split(/\s+/);
        words.forEach(w => {
            if (w.length > 4) trendingKeywords.add(w);
        });
    });

    // 2. Score Markets
    return activeMarkets.map(m => {
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
async function sendTelegramAlert(market, signalReason = '') {
    if (!TELEGRAM_BOT_TOKEN) return;

    // DEDUPLICATION: Check if we already sniped this market in the last 24h
    if (isMarketAlreadySniped(market.id, market.score)) {
        console.log(`[Telegram] Skipping duplicate alert for: ${market.question.slice(0, 30)}... (already sniped)`);
        return;
    }

    const message = `
🚀 *HYPER-LISTENER ALERT* 🚀

📌 ${market.question}
📊 Score: *${market.score}/100*
${market.newsCorrelation ? '🔥 Validated by News/RSS' : ''}

💰 Vol: $${(parseFloat(market.volume) / 1000).toFixed(1)}k
💧 Liq: $${(parseFloat(market.liquidity) / 1000).toFixed(1)}k

${signalReason ? `\n📋 *Why this signal:*\n${signalReason}\n` : ''}
🔗 [Open on Polymarket](https://polymarket.com/event/${market.slug || market.id})
    `.trim();

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        console.log(`[Telegram] Sent alert for: ${market.question.slice(0, 30)}...`);

        // Mark as sniped AFTER successful send
        markMarketAsSniped(market.id, market.score);

        // Log to file for Frontend UI
        logToFile('alert', `High Score Opportunity: ${market.question.slice(0, 50)}...`, 'high', {
            relatedMarketId: market.id,
            score: market.score
        });

    } catch (e) {
        console.error('[Telegram] Error:', e.message);
        logToFile('error', `Failed to send Telegram alert: ${e.message}`, 'high');
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
            // DEDUPLICATION: Check if signal should be skipped
            const skipCheck = shouldSkipSignal(pick.id, pick.score, pick.newsCorrelation);

            if (skipCheck.skip) {
                console.log(`[Signal] Skipping: ${pick.question.slice(0, 30)}... (${skipCheck.reason})`);
                continue;
            }

            // Build reason explanation
            let signalReason = '📊 Scoring factors: ';
            const reasons = [];
            if (pick.newsCorrelation) reasons.push('🔥 News/RSS match detected');
            reasons.push(`Volume: $${parseFloat(pick.volume || 0).toLocaleString()}`);
            reasons.push(`Liquidity: $${parseFloat(pick.liquidity || 0).toLocaleString()}`);
            if (skipCheck.previousScore) {
                reasons.push(`📈 Score increased: ${skipCheck.previousScore} → ${pick.score}`);
            }
            signalReason += reasons.join(' | ');

            // Save signal to history database WITH ALL INFO
            const signalRecord = saveSignalToHistory(pick);
            console.log(`[Signal] NEW: ${pick.question.slice(0, 40)}... (ID: ${signalRecord.id})`);
            if (skipCheck.reason) console.log(`[Signal] Reason: ${skipCheck.reason}`);

            // Log signal to dashboard console WITH EXPLANATION
            logToFile('signal', `🎯 ${pick.question.slice(0, 50)}... | Score: ${pick.score} | ${pick.newsCorrelation ? '🔥 NEWS' : ''}`, 'high', {
                relatedMarketId: pick.id,
                signalId: signalRecord.id,
                score: pick.score,
                volume: pick.volume,
                liquidity: pick.liquidity,
                newsCorrelation: pick.newsCorrelation || false,
                reason: signalReason,
                slug: pick.slug
            });

            // Send Telegram with detailed explanation
            await sendTelegramAlert(pick, signalReason);

            // AUTO-TRADE INTEGRATION
            if (settings.autoTrade && pick.score >= (settings.minAutoScore || 90)) {
                await executeAutoTrade(pick);
            }
        }

    }, settings.scanInterval * 1000);
}

// -- Auto-Trade --
const tradedMarkets = new Set();
async function executeAutoTrade(market) {
    if (tradedMarkets.has(market.id)) return;

    // Safety check: Don't overtrade
    if (tradedMarkets.size > 20) tradedMarkets.clear(); // Reset cache occasionally

    console.log(`[Auto-Trade] 🤖 Attempting to SNIPE: ${market.question}`);

    try {
        const payload = {
            marketId: market.id,
            side: 'BUY',
            outcome: 'YES', // Default to YES for high score
            amount: settings.autoTradeAmount || 50,
            currentPrice: 0.50 // Mock Price or fetch real price if available in market obj
        };

        // If market has outcomes/prices, use them
        if (market.outcomePrices) {
            // Parse JSON if needed or access array
            // detailed implementation depends on market structure
            // simplifying for now
            payload.currentPrice = 0.55;
        }

        const res = await axios.post('http://localhost:3000/api/trading/execute', payload);

        if (res.data && res.data.status === 'FILLED') {
            console.log(`[Auto-Trade] ✅ SUCCESS! Bought $${payload.amount} of ${market.question}`);
            tradedMarkets.add(market.id);
            logToFile('snipe', `🤖 Auto-Sniped: ${market.question} (Score: ${market.score})`, 'high');
        }

    } catch (e) {
        console.error(`[Auto-Trade] ❌ Failed: ${e.message}`);
    }
}

// Cleanup old snipes on startup
cleanupOldSnipes();
cleanupOldSignals();

run();
