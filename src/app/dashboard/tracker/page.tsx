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
    Terminal
} from 'lucide-react';

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

    const fetchData = useCallback(async () => {
        try {
            const [txRes, statsRes, logsRes] = await Promise.all([
                fetch('/api/tracker/transactions?limit=100'),
                fetch('/api/tracker/stats'),
                fetch('/api/tracker/logs?limit=50')
            ]);

            const txData = await txRes.json();
            if (txRes.ok) setTransactions(txData.transactions || []); // Extract array from paginated response
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

    const copyAddress = (address: string) => {
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

    const getTagColor = (tag: string) => {
        if (tag.includes('Legend')) return 'from-purple-500 to-pink-500';
        if (tag.includes('Shark')) return 'from-blue-500 to-cyan-500';
        if (tag.includes('Dolphin')) return 'from-cyan-500 to-teal-500';
        if (tag.includes('Sniper')) return 'from-green-500 to-emerald-500';
        if (tag.includes('Degen')) return 'from-red-500 to-orange-500';
        return 'from-gray-500 to-gray-600';
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter.tag && !tx.wallet_tag.toLowerCase().includes(filter.tag.toLowerCase())) return false;
        if (filter.minAmount && tx.amount < filter.minAmount) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-4xl">🐋</span>
                        Whale Tracker
                    </h1>
                    <p className="text-gray-400 mt-1">Real-time whale activity on Polymarket</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className={`p-3 rounded-xl transition-all ${showLogs ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Terminal className="w-5 h-5" />
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Transactions</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.totalTransactions || 0}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Total Volume</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatAmount(stats?.totalVolume || 0)}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Unique Whales</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.uniqueWhales || 0}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Avg Trade</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatAmount(stats?.avgTradeSize || 0)}</p>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Filters:</span>
                </div>
                <select
                    value={filter.tag}
                    onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Tags</option>
                    <option value="legend">🐋 Whale Legend</option>
                    <option value="shark">🦈 Shark</option>
                    <option value="dolphin">🐬 Dolphin</option>
                    <option value="sniper">🎯 Sniper</option>
                    <option value="degen">💸 Degen</option>
                </select>
                <select
                    value={filter.minAmount}
                    onChange={(e) => setFilter({ ...filter, minAmount: parseInt(e.target.value) })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                    <option value="0">Min Amount: Any</option>
                    <option value="1000">Min: $1K</option>
                    <option value="5000">Min: $5K</option>
                    <option value="10000">Min: $10K</option>
                    <option value="50000">Min: $50K</option>
                </select>
            </div>

            {/* Main Content */}
            <div className={`grid ${showLogs ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {/* Transactions Feed */}
                <div className={showLogs ? 'lg:col-span-2' : ''}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Live Feed</h2>
                            <span className="text-sm text-gray-400">{filteredTransactions.length} transactions</span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {filteredTransactions.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <span className="text-4xl mb-4 block">🐋</span>
                                        <p>No whale transactions yet</p>
                                        <p className="text-sm mt-2">Start the tracker to see live trades</p>
                                    </div>
                                ) : (
                                    filteredTransactions.map((tx, index) => (
                                        <motion.div
                                            key={tx.tx_hash}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    {/* Wallet Info */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${getTagColor(tx.wallet_tag)} text-white`}>
                                                            {tx.wallet_tag}
                                                        </span>
                                                        <button
                                                            onClick={() => copyAddress(tx.wallet_address)}
                                                            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
                                                        >
                                                            <span className="font-mono">
                                                                {tx.wallet_address.slice(0, 6)}...{tx.wallet_address.slice(-4)}
                                                            </span>
                                                            {copied === tx.wallet_address ? (
                                                                <Check className="w-3 h-3 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                        {tx.wallet_win_rate && (
                                                            <span className="text-xs text-gray-500">
                                                                WR: {(tx.wallet_win_rate * 100).toFixed(0)}%
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Market Question */}
                                                    <p className="text-white text-sm mb-2 truncate">
                                                        {tx.market_question}
                                                    </p>

                                                    {/* Trade Details */}
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className={`font-semibold ${tx.outcome === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                                                            {tx.outcome}
                                                        </span>
                                                        <span className="text-gray-400">@</span>
                                                        <span className="text-white">{(tx.price * 100).toFixed(0)}¢</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="text-purple-400 font-semibold">{formatAmount(tx.amount)}</span>
                                                    </div>
                                                </div>

                                                {/* Right Side */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs text-gray-500">{formatTimeAgo(tx.timestamp)}</span>
                                                    {tx.market_slug && (
                                                        <a
                                                            href={`https://polymarket.com/event/${tx.market_slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            View
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Logs Console */}
                {showLogs && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/10 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">Console</h2>
                        </div>
                        <div className="p-4 max-h-[600px] overflow-y-auto font-mono text-sm">
                            {logs.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">
                                    <p>No logs yet</p>
                                    <p className="text-xs mt-2">Logs will appear when the tracker runs</p>
                                </div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="py-1">
                                        <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                        <span className={
                                            log.level === 'error' ? 'text-red-400' :
                                                log.level === 'warning' ? 'text-yellow-400' :
                                                    log.level === 'success' ? 'text-green-400' :
                                                        'text-gray-300'
                                        }>
                                            {log.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
