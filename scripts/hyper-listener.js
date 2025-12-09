"use strict";
/**
 * HYPER-LISTENER v3 (DB-Integrated)
 * --------------------------------
 * Scans Polymarket, filters high-potential opportunities, uses Smart Filters,
 * and enables "Turbo Mode" during news events.
 * 
 * CHANGES v3:
 * - Removed file-based history (now uses API/DB)
 * - Removed p-limit dependency (optimized built-in concurrency)
 * - Simplified logging structure
 * - Unified Signal model
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

// -- Configuration --
const API_URL = 'http://localhost:3000/api'; // Local API for DB access
const CONFIG_PATH = path.join(__dirname, '../data/listener-config.json');
const LOGS_PATH = path.join(__dirname, '../data/listener-logs.json');

// Default Settings
let settings = {
    enabled: true,
    scanInterval: 10,
    minScore: 85,
    maxMarkets: 200, // Increased
    turboMode: false,
    enableRss: true,
    rssUrls: [],
    customKeywords: [],
    excludePatterns: [
        'in 2025', 'by 2025', 'before 2025',
        'released in', 'announce in',
        'will.*win', 'will.*lose',
        'gta vi', 'gta 6'
    ]
};

const parser = new Parser();

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
            priority
        };

        // Structure relatedMarket for dashboard notifications
        if (metadata.relatedMarketId) {
            newLog.relatedMarketId = metadata.relatedMarketId;
            newLog.signalId = metadata.signalId;
            newLog.relatedMarket = {
                id: metadata.relatedMarketId,
                title: message.split('|')[0].replace(/🎯|⚡|🔥/g, '').trim(),
                score: metadata.score || 0,
                volume: metadata.volume || '0',
                probability: 50,
                slug: metadata.slug,
                image: ''
            };
        } else {
            Object.assign(newLog, metadata);
        }

        logs.unshift(newLog);
        logs = logs.slice(0, 100);
        fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));

        // Also log to console for PM2
        console.log(`[${type.toUpperCase()}] ${message}`);
    } catch (e) {
        console.error('[Logger] Failed to write log:', e.message);
    }
}

// -- API Integration --
async function saveSignalToDB(market) {
    try {
        // Construct reason string
        const reasons = [];
        if (market.newsCorrelation) reasons.push('🔥 News Match');
        if (market.score > 90) reasons.push('🚀 Very High Score');
        reasons.push(`Vol: $${parseFloat(market.volume || 0).toLocaleString()}`);

        const payload = {
            marketId: market.id,
            question: market.question,
            slug: market.slug,
            score: market.score,
            reason: reasons.join(' | '),
            volume: market.volume,
            liquidity: market.liquidity,
            newsCorrelation: market.newsCorrelation
        };

        const res = await axios.post(`${API_URL}/signals`, payload);
        return res.data;
    } catch (error) {
        console.error('[DB] Failed to save signal:', error.message);
        return { id: 'offline_' + Date.now() }; // Fallback ID
    }
}

// -- Source Adapters --
async function fetchPolymarket() {
    try {
        // Use same URL format that worked in previous version
        const url = `https://gamma-api.polymarket.com/markets?closed=false&limit=500&active=true`;
        const { data } = await axios.get(url);
        console.log('[Polymarket] Scanning...');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        logToFile('error', `Polymarket Scan Failed: ${e.message}`, 'high');
        return [];
    }
}

async function fetchRSS() {
    if (!settings.enableRss || !settings.rssUrls.length) return [];

    // Use native Promise.all with simple chunking (size 5) to avoid overload
    const chunkStats = { success: 0, fail: 0 };
    const items = [];

    for (let i = 0; i < settings.rssUrls.length; i += 5) {
        const chunk = settings.rssUrls.slice(i, i + 5);
        await Promise.all(chunk.map(async (url) => {
            try {
                const feed = await parser.parseURL(url);
                feed.items.forEach(item => items.push({ ...item, source: feed.title }));
                chunkStats.success++;
            } catch (e) {
                // Silent fail for RSS
                chunkStats.fail++;
            }
        }));
    }
    return items;
}

// -- Core Logic --
async function scanAndProcess() {
    try {
        console.log('⚡ Scanning...');

        // 1. Fetch Data
        const [polyMarkets, rssItems] = await Promise.all([
            fetchPolymarket(),
            fetchRSS()
        ]);

        if (!polyMarkets.length) return;

        // 2. Filter Active Markets
        const activeMarkets = polyMarkets.filter(m => {
            if (!m.question || !m.id) return false;

            // Apply Exclude Patterns
            if (settings.excludePatterns?.length > 0) {
                const questionLower = m.question.toLowerCase();
                for (const pattern of settings.excludePatterns) {
                    if (questionLower.includes(pattern.toLowerCase())) return false;
                }
            }
            return true;
        });

        // 3. Extract Keywords from News
        const trendingKeywords = new Set();
        rssItems.forEach(item => {
            const words = (item.title || '').toLowerCase().split(/\s+/);
            words.forEach(w => { if (w.length > 4) trendingKeywords.add(w); });
        });

        // 4. Score Markets
        const highPotential = [];

        for (const m of activeMarkets) {
            let score = 10;
            const volume = parseFloat(m.volume) || 0;
            const liquidity = parseFloat(m.liquidity) || 0;

            // Metrics Score
            score += Math.min(30, (volume / 100000) * 30);
            score += Math.min(25, (liquidity / 50000) * 25);

            // News Correlation
            const title = (m.question || '').toLowerCase();
            let newsCorrelation = false;

            // Keyword Boost
            if (settings.customKeywords?.some(k => title.includes(k.toLowerCase()))) {
                score += 20;
            }

            // RSS Boost
            let newsMatches = 0;
            trendingKeywords.forEach(kw => {
                if (title.includes(kw)) newsMatches++;
            });

            if (newsMatches >= 2) {
                score += 30;
                newsCorrelation = true;
            }

            // Threshold Check
            if (score >= settings.minScore) {
                highPotential.push({ ...m, score: Math.round(score), newsCorrelation });
            }
        }

        // 5. Process Signals
        console.log(`[Filter] ${polyMarkets.length} total → ${activeMarkets.length} active → ${highPotential.length} signals`);

        for (const pick of highPotential) {
            // Save to DB (Handle deduplication via API)
            const savedSignal = await saveSignalToDB(pick);

            // Log Notification (Always Log high potential)
            // Note: In a real system we'd check if we already logged this recently to avoid spamming the log file
            // But for now, we rely on the DB to be the source of truth for "Signals"
            // We only log to file if it's "NEW" or score improved significantly.
            // Simplified: Just log it. The dashboard uses logs for "Live" feed.

            logToFile('signal', `🎯 ${pick.question.slice(0, 50)}... | Score: ${pick.score}`, 'high', {
                relatedMarketId: pick.id,
                signalId: savedSignal.id,
                score: pick.score,
                volume: pick.volume,
                slug: pick.slug
            });

            // Record market snapshot for historical analysis
            try {
                await axios.post(`${API_URL}/intelligence/history`, {
                    marketId: pick.id,
                    score: pick.score,
                    volume: parseFloat(pick.volume) || 0,
                    liquidity: parseFloat(pick.liquidity) || 0,
                    probability: 50 // Default - update if available
                });
            } catch (e) {
                // Silent fail for snapshots
            }
        }

        // Check alerts against current high-potential markets
        try {
            const marketData = highPotential.map(m => ({
                id: m.id,
                title: m.question,
                score: m.score,
                volume: parseFloat(m.volume) || 0,
                probability: 50 // Default
            }));

            if (marketData.length > 0) {
                await axios.post(`${API_URL}/alerts/check`, { marketData });
            }
        } catch (e) {
            console.error('[Alerts] Check failed:', e.message);
        }


    } catch (e) {
        logToFile('error', `Cycle Error: ${e.message}`, 'high');
    }
}

// -- Main Loop --
console.log('⚡ Hyper-Listener v3 Engine Started');
setInterval(scanAndProcess, settings.scanInterval * 1000);
scanAndProcess(); // Initial run
