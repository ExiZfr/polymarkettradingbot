'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Play, Pause, Settings, BarChart3,
    ArrowUpRight, ArrowDownRight, Zap, Target,
    Shield, TrendingUp, Terminal, Clock, AlertTriangle,
    Wallet, RefreshCw, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';

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
    status: 'PENDING' | 'EXECUTED' | 'CLOSED';
    pnl?: number;
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
    const [showLogs, setShowLogs] = useState(false);

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
        const interval = setInterval(fetchData, 3000); // 3s polling for HFT feel
        return () => clearInterval(interval);
    }, [fetchData]);

    // Formatters
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const formatPct = (val: number) => `${(val).toFixed(1)}%`;
    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

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
                                    Mean Reversion HFT
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${status?.running
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${status?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        {status?.running ? 'System Online' : 'System Offline'}
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground border border-border">
                                        v1.0.4-stable
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${status?.mode === 'live'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                        {status?.mode === 'live' ? 'LIVE TRADING' : 'SIMULATION MODE'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls & Bankroll */}
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <div className="text-sm text-muted-foreground mb-1">Current Bankroll</div>
                                <div className="text-2xl font-mono font-bold text-foreground">
                                    {status ? formatCurrency(status.bankroll) : '$---'}
                                </div>
                                <div className={`text-xs font-medium ${(status?.dailyPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {status && status.dailyPnl > 0 ? '+' : ''}{status ? formatCurrency(status.dailyPnl) : '$0.00'} Today
                                </div>
                            </div>

                            <div className="h-10 w-px bg-border hidden md:block" />

                            <button className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 ${status?.running
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 shadow-red-500/5'
                                    : 'bg-green-500 text-white hover:bg-green-400 shadow-green-500/20'
                                }`}>
                                {status?.running ? (
                                    <><Pause className="w-5 h-5 fill-current" /> STOP BOT</>
                                ) : (
                                    <><Play className="w-5 h-5 fill-current" /> START BOT</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KPI GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PnL Card */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-cyan-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded bg-muted ${(stats?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            All Time
                        </span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Total Net P&L</div>
                        <div className={`text-3xl font-bold tracking-tight ${(stats?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {stats ? formatCurrency(stats.totalPnl) : '$0.00'}
                        </div>
                    </div>
                </div>

                {/* Win Rate Card */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                            {stats?.closedSignals || 0} Trades
                        </span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">
                            {stats ? formatPct(stats.winRate) : '0.0%'}
                        </div>
                    </div>
                </div>

                {/* Signals Card */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-purple-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Active Signals</div>
                        <div className="text-3xl font-bold tracking-tight text-purple-400">
                            {stats ? stats.pendingSignals + stats.executedSignals : 0}
                        </div>
                    </div>
                </div>

                {/* Avg Z-Score Card */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-amber-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                            Target {'>'} 2.0σ
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

            {/* --- MAIN CONTENT & SIGNALS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Logic & Console */}
                <div className="space-y-6">
                    {/* Strategy Logic Box */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-cyan-400" />
                            <h3 className="font-bold">Strategy Logic</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Condition 1</div>
                                <div className="text-sm font-medium">Wait for Price Spike (Pump/Dump)</div>
                                <div className="text-xs text-cyan-400 mt-1">Z-Score {'>'} 2.0σ on 1m timeframe</div>
                            </div>
                            <div className="flex justify-center -my-2 opacity-30">
                                <ArrowDownRight className="w-4 h-4" />
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Condition 2</div>
                                <div className="text-sm font-medium">Fade the Move (Mean Reversion)</div>
                                <div className="text-xs text-purple-400 mt-1">Bet against the crowd emotion</div>
                            </div>
                            <div className="flex justify-center -my-2 opacity-30">
                                <ArrowDownRight className="w-4 h-4" />
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Exit Strategy</div>
                                <div className="text-sm font-medium">Time-Based Stop or Profit Target</div>
                                <div className="text-xs text-emerald-400 mt-1">Max hold: 5 mins • Kelly Sizing: 25%</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Logs Preview */}
                    <div className="rounded-2xl border border-border bg-black/40 overflow-hidden text-xs font-mono">
                        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-muted-foreground">System Logs</span>
                            </div>
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                            {signals.slice(0, 5).map((sig) => (
                                <div key={sig.id} className="flex gap-2 text-gray-400">
                                    <span className="text-gray-600 shrink-0">[{formatTime(sig.timestamp)}]</span>
                                    <span>
                                        Signal detected: <span className={sig.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}>{sig.direction}</span> ratio {sig.zScore}σ on {sig.symbol}
                                    </span>
                                </div>
                            ))}
                            <div className="text-gray-600 italic">... monitoring 15min markets ...</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Signals Table */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-cyan-500 rounded-full" />
                            <h3 className="font-bold text-lg">Live Signals Feed</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Real-time
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Last update: {formatTime(lastRefreshed.toISOString())}
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4 text-left">Time</th>
                                    <th className="px-6 py-4 text-left">Market / Question</th>
                                    <th className="px-6 py-4 text-left">Detected Anomaly</th>
                                    <th className="px-6 py-4 text-center">Execution</th>
                                    <th className="px-6 py-4 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {signals.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                                    <Activity className="w-8 h-8 opacity-20" />
                                                </div>
                                                <p className="font-medium">No active anomalies detected.</p>
                                                <p className="text-sm opacity-60 mt-1">Scanning 1-minute candles on BTC/ETH...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    signals.map((sig) => (
                                        <tr key={sig.id} className="hover:bg-muted/30 transition-colors group">
                                            {/* Time */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                                                {formatTime(sig.timestamp)}
                                            </td>

                                            {/* Market */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg shrink-0 ${sig.symbol.includes('BTC')
                                                            ? 'bg-orange-500/10 text-orange-400'
                                                            : 'bg-indigo-500/10 text-indigo-400'
                                                        }`}>
                                                        {sig.symbol.includes('BTC') ? <span className="font-bold">₿</span> : <span className="font-bold">Ξ</span>}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{sig.symbol}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={sig.marketQuestion}>
                                                            {sig.marketQuestion}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Anomaly / Z-Score */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <span className="text-purple-400">{sig.zScore}σ</span>
                                                        <span className="text-muted-foreground text-xs">deviation</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500 rounded-full"
                                                            style={{ width: `${Math.min(100, (sig.zScore / 4) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className={`text-xs ${sig.direction === 'LONG' ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        Predicted Reversion: {sig.direction}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Execution Details */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-end text-sm">
                                                    <div className="bg-muted px-2 py-1 rounded text-xs font-mono mb-1">
                                                        {sig.outcome} @ {sig.entryPrice.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        EV: <span className="text-green-400">+{(sig.expectedValue * 100).toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status / Result */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {sig.status === 'PENDING' && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {sig.status === 'EXECUTED' && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">
                                                            Live
                                                        </span>
                                                    )}
                                                    {sig.status === 'CLOSED' && sig.pnl !== undefined && (
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${sig.pnl >= 0
                                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            }`}>
                                                            {sig.pnl >= 0 ? '+' : ''}{formatCurrency(sig.pnl)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
