"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Target,
    ArrowRight,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Copy,
    Share2,
    Calculator,
    Info
} from "lucide-react";
import { PaperOrder } from "@/lib/paper-trading";

interface ClosePositionModalProps {
    order: PaperOrder;
    livePrice?: { yes: number; no: number };
    onClose: () => void;
    onConfirm: () => void;
}

export default function ClosePositionModal({ order, livePrice, onClose, onConfirm }: ClosePositionModalProps) {
    // Determine current price: Live > Stored > Entry (prioritize live price)
    const currentPrice = livePrice
        ? (order.outcome === 'YES' ? livePrice.yes : livePrice.no)
        : (order.currentPrice || order.entryPrice);
    const isYes = order.outcome === 'YES';

    // Calculate simulated exit values
    const grossValue = order.shares * currentPrice;

    // Fees simulation (e.g. 2% taker fee/slippage for realism)
    const estimatedFees = grossValue * 0.02;
    const netValue = grossValue - estimatedFees;

    const initialInvestment = order.amount;
    const netPnL = netValue - initialInvestment;
    const netRoi = (netPnL / initialInvestment) * 100;
    const isProfit = netPnL >= 0;

    // Time calculations
    const durationMs = Date.now() - order.timestamp;
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = durationHours / 24;

    const formatDuration = () => {
        if (durationHours < 1) return `${Math.floor(durationMs / (1000 * 60))} mins`;
        if (durationHours < 24) return `${Math.floor(durationHours)} hours`;
        return `${durationDays.toFixed(1)} days`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
            >
                {/* Background Glows */}
                <div className={`absolute top-0 right-0 w-96 h-96 opacity-20 blur-[100px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3 ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none rounded-full -translate-x-1/3 translate-y-1/3" />

                {/* Left Panel: Metrics & Context */}
                <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-white/5 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-white/50 text-xs font-mono uppercase tracking-wider">
                            <Clock size={12} />
                            <span>Held for {formatDuration()}</span>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold border ${order.outcome === 'YES' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                            {order.outcome} POSITION
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white leading-snug mb-1 line-clamp-2">
                        {order.marketTitle}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-white/40 mb-8">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded">ID: {order.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{new Date(order.timestamp).toLocaleDateString()}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                                <Target size={12} /> Entry Price
                            </p>
                            <p className="text-xl font-mono font-medium text-white">${order.entryPrice.toFixed(3)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-br opacity-10 transition-opacity ${currentPrice >= order.entryPrice ? 'from-emerald-500' : 'from-rose-500'}`} />
                            <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                                <DollarSign size={12} /> Current Market
                            </p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-mono font-medium text-white">${currentPrice.toFixed(3)}</p>
                                <span className={`text-xs ${currentPrice >= order.entryPrice ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {currentPrice >= order.entryPrice ? '↑' : '↓'}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 col-span-2 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/40 mb-1">Position Size</p>
                                <p className="text-lg font-medium text-white">{order.shares.toFixed(2)} Shares</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/40 mb-1">Invested</p>
                                <p className="text-lg font-medium text-white">${order.amount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Action & Outcome */}
                <div className="w-full md:w-[320px] bg-black/20 p-8 flex flex-col relative z-20">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>

                    <div className="mb-auto mt-6">
                        <p className="text-xs text-center text-white/40 uppercase tracking-widest font-bold mb-4">Projected Return</p>

                        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                            <div className={`absolute top-0 w-full h-1 ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <div className={`absolute inset-0 opacity-10 blur-xl ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                            <h2 className={`text-4xl font-bold tracking-tight mb-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isProfit ? '+' : ''}{netPnL.toFixed(2)} <span className="text-lg opacity-60">$</span>
                            </h2>
                            <div className={`flex items-center gap-1.5 text-sm font-bold px-2 py-0.5 rounded-full ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {netRoi.toFixed(2)}% ROI
                            </div>
                        </div>

                        <div className="mt-6 text-sm space-y-3">
                            <div className="flex justify-between text-white/60">
                                <span>Gross Value</span>
                                <span className="text-white">${grossValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white/60">
                                <span className="flex items-center gap-1"><Info size={12} /> Est. Fees (2%)</span>
                                <span className="text-rose-400">-${estimatedFees.toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="flex justify-between font-bold text-white">
                                <span>Net Return</span>
                                <span>${netValue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfirm}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group
                                ${isProfit ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500'}
                            `}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span>Confirm Close</span>
                            <ArrowRight size={18} />
                        </motion.button>
                        <p className="text-[10px] text-center text-white/30 mt-3">
                            Proceeding will execute a market sell order immediately.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
