"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Filter,
    Search,
    ArrowUpDown,
    Clock,
    CheckCircle2,
    XCircle,
    Timer,
    X,
    Activity,
    MoreHorizontal,
    ExternalLink,
    Maximize2
} from "lucide-react";
import { paperStore, PaperOrder, PaperProfile } from "@/lib/paper-trading";
import { showTradeNotification } from "@/components/dashboard/TradeNotificationSystem";
import ClosePositionModal from "@/components/dashboard/ClosePositionModal";
import OrderDetailsModal from "@/components/dashboard/OrderDetailsModal";
import MiniPriceChart from "@/components/ui/MiniPriceChart";
import PolymarketLink from "@/components/ui/PolymarketLink";

type FilterStatus = "ALL" | "OPEN" | "CLOSED" | "CANCELLED";
type SortField = "timestamp" | "pnl" | "amount";
type SortOrder = "asc" | "desc";

// Live prices state type
type LivePrices = Record<string, { yes: number; no: number; lastUpdate: string }>;

// --- Components ---

function PortfolioHeader({ profile, unrealizedPnL, orders }: { profile: PaperProfile; unrealizedPnL: number; orders: PaperOrder[] }) {
    // Calculate realized P&L from closed orders
    const closedOrders = orders.filter(o => o.status === 'CLOSED');
    const realizedPnL = closedOrders.reduce((sum, o) => sum + (o.pnl || 0), 0);
    
    // Calculate win/loss stats
    const wins = closedOrders.filter(o => (o.pnl || 0) > 0).length;
    const losses = closedOrders.filter(o => (o.pnl || 0) < 0).length;
    const totalTrades = wins + losses;
    const realWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    
    // Total portfolio value = available cash + unrealized P&L
    const totalValue = profile.currentBalance + unrealizedPnL;
    const totalPnL = realizedPnL + unrealizedPnL;
    
    const roi = profile.initialBalance > 0
        ? ((totalValue - profile.initialBalance) / profile.initialBalance) * 100
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Main Balance Card */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-linear-to-br from-card to-muted border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Portfolio Value</p>
                        <h2 className="text-3xl font-bold text-foreground mt-1">
                            ${totalValue.toFixed(2)}
                        </h2>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${roi >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Available Cash</p>
                        <p className="text-base font-mono text-foreground/80">${profile.currentBalance.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Unrealized P&L</p>
                        <p className={`text-base font-mono ${unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* PnL Stats */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-center relative group">
                <div className={`absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-10 transition-opacity ${realizedPnL >= 0 ? 'from-emerald-500/20' : 'from-rose-500/20'}`} />
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded bg-muted ${realizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {realizedPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Realized P&L</span>
                </div>
                <p className={`text-2xl font-bold ${realizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Total: <span className={totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}</span>
                </p>
            </div>

            {/* Win Rate */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded bg-blue-500/10 text-blue-500">
                        <Target size={14} />
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Win Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                    {realWinRate.toFixed(1)}%
                </p>
                <div className="flex gap-2 text-xs mt-1">
                    <span className="text-emerald-500">{wins} W</span>
                    <span className="text-muted-foreground/20">|</span>
                    <span className="text-rose-500">{losses} L</span>
                </div>
            </div>
        </div>
    );
}

export default function OrderBookPage() {
    const [orders, setOrders] = useState<PaperOrder[]>([]);
    const [profile, setProfile] = useState<PaperProfile | null>(null);
    const [selectedOrderToClose, setSelectedOrderToClose] = useState<PaperOrder | null>(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<PaperOrder | null>(null);

    const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("timestamp");
    const [sortDirection, setSortDirection] = useState<SortOrder>("desc");
    const [livePrices, setLivePrices] = useState<LivePrices>({});
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

    const loadOrders = useCallback(() => {
        const allOrders = paperStore.getOrders();
        const activeProfile = paperStore.getActiveProfile();
        setOrders(allOrders);
        setProfile(activeProfile);
    }, []);

    // Fetch live prices logic with guard against concurrent fetches
    const isFetching = useRef(false);
    const fetchLivePrices = useCallback(async () => {
        // Prevent concurrent fetches
        if (isFetching.current) return;

        const openOrders = orders.filter(o => o.status === 'OPEN');
        if (openOrders.length === 0) return;

        const marketIds = [...new Set(openOrders.map(o => o.marketId))];
        if (marketIds.length === 0) return;

        isFetching.current = true;
        try {
            const response = await fetch(`/api/prices?ids=${marketIds.join(',')}`, {
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            const pricesData: LivePrices = {};

            if (response.ok) {
                const data = await response.json();
                Object.assign(pricesData, data.prices || {});
            }

            // For mock/paper orders that don't have real Polymarket IDs,
            // simulate realistic price movements around entry price
            openOrders.forEach(order => {
                if (!pricesData[order.marketId]) {
                    // Simulate price: entry ± random variance (±5%)
                    const variance = (Math.random() - 0.5) * 0.1; // -5% to +5%
                    const simulatedPrice = Math.min(0.95, Math.max(0.05, order.entryPrice + variance));
                    pricesData[order.marketId] = {
                        yes: order.outcome === 'YES' ? simulatedPrice : 1 - simulatedPrice,
                        no: order.outcome === 'NO' ? simulatedPrice : 1 - simulatedPrice,
                        lastUpdate: new Date().toISOString()
                    };
                }
            });

            setLivePrices(pricesData);
            setLastPriceUpdate(new Date());
        } catch (error) {
            // Only log non-abort errors
            if (error instanceof Error && error.name !== 'AbortError') {
                console.warn('Price fetch skipped:', error.message);
            }
        } finally {
            isFetching.current = false;
        }
    }, [orders]);

    // Initial load effect
    useEffect(() => {
        loadOrders();
        const handleUpdate = () => loadOrders();
        window.addEventListener('paper-update', handleUpdate);
        return () => window.removeEventListener('paper-update', handleUpdate);
    }, [loadOrders]);

    // Polling effect - separated to avoid dependency loops
    useEffect(() => {
        // Only start polling if there are open orders
        const openCount = orders.filter(o => o.status === 'OPEN').length;
        if (openCount === 0) return;

        // Initial fetch
        fetchLivePrices();

        // Poll every 15 seconds (reasonable rate)
        const interval = setInterval(fetchLivePrices, 15000);
        return () => clearInterval(interval);
    }, [fetchLivePrices]);

    // Auto-settlement: Check if any markets have resolved
    const isCheckingSettlement = useRef(false);
    const checkAndSettleMarkets = useCallback(async () => {
        if (isCheckingSettlement.current) return;

        const openOrders = orders.filter(o => o.status === 'OPEN');
        if (openOrders.length === 0) return;

        const marketIds = [...new Set(openOrders.map(o => o.marketId))];
        if (marketIds.length === 0) return;

        isCheckingSettlement.current = true;
        try {
            const res = await fetch(`/api/markets/check-resolution?ids=${marketIds.join(',')}`, {
                signal: AbortSignal.timeout(15000)
            });

            if (res.ok) {
                const data = await res.json();
                const resolvedMarkets = data.resolvedMarkets || [];

                if (resolvedMarkets.length > 0) {
                    console.log('[AutoSettle] Found resolved markets:', resolvedMarkets);

                    // Settle each order that belongs to a resolved market
                    for (const resolved of resolvedMarkets) {
                        const ordersToSettle = openOrders.filter(o => o.marketId === resolved.marketId);
                        for (const order of ordersToSettle) {
                            const settled = paperStore.settleOrder(order.id, resolved.winningOutcome);
                            if (settled) {
                                console.log(`[AutoSettle] Settled order ${order.id}: ${order.outcome} vs ${resolved.winningOutcome}`);
                            }
                        }
                    }

                    // Reload orders to reflect changes
                    loadOrders();
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.warn('[AutoSettle] Check failed:', error.message);
            }
        } finally {
            isCheckingSettlement.current = false;
        }
    }, [orders, loadOrders]);

    // Settlement polling effect - check every 30 seconds
    useEffect(() => {
        const openCount = orders.filter(o => o.status === 'OPEN').length;
        if (openCount === 0) return;

        // Initial check after 5 seconds (give time for page load)
        const initialTimeout = setTimeout(checkAndSettleMarkets, 5000);

        // Then check every 30 seconds
        const interval = setInterval(checkAndSettleMarkets, 30000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [checkAndSettleMarkets]);

    // Computed Values
    const unrealizedPnL = useMemo(() => {
        return orders
            .filter(o => o.status === 'OPEN')
            .reduce((sum, order) => {
                const price = livePrices[order.marketId];
                if (!price) return sum;
                const currentPrice = order.outcome === 'YES' ? price.yes : price.no;
                return sum + ((order.shares * currentPrice) - order.amount);
            }, 0);
    }, [orders, livePrices]);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(o => {
                if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
                if (searchQuery && !o.marketTitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => {
                const factor = sortDirection === "asc" ? 1 : -1;
                if (sortField === "timestamp") return (a.timestamp - b.timestamp) * factor;
                if (sortField === "amount") return (a.amount - b.amount) * factor;
                if (sortField === "pnl") return ((a.pnl || 0) - (b.pnl || 0)) * factor;
                return 0;
            });
    }, [orders, filterStatus, searchQuery, sortField, sortDirection]);

    const handleConfirmClose = () => {
        if (!selectedOrderToClose) return;

        // Live price resolution
        const livePriceData = livePrices[selectedOrderToClose.marketId];
        let exitPrice = selectedOrderToClose.currentPrice || selectedOrderToClose.entryPrice;
        if (livePriceData) {
            exitPrice = selectedOrderToClose.outcome === 'YES' ? livePriceData.yes : livePriceData.no;
        }

        const closedOrder = paperStore.closeOrder(selectedOrderToClose.id, exitPrice);
        if (closedOrder) showTradeNotification(closedOrder, 'CLOSED');

        setSelectedOrderToClose(null);
        setSelectedOrderDetails(null); // Also close details if open
        loadOrders();
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <BookOpen size={20} />
                        </div>
                        Order Book <span className="text-muted-foreground/20 font-light">|</span> <span className="text-muted-foreground font-medium text-lg">Terminal</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 ml-1">
                        Professional execution & historical analysis
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {lastPriceUpdate && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 text-emerald-500 text-xs border border-emerald-500/20">
                            <Activity size={12} className="animate-pulse" />
                            Live Feed Active
                        </div>
                    )}
                    <button
                        onClick={loadOrders}
                        className="p-2 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {profile && <PortfolioHeader profile={profile} unrealizedPnL={unrealizedPnL} />}

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                        type="text"
                        placeholder="Search markets or positions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 p-1 rounded-xl bg-card border border-border overflow-x-auto">
                    {(["ALL", "OPEN", "CLOSED", "CANCELLED"] as FilterStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === status
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                            {status === "ALL" ? "ALL TRADES" : status}
                            <span className="ml-2 opacity-50 text-[10px]">
                                {orders.filter(o => status === "ALL" || o.status === status).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Trading Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Market</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Side</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Price / Value</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">P&L</th>
                                <th className="hidden lg:table-cell py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider w-48">24h History</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.map((order) => {
                                const livePrice = livePrices[order.marketId]
                                    ? (order.outcome === 'YES' ? livePrices[order.marketId].yes : livePrices[order.marketId].no)
                                    : (order.currentPrice || order.entryPrice);

                                const currentValue = order.shares * livePrice;
                                const rowPnl = order.status === 'OPEN'
                                    ? currentValue - order.amount
                                    : (order.pnl || 0);
                                const rowRoi = (rowPnl / order.amount) * 100;
                                const isPos = rowPnl >= 0;

                                return (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-muted/30 transition-colors group cursor-pointer border-b border-border/30 last:border-0"
                                        onClick={() => setSelectedOrderDetails(order)}
                                    >
                                        {/* Market */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {/* Market Image - Priority: order.marketImage > crypto icons > fallback */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${!order.marketImage && (order.marketTitle?.toLowerCase().includes('btc') || order.marketTitle?.toLowerCase().includes('bitcoin'))
                                                    ? 'bg-orange-500/20 text-orange-400'
                                                    : !order.marketImage && (order.marketTitle?.toLowerCase().includes('eth') || order.marketTitle?.toLowerCase().includes('ethereum'))
                                                        ? 'bg-indigo-500/20 text-indigo-400'
                                                        : 'bg-muted'
                                                    }`}>
                                                    {order.marketImage ? (
                                                        <img
                                                            src={order.marketImage}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-muted-foreground">📊</span>';
                                                            }}
                                                        />
                                                    ) : order.marketTitle?.toLowerCase().includes('btc') || order.marketTitle?.toLowerCase().includes('bitcoin') ? (
                                                        <span className="text-lg font-bold">₿</span>
                                                    ) : order.marketTitle?.toLowerCase().includes('eth') || order.marketTitle?.toLowerCase().includes('ethereum') ? (
                                                        <span className="text-lg font-bold">Ξ</span>
                                                    ) : (
                                                        <Activity className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-foreground truncate max-w-[220px]">{order.marketTitle}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                                                            {new Date(order.timestamp).toLocaleDateString()}
                                                        </span>
                                                        {order.source && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${order.source === 'MEAN_REVERSION'
                                                                ? 'bg-purple-500/20 text-purple-400'
                                                                : order.source === 'COPY_TRADING'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : order.source === 'SNIPER'
                                                                        ? 'bg-red-500/20 text-red-400'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}>
                                                                {order.source.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        {/* Direct URL if available, else use resolver */}
                                                        {order.marketUrl ? (
                                                            <a
                                                                href={order.marketUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                View <ExternalLink size={8} />
                                                            </a>
                                                        ) : (
                                                            <PolymarketLink
                                                                marketId={order.marketId}
                                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <span onClick={(e) => e.stopPropagation()}>
                                                                    View <ExternalLink size={8} />
                                                                </span>
                                                            </PolymarketLink>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Side */}
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border tracking-wider ${order.outcome === 'YES' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                                {order.outcome}
                                            </span>
                                        </td>

                                        {/* Price / Value */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xs text-muted-foreground">$</span>
                                                    <span className="text-sm font-bold text-foreground font-mono">{livePrice.toFixed(3)}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Entry: ${order.entryPrice.toFixed(3)}</p>
                                            </div>
                                        </td>

                                        {/* P&L - Now with animation */}
                                        <td className="py-4 px-6 text-right">
                                            <motion.div
                                                className="flex flex-col items-end"
                                                animate={{ scale: order.status === 'OPEN' ? [1, 1.02, 1] : 1 }}
                                                transition={{ duration: 2, repeat: order.status === 'OPEN' ? Infinity : 0 }}
                                            >
                                                <span className={`text-sm font-bold font-mono ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isPos ? '+' : ''}${Math.abs(rowPnl).toFixed(2)}
                                                </span>
                                                <span className={`text-[10px] px-1.5 rounded mt-0.5 font-bold ${isPos ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                                    {isPos ? '+' : ''}{rowRoi.toFixed(1)}%
                                                </span>
                                                {order.status === 'CLOSED' && (
                                                    <span className="text-[9px] text-muted-foreground mt-1">Realized</span>
                                                )}
                                            </motion.div>
                                        </td>

                                        {/* Chart */}
                                        <td className="hidden lg:table-cell py-4 px-6">
                                            {order.status === 'OPEN' && (
                                                <MiniPriceChart
                                                    marketId={order.marketId}
                                                    entryPrice={order.entryPrice}
                                                    outcome={order.outcome}
                                                    className="opacity-50 group-hover:opacity-100 transition-opacity"
                                                />
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="py-4 px-6 text-right">
                                            {order.status === 'OPEN' ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrderToClose(order);
                                                    }}
                                                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all shadow-sm active:scale-95 border border-red-500/20"
                                                >
                                                    Close Trade
                                                </button>
                                            ) : (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${order.status === 'CLOSED' ? 'border-border text-muted-foreground' : 'border-border/50 text-muted-foreground/50'}`}>
                                                    {order.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                                <BookOpen size={24} className="text-muted-foreground" />
                                            </div>
                                            <p className="text-lg font-medium text-foreground">No active orders found</p>
                                            <p className="text-sm text-muted-foreground mt-1">Trades will appear here once executed</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedOrderToClose && (
                    <ClosePositionModal
                        order={selectedOrderToClose}
                        livePrice={livePrices[selectedOrderToClose.marketId] ? {
                            yes: livePrices[selectedOrderToClose.marketId].yes,
                            no: livePrices[selectedOrderToClose.marketId].no
                        } : undefined}
                        onClose={() => setSelectedOrderToClose(null)}
                        onConfirm={handleConfirmClose}
                    />
                )}
                {selectedOrderDetails && (
                    <OrderDetailsModal
                        order={selectedOrderDetails}
                        livePrice={livePrices[selectedOrderDetails.marketId] ? {
                            yes: livePrices[selectedOrderDetails.marketId].yes,
                            no: livePrices[selectedOrderDetails.marketId].no
                        } : undefined}
                        onClose={() => setSelectedOrderDetails(null)}
                        onClosePosition={() => {
                            setSelectedOrderToClose(selectedOrderDetails);
                            setSelectedOrderDetails(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
