'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Radar,
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    Filter,
    ExternalLink,
    Copy,
    CheckCircle2
} from 'lucide-react';
import { paperStore } from '@/lib/paper-trading';

interface WhaleSignal {
    id: number;
    wallet_address: string;
    market_id: string;
    outcome: 'YES' | 'NO';
    amount_usd: number;
    price: number;
    timestamp: number;
    tx_hash: string;
    wallet_category: string | null;
    reputation_score: number | null;
    was_copied: number;
    copy_position_size: number;
    created_at: string;
}

interface Analytics {
    total_signals: number;
    unique_wallets: number;
    total_volume: number;
    avg_trade_size: number;
    copied_count: number;
    total_copied_volume: number;
    top_wallets: Array<{
        wallet_address: string;
        wallet_category: string | null;
        signal_count: number;
        total_volume: number;
    }>;
}

export default function RadarPage() {
    const [signals, setSignals] = useState<WhaleSignal[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | null>(null);

    // Fetch data
    const fetchData = async () => {
        try {
            const [signalsRes, analyticsRes] = await Promise.all([
                fetch(`/api/radar/signals?${filter ? `category=${filter}` : ''}`),
                fetch('/api/radar/analytics'),
            ]);

            const signalsData = await signalsRes.json();
            const analyticsData = await analyticsRes.json();

            if (signalsData.success) {
                setSignals(signalsData.signals);
            }

            if (analyticsData.success) {
                setAnalytics(analyticsData.analytics);
                setIsActive(analyticsData.is_active);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching radar data:', error);
            setLoading(false);
        }
    };

    // Process pending trades from bot
    const processPendingTrades = async () => {
        try {
            const res = await fetch('/api/radar/queue');
            const data = await res.json();

            if (data.success && data.trades && data.trades.length > 0) {
                for (const trade of data.trades) {
                    // Execute in paper trading
                    const result = paperStore.placeOrder({
                        marketId: trade.market_id,
                        marketTitle: trade.market_title,
                        type: 'BUY',
                        outcome: trade.outcome,
                        entryPrice: trade.price,
                        amount: trade.amount,
                        source: 'COPY_TRADING',
                        notes: `Whale: ${trade.whale_wallet.slice(0, 10)}... | ${trade.wallet_category} | Conf: ${trade.confidence_score}/100`
                    });

                    if (result) {
                        console.log(`[Radar] Auto-executed trade: $${trade.amount} on ${trade.outcome}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing trade queue:', error);
        }
    };

    useEffect(() => {
        fetchData();
        processPendingTrades();

        // Poll every 10 seconds
        const interval = setInterval(() => {
            fetchData();
            processPendingTrades();
        }, 10000);

        return () => clearInterval(interval);
    }, [filter]);

    const getCategoryColor = (category: string | null) => {
        switch (category) {
            case 'SMART_MONEY':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'INSIDER':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'MARKET_MAKER':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default:
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor(Date.now() / 1000 - timestamp);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Radar className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading radar data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Radar className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">PolyRadar</h1>
                            <p className="text-muted-foreground">Whale Detection System</p>
                        </div>
                    </div>

                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-sm font-medium">
                            {isActive ? 'LIVE' : 'OFFLINE'}
                        </span>
                    </div>
                </div>

                {/* Stats Cards */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-card rounded-xl border border-border"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                <span className="text-xs text-muted-foreground">Total Signals</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{analytics.total_signals}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-4 bg-card rounded-xl border border-border"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-5 h-5 text-purple-500" />
                                <span className="text-xs text-muted-foreground">Unique Whales</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{analytics.unique_wallets}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-4 bg-card rounded-xl border border-border"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-muted-foreground">Total Volume</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                ${analytics.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-4 bg-card rounded-xl border border-border"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                <span className="text-xs text-muted-foreground">Copied</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {analytics.copied_count} ({analytics.total_signals > 0 ? Math.round((analytics.copied_count / analytics.total_signals) * 100) : 0}%)
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <button
                        onClick={() => setFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === null
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('SMART_MONEY')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'SMART_MONEY'
                            ? 'bg-green-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Smart Money
                    </button>
                    <button
                        onClick={() => setFilter('INSIDER')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'INSIDER'
                            ? 'bg-orange-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Insider
                    </button>
                </div>
            </div>

            {/* Whale Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">Recent Whales</h2>

                    {signals.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-xl border border-border">
                            <Radar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">No whale signals detected yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-2">
                                Run the PolyRadar bot to start detecting whales
                            </p>
                        </div>
                    ) : (
                        signals.map((signal, index) => (
                            <motion.div
                                key={signal.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-5 bg-gradient-to-br from-card to-card/50 rounded-xl border border-border hover:border-primary/50 transition group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryColor(
                                                        signal.wallet_category
                                                    )}`}
                                                >
                                                    {signal.wallet_category || 'UNKNOWN'}
                                                </span>
                                                {signal.reputation_score && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Score: {signal.reputation_score.toFixed(0)}/100
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-sm font-mono text-muted-foreground">
                                                    {truncateAddress(signal.wallet_address)}
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(signal.wallet_address)}
                                                    className="opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimeAgo(signal.timestamp)}
                                    </span>
                                </div>

                                {/* Trade Details */}
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <span className="text-xs text-muted-foreground block mb-1">Market</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground">#{signal.market_id}</span>
                                            <a
                                                href={`https://polymarket.com/event/${signal.market_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                            </a>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block mb-1">Position</span>
                                        <span className={`text-sm font-bold ${signal.outcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                            {signal.outcome} @ ${signal.price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                                    <div>
                                        <span className="text-xs text-muted-foreground block mb-1">Trade Size</span>
                                        <span className="text-lg font-bold text-foreground">
                                            ${signal.amount_usd.toLocaleString()}
                                        </span>
                                    </div>

                                    {signal.was_copied === 1 && (
                                        <div className="text-right">
                                            <span className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                COPIED
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ${signal.copy_position_size.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Sidebar - Top Whales */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">Top Whales</h2>

                    {analytics?.top_wallets && analytics.top_wallets.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.top_wallets.slice(0, 10).map((wallet, index) => (
                                <div
                                    key={wallet.wallet_address}
                                    className="p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryColor(
                                                wallet.wallet_category
                                            )}`}
                                        >
                                            {wallet.wallet_category || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <code className="text-xs font-mono text-muted-foreground block mb-2">
                                        {truncateAddress(wallet.wallet_address)}
                                    </code>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{wallet.signal_count} signals</span>
                                        <span className="font-semibold text-foreground">
                                            ${wallet.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-card rounded-xl border border-border">
                            <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No whale data yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
