"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MiniPriceChartProps {
    marketId: string;
    entryPrice: number;
    outcome: 'YES' | 'NO';
    className?: string;
}

interface PricePoint {
    timestamp: number;
    price: number;
}

export default function MiniPriceChart({ marketId, entryPrice, outcome, className = '' }: MiniPriceChartProps) {
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`/api/prices/history?id=${marketId}&outcome=${outcome}&interval=day&fidelity=60`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.history && data.history.length > 0) {
                        setHistory(data.history.slice(-24)); // Last 24 points
                        setCurrentPrice(data.history[data.history.length - 1]?.price || null);
                    }
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error('Failed to fetch price history:', e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [marketId, outcome]); // Added outcome to dependency array for completeness

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${className} bg-white/5 animate-pulse rounded-xl`}>
                <span className="text-xs text-white/30 font-medium">Loading Chart...</span>
            </div>
        );
    }

    if (error || history.length < 2) {
        return (
            <div className={`flex flex-col items-center justify-center ${className} rounded-xl border border-white/5`}>
                <span className="text-xs text-white/30 font-medium mb-1">No data</span>
                {/* Debug Info for User/Dev */}
                <span className="text-[9px] text-white/10 font-mono">
                    {marketId.slice(0, 8)}... • {outcome}
                </span>
            </div>
        );
    }

    // Calculate bounds for SVG
    const prices = history.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 0.01;

    // Generate SVG path
    const width = 96;
    const height = 48;
    const padding = 4;

    const points = history.map((p, i) => {
        const x = padding + (i / (history.length - 1)) * (width - padding * 2);
        const y = height - padding - ((p.price - minPrice) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    // Entry price line position
    const entryY = height - padding - ((entryPrice - minPrice) / range) * (height - padding * 2);

    // Determine if profit or loss
    const priceChange = currentPrice ? currentPrice - entryPrice : 0;
    const isProfit = priceChange >= 0;
    const changePercent = entryPrice > 0 ? ((priceChange / entryPrice) * 100).toFixed(1) : '0';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg width={width} height={height} className="overflow-visible">
                {/* Entry price line */}
                <line
                    x1={0}
                    y1={entryY}
                    x2={width}
                    y2={entryY}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="2,2"
                    strokeWidth={1}
                />

                {/* Price line */}
                <polyline
                    fill="none"
                    stroke={isProfit ? '#22c55e' : '#ef4444'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />

                {/* Current price dot */}
                {history.length > 0 && (
                    <circle
                        cx={width - padding}
                        cy={height - padding - ((history[history.length - 1].price - minPrice) / range) * (height - padding * 2)}
                        r={3}
                        fill={isProfit ? '#22c55e' : '#ef4444'}
                    />
                )}
            </svg>

            {/* Change indicator */}
            {currentPrice && (
                <div className={`flex flex-col items-end text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    <div className="flex items-center gap-0.5">
                        {isProfit ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        <span className="font-bold">{isProfit ? '+' : ''}{changePercent}%</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        ${currentPrice.toFixed(3)}
                    </span>
                </div>
            )}
        </div>
    );
}
