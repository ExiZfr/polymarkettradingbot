"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Receipt,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Filter,
    Search,
    ExternalLink,
    DollarSign,
    Percent,
    Target,
    Zap,
    Users,
    Brain,
    RefreshCw,
    MoreVertical,
    X
} from "lucide-react";
import { paperStore, PaperOrder, PaperStats } from "@/lib/paper-trading";

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED' | 'CANCELLED';
type FilterSource = 'ALL' | 'MANUAL' | 'SNIPER' | 'COPY_TRADING' | 'ORACLE';

const sourceIcons: Record<PaperOrder['source'], React.ElementType> = {
    MANUAL: Target,
    SNIPER: Zap,
    COPY_TRADING: Users,
    ORACLE: Brain
};

const sourceColors: Record<PaperOrder['source'], string> = {
    MANUAL: 'text-slate-400 bg-slate-400/10',
    SNIPER: 'text-amber-400 bg-amber-400/10',
    COPY_TRADING: 'text-purple-400 bg-purple-400/10',
    ORACLE: 'text-blue-400 bg-blue-400/10'
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<PaperOrder[]>([]);
    const [stats, setStats] = useState<PaperStats | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [filterSource, setFilterSource] = useState<FilterSource>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<PaperOrder | null>(null);

    useEffect(() => {
        loadData();

        // Poll for updates instead of custom event
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch('/api/trading/wallet');
            if (res.ok) {
                const data = await res.json();
                if (data.orders) {
                    setOrders(data.orders);
                }
                // Calculate stats from data if needed, or if API provides them
                // For now, let's recalculate stats client-side or assume paperStore is deprecated
                // Ideally, create a helper to calc stats from orders list
                const calculatedStats: PaperStats = {
                    totalTrades: data.orders.length,
                    openTrades: data.orders.filter((o: any) => o.status === 'OPEN').length,
                    closedTrades: data.orders.filter((o: any) => o.status === 'CLOSED').length,
                    winRate: 0, // Implement calc
                    totalPnL: data.orders.reduce((sum: number, o: any) => sum + (o.pnl || 0), 0),
                    profitFactor: 0,
                    realizedPnL: 0,
                    unrealizedPnL: 0,
                    avgWin: 0,
                    avgLoss: 0,
                    maxDrawdown: 0,
                    sharpeRatio: 0
                };

                // Simple win rate calc
                const closed = calculatedStats.closedTrades;
                const wins = data.orders.filter((o: any) => o.status === 'CLOSED' && (o.pnl || 0) > 0).length;
                calculatedStats.winRate = closed > 0 ? (wins / closed) * 100 : 0;

                setStats(calculatedStats);
            }
        } catch (e) {
            console.error("Failed to load orders", e);
        }
    };

    const handleCloseOrder = (orderId: string, exitPrice: number) => {
        paperStore.closeOrder(orderId, exitPrice);
        loadData();
        setSelectedOrder(null);
    };

    const handleCancelOrder = (orderId: string) => {
        if (confirm('Cancel this order? Amount will be refunded.')) {
            paperStore.cancelOrder(orderId);
            loadData();
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        if (filterStatus !== 'ALL' && order.status !== filterStatus) return false;
        if (filterSource !== 'ALL' && order.source !== filterSource) return false;
        if (searchQuery && !order.marketTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const getStatusBadge = (status: PaperOrder['status']) => {
        switch (status) {
            case 'OPEN':
                return <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1"><Clock size={12} /> Open</span>;
            case 'CLOSED':
                return <span className="px-2 py-1 text-xs font-bold bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Closed</span>;
            case 'CANCELLED':
                return <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded-full flex items-center gap-1"><XCircle size={12} /> Cancelled</span>;
            case 'PENDING':
                return <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Pending</span>;
            default:
                return null;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Receipt className="text-indigo-400" />
                        Order History
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Track all your paper trading orders and performance</p>
                </div>

                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Trades', value: stats.totalTrades, color: 'text-white' },
                        { label: 'Open', value: stats.openTrades, color: 'text-blue-400' },
                        { label: 'Closed', value: stats.closedTrades, color: 'text-green-400' },
                        { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: 'text-indigo-400' },
                        { label: 'Total PnL', value: `$${stats.totalPnL.toFixed(2)}`, color: stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
                        { label: 'Profit Factor', value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), color: 'text-amber-400' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#0C0D12] border border-white/5 rounded-xl p-4">
                            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                            <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="bg-[#0C0D12] border border-white/5 rounded-xl p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by market name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {(['ALL', 'OPEN', 'CLOSED', 'CANCELLED'] as FilterStatus[]).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Source Filter */}
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value as FilterSource)}
                        className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none"
                    >
                        <option value="ALL">All Sources</option>
                        <option value="MANUAL">Manual</option>
                        <option value="SNIPER">Sniper</option>
                        <option value="COPY_TRADING">Copy Trading</option>
                        <option value="ORACLE">Oracle</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#0C0D12] border border-white/5 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4 lg:col-span-3">Market</div>
                    <div className="col-span-2 lg:col-span-1">Type</div>
                    <div className="col-span-2 hidden lg:block">Source</div>
                    <div className="col-span-2 lg:col-span-1">Entry</div>
                    <div className="col-span-2 lg:col-span-1 hidden lg:block">Exit</div>
                    <div className="col-span-2 lg:col-span-1">Amount</div>
                    <div className="col-span-2 lg:col-span-1">PnL</div>
                    <div className="col-span-2 lg:col-span-1">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Orders List */}
                <div className="divide-y divide-white/5">
                    <AnimatePresence>
                        {filteredOrders.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No orders found</p>
                            </div>
                        ) : (
                            filteredOrders.map((order, index) => {
                                const SourceIcon = sourceIcons[order.source];
                                const unrealizedPnL = order.status === 'OPEN' && order.currentPrice
                                    ? (order.shares * order.currentPrice) - order.amount
                                    : undefined;

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        {/* Market */}
                                        <div className="col-span-4 lg:col-span-3">
                                            <div className="font-medium text-white text-sm line-clamp-1">{order.marketTitle}</div>
                                            <div className="text-xs text-slate-500">{formatDate(order.timestamp)}</div>
                                        </div>

                                        {/* Type */}
                                        <div className="col-span-2 lg:col-span-1">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${order.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {order.type}
                                            </span>
                                        </div>

                                        {/* Source */}
                                        <div className="col-span-2 hidden lg:flex items-center gap-2">
                                            <div className={`p-1.5 rounded ${sourceColors[order.source]}`}>
                                                <SourceIcon size={14} />
                                            </div>
                                            <span className="text-xs text-slate-400">{order.source.replace('_', ' ')}</span>
                                        </div>

                                        {/* Entry */}
                                        <div className="col-span-2 lg:col-span-1 font-mono text-sm text-white">
                                            ${order.entryPrice.toFixed(2)}
                                        </div>

                                        {/* Exit */}
                                        <div className="col-span-2 lg:col-span-1 hidden lg:block font-mono text-sm text-slate-400">
                                            {order.exitPrice ? `$${order.exitPrice.toFixed(2)}` : '—'}
                                        </div>

                                        {/* Amount */}
                                        <div className="col-span-2 lg:col-span-1 font-mono text-sm text-white">
                                            ${order.amount.toFixed(2)}
                                        </div>

                                        {/* PnL */}
                                        <div className="col-span-2 lg:col-span-1">
                                            {order.pnl !== undefined ? (
                                                <div className={`font-mono text-sm font-bold ${order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {order.pnl >= 0 ? '+' : ''}{order.pnl.toFixed(2)}
                                                </div>
                                            ) : unrealizedPnL !== undefined ? (
                                                <div className={`font-mono text-sm ${unrealizedPnL >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                                                    ~{unrealizedPnL >= 0 ? '+' : ''}{unrealizedPnL.toFixed(2)}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">—</span>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 lg:col-span-1">
                                            {getStatusBadge(order.status)}
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={16} className="text-slate-400" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div >
            </div >

            {/* Order Detail Modal */}
            <AnimatePresence>
                {
                    selectedOrder && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedOrder(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#0C0D12] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedOrder.marketTitle}</h3>
                                        <p className="text-xs text-slate-500">Order ID: {selectedOrder.id}</p>
                                    </div>
                                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-lg">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">Type</div>
                                        <div className={`font-bold ${selectedOrder.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                            {selectedOrder.type} {selectedOrder.outcome}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">Status</div>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">Entry Price</div>
                                        <div className="font-mono font-bold text-white">${selectedOrder.entryPrice.toFixed(4)}</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">Exit Price</div>
                                        <div className="font-mono font-bold text-white">
                                            {selectedOrder.exitPrice ? `$${selectedOrder.exitPrice.toFixed(4)}` : '—'}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">Amount</div>
                                        <div className="font-mono font-bold text-white">${selectedOrder.amount.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">Shares</div>
                                        <div className="font-mono font-bold text-white">{selectedOrder.shares.toFixed(4)}</div>
                                    </div>
                                    {selectedOrder.pnl !== undefined && (
                                        <>
                                            <div className="bg-white/5 p-4 rounded-xl">
                                                <div className="text-xs text-slate-500 mb-1">PnL</div>
                                                <div className={`font-mono font-bold ${selectedOrder.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {selectedOrder.pnl >= 0 ? '+' : ''}${selectedOrder.pnl.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-xl">
                                                <div className="text-xs text-slate-500 mb-1">ROI</div>
                                                <div className={`font-mono font-bold ${(selectedOrder.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {(selectedOrder.roi || 0) >= 0 ? '+' : ''}{(selectedOrder.roi || 0).toFixed(2)}%
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Risk Management */}
                                {(selectedOrder.stopLoss || selectedOrder.takeProfit) && (
                                    <div className="mb-6 p-4 bg-white/5 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-2">Risk Management</div>
                                        <div className="flex gap-4">
                                            {selectedOrder.stopLoss && (
                                                <div className="flex items-center gap-2 text-red-400">
                                                    <TrendingDown size={14} />
                                                    <span className="font-mono text-sm">SL: ${selectedOrder.stopLoss.toFixed(4)}</span>
                                                </div>
                                            )}
                                            {selectedOrder.takeProfit && (
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <TrendingUp size={14} />
                                                    <span className="font-mono text-sm">TP: ${selectedOrder.takeProfit.toFixed(4)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions for Open Orders */}
                                {selectedOrder.status === 'OPEN' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                const price = prompt('Enter exit price:', selectedOrder.currentPrice?.toString() || selectedOrder.entryPrice.toString());
                                                if (price) handleCloseOrder(selectedOrder.id, parseFloat(price));
                                            }}
                                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                                        >
                                            Close Position
                                        </button>
                                        <button
                                            onClick={() => handleCancelOrder(selectedOrder.id)}
                                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* View on Polymarket */}
                                <a
                                    href={`https://polymarket.com/market/${selectedOrder.marketId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors"
                                >
                                    View on Polymarket <ExternalLink size={16} />
                                </a>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
