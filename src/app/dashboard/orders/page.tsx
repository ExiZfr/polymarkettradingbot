"use client";

import { useState, useEffect } from "react";
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
    X
} from "lucide-react";
import { paperStore, PaperOrder, PaperProfile } from "@/lib/paper-trading";
import { showTradeNotification } from "@/components/dashboard/TradeNotificationSystem";
import ClosePositionModal from "@/components/dashboard/ClosePositionModal";
import PolymarketLink from "@/components/ui/PolymarketLink";

type FilterStatus = "ALL" | "OPEN" | "CLOSED" | "CANCELLED";

// Portfolio Balance Component
function PortfolioBalance({ profile }: { profile: PaperProfile }) {
    const roi = profile.initialBalance > 0
        ? ((profile.currentBalance - profile.initialBalance) / profile.initialBalance) * 100
        : 0;

    const isPositive = profile.totalPnL >= 0;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Portfolio Balance</h3>
                    <p className="text-xs text-muted-foreground mt-1">{profile.username}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {isPositive ? '↑' : '↓'} {roi >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Initial Capital</p>
                    <p className="text-lg font-bold text-foreground">${profile.initialBalance.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-lg font-bold text-primary">${profile.currentBalance.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
                    <p className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}${profile.totalPnL.toFixed(2)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                    <p className="text-lg font-bold text-foreground">{profile.winRate.toFixed(1)}%</p>
                </div>
            </div>
        </div>
    );
}

// Summary Stats Component
function SummaryStats({ orders }: { orders: PaperOrder[] }) {
    const openOrders = orders.filter(o => o.status === "OPEN");
    const closedOrders = orders.filter(o => o.status === "CLOSED");
    const wonOrders = closedOrders.filter(o => (o.pnl || 0) > 0);
    const lostOrders = closedOrders.filter(o => (o.pnl || 0) < 0);

    const totalInvested = orders.reduce((sum, o) => sum + o.amount, 0);
    const totalPnl = closedOrders.reduce((sum, o) => sum + (o.pnl || 0), 0);
    const winRate = closedOrders.length > 0 ? (wonOrders.length / closedOrders.length) * 100 : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen size={14} />
                    <span className="text-xs uppercase tracking-wider">Total</span>
                </div>
                <p className="text-xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                    <Timer size={14} />
                    <span className="text-xs uppercase tracking-wider">Open</span>
                </div>
                <p className="text-xl font-bold text-yellow-500">{openOrders.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                    <CheckCircle2 size={14} />
                    <span className="text-xs uppercase tracking-wider">Won</span>
                </div>
                <p className="text-xl font-bold text-green-500">{wonOrders.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                    <XCircle size={14} />
                    <span className="text-xs uppercase tracking-wider">Lost</span>
                </div>
                <p className="text-xl font-bold text-red-500">{lostOrders.length}</p>
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

// Order Row Component (Detailed)
function OrderRow({ order, index, onClose }: { order: PaperOrder; index: number; onClose: (id: string) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusConfig = {
        OPEN: {
            color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            icon: Timer,
            label: "Open"
        },
        CLOSED: {
            color: (order.pnl || 0) >= 0 ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20",
            icon: (order.pnl || 0) >= 0 ? CheckCircle2 : XCircle,
            label: (order.pnl || 0) >= 0 ? "Won" : "Lost"
        },
        CANCELLED: {
            color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
            icon: X,
            label: "Cancelled"
        },
        PENDING: {
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            icon: Clock,
            label: "Pending"
        }
    };

    const config = statusConfig[order.status];
    const StatusIcon = config.icon;

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
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
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={`p-2.5 rounded-xl ${config.color}`}>
                        <StatusIcon size={18} />
                    </div>

                    {/* Market Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                                {order.marketTitle || "Unknown Market"}
                            </p>
                            <PolymarketLink
                                marketId={order.marketId}
                                className="text-muted-foreground hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <ExternalLink size={12} />
                            </PolymarketLink>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${order.outcome === "YES"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                                }`}>
                                {order.outcome}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(order.timestamp)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${order.source === 'COPY_TRADING' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                {order.source.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-6">
                    {/* Entry Price */}
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Entry</p>
                        <p className="text-sm font-medium text-foreground">${order.entryPrice.toFixed(3)}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Invested</p>
                        <p className="text-sm font-medium text-foreground">${order.amount.toFixed(2)}</p>
                    </div>

                    {/* P&L */}
                    <div className="text-right min-w-[80px]">
                        <p className="text-xs text-muted-foreground">P&L</p>
                        {order.pnl !== undefined ? (
                            <p className={`text-sm font-bold ${order.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {order.pnl >= 0 ? "+" : ""}${order.pnl.toFixed(2)}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                        )}
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${config.color}`}>
                        {config.label}
                    </span>

                    {/* Close Button (for open orders) */}
                    {order.status === 'OPEN' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(order.id);
                            }}
                            className="px-2 py-1 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                        >
                            Close
                        </button>
                    )}
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
                                <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                                <p className="text-sm font-mono text-foreground">{order.id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Shares</p>
                                <p className="text-sm text-foreground">{order.shares.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                                <p className="text-sm text-foreground">
                                    ${(order.currentPrice || order.entryPrice).toFixed(3)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Exit Price</p>
                                <p className="text-sm text-foreground">
                                    {order.exitPrice ? `$${order.exitPrice.toFixed(3)}` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                                <p className="text-sm text-foreground">
                                    {order.stopLoss ? `$${order.stopLoss.toFixed(3)}` : "None"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
                                <p className="text-sm text-foreground">
                                    {order.takeProfit ? `$${order.takeProfit.toFixed(3)}` : "None"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                                <p className={`text-sm ${(order.roi || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {order.roi ? `${order.roi >= 0 ? '+' : ''}${order.roi.toFixed(2)}%` : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Closed At</p>
                                <p className="text-sm text-foreground">
                                    {order.exitTimestamp ? formatDate(order.exitTimestamp) : "—"}
                                </p>
                            </div>
                            {order.notes && (
                                <div className="md:col-span-4">
                                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm text-foreground italic">{order.notes}</p>
                                </div>
                            )}
                            <div className="md:col-span-4 flex items-end">
                                <PolymarketLink
                                    marketId={order.marketId}
                                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                                >
                                    <ExternalLink size={12} />
                                    View on Polymarket
                                </PolymarketLink>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}

export default function OrderBookPage() {
    const [orders, setOrders] = useState<PaperOrder[]>([]);
    const [profile, setProfile] = useState<PaperProfile | null>(null);
    const [selectedOrderToClose, setSelectedOrderToClose] = useState<PaperOrder | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    const loadOrders = () => {
        const allOrders = paperStore.getOrders();
        const activeProfile = paperStore.getActiveProfile();
        setOrders(allOrders);
        setProfile(activeProfile);
    };

    useEffect(() => {
        loadOrders();
        // Listen to storage events for live updates
        const handleUpdate = () => loadOrders();
        window.addEventListener('paper-update', handleUpdate);
        return () => window.removeEventListener('paper-update', handleUpdate);
    }, []);

    // Open the close modal upon button click
    const handleCloseClick = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) setSelectedOrderToClose(order);
    };

    // Confirm close from modal
    const handleConfirmClose = () => {
        if (!selectedOrderToClose) return;

        const currentPrice = selectedOrderToClose.currentPrice || selectedOrderToClose.entryPrice;
        const closedOrder = paperStore.closeOrder(selectedOrderToClose.id, currentPrice);

        if (closedOrder) {
            showTradeNotification(closedOrder, 'CLOSED');
        }

        setSelectedOrderToClose(null); // Close modal
        loadOrders();
    };

    // Filter and sort orders
    const filteredOrders = orders
        .filter(o => {
            if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
            if (searchQuery && !o.marketTitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            return sortOrder === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
        });

    const filterButtons: { label: string; value: FilterStatus; count: number }[] = [
        { label: "All", value: "ALL", count: orders.length },
        { label: "Open", value: "OPEN", count: orders.filter(o => o.status === "OPEN").length },
        { label: "Closed", value: "CLOSED", count: orders.filter(o => o.status === "CLOSED").length },
        { label: "Cancelled", value: "CANCELLED", count: orders.filter(o => o.status === "CANCELLED").length },
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
                        onClick={loadOrders}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Portfolio Balance */}
            {profile && <PortfolioBalance profile={profile} />}

            {/* Summary Stats */}
            <SummaryStats orders={orders} />

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

            {/* Orders List */}
            <div className="space-y-3">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                        <OrderRow key={order.id} order={order} index={index} onClose={handleCloseClick} />
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
                        <p className="text-lg font-medium text-foreground">Aucun ordre</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            {searchQuery || filterStatus !== "ALL"
                                ? "Aucun ordre ne correspond à vos filtres"
                                : "Le carnet d'ordres est vide. Copiez un trade depuis le Radar pour commencer."
                            }
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Close Position Modal */}
            <AnimatePresence>
                {selectedOrderToClose && (
                    <ClosePositionModal
                        order={selectedOrderToClose}
                        onClose={() => setSelectedOrderToClose(null)}
                        onConfirm={handleConfirmClose}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
