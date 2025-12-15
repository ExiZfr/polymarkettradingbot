'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, TrendingUp, RefreshCw, ExternalLink, Copy,
    Trophy, Target, Shield, Flame, Crown, Users,
    ChevronRight, Check, AlertTriangle, Clock
} from 'lucide-react';

interface Signal {
    id: string;
    marketId: string;
    marketSlug: string;
    question: string;
    outcome: string;
    traderAddress: string;
    traderPnl: number;
    traderWinRate: number;
    traderRank: number;
    entryPrice: number;
    size: number;
    side: string;
    reliabilityScore: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    reason: string;
    timestamp: string;
}

interface Trader {
    address: string;
    pnl: number;
    winRate: number;
    trades: number;
    rank: number;
    score: number;
}

export default function OraclePage() {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [leaderboard, setLeaderboard] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'signals' | 'leaderboard'>('signals');
    const [leaderboardStats, setLeaderboardStats] = useState<any>(null);
    const [filterConfidence, setFilterConfidence] = useState<string>('all');
    const [leaderboardPeriod, setLeaderboardPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

    const fetchLeaderboard = useCallback(async (period: string) => {
        try {
            const res = await fetch(`/api/oracle/leaderboard?limit=100&period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard?.map((t: any) => ({
                    address: t.address,
                    pnl: t.totalPnl,
                    winRate: t.winRate,
                    trades: t.totalTrades,
                    rank: t.rank,
                    score: t.score,
                    cryptoTrades: t.cryptoTrades
                })) || []);
                setLeaderboardStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch signals
            const signalsRes = await fetch('/api/oracle/signals');
            if (signalsRes.ok) {
                const signalsData = await signalsRes.json();
                setSignals(signalsData.signals || []);
            }

            // Fetch leaderboard with current period
            await fetchLeaderboard(leaderboardPeriod);

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch oracle data:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchLeaderboard, leaderboardPeriod]);

    // Refetch leaderboard when period changes
    useEffect(() => {
        if (!loading) {
            fetchLeaderboard(leaderboardPeriod);
        }
    }, [leaderboardPeriod, fetchLeaderboard, loading]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleCopyTrade = async (signal: Signal) => {
        // This would integrate with paper trading
        const paperStore = (window as any).paperStore;
        if (paperStore?.placeOrder) {
            await paperStore.placeOrder({
                marketId: signal.marketId,
                marketTitle: signal.question,
                type: signal.side as 'BUY' | 'SELL',
                outcome: signal.outcome as 'YES' | 'NO',
                amount: Math.min(signal.size, 100), // Cap at $100 for paper trading
                entryPrice: signal.entryPrice,
                source: 'ORACLE'
            });
        }
        setCopiedId(signal.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const truncateAddress = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const getConfidenceConfig = (confidence: string) => {
        switch (confidence) {
            case 'EXTREME':
                return {
                    bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
                    border: 'border-amber-500/50',
                    text: 'text-amber-400',
                    icon: Flame,
                    label: 'EXTREME'
                };
            case 'HIGH':
                return {
                    bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
                    border: 'border-emerald-500/50',
                    text: 'text-emerald-400',
                    icon: Shield,
                    label: 'HIGH'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
                    border: 'border-blue-500/50',
                    text: 'text-blue-400',
                    icon: Target,
                    label: 'MEDIUM'
                };
            default:
                return {
                    bg: 'bg-muted/50',
                    border: 'border-border',
                    text: 'text-muted-foreground',
                    icon: AlertTriangle,
                    label: 'LOW'
                };
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'from-amber-400 to-orange-500';
        if (score >= 60) return 'from-emerald-400 to-green-500';
        if (score >= 40) return 'from-blue-400 to-cyan-500';
        return 'from-gray-400 to-gray-500';
    };

    const filteredSignals = signals.filter(s =>
        filterConfidence === 'all' || s.confidence === filterConfidence
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-orange-500/5" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

                <div className="relative p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                                    CryptoOracle
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    AI-Powered Trading Signals • Copy the Best Traders
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {lastUpdate && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    {lastUpdate.toLocaleTimeString()}
                                </div>
                            )}
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20 transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-purple-400/80 uppercase tracking-wide">Active Signals</span>
                                <Zap className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-2xl font-bold text-purple-400">{signals.length}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-emerald-400/80 uppercase tracking-wide">High Confidence</span>
                                <Shield className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-400">
                                {signals.filter(s => s.confidence === 'HIGH' || s.confidence === 'EXTREME').length}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-amber-400/80 uppercase tracking-wide">Top Traders</span>
                                <Trophy className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="text-2xl font-bold text-amber-400">{leaderboard.length}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-blue-400/80 uppercase tracking-wide">Avg Score</span>
                                <Target className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-blue-400">
                                {signals.length > 0 ? Math.round(signals.reduce((a, b) => a + b.reliabilityScore, 0) / signals.length) : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border bg-muted/20">
                <div className="flex items-center gap-1 p-2 max-w-2xl">
                    <button
                        onClick={() => setActiveTab('signals')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'signals'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <Zap className="w-4 h-4" />
                        Trading Signals
                        {signals.length > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                {signals.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'leaderboard'
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'signals' ? (
                        <motion.div
                            key="signals"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Confidence Filters */}
                            <div className="flex items-center gap-2 mb-4">
                                {['all', 'EXTREME', 'HIGH', 'MEDIUM', 'LOW'].map((conf) => (
                                    <button
                                        key={conf}
                                        onClick={() => setFilterConfidence(conf)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterConfidence === conf
                                            ? conf === 'EXTREME' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                conf === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    conf === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                        conf === 'LOW' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                                            'bg-primary/10 text-primary border border-primary/30'
                                            : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {conf === 'all' ? 'All Signals' : conf}
                                    </button>
                                ))}
                                <div className="ml-auto text-sm text-muted-foreground">
                                    {filteredSignals.length} signals
                                </div>
                            </div>

                            {/* Signals List */}
                            <div className="space-y-3">
                                {loading && signals.length === 0 ? (
                                    <div className="text-center py-12">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
                                        <p className="text-muted-foreground">Scanning for trading signals...</p>
                                    </div>
                                ) : filteredSignals.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-border">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-muted-foreground">No signals match your filter</p>
                                    </div>
                                ) : (
                                    filteredSignals.map((signal, idx) => {
                                        const config = getConfidenceConfig(signal.confidence);
                                        const Icon = config.icon;

                                        return (
                                            <motion.div
                                                key={signal.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} p-4 hover:scale-[1.01] transition-transform`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Score Circle */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getScoreColor(signal.reliabilityScore)} flex items-center justify-center shadow-lg`}>
                                                            <span className="text-xl font-bold text-white">{signal.reliabilityScore}</span>
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${config.bg} border ${config.border}`}>
                                                            <Icon className={`w-3 h-3 ${config.text}`} />
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4 mb-2">
                                                            <div>
                                                                <h3 className="font-medium text-foreground line-clamp-1">
                                                                    {signal.question}
                                                                </h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${signal.outcome === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                        {signal.outcome}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        @ ${signal.entryPrice.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">•</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ${signal.size.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleCopyTrade(signal)}
                                                                disabled={copiedId === signal.id}
                                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${copiedId === signal.id
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
                                                                    }`}
                                                            >
                                                                {copiedId === signal.id ? (
                                                                    <>
                                                                        <Check className="w-4 h-4" />
                                                                        Copied!
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="w-4 h-4" />
                                                                        Copy Trade
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Trader Info */}
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span className="font-mono text-muted-foreground">
                                                                    {truncateAddress(signal.traderAddress)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                                                <span className={signal.traderPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                                    ${Math.abs(signal.traderPnl).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Target className="w-3.5 h-3.5 text-blue-400" />
                                                                <span className="text-blue-400">
                                                                    {(signal.traderWinRate * 100).toFixed(0)}% WR
                                                                </span>
                                                            </div>
                                                            {signal.traderRank <= 100 && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                                                                    <span className="text-amber-400">#{signal.traderRank}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Reason */}
                                                        <div className={`mt-2 text-xs ${config.text}`}>
                                                            {signal.reason}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-3 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-semibold text-amber-400 flex items-center gap-2">
                                            <Trophy className="w-5 h-5" />
                                            Top Crypto Traders
                                        </h2>

                                        {/* Period Filter Buttons */}
                                        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                                            {[
                                                { value: 'daily', label: '24h' },
                                                { value: 'weekly', label: '7j' },
                                                { value: 'monthly', label: '30j' },
                                                { value: 'all', label: 'All' }
                                            ].map((period) => (
                                                <button
                                                    key={period.value}
                                                    onClick={() => setLeaderboardPeriod(period.value as any)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${leaderboardPeriod === period.value
                                                            ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                        }`}
                                                >
                                                    {period.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    {leaderboardStats && (
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{leaderboardStats.total} traders</span>
                                            <span>•</span>
                                            <span>Avg Score: {leaderboardStats.avgScore}%</span>
                                            <span>•</span>
                                            <span className="text-emerald-400">{leaderboardStats.topTraders} top performers</span>
                                        </div>
                                    )}
                                </div>

                                <div className="divide-y divide-border">
                                    {leaderboard.map((trader, idx) => (
                                        <motion.div
                                            key={trader.address}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            {/* Rank */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${trader.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                                                trader.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                                    trader.rank === 3 ? 'bg-orange-600/20 text-orange-500' :
                                                        'bg-muted text-muted-foreground'
                                                }`}>
                                                {trader.rank <= 3 ? <Crown className="w-5 h-5" /> : trader.rank}
                                            </div>

                                            {/* Trader */}
                                            <div className="flex-1">
                                                <div className="font-mono font-medium">
                                                    {truncateAddress(trader.address)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {trader.trades} trades
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="text-right">
                                                <div className={`font-bold ${trader.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {(trader.winRate * 100).toFixed(0)}% win rate
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getScoreColor(trader.score)} text-white`}>
                                                {trader.score}
                                            </div>

                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
