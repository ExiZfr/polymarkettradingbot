"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ProcessedMarket } from '@/lib/polymarket';
import { SnipabilityScore } from '@/lib/snipability-algo';

// --- Types ---

export type MarketData = {
    market: ProcessedMarket;
    analysis: SnipabilityScore;
};

export type Alert = {
    id: string;
    userId: number;
    name: string;
    type: 'PRICE_THRESHOLD' | 'VOLUME_SPIKE' | 'KEYWORD' | 'SCORE_TRIGGER' | 'WALLET_ACTIVITY';
    isActive: boolean;
    conditions: Record<string, any>;
    telegramEnabled: boolean;
    emailEnabled: boolean;
    webEnabled: boolean;
    triggeredCount: number;
    lastTriggered?: Date;
    createdAt: Date;
    updatedAt: Date;
};

export type MarketSnapshot = {
    id: string;
    marketId: string;
    score: number;
    volume: number;
    liquidity: number;
    probability: number;
    timestamp: Date;
};

export type IntelligenceStats = {
    activeAlerts: number;
    marketsTracked: number;
    signalsToday: number;
    alertsTriggeredToday: number;
};

// --- Context ---

type MarketIntelligenceContextType = {
    // Alerts
    alerts: Alert[];
    createAlert: (config: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount' | 'lastTriggered'>) => Promise<Alert>;
    updateAlert: (id: string, changes: Partial<Alert>) => Promise<Alert>;
    deleteAlert: (id: string) => Promise<void>;
    toggleAlertActive: (id: string) => Promise<void>;

    // Market History
    getMarketHistory: (marketId: string, period: '1h' | '24h' | '7d' | '30d') => Promise<MarketSnapshot[]>;

    // Stats
    stats: IntelligenceStats;

    // State
    isLoading: boolean;
    refreshAlerts: () => Promise<void>;
};

const MarketIntelligenceContext = createContext<MarketIntelligenceContextType | undefined>(undefined);

// --- Provider ---

export function MarketIntelligenceProvider({
    children,
    userId
}: {
    children: React.ReactNode;
    userId?: number;
}) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<IntelligenceStats>({
        activeAlerts: 0,
        marketsTracked: 0,
        signalsToday: 0,
        alertsTriggeredToday: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

    // Fetch alerts on mount
    const refreshAlerts = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/alerts?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);

                // Calculate stats
                const activeCount = data.filter((a: Alert) => a.isActive).length;
                const triggeredToday = data.filter((a: Alert) => {
                    if (!a.lastTriggered) return false;
                    const lastTrig = new Date(a.lastTriggered);
                    const dayAgo = new Date();
                    dayAgo.setDate(dayAgo.getDate() - 1);
                    return lastTrig > dayAgo;
                }).length;

                setStats(prev => ({
                    ...prev,
                    activeAlerts: activeCount,
                    alertsTriggeredToday: triggeredToday,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        refreshAlerts();
    }, [refreshAlerts]);

    // Alert Actions
    const createAlert = useCallback(async (config: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount' | 'lastTriggered'>) => {
        const res = await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });

        if (!res.ok) throw new Error('Failed to create alert');

        const newAlert = await res.json();
        setAlerts(prev => [newAlert, ...prev]);
        return newAlert;
    }, []);

    const updateAlert = useCallback(async (id: string, changes: Partial<Alert>) => {
        const res = await fetch(`/api/alerts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes),
        });

        if (!res.ok) throw new Error('Failed to update alert');

        const updatedAlert = await res.json();
        setAlerts(prev => prev.map(a => a.id === id ? updatedAlert : a));
        return updatedAlert;
    }, []);

    const deleteAlert = useCallback(async (id: string) => {
        const res = await fetch(`/api/alerts/${id}`, {
            method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete alert');

        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const toggleAlertActive = useCallback(async (id: string) => {
        const alert = alerts.find(a => a.id === id);
        if (!alert) throw new Error('Alert not found');

        await updateAlert(id, { isActive: !alert.isActive });
    }, [alerts, updateAlert]);

    // Market History
    const getMarketHistory = useCallback(async (marketId: string, period: '1h' | '24h' | '7d' | '30d') => {
        const res = await fetch(`/api/intelligence/history?marketId=${marketId}&period=${period}`);
        if (!res.ok) throw new Error('Failed to fetch market history');

        return await res.json();
    }, []);

    return (
        <MarketIntelligenceContext.Provider value={{
            alerts,
            createAlert,
            updateAlert,
            deleteAlert,
            toggleAlertActive,
            getMarketHistory,
            stats,
            isLoading,
            refreshAlerts,
        }}>
            {children}
        </MarketIntelligenceContext.Provider>
    );
}

export const useMarketIntelligence = () => {
    const context = useContext(MarketIntelligenceContext);
    if (!context) throw new Error("useMarketIntelligence must be used within MarketIntelligenceProvider");
    return context;
};
