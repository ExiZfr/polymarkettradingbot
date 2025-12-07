/**
 * Listener Service
 * Real-time monitoring of news, tweets, and events for tracked markets
 */

import { ProcessedMarket } from './polymarket';
import { SnipabilityScore } from './snipability-algo';

export interface ListenerSignal {
    marketId: string;
    type: 'tweet' | 'news' | 'rss' | 'event';
    source: string;
    title: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number; // 0-100
    timestamp: Date;
    url?: string;
}

export interface ListenerStatus {
    isRunning: boolean;
    marketsTracked: number;
    signalsDetected: number;
    lastUpdate: Date;
}

/**
 * Listener Service - Monitors external sources for market-relevant information
 */
class ListenerService {
    private trackedMarkets: Map<string, { market: ProcessedMarket; isFavorite: boolean }> = new Map();
    private signals: Map<string, ListenerSignal[]> = new Map(); // marketId -> signals
    private isRunning: boolean = false;
    private updateInterval: NodeJS.Timeout | null = null;

    /**
     * Start the listener
     */
    start() {
        if (this.isRunning) return;

        console.log('[Listener] Starting real-time monitoring...');
        this.isRunning = true;

        // Poll every 30 seconds
        this.updateInterval = setInterval(() => {
            this.scanSources();
        }, 30000);

        // Initial scan
        this.scanSources();
    }

    /**
     * Stop the listener
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('[Listener] Stopped.');
    }

    /**
     * Track a new market
     */
    trackMarket(market: ProcessedMarket, isFavorite: boolean = false) {
        this.trackedMarkets.set(market.id, { market, isFavorite });
        console.log(`[Listener] Now tracking: ${market.title} (Favorite: ${isFavorite})`);
    }

    /**
     * Untrack a market
     */
    untrackMarket(marketId: string) {
        this.trackedMarkets.delete(marketId);
        this.signals.delete(marketId);
    }

    /**
     * Toggle favorite status (favorites get priority)
     */
    toggleFavorite(marketId: string) {
        const tracked = this.trackedMarkets.get(marketId);
        if (tracked) {
            tracked.isFavorite = !tracked.isFavorite;
            console.log(`[Listener] ${tracked.market.title} favorite: ${tracked.isFavorite}`);
        }
    }

    /**
     * Get signals for a specific market
     */
    getSignals(marketId: string): ListenerSignal[] {
        return this.signals.get(marketId) || [];
    }

    /**
     * Get listener status
     */
    getStatus(): ListenerStatus {
        return {
            isRunning: this.isRunning,
            marketsTracked: this.trackedMarkets.size,
            signalsDetected: Array.from(this.signals.values()).reduce((sum, arr) => sum + arr.length, 0),
            lastUpdate: new Date()
        };
    }

    /**
     * Scan all sources for relevant information
     * In production, this would call real APIs (Twitter, RSS, News APIs)
     */
    private async scanSources() {
        if (!this.isRunning) return;

        // Prioritize favorites
        const favorites = Array.from(this.trackedMarkets.values())
            .filter(t => t.isFavorite)
            .map(t => t.market);

        const nonFavorites = Array.from(this.trackedMarkets.values())
            .filter(t => !t.isFavorite)
            .map(t => t.market);

        // Scan favorites first (more frequent updates)
        for (const market of favorites) {
            await this.scanMarket(market, true);
        }

        // Then scan non-favorites (with rate limiting)
        for (const market of nonFavorites.slice(0, 10)) { // Limit to 10 non-favorites per scan
            await this.scanMarket(market, false);
        }
    }

    /**
     * Scan a specific market for news/signals
     */
    private async scanMarket(market: ProcessedMarket, isPriority: boolean) {
        try {
            // In production, integrate:
            // - Twitter API v2 (search tweets related to market keywords)
            // - NewsAPI.org (fetch recent articles)
            // - RSS feeds (Polymarket official, Bloomberg, Reuters)
            // - Reddit API (r/Polymarket, r/CryptoCurrency)

            // For now, simulate signal detection
            const keywords = this.extractKeywords(market.title);
            const signals = await this.mockSignalDetection(market.id, keywords, isPriority);

            if (signals.length > 0) {
                const existing = this.signals.get(market.id) || [];
                this.signals.set(market.id, [...existing, ...signals].slice(-20)); // Keep last 20 signals
                console.log(`[Listener] 🔔 ${signals.length} new signal(s) for "${market.title}"`);
            }
        } catch (error) {
            console.error(`[Listener] Error scanning market ${market.id}:`, error);
        }
    }

    /**
     * Extract keywords from market title for search
     */
    private extractKeywords(title: string): string[] {
        const stopWords = ['will', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'on', 'at', 'by'];
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3 && !stopWords.includes(word));
    }

    /**
     * Mock signal detection (placeholder for real API calls)
     * In production, replace with actual Twitter/News API calls
     */
    private async mockSignalDetection(marketId: string, keywords: string[], isPriority: boolean): Promise<ListenerSignal[]> {
        // Simulate occasional signal detection
        const shouldDetect = Math.random() < (isPriority ? 0.3 : 0.1);

        if (!shouldDetect) return [];

        const signalTypes: Array<'tweet' | 'news' | 'rss' | 'event'> = ['tweet', 'news', 'rss', 'event'];
        const sentiments: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];

        return [{
            marketId,
            type: signalTypes[Math.floor(Math.random() * signalTypes.length)],
            source: Math.random() > 0.5 ? '@elonmusk' : 'Bloomberg',
            title: `Breaking: New development regarding ${keywords[0]}`,
            content: `Recent reports suggest significant movement in ${keywords.join(', ')} sector. Monitor closely.`,
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            relevance: Math.floor(Math.random() * 30) + 70, // 70-100
            timestamp: new Date(),
            url: 'https://twitter.com/example'
        }];
    }
}

// Singleton instance
export const listener = new ListenerService();
