'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    TrendingUp,
    Users,
    DollarSign,
    ExternalLink,
    Copy,
    Check,
    RefreshCw,
    Filter,
    Terminal,
    Trophy,
    Target,
    Zap,
    Skull,
    Anchor,
    Search,
    ArrowRight
} from 'lucide-react';
import TransactionDetails from '@/components/tracker/TransactionDetails';

interface WhaleTransaction {
    wallet_address: string;
    wallet_tag: string;
    wallet_win_rate: number | null;
    wallet_pnl: number | null;
    market_id: string;
    market_question: string;
    market_slug: string;
    outcome: string;
    amount: number;
    price: number;
    timestamp: string;
    tx_hash: string;
}

interface Stats {
    totalTransactions: number;
    totalVolume: number;
    uniqueWhales: number;
    avgTradeSize: number;
    tagDistribution: Record<string, number>;
    topWhales: Array<{
        address: string;
        tag: string;
        totalVolume: number;
        tradeCount: number;
    }>;
}

interface LogEntry {
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

export default function TrackerPage() {
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [showLogs, setShowLogs] = useState(false);
    const [filter, setFilter] = useState({ tag: '', minAmount: 0 });
    const [selectedTx, setSelectedTx] = useState<WhaleTransaction | null>(null);

    const fetchData = useCallback(async () => {
        try {
            // Fetch more transactions to allow for better client-side filtering
            const [txRes, statsRes, logsRes] = await Promise.all([
                fetch('/api/tracker/transactions?limit=200'),
                fetch('/api/tracker/stats'),
                fetch('/api/tracker/logs?limit=50')
            ]);

            const txData = await txRes.json();
            if (txRes.ok) setTransactions(txData.transactions || []);
            if (statsRes.ok) setStats(await statsRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const copyAddress = (e: React.MouseEvent, address: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(address);
        setCopied(address);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const formatTimeAgo = (timestamp: string) => {
        const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    const getTagConfig = (tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('legend')) return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Trophy };
        if (lowerTag.includes('shark')) return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Anchor };
        if (lowerTag.includes('dolphin')) return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Activity };
        if (lowerTag.includes('sniper')) return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Target };
        if (lowerTag.includes('degen')) return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Skull };
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Zap };
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter.tag && !tx.wallet_tag.toLowerCase().includes(filter.tag.toLowerCase())) return false;
        if (filter.minAmount && tx.amount < filter.minAmount) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#0a0f16] p-6 text-white font-sans selection:bg-purple-500/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-400" />
                        Whale Tracker
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm md:text-base">Real-time detection of high-value Polymarket transactions</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className={`p-3 rounded-xl border transition-all ${showLogs
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                            }`}
                        title="Toggle Full Logs"
                    >
                        <Terminal className="w-5 h-5" />
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* Left Column: Stats & Filters & Leaderboard (1 Col) */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-gray-400">Tx Count</span>
                            </div>
                            <p className="text-2xl font-bold">{stats?.totalTransactions.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-gray-400">Volume</span>
                            </div>
                            <p className="text-2xl font-bold">{formatAmount(stats?.totalVolume || 0)}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-gray-400">Whales</span>
                            </div>
                            <p className="text-2xl font-bold">{stats?.uniqueWhales || 0}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-orange-400" />
                                <span className="text-xs text-gray-400">Avg Size</span>
                            </div>
                            <p className="text-2xl font-bold">{formatAmount(stats?.avgTradeSize || 0)}</p>
                        </div>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            Filters
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Whale Tag</label>
                                <select
                                    value={filter.tag}
                                    onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                                >
                                    <option value="">All Categories</option>
                                    <option value="legend">👑 Whale Legend</option>
                                    <option value="shark">🦈 Shark</option>
                                    <option value="dolphin">🐬 Dolphin</option>
                                    <option value="sniper">🎯 Sniper</option>
                                    <option value="degen">💀 Degen</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Min Amount</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0, 1000, 5000, 10000, 50000, 100000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setFilter({ ...filter, minAmount: amt })}
                                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${filter.minAmount === amt
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {amt === 0 ? 'Any' : `$${amt / 1000}k`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Whales Leaderboard */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            Top Whales (24h)
                        </h3>
                        <div className="space-y-3">
                            {stats?.topWhales?.slice(0, 5).map((whale, idx) => {
                                const config = getTagConfig(whale.tag);
                                return (
                                    <div key={whale.address} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="text-xs font-bold text-gray-500 w-4">#{idx + 1}</div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-xs font-medium ${config.color}`}>{whale.tag}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono">
                                                    {whale.address.slice(0, 4)}...{whale.address.slice(-4)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{formatAmount(whale.totalVolume)}</div>
                                            <div className="text-xs text-gray-500">{whale.tradeCount} trades</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!stats?.topWhales?.length && (
                                <div className="text-center text-gray-500 py-4 text-sm">No data yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center/Right Column: Live Feed & Console (3 Cols) */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Live Feed Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Live Feed
                        </h2>
                        <span className="text-sm text-gray-400 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            {filteredTransactions.length} events
                        </span>
                    </div>

                    {/* Feed Container */}
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredTransactions.length === 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300">No activity detected</h3>
                                    <p className="text-gray-500 mt-2">Waiting for new transactions matching your filters...</p>
                                </div>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const tagConfig = getTagConfig(tx.wallet_tag);
                                    const TagIcon = tagConfig.icon;
                                    const outcomeColor = tx.outcome === 'YES' ? 'text-green-400' : tx.outcome === 'NO' ? 'text-red-400' : 'text-blue-400';
                                    const outcomeBg = tx.outcome === 'YES' ? 'bg-green-500/10' : tx.outcome === 'NO' ? 'bg-red-500/10' : 'bg-blue-500/10';

                                    return (
                                        <motion.div
                                            key={tx.tx_hash}
                                            layoutId={tx.tx_hash}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => setSelectedTx(tx)}
                                            className="group cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-blue-500/10 rounded-2xl p-5 transition-all relative overflow-hidden"
                                        >
                                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative z-10">

                                                {/* Left: Wallet */}
                                                <div className="flex items-center gap-4 min-w-[200px]">
                                                    <div className={`p-3 rounded-xl ${tagConfig.bg} ${tagConfig.border} border`}>
                                                        <TagIcon className={`w-6 h-6 ${tagConfig.color}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${tagConfig.color}`}>{tx.wallet_tag}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <button
                                                                onClick={(e) => copyAddress(e, tx.wallet_address)}
                                                                className="flex items-center gap-1 text-xs text-gray-400 font-mono hover:text-white transition-colors"
                                                            >
                                                                {tx.wallet_address.slice(0, 6)}...{tx.wallet_address.slice(-4)}
                                                                {copied === tx.wallet_address ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle: Market Info */}
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium text-gray-200 line-clamp-1 mb-2 group-hover:text-blue-300 transition-colors">
                                                        {tx.market_question || "Unknown Market"}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border border-white/5 ${outcomeBg} ${outcomeColor}`}>
                                                            {tx.outcome}
                                                        </span>
                                                        <span className="text-sm text-gray-500">at</span>
                                                        <span className="text-sm font-bold text-white">{(tx.price * 100).toFixed(1)}¢</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                        <span className="text-sm font-bold text-blue-400 shadow-blue-500/20 drop-shadow-sm">
                                                            {formatAmount(tx.amount)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right: Time & Chevron */}
                                                <div className="flex items-center gap-4 min-w-[100px] justify-end">
                                                    <div className="text-right">
                                                        <span className="text-xs text-gray-500 font-mono block">{formatTimeAgo(tx.timestamp)}</span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Console Logs */}
                    {showLogs && (
                        <div className="mt-8 bg-[#0d121d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-300">System Logs</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">Real-time</span>
                            </div>
                            <div className="p-4 h-48 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`${log.level === 'error' ? 'text-red-400' :
                                            log.level === 'warning' ? 'text-yellow-400' :
                                                log.level === 'success' ? 'text-green-400' :
                                                    'text-gray-300'
                                            }`}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="text-gray-600 text-center italic mt-16">Waiting for system logs...</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Details Overlay */}
            <AnimatePresence>
                {selectedTx && (
                    <TransactionDetails
                        transaction={selectedTx}
                        onClose={() => setSelectedTx(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
