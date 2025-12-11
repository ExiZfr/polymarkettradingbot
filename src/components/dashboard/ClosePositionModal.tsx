"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Wallet,
    Target,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    ExternalLink
} from "lucide-react";
import { PaperOrder } from "@/lib/paper-trading";

interface ClosePositionModalProps {
    order: PaperOrder;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ClosePositionModal({ order, onClose, onConfirm }: ClosePositionModalProps) {
    const currentPrice = order.currentPrice || order.entryPrice;
    const pnl = (order.shares * currentPrice) - order.amount;
    const roi = (pnl / order.amount) * 100;
    const isWin = pnl >= 0;

    // Simulate fee calculation (e.g. 2% taker fee for realism simulation)
    const fees = order.amount * 0.02;
    const netPnl = pnl - fees;

    const formatDuration = (startTimestamp: number) => {
        const durationMs = Date.now() - startTimestamp;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
            >
                {/* Header Gradient Line */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isWin ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-full z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Close Position</h2>
                        <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                            Are you sure you want to exit this trade? Analyze your current metrics below.
                        </p>
                    </div>

                    {/* Main PnL Display */}
                    <div className={`relative p-6 rounded-2xl border mb-6 text-center overflow-hidden
                        ${isWin ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}
                    `}>
                        {/* Background Pulse */}
                        <div className={`absolute inset-0 opacity-20 blur-3xl rounded-full translate-y-10 scale-150 ${isWin ? 'bg-green-500' : 'bg-red-500'}`} />

                        <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-widest">Unrealized P&L</p>
                        <div className="flex items-baseline justify-center gap-2 relative z-10">
                            <span className={`text-5xl font-bold tracking-tight ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                            </span>
                            <span className="text-lg text-white/40 font-medium">USD</span>
                        </div>
                        <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold ${isWin ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {isWin ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white/40 text-xs uppercase">
                                <DollarSign size={14} /> Entry Price
                            </div>
                            <p className="text-lg font-mono text-white semi-bold">${order.entryPrice.toFixed(3)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white/40 text-xs uppercase">
                                <Target size={14} /> Mark Price
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-mono text-white semi-bold">${currentPrice.toFixed(3)}</p>
                                <span className={`text-xs ${currentPrice > order.entryPrice && order.outcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                    {((currentPrice - order.entryPrice) / order.entryPrice * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white/40 text-xs uppercase">
                                <Clock size={14} /> Duration
                            </div>
                            <p className="text-lg font-mono text-white semi-bold">{formatDuration(order.timestamp)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white/40 text-xs uppercase">
                                <Wallet size={14} /> Est. Returns
                            </div>
                            <p className="text-lg font-mono text-white semi-bold">${(order.amount + netPnl).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Market Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-8">
                        <div className={`shrink-0 w-1 h-8 rounded-full ${order.outcome === 'YES' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/40 mb-0.5">Market Outcome</p>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${order.outcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                    {order.outcome}
                                </span>
                                <span className="text-sm text-white/80 truncate mr-2">{order.marketTitle}</span>
                                <a
                                    href={`https://polymarket.com/market/${order.marketId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/30 hover:text-blue-400 transition-colors"
                                    title="View on Polymarket"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfirm}
                            className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2
                                ${isWin ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-900/20' : 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-900/20'}
                            `}
                        >
                            Confirm Close
                            <ArrowRight size={18} />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
