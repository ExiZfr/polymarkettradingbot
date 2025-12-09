"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { fetchPolymarketMarkets, ProcessedMarket } from '@/lib/polymarket';
import { calculateSnipability, EventType, UrgencyLevel, SnipabilityScore } from '@/lib/snipability-algo';
import { filterSnipableMarkets } from '@/lib/dynamic-filter';

// --- Types ---

export type MarketData = {
    market: ProcessedMarket;
    analysis: SnipabilityScore;
};

export type LogType = 'info' | 'signal' | 'alert' | 'error' | 'success';
export type SourceType = 'twitter' | 'rss' | 'reddit' | 'news' | 'telegram' | 'polymarket';

export type ListenerLog = {
    id: string;
    timestamp: Date;
    source: SourceType;
    type: LogType;
    message: string;
    priority: 'low' | 'medium' | 'high';
    relatedMarketId?: string;
    // Enhanced: Include market data for direct display
    relatedMarket?: {
        id: string;
        title: string;
        image: string;
        score: number;
        probability: number;
        volume: string;
    };
};

type RadarContextType = {
    // Data
    markets: MarketData[];
    logs: ListenerLog[];
    favorites: Set<string>; // Set of Market IDs

    // Status
    isLoading: boolean;
    lastUpdated: Date | null;

    // Actions
    toggleFavorite: (marketId: string) => void;
    refreshMarkets: () => Promise<void>;
    clearLogs: () => void;
};

const RadarContext = createContext<RadarContextType | undefined>(undefined);

// --- Dummy Data Generator for Listener ---
const MOCK_SOURCES: SourceType[] = ['twitter', 'reddit', 'news', 'polymarket'];
const KEYWORDS = ['Trump', 'Biden', 'Crypto', 'Rate Cut', 'Inflation', 'SpaceX', 'ETF', 'Regulation'];

// --- Provider ---

export function RadarProvider({ children }: { children: React.ReactNode }) {
    const [markets, setMarkets] = useState<MarketData[]>([]);
    const [logs, setLogs] = useState<ListenerLog[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Load favorites from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('polybot_favorites');
        if (saved) {
            try {
                setFavorites(new Set(JSON.parse(saved)));
            } catch (e) { console.error('Error loading favorites', e); }
        }
    }, []);

    // Save favorites whenever they change
    useEffect(() => {
        const array = Array.from(favorites);
        localStorage.setItem('polybot_favorites', JSON.stringify(array));
    }, [favorites]);

    // --- Core Market Loop ---
    const refreshMarkets = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch
            const raw = await fetchPolymarketMarkets();

            // 2. Analyze & Score
            const analyzed: MarketData[] = raw.map(m => ({
                market: m,
                analysis: calculateSnipability(m)
            }));

            // 3. Filter (Show more diverse markets - very inclusive)
            const viable = analyzed
                .filter(m => m.analysis.score >= 15) // Very low threshold for maximum variety
                .sort((a, b) => b.analysis.score - a.analysis.score)
                .slice(0, 150); // Top 150 markets

            setMarkets(viable);
            setLastUpdated(new Date());

            // 5. Generate a "Scan Complete" log
            addLog({
                source: 'polymarket',
                type: 'info',
                message: `Scan complete: ${viable.length} opportunities found.`,
                priority: 'low'
            });

        } catch (err) {
            console.error("Radar Loop Error:", err);
            addLog({
                source: 'polymarket',
                type: 'error',
                message: 'Failed to fetch market data.',
                priority: 'high'
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Listener Simulation Loop ---
    const addLog = (log: Omit<ListenerLog, 'id' | 'timestamp'>) => {
        const newLog: ListenerLog = {
            ...log,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
        };
        setLogs(prev => [newLog, ...prev].slice(0, 500)); // Keep last 500
    };

    // Background Loops
    useEffect(() => {
        // Initial fetch
        refreshMarkets();

        // Market Loop (Every 60s)
        const marketInterval = setInterval(refreshMarkets, 60000);

        // Listener Loop (Simulated - links to real markets when signals detected)
        const listenerInterval = setInterval(() => {
            // 70% chance to generate activity every 3 seconds
            if (Math.random() > 0.3) {
                const isSignal = Math.random() > 0.75;
                const source = MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)];
                const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

                if (isSignal && markets.length > 0) {
                    // Find a matching market based on keyword
                    const matchingMarket = markets.find(m =>
                        m.market.title.toLowerCase().includes(keyword.toLowerCase()) ||
                        m.market.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))
                    ) || markets[Math.floor(Math.random() * markets.length)]; // Fallback to random market

                    addLog({
                        source,
                        type: 'signal',
                        message: `🔥 Volume spike detected: "${matchingMarket.market.title.slice(0, 50)}..."`,
                        priority: 'high',
                        relatedMarketId: matchingMarket.market.id,
                        relatedMarket: {
                            id: matchingMarket.market.id,
                            title: matchingMarket.market.title,
                            image: matchingMarket.market.image,
                            score: matchingMarket.analysis.score,
                            probability: matchingMarket.market.probability,
                            volume: matchingMarket.market.volume
                        }
                    });
                } else {
                    // Regular info log without market link
                    addLog({
                        source,
                        type: 'info',
                        message: `Monitoring discussions: ${keyword}...`,
                        priority: 'low'
                    });
                }
            }
        }, 4000);

        return () => {
            clearInterval(marketInterval);
            clearInterval(listenerInterval);
        };
    }, [refreshMarkets]);

    // Actions
    const toggleFavorite = (id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearLogs = () => setLogs([]);

    return (
        <RadarContext.Provider value={{
            markets,
            logs,
            favorites,
            isLoading,
            lastUpdated,
            toggleFavorite,
            refreshMarkets,
            clearLogs
        }}>
            {children}
        </RadarContext.Provider>
    );
}

export const useRadar = () => {
    const context = useContext(RadarContext);
    if (!context) throw new Error("useRadar must be used within RadarProvider");
    return context;
};
