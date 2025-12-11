"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Filter,
    Download,
    Search,
    Calendar,
    ArrowUpDown,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Timer,
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

type FilterStatus = "ALL" | "OPEN" | "CLOSED_PROFIT" | "CLOSED_LOSS";

// Summary Stats Component
function SummaryStats({ trades }: { trades: Trade[] }) {
    const openTrades = trades.filter(t => t.status === "OPEN");
    const closedTrades = trades.filter(t => t.status !== "OPEN");
    const wonTrades = trades.filter(t => t.status === "CLOSED_PROFIT");
    const lostTrades = trades.filter(t => t.status === "CLOSED_LOSS");

    const totalInvested = trades.reduce((sum, t) => sum + t.amount_invested_USDC, 0);
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.net_pnl_USDC || 0), 0);
    const totalFees = closedTrades.reduce((sum, t) => sum + (t.fees_simulated || 0), 0);

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen size={14} />
                    <span className="text-xs uppercase tracking-wider">Total</span>
                </div>
                <p className="text-xl font-bold text-foreground">{trades.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                    <Timer size={14} />
                    <span className="text-xs uppercase tracking-wider">Open</span>
                </div>
                <p className="text-xl font-bold text-yellow-500">{openTrades.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                    <CheckCircle2 size={14} />
                    <span className="text-xs uppercase tracking-wider">Won</span>
                </div>
                <p className="text-xl font-bold text-green-500">{wonTrades.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                    <XCircle size={14} />
                    <span className="text-xs uppercase tracking-wider">Lost</span>
                </div>
                <p className="text-xl font-bold text-red-500">{lostTrades.length}</p>
            </div>
            <div className={`p-4 rounded-xl border ${totalPnl >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className={`flex items-center gap-2 mb-1 ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="text-xs uppercase tracking-wider">Net P&L</span>
                </div>
                <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                </p>
            </div>
        </div>
    );
}

// Trade Row Component (Detailed)
function TradeRow({ trade, index }: { trade: Trade; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusConfig = {
        OPEN: {
            color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            icon: Timer,
            label: "Open"
        },
        CLOSED_PROFIT: {
            color: "bg-green-500/10 text-green-500 border-green-500/20",
            icon: CheckCircle2,
            label: "Won"
        },
        CLOSED_LOSS: {
            color: "bg-red-500/10 text-red-500 border-red-500/20",
            icon: XCircle,
            label: "Lost"
        },
    };

    const config = statusConfig[trade.status];
    const StatusIcon = config.icon;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="rounded-xl border border-border/50 bg-card overflow-hidden"
        >
            {/* Main Row */}
            <div
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={`p-2.5 rounded-xl ${config.color}`}>
                        <StatusIcon size={18} />
                    </div>

                    {/* Market Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {trade.market_question || "Unknown Market"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${trade.outcome_taken === "YES"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-red-500/10 text-red-500"
                                }`}>
                                {trade.outcome_taken}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(trade.date_ouverture)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-6">
                    {/* Entry Price */}
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Entry</p>
                        <p className="text-sm font-medium text-foreground">${trade.price_entry.toFixed(4)}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Invested</p>
                        <p className="text-sm font-medium text-foreground">${trade.amount_invested_USDC.toFixed(2)}</p>
                    </div>

                    {/* P&L */}
                    <div className="text-right min-w-[80px]">
                        <p className="text-xs text-muted-foreground">P&L</p>
                        {trade.net_pnl_USDC !== null ? (
                            <p className={`text-sm font-bold ${trade.net_pnl_USDC >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {trade.net_pnl_USDC >= 0 ? "+" : ""}${trade.net_pnl_USDC.toFixed(2)}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                        )}
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${config.color}`}>
                        {config.label}
                    </span>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50 bg-muted/20"
                    >
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Trade ID</p>
                                <p className="text-sm font-mono text-foreground">{trade.trade_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Shares Received</p>
                                <p className="text-sm text-foreground">{trade.shares_received.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Exit Price</p>
                                <p className="text-sm text-foreground">
                                    {trade.price_exit !== null ? `$${trade.price_exit.toFixed(4)}` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Fees Paid</p>
                                <p className="text-sm text-foreground">
                                    {trade.fees_simulated !== null ? `$${trade.fees_simulated.toFixed(2)}` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Gross P&L</p>
                                <p className={`text-sm ${(trade.gross_pnl_USDC || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {trade.gross_pnl_USDC !== null ? `$${trade.gross_pnl_USDC.toFixed(2)}` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Closed At</p>
                                <p className="text-sm text-foreground">
                                    {trade.date_cloture ? formatDate(trade.date_cloture) : "—"}
                                </p>
                            </div>
                            <div className="md:col-span-2 flex items-end">
                                {trade.market_slug && (
                                    <a
                                        href={`https://polymarket.com/event/${trade.market_slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                                    >
                                        <ExternalLink size={12} />
                                        View on Polymarket
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function OrderBookPage() {
    const [ledger, setLedger] = useState<Ledger | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

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
        } catch (error) {
            console.error("Failed to load ledger:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLedger();
    }, [loadLedger]);

    // Filter and sort trades
    const filteredTrades = ledger?.trades
        .filter(t => {
            if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
            if (searchQuery && !t.market_question?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date_ouverture).getTime();
            const dateB = new Date(b.date_ouverture).getTime();
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        }) || [];

    const filterButtons: { label: string; value: FilterStatus; count: number }[] = [
        { label: "All", value: "ALL", count: ledger?.trades.length || 0 },
        { label: "Open", value: "OPEN", count: ledger?.trades.filter(t => t.status === "OPEN").length || 0 },
        { label: "Won", value: "CLOSED_PROFIT", count: ledger?.trades.filter(t => t.status === "CLOSED_PROFIT").length || 0 },
        { label: "Lost", value: "CLOSED_LOSS", count: ledger?.trades.filter(t => t.status === "CLOSED_LOSS").length || 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <BookOpen className="text-primary" size={24} />
                        </div>
                        Carnet d'Ordres
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Journal complet de tous vos trades paper trading
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
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            {ledger && <SummaryStats trades={ledger.trades} />}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search markets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-2">
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setFilterStatus(btn.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === btn.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {btn.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === btn.value
                                    ? "bg-primary-foreground/20"
                                    : "bg-background"
                                }`}>
                                {btn.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <button
                    onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowUpDown size={16} />
                    {sortOrder === "newest" ? "Newest" : "Oldest"}
                </button>
            </div>

            {/* Trades List */}
            <div className="space-y-3">
                {filteredTrades.length > 0 ? (
                    filteredTrades.map((trade, index) => (
                        <TradeRow key={trade.trade_id} trade={trade} index={index} />
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border bg-muted/20"
                    >
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                            <BookOpen size={32} className="text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground">Aucun trade</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            {searchQuery || filterStatus !== "ALL"
                                ? "Aucun trade ne correspond à vos filtres"
                                : "Le carnet d'ordres est vide. Lancez le Sniper pour commencer le paper trading."
                            }
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
