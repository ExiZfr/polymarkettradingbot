'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Play, Pause, BarChart3,
    ArrowUpRight, ArrowDownRight, Zap, Target,
    Shield, TrendingUp, Terminal, ExternalLink,
    Wallet, RefreshCw, CheckCircle2, XCircle, DollarSign, Bell
} from 'lucide-react';
import { paperStore } from '@/lib/paper-trading';
import { useToast } from '@/contexts/ToastContext';
import PolymarketLink from '@/components/ui/PolymarketLink';

// Types
interface StrategySignal {
    id: string;
    timestamp: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    zScore: number;
    confidence: number;
    entryPrice: number;
    expectedValue: number;
    kellySize: number;
    marketQuestion: string;
    outcome: 'Yes' | 'No';
    status: 'PENDING' | 'EXECUTED' | 'CLOSED' | 'SKIPPED' | 'TAKEN';
    pnl?: number;
    marketId?: string;
    marketImage?: string;
    marketUrl?: string;
    marketSlug?: string;
}

interface StrategyStats {
    totalSignals: number;
    pendingSignals: number;
    executedSignals: number;
    closedSignals: number;
    totalPnl: number;
    winRate: number;
    avgZScore: number;
    avgConfidence: number;
}

interface BotStatus {
    running: boolean;
    mode: 'simulation' | 'live';
    bankroll: number;
    dailyPnl: number;
    wins: number;
    trades: number;
    lastUpdate: string;
}

export default function OraclePage() {
    const [loading, setLoading] = useState(true);
    const [signals, setSignals] = useState<StrategySignal[]>([]);
    const [stats, setStats] = useState<StrategyStats | null>(null);
    const [status, setStatus] = useState<BotStatus | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [takenSignals, setTakenSignals] = useState<Set<string>>(new Set());
    const [skippedSignals, setSkippedSignals] = useState<Set<string>>(new Set());
    const [tradeAmount, setTradeAmount] = useState<number>(10);
    const [autoMode, setAutoMode] = useState<boolean>(false); // Manual by default

    const { showSuccessToast, showErrorToast } = useToast();

    // Fetch Strategy Data
    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/oracle/strategy');
            if (res.ok) {
                const data = await res.json();
                setSignals(data.signals || []);
                setStats(data.stats || null);
                setStatus(data.status || null);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch strategy:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and polling
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5s polling
        return () => clearInterval(interval);
    }, [fetchData]);

    // Auto-execute trades when autoMode is ON
    useEffect(() => {
        if (!autoMode) return;

        // Find new actionable signals that haven't been processed
        const newSignals = signals.filter(s =>
            (s.status === 'PENDING' || s.status === 'EXECUTED') &&
            !takenSignals.has(s.id) &&
            !skippedSignals.has(s.id)
        );

        // Auto-take each new signal
        newSignals.forEach(signal => {
            const profile = paperStore.getActiveProfile();
            if (profile && profile.currentBalance >= tradeAmount) {
                const order = paperStore.placeOrder({
                    marketId: signal.marketId || signal.id,
                    marketTitle: signal.marketQuestion,
                    marketImage: signal.marketImage,
                    marketUrl: signal.marketUrl,
                    marketSlug: signal.marketSlug,
                    type: 'BUY',
                    outcome: signal.outcome === 'Yes' ? 'YES' : 'NO',
                    entryPrice: signal.entryPrice,
                    amount: tradeAmount,
                    source: 'MEAN_REVERSION',
                    notes: `[AUTO] Z-Score: ${signal.zScore}σ | EV: ${(signal.expectedValue * 100).toFixed(1)}%`
                });

                if (order) {
                    setTakenSignals(prev => new Set([...prev, signal.id]));
                    showSuccessToast('Auto Trade!', `${signal.direction} ${signal.outcome} @ ${signal.entryPrice.toFixed(3)}`);
                }
            }
        });
    }, [signals, autoMode, takenSignals, skippedSignals, tradeAmount, showSuccessToast]);

    // Take Trade - Execute in Paper Trading
    const handleTakeTrade = (signal: StrategySignal) => {
        const profile = paperStore.getActiveProfile();

        if (!profile || profile.currentBalance < tradeAmount) {
            showErrorToast('Insufficient Balance', 'Not enough paper trading balance');
            return;
        }

        const order = paperStore.placeOrder({
            marketId: signal.marketId || signal.id,
            marketTitle: signal.marketQuestion,
            marketImage: signal.marketImage,
            marketUrl: signal.marketUrl,
            marketSlug: signal.marketSlug,
            type: 'BUY',
            outcome: signal.outcome === 'Yes' ? 'YES' : 'NO',
            entryPrice: signal.entryPrice,
            amount: tradeAmount,
            source: 'MEAN_REVERSION',
            notes: `Z-Score: ${signal.zScore}σ | EV: ${(signal.expectedValue * 100).toFixed(1)}% | Direction: ${signal.direction}`
        });

        if (order) {
            setTakenSignals(prev => new Set([...prev, signal.id]));
            showSuccessToast('Trade Executed!', `${signal.direction} ${signal.outcome} @ ${signal.entryPrice.toFixed(3)} ($${tradeAmount})`);
        } else {
            showErrorToast('Trade Failed', 'Could not place order');
        }
    };

    // Skip Signal
    const handleSkipSignal = (signalId: string) => {
        setSkippedSignals(prev => new Set([...prev, signalId]));
    };

    // Formatters
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const formatPct = (val: number) => `${(val).toFixed(1)}%`;
    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Filter pending signals that haven't been acted on
    const actionableSignals = signals.filter(s =>
        (s.status === 'PENDING' || s.status === 'EXECUTED') &&
        !takenSignals.has(s.id) &&
        !skippedSignals.has(s.id)
    );

    const paperProfile = paperStore.getActiveProfile();

    return (
        <div className="min-h-screen bg-background text-foreground space-y-6 p-6">

            {/* --- HEADER SECTION --- */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                        {/* Title & Status */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                                    <Activity className="w-8 h-8 text-white" />
                                </div>
                                {status?.running && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-background"></span>
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                                    Mean Reversion Signals
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${status?.running
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${status?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        {status?.running ? 'Scanning...' : 'Offline'}
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium">
                                        PAPER TRADING
                                    </div>
                                    {actionableSignals.length > 0 && (
                                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium animate-pulse">
                                            <Bell className="w-3 h-3" />
                                            {actionableSignals.length} New Signal{actionableSignals.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Controls: Mode Toggle, Balance, Trade Size */}
                        <div className="flex items-center gap-6">
                            {/* Auto/Manual Toggle */}
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Execution Mode</div>
                                <div className="flex items-center bg-muted rounded-lg p-1">
                                    <button
                                        onClick={() => setAutoMode(false)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!autoMode
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => setAutoMode(true)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${autoMode
                                            ? 'bg-green-500 text-white shadow'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Auto
                                    </button>
                                </div>
                            </div>

                            <div className="h-10 w-px bg-border" />

                            <div className="text-right">
                                <div className="text-sm text-muted-foreground mb-1">Paper Balance</div>
                                <div className="text-2xl font-mono font-bold text-foreground">
                                    {paperProfile ? formatCurrency(paperProfile.currentBalance) : '$---'}
                                </div>
                            </div>

                            <div className="h-10 w-px bg-border" />

                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Trade Size</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setTradeAmount(Math.max(5, tradeAmount - 5))}
                                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-bold"
                                    >-</button>
                                    <div className="w-20 text-center font-mono font-bold text-lg">
                                        ${tradeAmount}
                                    </div>
                                    <button
                                        onClick={() => setTradeAmount(Math.min(100, tradeAmount + 5))}
                                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-bold"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KPI GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Actionable Signals */}
                <div className="p-5 rounded-2xl bg-card border border-purple-500/30 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded animate-pulse">
                                ACTION NEEDED
                            </span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Pending Signals</div>
                            <div className="text-3xl font-bold tracking-tight text-purple-400">
                                {actionableSignals.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trades Taken */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-green-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                            Today
                        </span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Trades Taken</div>
                        <div className="text-3xl font-bold tracking-tight text-green-400">
                            {takenSignals.size}
                        </div>
                    </div>
                </div>

                {/* Win Rate */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Signal Win Rate</div>
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">
                            {stats ? formatPct(stats.winRate) : '0.0%'}
                        </div>
                    </div>
                </div>

                {/* Avg Z-Score */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-amber-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                            {'>'} 2.0σ = Signal
                        </span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Avg Signal Strength</div>
                        <div className="text-3xl font-bold tracking-tight text-amber-400">
                            {stats ? stats.avgZScore.toFixed(2) : '0.00'}σ
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Strategy Info */}
                <div className="space-y-6">
                    {/* Strategy Logic */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-cyan-400" />
                            <h3 className="font-bold">How It Works</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                <div className="text-muted-foreground">Bot scans BTC/ETH 1-min candles for <span className="text-cyan-400 font-medium">Z-Score {'>'} 2σ</span> anomalies</div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                <div className="text-muted-foreground">Detects pumps/dumps and predicts <span className="text-purple-400 font-medium">Mean Reversion</span></div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                <div className="text-muted-foreground">You decide: <span className="text-green-400 font-medium">Take</span> or <span className="text-red-400 font-medium">Skip</span> the trade</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            <h3 className="font-bold">Session Stats</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 rounded-xl bg-muted/50">
                                <div className="text-muted-foreground">Total Signals</div>
                                <div className="text-xl font-bold">{stats?.totalSignals || 0}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50">
                                <div className="text-muted-foreground">Skipped</div>
                                <div className="text-xl font-bold text-red-400">{skippedSignals.size}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50">
                                <div className="text-muted-foreground">Avg EV</div>
                                <div className="text-xl font-bold text-green-400">
                                    +{((stats?.avgConfidence || 0) * 0.15).toFixed(1)}%
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50">
                                <div className="text-muted-foreground">Last Update</div>
                                <div className="text-sm font-mono">{formatTime(lastRefreshed.toISOString())}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Signal Cards */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Live Trading Signals
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Auto-refresh: 5s
                        </div>
                    </div>

                    {/* No signals state */}
                    {signals.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="font-medium text-lg mb-2">Scanning for Anomalies...</h3>
                            <p className="text-sm text-muted-foreground">
                                The bot is monitoring BTC/ETH markets for Z-Score {'>'} 2σ deviations.
                                <br />Signals will appear here when detected.
                            </p>
                        </div>
                    )}

                    {/* Signal Cards */}
                    <AnimatePresence>
                        {signals.map((signal) => {
                            const isTaken = takenSignals.has(signal.id);
                            const isSkipped = skippedSignals.has(signal.id);
                            const isActionable = !isTaken && !isSkipped && (signal.status === 'PENDING' || signal.status === 'EXECUTED');

                            return (
                                <motion.div
                                    key={signal.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className={`rounded-2xl border bg-card overflow-hidden transition-all ${isActionable
                                        ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
                                        : isTaken
                                            ? 'border-green-500/30 opacity-75'
                                            : isSkipped
                                                ? 'border-border opacity-50'
                                                : 'border-border'
                                        }`}
                                >
                                    {/* Signal Header */}
                                    <div className={`p-4 border-b border-border/50 ${isActionable ? 'bg-purple-500/5' : ''
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* Direction Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${signal.direction === 'LONG'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {signal.direction === 'LONG'
                                                        ? <ArrowUpRight className="w-6 h-6" />
                                                        : <ArrowDownRight className="w-6 h-6" />
                                                    }
                                                </div>
                                                {/* Symbol & Question */}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-lg">{signal.symbol}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${signal.direction === 'LONG'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {signal.direction}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                                                            {signal.marketQuestion}
                                                        </div>
                                                        {signal.marketId && (
                                                            <PolymarketLink
                                                                marketId={signal.marketId}
                                                                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </PolymarketLink>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Time */}
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Detected</div>
                                                <div className="font-mono text-sm">{formatTime(signal.timestamp)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signal Body */}
                                    <div className="p-4">
                                        <div className="grid grid-cols-4 gap-4 mb-4">
                                            {/* Z-Score */}
                                            <div className="text-center p-3 rounded-xl bg-muted/50">
                                                <div className="text-xs text-purple-400 mb-1">Z-Score</div>
                                                <div className="text-xl font-bold text-purple-400">{signal.zScore}σ</div>
                                                <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full"
                                                        style={{ width: `${Math.min(100, (signal.zScore / 4) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Entry Price */}
                                            <div className="text-center p-3 rounded-xl bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                                                <div className="text-xl font-bold">{signal.entryPrice.toFixed(2)}¢</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Buy {signal.outcome}
                                                </div>
                                            </div>
                                            {/* Expected Value */}
                                            <div className="text-center p-3 rounded-xl bg-muted/50">
                                                <div className="text-xs text-green-400 mb-1">Expected Value</div>
                                                <div className="text-xl font-bold text-green-400">
                                                    +{(signal.expectedValue * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                            {/* Kelly */}
                                            <div className="text-center p-3 rounded-xl bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">Kelly Size</div>
                                                <div className="text-xl font-bold">{(signal.kellySize * 100).toFixed(0)}%</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {isActionable ? (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleTakeTrade(signal)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 active:scale-95"
                                                >
                                                    <DollarSign className="w-5 h-5" />
                                                    Take Trade (${tradeAmount})
                                                </button>
                                                <button
                                                    onClick={() => handleSkipSignal(signal.id)}
                                                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-all"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    Skip
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`py-3 px-4 rounded-xl text-center font-medium ${isTaken
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : isSkipped
                                                    ? 'bg-muted text-muted-foreground'
                                                    : signal.status === 'CLOSED'
                                                        ? 'bg-gray-500/10 text-gray-400'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {isTaken ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Trade Taken
                                                    </span>
                                                ) : isSkipped ? (
                                                    'Skipped'
                                                ) : signal.status === 'CLOSED' ? (
                                                    <span>
                                                        Closed {signal.pnl !== undefined && (
                                                            <span className={signal.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                                ({signal.pnl >= 0 ? '+' : ''}{formatCurrency(signal.pnl)})
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    signal.status
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
