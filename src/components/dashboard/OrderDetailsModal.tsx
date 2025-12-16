"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowRight,
    Copy,
    Clock,
    Wallet,
    CheckCircle2
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
    const [copied, setCopied] = useState(false);

    // Resolve current price: Live > Stored > Entry
    const currentPrice = livePrice
        ? (order.outcome === 'YES' ? livePrice.yes : livePrice.no)
        : (order.currentPrice || order.entryPrice);

    const currentValue = order.shares * currentPrice;
    const pnl = currentValue - order.amount;
    const roi = order.amount > 0 ? (pnl / order.amount) * 100 : 0;
    const isProfit = pnl >= 0;

    const durationMs = Date.now() - order.timestamp;
    const durationHours = durationMs / (1000 * 60 * 60);

    const handleCopyStats = () => {
        const text = `Polygraal Trade 🛸\n\nMarket: ${order.marketTitle}\nSide: ${order.outcome}\nROI: ${isProfit ? '+' : ''}${roi.toFixed(2)}%\nPnL: $${pnl.toFixed(2)}\nEntry: $${order.entryPrice.toFixed(3)}\nExit: $${currentPrice.toFixed(3)}\n\n#Polymarket #Crypto`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Stagger visuals
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    // Use stored URL first (from tracker DB), otherwise slug, otherwise ID fallback
    const marketLink = order.marketUrl
        || (order.marketSlug ? `https://polymarket.com/event/${order.marketSlug}` : null)
        || `https://polymarket.com/market/${order.marketId}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-5xl bg-[#09090b] border border-white/5 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] ring-1 ring-white/5"
            >
                {/* Left Panel: Deep Dive Stats */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#09090b]">
                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2" />
                    </div>

                    {/* Header */}
                    <div className="p-6 md:p-8 flex items-start justify-between z-10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#131316] p-1 flex-shrink-0 relative overflow-hidden ring-1 ring-white/5 shadow-xl">
                                {order.marketImage && (
                                    <img
                                        src={order.marketImage}
                                        className="w-full h-full object-cover rounded-xl"
                                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                    />
                                )}
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <h2 className="text-lg md:text-xl font-bold text-white leading-tight line-clamp-2 pr-4 tracking-tight">
                                    {order.marketTitle}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold border tracking-wider shadow-sm ${order.outcome === 'YES' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 border-rose-500/10 text-rose-400'}`}>
                                        {order.outcome}
                                    </span>
                                    <span className="text-[11px] text-white/30 font-medium font-mono">ID: {order.id.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <motion.div
                        className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 space-y-6 custom-scrollbar z-10 py-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* KPI Stats - Adjusted for readability */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-[#131316]/50 border border-white/5 hover:border-white/10 transition-colors group">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Net P&L</p>
                                <p className={`text-xl lg:text-2xl font-bold tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isProfit ? '+' : ''}{pnl.toFixed(2)}$
                                </p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-[#131316]/50 border border-white/5 hover:border-white/10 transition-colors">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Return (ROI)</p>
                                <p className={`text-xl lg:text-2xl font-bold tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {roi.toFixed(2)}%
                                </p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-[#131316]/30 border border-white/5 hidden md:block">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Current Value</p>
                                <p className="text-lg lg:text-xl font-bold text-white/90">${currentValue.toFixed(2)}</p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-[#131316]/30 border border-white/5 hidden md:block">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Invested</p>
                                <p className="text-lg lg:text-xl font-bold text-white/90">${order.amount.toFixed(2)}</p>
                            </motion.div>
                        </div>

                        {/* Mobile only row for Value/Invested */}
                        <div className="grid grid-cols-2 gap-4 md:hidden">
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-[#131316]/30 border border-white/5">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Value</p>
                                <p className="text-lg font-bold text-white/90">${currentValue.toFixed(2)}</p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-[#131316]/30 border border-white/5">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Invested</p>
                                <p className="text-lg font-bold text-white/90">${order.amount.toFixed(2)}</p>
                            </motion.div>
                        </div>

                        {/* Details List */}
                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-xs text-white/30 font-medium group-hover:text-white/50 transition-colors">Entry Price</span>
                                    <span className="text-sm font-mono font-medium text-white/90 bg-white/5 px-2 py-0.5 rounded">${order.entryPrice.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-xs text-white/30 font-medium group-hover:text-white/50 transition-colors">Current Price</span>
                                    <span className="text-sm font-mono font-medium text-white/90 bg-white/5 px-2 py-0.5 rounded">${currentPrice.toFixed(3)}</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-xs text-white/30 font-medium group-hover:text-white/50 transition-colors">Shares</span>
                                    <span className="text-sm font-mono font-medium text-white/90">{order.shares.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-xs text-white/30 font-medium group-hover:text-white/50 transition-colors">Holding Time</span>
                                    <span className="text-sm font-mono font-medium text-white/90 flex items-center gap-1.5">
                                        <Clock size={12} className="text-white/20" />
                                        {durationHours < 1 ? '< 1h' : `${durationHours.toFixed(1)}h`}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* TP/SL Targets Section */}
                        {(order as any).tp1Percent && (
                            <motion.div variants={itemVariants} className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10">
                                <p className="text-[10px] text-blue-400/60 uppercase tracking-widest font-bold mb-4">Take Profit / Stop Loss</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {/* TP1 */}
                                    <div className={`p-3 rounded-xl border ${(order as any).tp1Hit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mb-1">TP1 ({(order as any).tp1SizePercent || 50}%)</p>
                                        <p className={`text-sm font-bold ${(order as any).tp1Hit ? 'text-emerald-400' : 'text-white/70'}`}>
                                            +{(order as any).tp1Percent}%
                                        </p>
                                        <p className="text-[10px] text-white/30 font-mono mt-1">
                                            ${(order.entryPrice * (1 + (order as any).tp1Percent / 100)).toFixed(3)}
                                        </p>
                                        {(order as any).tp1Hit && <span className="text-[8px] text-emerald-400 font-bold">✓ HIT</span>}
                                    </div>
                                    {/* TP2 */}
                                    <div className={`p-3 rounded-xl border ${(order as any).tp2Hit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mb-1">TP2 (Full)</p>
                                        <p className={`text-sm font-bold ${(order as any).tp2Hit ? 'text-emerald-400' : 'text-white/70'}`}>
                                            +{(order as any).tp2Percent}%
                                        </p>
                                        <p className="text-[10px] text-white/30 font-mono mt-1">
                                            ${(order.entryPrice * (1 + (order as any).tp2Percent / 100)).toFixed(3)}
                                        </p>
                                        {(order as any).tp2Hit && <span className="text-[8px] text-emerald-400 font-bold">✓ HIT</span>}
                                    </div>
                                    {/* SL */}
                                    <div className={`p-3 rounded-xl border ${(order as any).slHit ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mb-1">Stop Loss</p>
                                        <p className={`text-sm font-bold ${(order as any).slHit ? 'text-rose-400' : 'text-rose-400/70'}`}>
                                            {(order as any).stopLossPercent}%
                                        </p>
                                        <p className="text-[10px] text-white/30 font-mono mt-1">
                                            ${(order.entryPrice * (1 + (order as any).stopLossPercent / 100)).toFixed(3)}
                                        </p>
                                        {(order as any).slHit && <span className="text-[8px] text-rose-400 font-bold">✗ HIT</span>}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Right Panel: Premium Card */}
                <div className="w-full md:w-[400px] bg-[#0c0c0e] border-t md:border-t-0 md:border-l border-white/5 p-8 flex flex-col gap-6 relative z-20 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Shareable
                        </h3>
                        <button
                            onClick={handleCopyStats}
                            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy Stats</>}
                        </button>
                    </div>

                    {/* The Visual Card */}
                    <div className={`relative aspect-[3.5/5] rounded-[2.5rem] overflow-hidden p-8 flex flex-col justify-between shadow-2xl transition-all duration-500 group
                        ${isProfit
                            ? 'bg-gradient-to-br from-emerald-600 to-[#0c2e26] shadow-[0_20px_50px_-12px_rgba(16,185,129,0.3)]'
                            : 'bg-gradient-to-br from-rose-600 to-[#2e0c0c] shadow-[0_20px_50px_-12px_rgba(244,63,94,0.3)]'
                        }
                    `}>
                        {/* Noise Texture */}
                        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

                        {/* Dynamic Glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 mix-blend-soft-light group-hover:scale-110 transition-transform duration-700" />

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                                <Wallet size={22} className="text-white drop-shadow-md" />
                            </div>
                            <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg ${isProfit ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-rose-400/20 border-rose-400/30'}`}>
                                <span className="text-[10px] font-black text-white tracking-widest flex items-center gap-1.5 uppercase">
                                    {isProfit ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                                    {isProfit ? 'Profit' : 'Loss'}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-6">
                            <h3 className="text-white font-bold text-lg leading-snug line-clamp-3 drop-shadow-md tracking-tight">
                                {order.marketTitle}
                            </h3>
                        </div>

                        <div className="relative z-10 my-auto py-6">
                            <p className="text-white/60 text-[10px] uppercase tracking-[0.25em] font-extrabold mb-1">Total Return</p>
                            <p className="text-[3rem] leading-none font-black text-white tracking-tighter drop-shadow-xl">
                                {isProfit ? '+' : ''}{roi.toFixed(1)}%
                            </p>
                            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl group-hover:bg-white/20 transition-colors">
                                <span className="text-white font-mono font-bold tracking-tight">${pnl.toFixed(2)}</span>
                                <span className="text-white/60 text-[9px] uppercase font-bold tracking-wider">PNL</span>
                            </div>
                        </div>

                        <div className="relative z-10 pt-5 border-t border-white/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/50 text-[9px] uppercase font-bold tracking-wider mb-1">Entry</p>
                                    <p className="text-white font-mono text-sm font-bold bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">${order.entryPrice.toFixed(3)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/50 text-[9px] uppercase font-bold tracking-wider mb-1">Current</p>
                                    <p className="text-white font-mono text-sm font-bold bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">${currentPrice.toFixed(3)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-3">
                        {order.status === 'OPEN' && (
                            <button
                                onClick={onClosePosition}
                                className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-rose-900/20 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition-all flex items-center justify-center gap-2 active:scale-[0.98] group border border-rose-500/20"
                            >
                                <span>Close Position</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                        <a
                            href={marketLink}
                            target="_blank"
                            className="w-full py-3.5 rounded-xl font-bold text-white/50 bg-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
                        >
                            <span>Open on Polymarket</span>
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
