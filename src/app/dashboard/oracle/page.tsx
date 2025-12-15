'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, TrendingUp, TrendingDown, RefreshCw, ExternalLink,
    Eye, DollarSign, Activity, Target, AlertTriangle
} from 'lucide-react';

interface CryptoMarket {
    market_id: string;
    slug: string;
    question: string;
    symbol: string;
    strike_price: number;
    yes_price: number;
    volume: number;
    alpha: number;
    fair_value: number;
    spot_price: number;
}

interface SpotPrices {
    BTC: number;
    ETH: number;
    SOL: number;
}

export default function OraclePage() {
    const [markets, setMarkets] = useState<CryptoMarket[]>([]);
    const [spotPrices, setSpotPrices] = useState<SpotPrices>({ BTC: 0, ETH: 0, SOL: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [filter, setFilter] = useState<'all' | 'btc' | 'eth' | 'sol'>('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/oracle/scan');
            if (res.ok) {
                const data = await res.json();
                setMarkets(data.markets || []);
                setSpotPrices(data.spotPrices || { BTC: 0, ETH: 0, SOL: 0 });
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch oracle data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const filteredMarkets = markets.filter(m => {
        if (filter === 'all') return true;
        if (filter === 'btc') return m.symbol === 'BTC/USDT';
        if (filter === 'eth') return m.symbol === 'ETH/USDT';
        if (filter === 'sol') return m.symbol === 'SOL/USDT';
        return true;
    });

    const getAlphaColor = (alpha: number) => {
        if (alpha > 0.1) return 'text-emerald-400';
        if (alpha > 0.05) return 'text-emerald-500';
        if (alpha < -0.05) return 'text-red-400';
        return 'text-muted-foreground';
    };

    const getAlphaBg = (alpha: number) => {
        if (alpha > 0.1) return 'bg-emerald-500/10 border-emerald-500/30';
        if (alpha > 0.05) return 'bg-emerald-500/5 border-emerald-500/20';
        if (alpha < -0.05) return 'bg-red-500/10 border-red-500/30';
        return 'bg-secondary/50 border-border';
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                            CryptoOracle
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Smart Money + Mean Reversion Scanner
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {lastUpdate && (
                        <span className="text-xs text-muted-foreground">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Spot Prices Banner */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bitcoin</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">BTC</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-400 mt-1">
                        ${spotPrices.BTC?.toLocaleString() || '---'}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ethereum</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">ETH</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">
                        ${spotPrices.ETH?.toLocaleString() || '---'}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Solana</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">SOL</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400 mt-1">
                        ${spotPrices.SOL?.toLocaleString() || '---'}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
                {(['all', 'btc', 'eth', 'sol'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-primary/10 text-primary border border-primary/30'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        {f === 'all' ? 'All Markets' : f.toUpperCase()}
                    </button>
                ))}
                <div className="ml-auto text-sm text-muted-foreground">
                    {filteredMarkets.length} markets found
                </div>
            </div>

            {/* Markets Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b border-border grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase">
                    <div className="col-span-5">Market</div>
                    <div className="col-span-1 text-center">YES Price</div>
                    <div className="col-span-2 text-center">Strike</div>
                    <div className="col-span-1 text-center">Fair Value</div>
                    <div className="col-span-2 text-center">Alpha</div>
                    <div className="col-span-1 text-center">Actions</div>
                </div>

                <AnimatePresence>
                    {loading && markets.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                            Scanning crypto markets...
                        </div>
                    ) : filteredMarkets.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No markets found
                        </div>
                    ) : (
                        filteredMarkets.map((market, idx) => (
                            <motion.div
                                key={market.market_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className={`px-4 py-3 border-b border-border grid grid-cols-12 gap-4 items-center hover:bg-muted/20 transition-colors ${getAlphaBg(market.alpha)}`}
                            >
                                <div className="col-span-5">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${market.symbol === 'BTC/USDT' ? 'bg-orange-500/20 text-orange-400' :
                                                market.symbol === 'ETH/USDT' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-purple-500/20 text-purple-400'
                                            }`}>
                                            {market.symbol.split('/')[0]}
                                        </span>
                                        <span className="text-sm font-medium truncate">
                                            {market.question.length > 50 ? market.question.slice(0, 50) + '...' : market.question}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        Vol: ${(market.volume / 1000000).toFixed(1)}M
                                    </div>
                                </div>

                                <div className="col-span-1 text-center">
                                    <span className="text-sm font-mono font-bold">
                                        ${market.yes_price.toFixed(2)}
                                    </span>
                                </div>

                                <div className="col-span-2 text-center">
                                    <span className="text-sm font-mono">
                                        ${market.strike_price.toLocaleString()}
                                    </span>
                                </div>

                                <div className="col-span-1 text-center">
                                    <span className="text-sm font-mono text-muted-foreground">
                                        ${market.fair_value.toFixed(2)}
                                    </span>
                                </div>

                                <div className="col-span-2 text-center">
                                    <span className={`text-sm font-bold ${getAlphaColor(market.alpha)}`}>
                                        {market.alpha > 0 ? '+' : ''}{(market.alpha * 100).toFixed(1)}%
                                    </span>
                                    {market.alpha > 0.1 && (
                                        <span className="ml-1 text-xs">🔥</span>
                                    )}
                                </div>

                                <div className="col-span-1 flex justify-center gap-1">
                                    <a
                                        href={`https://polymarket.com/event/${market.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                        title="View on Polymarket"
                                    >
                                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                    </a>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></div>
                    <span>Alpha &gt; 5% (Undervalued)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></div>
                    <span>Alpha &lt; -5% (Overvalued)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Alpha = Fair Value - Current Price</span>
                </div>
            </div>
        </div>
    );
}
