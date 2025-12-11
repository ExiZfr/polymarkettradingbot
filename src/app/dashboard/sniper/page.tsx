"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Crosshair,
    Play,
    Square,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Zap,
    Activity,
    Clock,
    BarChart3,
    Percent,
    Radar,
    Search,
    Trash2
} from "lucide-react";
import SniperGuide from "@/components/dashboard/SniperGuide";
import FileLogsConsole from "@/components/dashboard/FileLogsConsole";

interface Trade {
    trade_id: string;
    status: "OPEN" | "CLOSED_PROFIT" | "CLOSED_LOSS";
    net_pnl_USDC: number | null;
    gross_pnl_USDC: number | null;
    fees_simulated: number | null;
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
    winningTrades: number;
    losingTrades: number;
    openTrades: number;
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

    return {
        capitalInitial: ledger.capital_initial_USDC,
        capitalCurrent: ledger.capital_current_USDC,
        totalNetPnl,
        winRate,
        profitFactor: typeof profitFactor === 'number' ? profitFactor.toFixed(2) : profitFactor,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        openTrades: openTrades.length,
        totalFees,
    };
}

function StatCard({ label, value, subValue, trend, color = "primary", icon: Icon }: any) {
    const gradients = {
        primary: "bg-linear-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20",
        green: "bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
        red: "bg-linear-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20",
        yellow: "bg-linear-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20",
    };

    // Fallback for color string if not in map
    const bgClass = gradients[color as keyof typeof gradients] || gradients.primary;
    const textClass = `text-${color === 'primary' ? 'blue' : color === 'green' ? 'emerald' : color === 'red' ? 'rose' : 'amber'}-500`;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={`p-5 rounded-2xl border backdrop-blur-sm ${bgClass}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="text-2xl font-black mt-2 tracking-tight">{value}</p>
                    {subValue && <p className="text-xs font-medium text-muted-foreground mt-1">{subValue}</p>}
                </div>
                <div className={`p-2 rounded-xl bg-background/50 ${textClass}`}>
                    <Icon size={20} />
                </div>
            </div>
        </motion.div>
    );
}

export default function SniperPage() {
    const [ledger, setLedger] = useState<Ledger | null>(null);
    // const [isRunning, setIsRunning] = useState(true); // Deprecated: Always running 24/7 now
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchLedger = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sniper/data');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setLedger(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLedger();
        // Poll every 5 seconds for live updates
        const interval = setInterval(fetchLedger, 5000);
        return () => clearInterval(interval);
    }, [fetchLedger]);

    const handleReset = async () => {
        if (!confirm("Attention: Cela va réinitialiser le compte à $1000 et effacer l'historique. Continuer ?")) return;
        try {
            await fetch('/api/sniper/reset', { method: 'POST' });
            fetchLedger();
        } catch (e) {
            console.error(e);
        }
    };

    const stats = ledger ? calculateStats(ledger) : null;

    return (
        <div className="space-y-6 relative pb-20">
            {/* Background Decor */}
            <div className="fixed top-0 right-0 p-20 opacity-5 pointer-events-none">
                <Crosshair size={400} />
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <span className="p-2 bg-primary text-primary-foreground rounded-lg">
                            <Crosshair size={24} />
                        </span>
                        Market Sniper
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">v1.0</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Le bot scanne la blockchain en temps réel pour détecter les inefficacités de prix avant les humains.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="font-bold text-sm tracking-wide">ACTIVE 24/7</span>
                    </div>

                    <button
                        onClick={fetchLedger}
                        className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
                        title="Force Refresh"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Radar Activity Visualizer */}
            <div className="relative w-full h-2 overflow-hidden rounded-full bg-muted/30">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-primary to-transparent opacity-50"
                />
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Capital Total"
                        value={`$${stats.capitalCurrent.toLocaleString()}`}
                        subValue={`Départ: $${stats.capitalInitial.toLocaleString()}`}
                        icon={DollarSign}
                        color="primary"
                    />
                    <StatCard
                        label="P&L Net"
                        value={`${stats.totalNetPnl >= 0 ? "+" : ""}$${stats.totalNetPnl.toFixed(2)}`}
                        subValue={`Frais payés: $${stats.totalFees.toFixed(2)}`}
                        icon={TrendingUp}
                        color={stats.totalNetPnl >= 0 ? "green" : "red"}
                    />
                    <StatCard
                        label="Win Rate"
                        value={`${stats.winRate.toFixed(1)}%`}
                        subValue={`${stats.winningTrades} gagnés / ${stats.losingTrades} perdus`}
                        icon={Percent}
                        color={stats.winRate >= 50 ? "green" : "red"}
                    />
                    <StatCard
                        label="Profit Factor"
                        value={stats.profitFactor}
                        subValue="Ratio Gains / Pertes"
                        icon={BarChart3}
                        color="yellow"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel & Console */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Paramètres de Tir</h3>
                                    <p className="text-sm text-muted-foreground">Configuration actuelle du script Python</p>
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Réinitialiser les données"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ConfigBox label="Mise Max" value="$100.00" desc="Risque par trade" />
                            <ConfigBox label="Tolerance" value="5%" desc="Écart vs 50/50" />
                            <ConfigBox label="Take Profit" value="10¢" desc="Target gain" />
                            <ConfigBox label="Slippage" value="Auto" desc="Simulation AMM" />
                        </div>
                    </motion.div>

                    {/* Integrated Console */}
                    <FileLogsConsole />
                </div>

                {/* Quick Status Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 flex flex-col justify-center"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">Scanner Status</h3>
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>

                    {/* Total Markets Analyzed - Big Counter */}
                    <motion.div
                        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-500/10 via-purple-500/10 to-blue-500/5 border border-blue-500/20 p-6 mb-4"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Radar className="text-blue-500" size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Total Analysés
                                </span>
                            </div>
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        </div>
                        <motion.div
                            key={ledger?.processed_market_ids.length || 0}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="text-5xl font-black tracking-tighter text-foreground"
                        >
                            {(ledger?.processed_market_ids.length || 0).toLocaleString()}
                        </motion.div>
                        <p className="text-xs text-muted-foreground mt-2">
                            marchés détectés depuis le démarrage
                        </p>

                        {/* Subtle background pattern */}
                        <div className="absolute top-0 right-0 opacity-5">
                            <Search size={80} />
                        </div>
                    </motion.div>

                    <div className="space-y-4 my-4">
                        <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                            <span className="text-muted-foreground">Positions Ouvertes</span>
                            <span className="font-mono text-yellow-500 font-bold">{stats?.openTrades || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dernier Update</span>
                            <span className="font-mono text-xs">{lastRefresh.toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <a href="/dashboard/orders" className="mt-auto w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Activity size={16} />
                        Voir Historique Complet
                    </a>
                </motion.div>
            </div>

            {/* Help Component */}
            <SniperGuide />
        </div>
    );
}

// Helper Subcomponent
function ConfigBox({ label, value, desc }: any) {
    return (
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
        </div>
    );
}

