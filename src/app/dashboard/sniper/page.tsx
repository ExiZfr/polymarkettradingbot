"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Crosshair,
    Play,
    Square,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Zap,
    Activity,
    Clock,
    BarChart3,
    Percent,
    AlertCircle,
} from "lucide-react";

// Types matching the Python module's virtual_ledger.json schema
interface Trade {
    trade_id: string;
    market_id: string;
    market_question: string;
    market_slug: string;
    status: "OPEN" | "CLOSED_PROFIT" | "CLOSED_LOSS";
    date_ouverture: string;
    outcome_taken: string;
    amount_invested_USDC: number;
    shares_received: number;
    price_entry: number;
    price_exit: number | null;
    date_cloture: string | null;
    gross_pnl_USDC: number | null;
    fees_simulated: number | null;
    net_pnl_USDC: number | null;
}

interface Ledger {
    capital_current_USDC: number;
    capital_initial_USDC: number;
    processed_market_ids: string[];
    trades: Trade[];
}

interface PerformanceStats {
    capitalInitial: number;
    capitalCurrent: number;
    totalNetPnl: number;
    winRate: number;
    profitFactor: number | string;
    maxDrawdown: number;
    avgPnlPerTrade: number;
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalFees: number;
}

function calculateStats(ledger: Ledger): PerformanceStats {
    const trades = ledger.trades || [];
    const closedTrades = trades.filter(t => t.status !== "OPEN");
    const openTrades = trades.filter(t => t.status === "OPEN");
    const winningTrades = closedTrades.filter(t => (t.net_pnl_USDC || 0) >= 0);
    const losingTrades = closedTrades.filter(t => (t.net_pnl_USDC || 0) < 0);

    const totalGrossProfit = winningTrades.reduce((sum, t) => sum + (t.gross_pnl_USDC || 0), 0);
    const totalGrossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.gross_pnl_USDC || 0), 0));
    const totalNetPnl = closedTrades.reduce((sum, t) => sum + (t.net_pnl_USDC || 0), 0);
    const totalFees = closedTrades.reduce((sum, t) => sum + (t.fees_simulated || 0), 0);

    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : "∞";
    const avgPnlPerTrade = closedTrades.length > 0 ? totalNetPnl / closedTrades.length : 0;

    return {
        capitalInitial: ledger.capital_initial_USDC,
        capitalCurrent: ledger.capital_current_USDC,
        totalNetPnl,
        winRate,
        profitFactor,
        maxDrawdown: 0, // Would need equity curve calculation
        avgPnlPerTrade,
        totalTrades: trades.length,
        openTrades: openTrades.length,
        closedTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        totalFees,
    };
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    color = "primary",
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
    trend?: "up" | "down" | "neutral";
    color?: "primary" | "green" | "red" | "yellow";
}) {
    const colorClasses = {
        primary: "from-primary/20 to-primary/5 border-primary/20",
        green: "from-green-500/20 to-green-500/5 border-green-500/20",
        red: "from-red-500/20 to-red-500/5 border-red-500/20",
        yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20",
    };

    const iconColors = {
        primary: "text-primary",
        green: "text-green-500",
        red: "text-red-500",
        yellow: "text-yellow-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-5 backdrop-blur-xl`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                    {subValue && (
                        <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>
                    )}
                </div>
                <div className={`rounded-xl bg-background/50 p-2.5 ${iconColors[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            {trend && (
                <div className="absolute bottom-3 right-3">
                    {trend === "up" && <TrendingUp size={16} className="text-green-500" />}
                    {trend === "down" && <TrendingDown size={16} className="text-red-500" />}
                </div>
            )}
        </motion.div>
    );
}

// Trade Row Component
function TradeRow({ trade, index }: { trade: Trade; index: number }) {
    const statusColors = {
        OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        CLOSED_PROFIT: "bg-green-500/10 text-green-500 border-green-500/20",
        CLOSED_LOSS: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    const statusLabels = {
        OPEN: "Open",
        CLOSED_PROFIT: "Won",
        CLOSED_LOSS: "Lost",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${trade.outcome_taken === "YES" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <Target size={16} className={trade.outcome_taken === "YES" ? "text-green-500" : "text-red-500"} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                        {trade.market_question || "Unknown Market"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {trade.outcome_taken} @ ${trade.price_entry.toFixed(4)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                        ${trade.amount_invested_USDC.toFixed(2)}
                    </p>
                    {trade.net_pnl_USDC !== null && (
                        <p className={`text-xs ${trade.net_pnl_USDC >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {trade.net_pnl_USDC >= 0 ? "+" : ""}${trade.net_pnl_USDC.toFixed(2)}
                        </p>
                    )}
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[trade.status]}`}>
                    {statusLabels[trade.status]}
                </span>
            </div>
        </motion.div>
    );
}

export default function SniperPage() {
    const [ledger, setLedger] = useState<Ledger | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // In a real implementation, this would fetch from an API
    // For now, we'll simulate with default data
    const loadLedger = useCallback(async () => {
        setIsLoading(true);
        try {
            // Simulated ledger data - in production, fetch from API
            const mockLedger: Ledger = {
                capital_current_USDC: 10000.00,
                capital_initial_USDC: 10000.00,
                processed_market_ids: [],
                trades: [],
            };
            setLedger(mockLedger);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Failed to load ledger:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLedger();
    }, [loadLedger]);

    const stats = ledger ? calculateStats(ledger) : null;

    const handleStartStop = () => {
        setIsRunning(!isRunning);
        // In production, this would call an API to start/stop the Python sniper
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Crosshair className="text-primary" size={24} />
                        </div>
                        Market Sniper
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Paper trading simulation for new market opportunities
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadLedger}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={handleStartStop}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${isRunning
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <Square size={16} />
                                Stop Sniper
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                Start Sniper
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${isRunning
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-yellow-500/5 border-yellow-500/20"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`relative flex h-3 w-3`}>
                        {isRunning && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning ? "bg-green-500" : "bg-yellow-500"}`}></span>
                    </div>
                    <span className={`font-medium ${isRunning ? "text-green-500" : "text-yellow-500"}`}>
                        {isRunning ? "Sniper Active - Scanning Markets" : "Sniper Idle - Ready to Deploy"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} />
                    Last refresh: {lastRefresh.toLocaleTimeString()}
                </div>
            </motion.div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={DollarSign}
                        label="Current Capital"
                        value={`$${stats.capitalCurrent.toLocaleString()}`}
                        subValue={`Started: $${stats.capitalInitial.toLocaleString()}`}
                        color="primary"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Total P&L"
                        value={`${stats.totalNetPnl >= 0 ? "+" : ""}$${stats.totalNetPnl.toFixed(2)}`}
                        subValue={`Fees: $${stats.totalFees.toFixed(2)}`}
                        trend={stats.totalNetPnl >= 0 ? "up" : "down"}
                        color={stats.totalNetPnl >= 0 ? "green" : "red"}
                    />
                    <StatCard
                        icon={Percent}
                        label="Win Rate"
                        value={`${stats.winRate.toFixed(1)}%`}
                        subValue={`${stats.winningTrades}W / ${stats.losingTrades}L`}
                        color={stats.winRate >= 50 ? "green" : "red"}
                    />
                    <StatCard
                        icon={BarChart3}
                        label="Profit Factor"
                        value={typeof stats.profitFactor === "number" ? stats.profitFactor.toFixed(2) : stats.profitFactor}
                        subValue={`Avg: $${stats.avgPnlPerTrade.toFixed(2)}/trade`}
                        color="yellow"
                    />
                </div>
            )}

            {/* Configuration Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
            >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-primary" />
                    Sniper Configuration
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Bet</p>
                        <p className="text-lg font-bold text-foreground mt-1">$500.00</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Price Tolerance</p>
                        <p className="text-lg font-bold text-foreground mt-1">5%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Take Profit</p>
                        <p className="text-lg font-bold text-foreground mt-1">10¢</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform Fee</p>
                        <p className="text-lg font-bold text-foreground mt-1">2%</p>
                    </div>
                </div>
            </motion.div>

            {/* Trades Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Activity size={18} className="text-primary" />
                        Trade Journal
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {stats?.totalTrades || 0} total trades
                    </span>
                </div>

                {ledger && ledger.trades.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {ledger.trades.slice().reverse().map((trade, index) => (
                            <TradeRow key={trade.trade_id} trade={trade} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                            <AlertCircle size={32} className="text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No trades yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Start the sniper to begin paper trading
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
