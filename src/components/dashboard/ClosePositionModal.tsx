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
    const [showCardPreview, setShowCardPreview] = useState(false);

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

                {/* Right Panel: Shareable Profit Card & Actions */}
                <div className="w-full md:w-[380px] bg-[#0c0c0e] border-t md:border-t-0 md:border-l border-white/5 p-6 flex flex-col relative z-20">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all z-10"
                    >
                        <X size={18} />
                    </button>

                    {/* The Visual Profit Card */}
                    <div className={`relative aspect-[3.5/4] rounded-[2rem] overflow-hidden p-6 flex flex-col justify-between shadow-2xl transition-all duration-500 group
                        ${isProfit
                            ? 'bg-gradient-to-br from-emerald-600 to-[#0c2e26] shadow-[0_20px_50px_-12px_rgba(16,185,129,0.3)]'
                            : 'bg-gradient-to-br from-rose-600 to-[#2e0c0c] shadow-[0_20px_50px_-12px_rgba(244,63,94,0.3)]'
                        }
                    `}>
                        {/* Noise Texture */}
                        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

                        {/* Dynamic Glow */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 mix-blend-soft-light" />

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <Wallet size={18} className="text-white" />
                            </div>
                            <div className={`px-2.5 py-1 rounded-full backdrop-blur-md border ${isProfit ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-rose-400/20 border-rose-400/30'}`}>
                                <span className="text-[9px] font-black text-white tracking-widest flex items-center gap-1 uppercase">
                                    {isProfit ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                                    {isProfit ? 'Profit' : 'Loss'}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-4">
                            <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 drop-shadow-md">
                                {order.marketTitle}
                            </h3>
                        </div>

                        <div className="relative z-10 my-auto py-4">
                            <p className="text-white/60 text-[9px] uppercase tracking-[0.25em] font-extrabold mb-1">Projected Return</p>
                            <p className="text-[2.5rem] leading-none font-black text-white tracking-tighter drop-shadow-xl">
                                {isProfit ? '+' : ''}{netRoi.toFixed(1)}%
                            </p>
                            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                <span className="text-white font-mono font-bold text-sm">${netPnL.toFixed(2)}</span>
                                <span className="text-white/60 text-[8px] uppercase font-bold tracking-wider">NET P&L</span>
                            </div>
                        </div>

                        <div className="relative z-10 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-end text-sm">
                                <div>
                                    <p className="text-white/50 text-[8px] uppercase font-bold mb-0.5">Entry</p>
                                    <p className="text-white font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-xs">${order.entryPrice.toFixed(3)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/50 text-[8px] uppercase font-bold mb-0.5">Current</p>
                                    <p className="text-white font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-xs">${currentPrice.toFixed(3)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fees Breakdown */}
                    <div className="mt-4 text-xs space-y-2 px-2">
                        <div className="flex justify-between text-white/50">
                            <span>Gross Value</span>
                            <span className="text-white/80">${grossValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white/50">
                            <span className="flex items-center gap-1"><Info size={10} /> Est. Fees (2%)</span>
                            <span className="text-rose-400">-${estimatedFees.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Preview & Action Buttons */}
                    <div className="mt-6 space-y-3">
                        {/* Preview Card Button */}
                        <button
                            onClick={() => setShowCardPreview(true)}
                            className="w-full py-3 rounded-xl font-bold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Share2 size={16} />
                            <span>Preview P&L Card</span>
                        </button>

                        {/* Confirm Close Button */}
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
                        <p className="text-[10px] text-center text-white/30">
                            Proceeding will execute a market sell order immediately.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Fullscreen Card Preview Overlay */}
            <AnimatePresence>
                {showCardPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
                        onClick={() => setShowCardPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={`relative w-full max-w-md aspect-[3/4] rounded-[3rem] overflow-hidden p-10 flex flex-col justify-between shadow-2xl
                                ${isProfit
                                    ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#0c2e26] shadow-[0_30px_80px_-10px_rgba(16,185,129,0.4)]'
                                    : 'bg-gradient-to-br from-rose-600 via-rose-700 to-[#2e0c0c] shadow-[0_30px_80px_-10px_rgba(244,63,94,0.4)]'
                                }
                            `}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Noise Texture */}
                            <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

                            {/* Dynamic Glow */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-white/25 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 mix-blend-soft-light" />

                            <div className="relative z-10 flex justify-between items-start">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-xl">
                                    <Wallet size={26} className="text-white drop-shadow-lg" />
                                </div>
                                <div className={`px-4 py-2 rounded-full backdrop-blur-md border shadow-lg ${isProfit ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-rose-400/20 border-rose-400/30'}`}>
                                    <span className="text-sm font-black text-white tracking-widest flex items-center gap-2 uppercase">
                                        {isProfit ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
                                        {isProfit ? 'Profit' : 'Loss'}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 mt-6">
                                <h3 className="text-white font-bold text-xl leading-snug line-clamp-3 drop-shadow-lg">
                                    {order.marketTitle}
                                </h3>
                            </div>

                            <div className="relative z-10 my-auto py-8">
                                <p className="text-white/60 text-xs uppercase tracking-[0.3em] font-extrabold mb-2">Total Return</p>
                                <p className="text-6xl leading-none font-black text-white tracking-tighter drop-shadow-2xl">
                                    {isProfit ? '+' : ''}{netRoi.toFixed(1)}%
                                </p>
                                <div className="inline-flex items-center gap-3 mt-5 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 shadow-xl">
                                    <span className="text-white font-mono font-bold text-lg">${netPnL.toFixed(2)}</span>
                                    <span className="text-white/60 text-xs uppercase font-bold tracking-wider">NET P&L</span>
                                </div>
                            </div>

                            <div className="relative z-10 pt-6 border-t border-white/15">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1.5">Entry</p>
                                        <p className="text-white font-mono text-lg font-bold bg-white/15 px-3 py-1 rounded-lg backdrop-blur-sm">${order.entryPrice.toFixed(3)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1.5">Current</p>
                                        <p className="text-white font-mono text-lg font-bold bg-white/15 px-3 py-1 rounded-lg backdrop-blur-sm">${currentPrice.toFixed(3)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowCardPreview(false)}
                                className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-20"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>

                        <p className="absolute bottom-8 text-white/40 text-sm">Click anywhere to close</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
