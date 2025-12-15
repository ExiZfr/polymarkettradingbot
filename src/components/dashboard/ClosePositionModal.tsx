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

            {/* Fullscreen Premium Card Preview Overlay */}
            <AnimatePresence>
                {showCardPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8"
                        onClick={() => setShowCardPreview(false)}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowCardPreview(false)}
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all z-50"
                        >
                            <X size={24} />
                        </button>

                        {/* The Epic Premium Card */}
                        <motion.div
                            initial={{ scale: 0.85, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.85, y: 40, opacity: 0 }}
                            transition={{ type: "spring", damping: 22, stiffness: 280 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0c] rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Hero Section with Background */}
                            <div className="relative h-[320px] md:h-[380px] overflow-hidden">
                                {/* Background Image (statue with VR) */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800')`,
                                        filter: 'brightness(0.5) saturate(1.2)'
                                    }}
                                />
                                {/* Gradient Overlay */}
                                <div className={`absolute inset-0 ${isProfit ? 'bg-gradient-to-br from-emerald-600/40 via-cyan-600/30 to-transparent' : 'bg-gradient-to-br from-rose-600/40 via-purple-600/30 to-transparent'}`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />

                                {/* Header */}
                                <div className="relative z-10 p-6 flex items-start justify-between">
                                    {/* Branding */}
                                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-sm">P</div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-sm flex items-center gap-1">
                                                PolyGraalX.app
                                                <CheckCircle2 size={14} className="text-cyan-400" />
                                            </span>
                                            <span className="text-white/50 text-[10px] font-mono">@WHALEHUNTER · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    {/* Winner/Loser Badge */}
                                    <div className={`px-4 py-2 rounded-full backdrop-blur-md border ${isProfit ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
                                        <span className="text-white text-xs font-black tracking-widest flex items-center gap-1.5 uppercase">
                                            {isProfit ? <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> : <span className="w-2 h-2 rounded-full bg-rose-400" />}
                                            {isProfit ? 'WINNER' : 'LOSS'}
                                        </span>
                                    </div>
                                </div>

                                {/* Market Question & Outcome */}
                                <div className="relative z-10 px-6 mt-4">
                                    <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-3 ${order.outcome === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        PREDICTION
                                    </span>
                                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg">
                                        {order.outcome} <span className="font-normal opacity-70">-</span> {order.marketTitle}
                                    </h2>
                                </div>

                                {/* Giant ROI Display */}
                                <div className="relative z-10 px-6 mt-6">
                                    <div className={`text-6xl md:text-7xl font-black tracking-tighter ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        <span className="drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                                            {isProfit ? '+' : ''}{netRoi.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 mt-2 text-xl md:text-2xl font-bold font-mono ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {isProfit ? '+' : ''}${netPnL.toFixed(2)}
                                        <span className={`w-4 h-4 rounded flex items-center justify-center ${isProfit ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                                            {isProfit ? <TrendingUp size={10} className="text-black" /> : <TrendingDown size={10} className="text-black" />}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-4 gap-2 p-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Entry Price</p>
                                    <p className="text-white font-mono font-bold text-sm">{order.entryPrice.toFixed(4)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Current Price</p>
                                    <p className="text-white font-mono font-bold text-sm">{currentPrice.toFixed(4)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Position Size</p>
                                    <p className="text-white font-mono font-bold text-sm">${order.amount.toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                                    <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">Powered By</p>
                                    <p className="text-white font-bold text-sm">PolyGraalX</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 p-4 pt-0">
                                <button
                                    onClick={() => {
                                        const text = `🏆 PolyGraalX Trade

📊 ${order.marketTitle}
🎯 Prediction: ${order.outcome}
📈 ROI: ${isProfit ? '+' : ''}${netRoi.toFixed(2)}%
💰 P&L: ${isProfit ? '+' : ''}$${netPnL.toFixed(2)}
📍 Entry: $${order.entryPrice.toFixed(4)}
📍 Exit: $${currentPrice.toFixed(4)}

Powered by PolyGraalX.app 🚀`;
                                        navigator.clipboard.writeText(text);
                                    }}
                                    className="py-4 rounded-xl font-bold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Copy size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-mono text-sm uppercase tracking-wider">Copy Stats</span>
                                </button>
                                <button
                                    onClick={() => {
                                        // Future: Save as image functionality
                                        alert('Save Card feature coming soon! For now, take a screenshot.');
                                    }}
                                    className="py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-500/20"
                                >
                                    <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-mono text-sm uppercase tracking-wider">Save Card</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
