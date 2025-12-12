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
    CheckCircle2
} from 'lucide-react';
import { paperStore } from '@/lib/paper-trading';
import RadarLogsConsole from '@/components/dashboard/RadarLogsConsole';
import RadarGuide from '@/components/dashboard/RadarGuide';
import SignalDetailsModal from '@/components/dashboard/SignalDetailsModal';
import { showTradeNotification } from '@/components/dashboard/TradeNotificationSystem';
import { WhaleSignal, WhaleAnalytics } from '@/lib/polyradar-db';

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
    const [selectedSignal, setSelectedSignal] = useState<WhaleSignal | null>(null);

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

    const handleCopyTrade = (signal: WhaleSignal, type: 'COPY' | 'INVERSE') => {
        const outcomeToBuy = type === 'COPY'
            ? signal.outcome
            : (signal.outcome === 'YES' ? 'NO' : 'YES');

        const result = paperStore.placeOrder({
            marketId: signal.market_id,
            marketTitle: `Market #${signal.market_id}`,
            type: 'BUY',
            outcome: outcomeToBuy,
            entryPrice: signal.price,
            amount: 100,
            source: 'COPY_TRADING',
            notes: `${type} Trade of Whale ${signal.wallet_address.slice(0, 6)}`
        });

        if (result) {
            // Show notification with order details
            showTradeNotification(result, 'OPENED');
            console.log(`${type} trade executed: $100 on ${outcomeToBuy}`);
            setSelectedSignal(null);
        }
    };

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

            {/* Main Content - Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">

                {/* Left Column: Whale Feed (8 cols) */}
                <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold text-foreground">Live Feed</h2>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                            {signals.length} signals
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40">
                        {signals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Radar className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                                <p>Waiting for whale signals...</p>
                            </div>
                        ) : (
                            signals.map((signal, index) => (
                                <motion.div
                                    key={signal.id}
                                    layoutId={`signal-${signal.id}`}
                                    onClick={() => setSelectedSignal(signal)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition group flex items-start gap-4 cursor-pointer hover:bg-accent/50 active:scale-[0.99]"
                                >
                                    {/* Icon */}
                                    <div className={`p-2 rounded-lg shrink-0 ${signal.outcome === 'YES' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {signal.outcome === 'YES' ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs font-mono font-bold text-foreground">
                                                    {truncateAddress(signal.wallet_address)}
                                                </code>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getCategoryColor(signal.wallet_category)}`}>
                                                    {signal.wallet_category || 'UNK'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatTimeAgo(signal.timestamp)}
                                            </span>
                                        </div>

                                        {/* Market Info */}
                                        <div className="mb-2">
                                            <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                                                {signal.market_question}
                                            </h3>
                                            {signal.market_description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {signal.market_description}
                                                </p>
                                            )}
                                            <div className="text-xs text-muted-foreground/60 mt-0.5">
                                                ID: {signal.market_id}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`${signal.outcome === 'YES' ? 'text-green-500' : 'text-red-500'} font-bold`}>
                                                    {signal.outcome}
                                                </span>
                                                <span className="text-muted-foreground">@</span>
                                                <span className="text-foreground">
                                                    {(signal.price * 100).toFixed(0)}¢
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                ${signal.amount_usd.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Polymarket Link */}
                                        {signal.market_slug && (
                                            <div className="mt-2 pt-2 border-t border-border">
                                                <a
                                                    href={`https://polymarket.com/event/${signal.market_slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    View on Polymarket
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    {signal.was_copied === 1 && (
                                        <div className="shrink-0 flex flex-col items-end justify-center h-full pl-2 border-l border-border">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
                                            <span className="text-[10px] font-bold text-green-500">COPIED</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">

                    {/* Top Whales (Top Half) */}
                    <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col min-h-0">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h2 className="text-lg font-bold text-foreground">Top Wallets</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                            {analytics?.top_wallets && analytics.top_wallets.length > 0 ? (
                                analytics.top_wallets.slice(0, 10).map((wallet, index) => (
                                    <div key={wallet.wallet_address} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border hover:border-primary/30 transition">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono font-medium text-foreground truncate">
                                                    {truncateAddress(wallet.wallet_address)}
                                                </span>
                                                <span className="text-xs font-bold text-primary">
                                                    ${(wallet.total_volume / 1000).toFixed(1)}k
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${wallet.wallet_category === 'SMART_MONEY' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                <span className="text-[10px] text-muted-foreground uppercase">{wallet.wallet_category || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No data</div>
                            )}
                        </div>
                    </div>

                    {/* Console (Bottom Half) */}
                    <div className="h-[300px] shrink-0">
                        <RadarLogsConsole />
                    </div>
                </div>
            </div>

            {/* Guide Button */}
            <RadarGuide />

            {/* Signal Details Modal */}
            <SignalDetailsModal
                signal={selectedSignal}
                isOpen={!!selectedSignal}
                onClose={() => setSelectedSignal(null)}
                onCopyTrade={handleCopyTrade}
            />
        </div>
    );
}
