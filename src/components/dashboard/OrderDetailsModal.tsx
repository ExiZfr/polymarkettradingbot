"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Target,
    Share2,
    Calendar,
    Hash,
    ArrowRight
} from "lucide-react";
import { PaperOrder } from "@/lib/paper-trading";
import MiniPriceChart from "@/components/ui/MiniPriceChart";

interface OrderDetailsModalProps {
    order: PaperOrder;
    livePrice?: { yes: number; no: number };
    onClose: () => void;
    onClosePosition: () => void;
}

export default function OrderDetailsModal({ order, livePrice, onClose, onClosePosition }: OrderDetailsModalProps) {
    const currentPrice = livePrice
        ? (order.outcome === 'YES' ? livePrice.yes : livePrice.no)
        : (order.currentPrice || order.entryPrice);

    const currentValue = order.shares * currentPrice;
    const pnl = currentValue - order.amount;
    const roi = (pnl / order.amount) * 100;
    const isProfit = pnl >= 0;

    const durationMs = Date.now() - order.timestamp;
    const durationHours = durationMs / (1000 * 60 * 60);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted p-0.5 flex-shrink-0 relative overflow-hidden">
                            {order.marketImage && (
                                <img
                                    src={order.marketImage}
                                    className="w-full h-full object-cover rounded-md"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground line-clamp-1 pr-4">{order.marketTitle}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded textxs font-bold border ${order.outcome === 'YES' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                    {order.outcome}
                                </span>
                                <span className="text-xs text-muted-foreground">ID: {order.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Stats */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Key Performance Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={`p-4 rounded-xl border ${isProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net P&L</p>
                                    <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isProfit ? '+' : ''}{pnl.toFixed(2)}$
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ROI</p>
                                    <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {roi.toFixed(2)}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
                                    <p className="text-2xl font-bold text-foreground">${currentValue.toFixed(2)}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Invested</p>
                                    <p className="text-2xl font-bold text-foreground">${order.amount.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Chart Section */}
                            <div className="p-6 rounded-xl bg-muted/30 border border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Activity size={16} /> Market Performance
                                    </h3>
                                    <span className="text-xs text-muted-foreground">Last 24 Hours</span>
                                </div>
                                <div className="h-64">
                                    <MiniPriceChart
                                        marketId={order.marketId}
                                        entryPrice={order.entryPrice}
                                        outcome={order.outcome}
                                        className="h-full w-full"
                                    />
                                </div>
                            </div>

                            {/* Detailed Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                                    <span className="text-sm text-muted-foreground">Entry Price</span>
                                    <span className="text-sm font-mono font-medium">${order.entryPrice.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                                    <span className="text-sm text-muted-foreground">Current Price</span>
                                    <span className="text-sm font-mono font-medium">${currentPrice.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                                    <span className="text-sm text-muted-foreground">Shares Held</span>
                                    <span className="text-sm font-mono font-medium">{order.shares.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                                    <span className="text-sm text-muted-foreground">Duration Held</span>
                                    <span className="text-sm font-mono font-medium">{durationHours < 1 ? '< 1h' : `${durationHours.toFixed(1)}h`}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: PnL Card Visual & Actions */}
                        <div className="space-y-6">
                            {/* PnL Visual Card */}
                            <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden p-6 flex flex-col justify-between shadow-2xl ${isProfit
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-900'
                                    : 'bg-gradient-to-br from-rose-600 to-red-900'
                                }`}>
                                {/* Background Decorations */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 rounded bg-white/20 backdrop-blur-sm">
                                            {isProfit ? <TrendingUp className="text-white" size={16} /> : <TrendingDown className="text-white" size={16} />}
                                        </div>
                                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Polygraal Profit Card</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-3">
                                        {order.marketTitle}
                                    </h3>
                                </div>

                                <div className="relative z-10 text-center py-8">
                                    <p className="text-white/60 text-sm uppercase tracking-widest font-medium mb-1">Return on Investment</p>
                                    <p className="text-5xl font-black text-white tracking-tight">
                                        {isProfit ? '+' : ''}{roi.toFixed(2)}%
                                    </p>
                                    <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                                        <span className="text-white font-mono font-bold">${pnl.toFixed(2)}</span>
                                        <span className="text-white/60 text-xs">Net PnL</span>
                                    </div>
                                </div>

                                <div className="relative z-10 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-white/40 text-[10px] uppercase font-bold">Entry</p>
                                            <p className="text-white font-mono">${order.entryPrice.toFixed(3)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/40 text-[10px] uppercase font-bold">Current</p>
                                            <p className="text-white font-mono">${currentPrice.toFixed(3)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                {order.status === 'OPEN' && (
                                    <button
                                        onClick={onClosePosition}
                                        className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>Close Position</span>
                                        <ArrowRight size={18} />
                                    </button>
                                )}
                                <a
                                    href={`https://polymarket.com/event/${order.marketId}`} // Fallback to ID or search if slug missing
                                    target="_blank"
                                    className="w-full py-3.5 rounded-xl font-bold text-foreground bg-muted hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>View on Polymarket</span>
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
import { Activity } from "lucide-react";
