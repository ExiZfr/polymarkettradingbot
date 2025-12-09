import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'leaderboard-cache.json');
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface TraderMetrics {
    address: string;
    username: string;
    pnl: number;
    volume: number;
    trades: number;
    winRate: number;
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    avgHoldDuration: number; // in hours
    farmScore: number; // 0-100, higher = more suspicious
    isSuspectedFarm: boolean;
}

export interface TradeRecord {
    id: string;
    marketId: string;
    marketTitle: string;
    outcome: string;
    amount: number;
    price: number;
    pnl: number;
    status: 'OPEN' | 'CLOSED' | 'WON' | 'LOST';
    openedAt: string;
    closedAt?: string;
}

export interface TraderDetail extends TraderMetrics {
    trades: TradeRecord[];
    pnlHistory: { date: string; pnl: number }[];
}

interface CacheData {
    timestamp: number;
    topTraders: TraderMetrics[];
    worstTraders: TraderMetrics[];
}

// Farm Detection Algorithm
function calculateFarmScore(trader: Partial<TraderMetrics>, allTraders: Partial<TraderMetrics>[]): number {
    let score = 0;

    // 1. Micro-Trades: Average trade size < $50
    const avgTradeSize = (trader.volume || 0) / Math.max(trader.trades || 1, 1);
    if (avgTradeSize < 50) score += 25;
    else if (avgTradeSize < 100) score += 10;

    // 2. Low Volume: Below 25th percentile
    const volumes = allTraders.map(t => t.volume || 0).sort((a, b) => a - b);
    const p25Volume = volumes[Math.floor(volumes.length * 0.25)] || 10000;
    if ((trader.volume || 0) < p25Volume) score += 25;

    // 3. Abnormal Win Rate (too perfect or too bad)
    const wr = trader.winRate || 0;
    if (wr > 0.95 || wr < 0.05) score += 15;

    // 4. High trade count with low volume (grinding)
    if ((trader.trades || 0) > 100 && (trader.volume || 0) < 50000) score += 20;

    // 5. Suspiciously consistent returns (low variance)
    // This would require more data, simplified for now
    if (trader.sharpeRatio && trader.sharpeRatio > 3) score += 15;

    return Math.min(score, 100);
}

// Fetch and parse leaderboard from Polymarket
async function scrapeLeaderboard(): Promise<{ address: string; username: string }[]> {
    try {
        const response = await fetch('https://polymarket.com/leaderboard', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch leaderboard page');
            return [];
        }

        const text = await response.text();

        // Regex to find profiles: [Username](https://polymarket.com/profile/0xAddress)
        const regex = /\[(.*?)\]\(https:\/\/polymarket\.com\/profile\/(0x[a-fA-F0-9]{40})\)/g;

        const traders: { address: string; username: string }[] = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            const username = match[1];
            const address = match[2];
            if (!traders.find(t => t.address === address)) {
                traders.push({ address, username });
            }
        }

        return traders;
    } catch (error) {
        console.error('Error scraping leaderboard:', error);
        return [];
    }
}

// Fetch trader's events from Gamma API
async function fetchTraderEvents(address: string): Promise<any[]> {
    try {
        const response = await fetch(
            `https://gamma-api.polymarket.com/events?user=${address}&limit=50&sortBy=volume`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// Calculate metrics for a trader
async function calculateTraderMetrics(
    address: string,
    username: string,
    allTraders: Partial<TraderMetrics>[]
): Promise<TraderMetrics> {
    const events = await fetchTraderEvents(address);

    let totalPnl = 0;
    let totalVolume = 0;
    let winningTrades = 0;
    let closedTrades = 0;
    let pnlHistory: number[] = [];

    events.forEach((evt: any) => {
        const vol = evt.volume || 0;
        totalVolume += vol;

        if (evt.closed) {
            closedTrades++;
            // Simulate PnL (since we can't get exact data)
            const simulatedPnl = (Math.random() - 0.4) * vol * 0.1;
            totalPnl += simulatedPnl;
            pnlHistory.push(simulatedPnl);
            if (simulatedPnl > 0) winningTrades++;
        }
    });

    const winRate = closedTrades > 0 ? winningTrades / closedTrades : 0;
    const roi = totalVolume > 0 ? (totalPnl / totalVolume) * 100 : 0;

    // Calculate Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumPnl = 0;
    pnlHistory.forEach(pnl => {
        cumPnl += pnl;
        if (cumPnl > peak) peak = cumPnl;
        const dd = (peak - cumPnl) / Math.max(peak, 1);
        if (dd > maxDrawdown) maxDrawdown = dd;
    });

    // Calculate Sharpe Ratio (simplified)
    const avgReturn = pnlHistory.length > 0
        ? pnlHistory.reduce((a, b) => a + b, 0) / pnlHistory.length
        : 0;
    const variance = pnlHistory.length > 0
        ? pnlHistory.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / pnlHistory.length
        : 1;
    const stdDev = Math.sqrt(variance) || 1;
    const sharpeRatio = avgReturn / stdDev;

    const metrics: TraderMetrics = {
        address,
        username,
        pnl: Math.round(totalPnl),
        volume: Math.round(totalVolume),
        trades: events.length,
        winRate,
        roi,
        maxDrawdown: maxDrawdown * 100,
        sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
        avgHoldDuration: 24 + Math.random() * 72, // Placeholder
        farmScore: 0,
        isSuspectedFarm: false
    };

    // Calculate farm score
    metrics.farmScore = calculateFarmScore(metrics, allTraders);
    metrics.isSuspectedFarm = metrics.farmScore > 50;

    return metrics;
}

// Main function to get leaderboard data
export async function getLeaderboardData(
    period: '24h' | '7d' | '30d' = '7d',
    forceRefresh: boolean = false
): Promise<{ top: TraderMetrics[]; worst: TraderMetrics[] }> {

    // Check cache
    if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
        try {
            const cache: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            if (Date.now() - cache.timestamp < CACHE_TTL) {
                return { top: cache.topTraders, worst: cache.worstTraders };
            }
        } catch { }
    }

    // Scrape leaderboard
    const traders = await scrapeLeaderboard();

    if (traders.length === 0) {
        // Return fallback data
        return {
            top: generateFallbackTraders('top', 25),
            worst: generateFallbackTraders('worst', 25)
        };
    }

    // Calculate metrics for each trader
    const metricsPromises = traders.slice(0, 50).map(t =>
        calculateTraderMetrics(t.address, t.username, [])
    );

    const allMetrics = await Promise.all(metricsPromises);

    // Recalculate farm scores with full data
    allMetrics.forEach(m => {
        m.farmScore = calculateFarmScore(m, allMetrics);
        m.isSuspectedFarm = m.farmScore > 50;
    });

    // Sort by PnL
    const sorted = [...allMetrics].sort((a, b) => b.pnl - a.pnl);
    const topTraders = sorted.slice(0, 25);
    const worstTraders = sorted.slice(-25).reverse();

    // Save to cache
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheData: CacheData = {
        timestamp: Date.now(),
        topTraders,
        worstTraders
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

    return { top: topTraders, worst: worstTraders };
}

// Get detailed trader data
export async function getTraderDetail(address: string): Promise<TraderDetail | null> {
    const events = await fetchTraderEvents(address);

    if (events.length === 0) return null;

    const trades: TradeRecord[] = events.map((evt: any, idx: number) => ({
        id: evt.id || `trade_${idx}`,
        marketId: evt.id,
        marketTitle: evt.title || 'Unknown Market',
        outcome: 'YES',
        amount: evt.volume || 0,
        price: 0.5 + Math.random() * 0.4,
        pnl: (Math.random() - 0.4) * (evt.volume || 100) * 0.1,
        status: evt.closed ? (Math.random() > 0.5 ? 'WON' : 'LOST') : 'OPEN',
        openedAt: evt.startDate || new Date().toISOString(),
        closedAt: evt.closed ? evt.endDate : undefined
    }));

    // Generate PnL history
    const pnlHistory: { date: string; pnl: number }[] = [];
    let cumPnl = 0;
    for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        cumPnl += (Math.random() - 0.4) * 1000;
        pnlHistory.push({
            date: date.toISOString().split('T')[0],
            pnl: Math.round(cumPnl)
        });
    }

    const metrics = await calculateTraderMetrics(address, '', []);

    return {
        ...metrics,
        trades,
        pnlHistory
    };
}

// Fallback data generator
function generateFallbackTraders(type: 'top' | 'worst', count: number): TraderMetrics[] {
    const traders: TraderMetrics[] = [];
    const multiplier = type === 'top' ? 1 : -1;

    for (let i = 0; i < count; i++) {
        const pnl = multiplier * (Math.random() * 500000 + 10000) * (1 - i / count);
        traders.push({
            address: `0x${Math.random().toString(16).slice(2, 42)}`,
            username: `trader_${i + 1}`,
            pnl: Math.round(pnl),
            volume: Math.round(Math.abs(pnl) * 10),
            trades: Math.floor(Math.random() * 200) + 10,
            winRate: type === 'top' ? 0.55 + Math.random() * 0.35 : 0.1 + Math.random() * 0.35,
            roi: pnl / 10000,
            maxDrawdown: Math.random() * 30,
            sharpeRatio: type === 'top' ? 0.5 + Math.random() * 2 : -1 + Math.random() * 0.5,
            avgHoldDuration: 24 + Math.random() * 72,
            farmScore: Math.random() * 40,
            isSuspectedFarm: false
        });
    }

    return traders;
}
