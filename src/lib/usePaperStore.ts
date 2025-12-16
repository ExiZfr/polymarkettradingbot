'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { paperStore, PaperOrder, PaperProfile, PaperStats } from './paper-trading';

/**
 * Custom hook to subscribe to paperStore changes
 * Triggers re-render when paperStore updates
 */
export function usePaperStore() {
    const [updateCount, setUpdateCount] = useState(0);

    useEffect(() => {
        const handleUpdate = () => {
            setUpdateCount(c => c + 1);
        };

        // Listen for paper-update events
        window.addEventListener('paper-update', handleUpdate);
        window.addEventListener('storage', handleUpdate); // For cross-tab sync

        return () => {
            window.removeEventListener('paper-update', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    // These will be recalculated on every update
    const profile = paperStore.getActiveProfile();
    const orders = paperStore.getAllOrders();
    const openOrders = orders.filter(o => o.status === 'OPEN');
    const closedOrders = orders.filter(o => o.status === 'CLOSED');
    const stats = paperStore.getStats();

    // Calculate unrealized P&L from open orders
    const unrealizedPnL = openOrders.reduce((sum, o) => {
        if (o.currentPrice !== undefined) {
            const pnl = (o.currentPrice - o.entryPrice) * o.shares;
            return sum + pnl;
        }
        return sum;
    }, 0);

    // Calculate realized P&L from closed orders
    const realizedPnL = closedOrders.reduce((sum, o) => sum + (o.pnl || 0), 0);

    return {
        profile,
        orders,
        openOrders,
        closedOrders,
        stats,
        unrealizedPnL,
        realizedPnL,
        totalPnL: realizedPnL + unrealizedPnL,
        updateCount, // Can be used to force re-render
        refresh: () => setUpdateCount(c => c + 1),
    };
}

/**
 * Hook for live price updates with polling
 */
export function useLivePrices(marketIds: string[], enabled: boolean = true) {
    const [prices, setPrices] = useState<Record<string, { yes: number; no: number }>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrices = useCallback(async () => {
        if (!enabled || marketIds.length === 0) return;

        setLoading(true);
        try {
            // Batch fetch prices
            const uniqueIds = [...new Set(marketIds)].filter(Boolean);
            if (uniqueIds.length === 0) return;

            const response = await fetch('/api/prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marketIds: uniqueIds }),
            });

            if (response.ok) {
                const data = await response.json();
                setPrices(data.prices || {});
                setError(null);
            }
        } catch (e) {
            setError('Failed to fetch prices');
        } finally {
            setLoading(false);
        }
    }, [marketIds.join(','), enabled]);

    useEffect(() => {
        fetchPrices();

        // Poll every 10 seconds
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, [fetchPrices]);

    return { prices, loading, error, refresh: fetchPrices };
}

/**
 * Combined hook for orders page with live P&L
 */
export function useOrdersWithLivePnL() {
    const store = usePaperStore();
    const marketIds = store.openOrders.map(o => o.marketId);
    const { prices, loading: pricesLoading } = useLivePrices(marketIds);

    // Update orders with live prices and calculate P&L
    const ordersWithLivePnL = store.orders.map(order => {
        if (order.status !== 'OPEN') return order;

        const priceData = prices[order.marketId];
        if (!priceData) return order;

        const currentPrice = order.outcome === 'YES' ? priceData.yes : priceData.no;
        const pnlPerShare = currentPrice - order.entryPrice;
        const livePnL = pnlPerShare * order.shares;
        const roi = order.entryPrice > 0 ? (pnlPerShare / order.entryPrice) * 100 : 0;

        return {
            ...order,
            currentPrice,
            pnl: livePnL,
            roi,
        };
    });

    // Recalculate totals
    const openWithPnL = ordersWithLivePnL.filter(o => o.status === 'OPEN');
    const liveUnrealizedPnL = openWithPnL.reduce((sum, o) => sum + (o.pnl || 0), 0);

    return {
        ...store,
        orders: ordersWithLivePnL,
        openOrders: openWithPnL,
        unrealizedPnL: liveUnrealizedPnL,
        totalPnL: store.realizedPnL + liveUnrealizedPnL,
        pricesLoading,
    };
}
