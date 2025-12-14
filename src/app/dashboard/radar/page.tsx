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
    ExternalLink,
    Copy,
    X
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
            // Add timestamp to prevent caching
            const timestamp = Date.now();
            const url = filter
                ? `/api/radar/transactions?limit=50&tag=${filter}&_t=${timestamp}`
                : `/api/radar/transactions?limit=50&_t=${timestamp}`;

            console.log('[RadarPage] Fetching data from:', url);
            const res = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const data = await res.json();
            console.log('[RadarPage] Received data:', {
                count: data.transactions?.length || 0,
                firstTx: data.transactions?.[0],
                firstTxTimestamp: data.transactions?.[0]?.timestamp,
                timestamp: new Date().toISOString()
            });

            if (data.transactions) {
                // Force new array reference to ensure React detects the change
                const freshTransactions = [...data.transactions];
                console.log('[RadarPage] Setting transactions, first 3:', freshTransactions.slice(0, 3).map(t => ({
                    id: t.id,
                    timestamp: t.timestamp,
                    amount: t.amount
                })));
                setTransactions(freshTransactions);
            }

            // Calculate analytics from transactions
            if (data.transactions && data.transactions.length > 0) {
                const uniqueAddresses = new Set(data.transactions.map((t: WhaleTransaction) => t.walletAddress));
                const totalVol = data.transactions.reduce((sum: number, t: WhaleTransaction) => sum + (t.amount || 0), 0);

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
                        existing.volume += (t.amount || 0);
                        existing.count += 1;
                    } else {
                        whaleMap.set(t.walletAddress, {
                            address: t.walletAddress,
                            tag: t.walletTag,
                            volume: (t.amount || 0),
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
                    avgTradeSize: data.transactions.length > 0 ? totalVol / data.transactions.length : 0,
                    tagDistribution: tagDist,
                    topWhales
                });
            }
        } catch (error) {
            console.error('[RadarPage] Error fetching radar data:', error);
        }
    };

    useEffect(() => {
        console.log('[RadarPage] useEffect triggered, filter:', filter);
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
                                                        {((tx.price ?? 0) * 100).toFixed(0)}¢
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

            {/* Transaction Details Modal */}
            {selectedTx && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedTx(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0A0C10] rounded-2xl border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-6 border-b border-white/5 flex justify-between items-start gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight mb-2">
                                    {selectedTx.marketQuestion}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded border border-white/10">
                                        ID: {selectedTx.marketSlug.slice(0, 10)}...
                                    </span>
                                    <span>•</span>
                                    <span>{formatTimeAgo(new Date(selectedTx.timestamp))}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 relative">
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <DollarSign size={14} className="text-green-500" />
                                        <span>Amount</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white font-mono">
                                        ${selectedTx.amount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <TrendingUp size={14} className={selectedTx.outcome === 'YES' ? 'text-green-500' : 'text-red-500'} />
                                        <span>Outcome</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-2xl font-bold ${selectedTx.outcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                            {selectedTx.outcome}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            @ {(selectedTx.price * 100).toFixed(0)}¢
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Activity size={14} className="text-blue-500" />
                                        <span>Estimated Shares</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white font-mono">
                                        {Math.floor(selectedTx.amount / selectedTx.price).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Wallet Info */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-purple-400" />
                                        <h3 className="font-semibold text-white">Whale Details</h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(selectedTx.walletTag)}`}>
                                        {selectedTx.walletTag}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 group">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="text-xs uppercase tracking-wider">Address</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm text-blue-400 font-mono">
                                                {selectedTx.walletAddress}
                                            </code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(selectedTx.walletAddress)}
                                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-white"
                                                title="Copy Address"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {(selectedTx.walletWinRate != null || selectedTx.walletTotalPnl != null) && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Win Rate</span>
                                                <span className="font-bold text-white bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-sm">
                                                    {((selectedTx.walletWinRate ?? 0) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Profit/Loss</span>
                                                <span className={`font-bold font-mono text-sm ${(selectedTx.walletTotalPnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    ${(selectedTx.walletTotalPnl ?? 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tx Hash & Actions */}
                            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                    <span>Transaction Hash</span>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs">{selectedTx.txHash || selectedTx.id}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(selectedTx.txHash || selectedTx.id)}
                                            className="hover:text-white transition-colors"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>

                                <a
                                    href={`https://polymarket.com/event/${selectedTx.marketSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <ExternalLink size={18} />
                                    View on Polymarket
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
