'use client';

import { useEffect, useRef, useCallback } from 'react';
import { paperStore } from './paper-trading';

/**
 * Hook to automatically process paper orders from the Oracle queue
 * 
 * This runs in the background and:
 * 1. Polls the /api/paper-orders/queue endpoint
 * 2. Fetches any unprocessed orders
 * 3. Adds them to paperStore
 * 4. Marks them as processed
 * 
 * Works even when the user is not on the Oracle page!
 */

interface QueuedOrder {
    id: string;
    timestamp: string;
    marketId: string;
    marketTitle: string;
    marketSlug?: string;
    marketUrl?: string;
    marketImage?: string;
    type: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    entryPrice: number;
    amount: number;
    source: string;
    notes?: string;
    processed: boolean;
}

export function useOracleAutoTrader(enabled: boolean = true, pollInterval: number = 5000) {
    const isProcessing = useRef(false);
    const lastProcessed = useRef<Set<string>>(new Set());

    const processQueue = useCallback(async () => {
        if (isProcessing.current || !enabled) return;

        isProcessing.current = true;

        try {
            // Fetch unprocessed orders from queue
            const response = await fetch('/api/paper-orders/queue');
            if (!response.ok) {
                console.warn('[OracleAutoTrader] Failed to fetch queue');
                return;
            }

            const data = await response.json();
            const orders: QueuedOrder[] = data.orders || [];

            if (orders.length === 0) return;

            console.log(`[OracleAutoTrader] Processing ${orders.length} queued orders`);

            const processedIds: string[] = [];

            for (const order of orders) {
                // Skip if already processed locally
                if (lastProcessed.current.has(order.id)) continue;

                try {
                    // Add order to paperStore
                    const paperOrder = paperStore.placeOrder({
                        marketId: order.marketId,
                        marketTitle: order.marketTitle,
                        marketSlug: order.marketSlug,
                        marketUrl: order.marketUrl,
                        marketImage: order.marketImage,
                        type: order.type,
                        outcome: order.outcome,
                        entryPrice: order.entryPrice,
                        amount: order.amount,
                        source: 'MEAN_REVERSION',
                        notes: order.notes
                    });

                    if (paperOrder) {
                        console.log(`[OracleAutoTrader] Order placed: ${paperOrder.id} - ${order.marketTitle}`);
                        processedIds.push(order.id);
                        lastProcessed.current.add(order.id);
                    }
                } catch (e) {
                    console.error(`[OracleAutoTrader] Failed to place order ${order.id}:`, e);
                }
            }

            // Mark orders as processed on server
            if (processedIds.length > 0) {
                await fetch('/api/paper-orders/queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderIds: processedIds })
                });

                console.log(`[OracleAutoTrader] Marked ${processedIds.length} orders as processed`);
            }

        } catch (error) {
            console.error('[OracleAutoTrader] Error:', error);
        } finally {
            isProcessing.current = false;
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        // Initial process
        processQueue();

        // Poll for new orders
        const interval = setInterval(processQueue, pollInterval);

        return () => clearInterval(interval);
    }, [enabled, pollInterval, processQueue]);

    return { processQueue };
}
