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
    CheckCircle2,
    ExternalLink
} from 'lucide-react';
import RadarLogsConsole from '@/components/dashboard/RadarLogsConsole';

interface WhaleTransaction {
    id: string;
    txHash: string;
    timestamp: Date;
    walletAddress: string;
    walletTag: string;
    walletWinRate: number | null;
    walletTotalPnl: number | null;
    marketQuestion: string;
    marketSlug: string;
    outcome: string;
    amount: number;
    price: number;
}

interface Analytics {
    totalTransactions: number;
    uniqueWhales: number;
    totalVolume: number;
    avgTradeSize: number;
    tagDistribution: Record<string, number>;
    topWhales: Array<{
        address: string;
        tag: string;
        totalVolume: number;
        transactionCount: number;
    }>;
}

export default function RadarPage() {
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [filter, setFilter] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<WhaleTransaction | null>(null);

    // Fetch transactions
    const fetchData = async () => {
        try {
            const url = filter
                ? `/api/radar/transactions?limit=50&tag=${filter}`
                : '/api/radar/transactions?limit=50';

            const res = await fetch(url);
            const data = await res.json();

            if (data.transactions) {
                setTransactions(data.transactions);
            }

            // Calculate analytics from transactions
            if (data.transactions && data.transactions.length > 0) {
                const uniqueAddresses = new Set(data.transactions.map((t: WhaleTransaction) => t.walletAddress));
                const totalVol = data.transactions.reduce((sum: number, t: WhaleTransaction) => sum + t.amount, 0);

                // Tag distribution
                const tagDist: Record<string, number> = {};
                data.transactions.forEach((t: WhaleTransaction) => {
                    tagDist[t.walletTag] = (tagDist[t.walletTag] || 0) + 1;
                });

                // Top whales
                const whaleMap = new Map<string, { address: string; tag: string; volume: number; count: number }>();
                data.transactions.forEach((t: WhaleTransaction) => {
                    const existing = whaleMap.get(t.walletAddress);
                    if (existing) {
                        existing.volume += t.amount;
                        existing.count += 1;
                    } else {
                        whaleMap.set(t.walletAddress, {
                            address: t.walletAddress,
                            tag: t.walletTag,
                            volume: t.amount,
                            count: 1
                        });
                    }
                });

                const topWhales = Array.from(whaleMap.values())
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 10)
                    .map(w => ({
                        address: w.address,
                        tag: w.tag,
                        totalVolume: w.volume,
                        transactionCount: w.count
                    }));

                setAnalytics({
                    totalTransactions: data.transactions.length,
                    uniqueWhales: uniqueAddresses.size,
                    totalVolume: totalVol,
                    avgTradeSize: totalVol / data.transactions.length,
                    tagDistribution: tagDist,
                    topWhales
                });
            }
        } catch (error) {
            console.error('Error fetching radar data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [filter]);

    const getCategoryColor = (tag: string | null) => {
        switch (tag) {
            case 'WINNER':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'INSIDER':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse';
            case 'SMART_MONEY':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'LOOSER':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'DUMB_MONEY':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default:
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatTimeAgo = (timestamp: Date) => {
        const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

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
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-500">LIVE</span>
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
                            <p className="text-2xl font-bold text-foreground">{analytics.totalTransactions}</p>
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
                            <p className="text-2xl font-bold text-foreground">{analytics.uniqueWhales}</p>
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
                                ${Math.round(analytics.totalVolume || 0).toLocaleString()}
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
                                <span className="text-xs text-muted-foreground">Avg Trade</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                ${Math.round(analytics.avgTradeSize || 0).toLocaleString()}
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
                        onClick={() => setFilter('WINNER')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'WINNER'
                            ? 'bg-green-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Winner
                    </button>
                    <button
                        onClick={() => setFilter('SMART_MONEY')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'SMART_MONEY'
                            ? 'bg-blue-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Smart Money
                    </button>
                    <button
                        onClick={() => setFilter('INSIDER')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'INSIDER'
                            ? 'bg-purple-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Insider
                    </button>
                    <button
                        onClick={() => setFilter('LOOSER')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'LOOSER'
                            ? 'bg-red-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Looser
                    </button>
                    <button
                        onClick={() => setFilter('DUMB_MONEY')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'DUMB_MONEY'
                            ? 'bg-orange-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Dumb Money
                    </button>
                    <button
                        onClick={() => setFilter('UNKNOWN')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'UNKNOWN'
                            ? 'bg-gray-500 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent'
                            }`}
                    >
                        Unknown
                    </button>
                </div>
            </div>

            {/* Main Content - Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-350px)] min-h-[600px]">
                {/* Left Column: Whale Feed (8 cols) */}
                <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold text-foreground">Live Feed</h2>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                            {transactions.length} signals
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40">
                        {transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Radar className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                                <p>Waiting for whale signals...</p>
                            </div>
                        ) : (
                            transactions.map((tx, index) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedTx(tx)}
                                    className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition group cursor-pointer hover:bg-accent/50 active:scale-[0.99]"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg shrink-0 ${tx.outcome === 'YES' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {tx.outcome === 'YES' ? (
                                                <TrendingUp className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs font-mono font-bold text-foreground">
                                                        {truncateAddress(tx.walletAddress)}
                                                    </code>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getCategoryColor(tx.walletTag)}`}>
                                                        {tx.walletTag}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatTimeAgo(tx.timestamp)}
                                                </span>
                                            </div>

                                            {/* Market Info */}
                                            <div className="mb-2">
                                                <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                                                    {tx.marketQuestion}
                                                </h3>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`${tx.outcome === 'YES' ? 'text-green-500' : 'text-red-500'} font-bold`}>
                                                        {tx.outcome}
                                                    </span>
                                                    <span className="text-muted-foreground">@</span>
                                                    <span className="text-foreground">
                                                        {(tx.price * 100).toFixed(0)}¢
                                                    </span>
                                                </div>
                                                <span className="font-bold text-foreground">
                                                    ${(tx.amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">
                    {/* Top Whales */}
                    <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col min-h-0">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h2 className="text-lg font-bold text-foreground">Top Wallets</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                            {analytics?.topWhales && analytics.topWhales.length > 0 ? (
                                analytics.topWhales.map((whale, index) => (
                                    <div
                                        key={whale.address}
                                        className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border hover:border-primary/30 transition"
                                    >
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono font-medium text-foreground truncate">
                                                    {truncateAddress(whale.address)}
                                                </span>
                                                <span className="text-xs font-bold text-primary">
                                                    ${(whale.totalVolume / 1000).toFixed(1)}k
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${whale.tag === 'WINNER' ? 'bg-green-500' : whale.tag === 'INSIDER' ? 'bg-orange-500' : 'bg-gray-500'}`} />
                                                <span className="text-[10px] text-muted-foreground uppercase">{whale.tag}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No data</div>
                            )}
                        </div>
                    </div>

                    {/* Console */}
                    <div className="h-[300px] shrink-0">
                        <RadarLogsConsole />
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedTx && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedTx(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm text-muted-foreground mb-1">Market</h3>
                                <p className="font-semibold">{selectedTx.marketQuestion}</p>
                                <a
                                    href={`https://polymarket.com/event/${selectedTx.marketSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                                >
                                    <ExternalLink size={14} />
                                    View on Polymarket
                                </a>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-muted-foreground mb-1">Amount</h3>
                                    <p className="font-bold text-lg">${(selectedTx.amount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-muted-foreground mb-1">Outcome</h3>
                                    <p className={`font-bold text-lg ${selectedTx.outcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                        {selectedTx.outcome} @ {(selectedTx.price * 100).toFixed(0)}¢
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm text-muted-foreground mb-1">Wallet</h3>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{selectedTx.walletAddress}</code>
                                <div className="mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getCategoryColor(selectedTx.walletTag)}`}>
                                        {selectedTx.walletTag}
                                    </span>
                                </div>
                            </div>

                            {selectedTx.walletWinRate !== null && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm text-muted-foreground mb-1">Win Rate</h3>
                                        <p className="font-semibold">{(selectedTx.walletWinRate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm text-muted-foreground mb-1">Total PnL</h3>
                                        <p className={`font-semibold ${(selectedTx.walletTotalPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            ${selectedTx.walletTotalPnl?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm text-muted-foreground mb-1">Transaction Hash</h3>
                                <code className="text-xs bg-muted px-2 py-1 rounded break-all">{selectedTx.txHash}</code>
                            </div>

                            <button
                                onClick={() => setSelectedTx(null)}
                                className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
