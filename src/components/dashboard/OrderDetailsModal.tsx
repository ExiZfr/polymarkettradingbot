"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowRight,
    Copy,
    Share2,
    Clock,
    Wallet
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="w-full max-w-5xl bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
                {/* Left Panel: Deep Dive Stats */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white/5 p-0.5 flex-shrink-0 relative overflow-hidden ring-1 ring-white/10">
                                {order.marketImage && (
                                    <img
                                        src={order.marketImage}
                                        className="w-full h-full object-cover rounded-lg"
                                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                    />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white line-clamp-1 pr-4">{order.marketTitle}</h2>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border tracking-wider ${order.outcome === 'YES' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                        {order.outcome}
                                    </span>
                                    <span className="text-[10px] text-white/40 font-mono">ID: {order.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className={`p-4 rounded-2xl border ${isProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Net P&L</p>
                                <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isProfit ? '+' : ''}{pnl.toFixed(2)}$
                                </p>
                            </div>
                            <div className={`p-4 rounded-2xl border ${isProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">ROI</p>
                                <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {roi.toFixed(2)}%
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Current Value</p>
                                <p className="text-2xl font-bold text-white">${currentValue.toFixed(2)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Invested</p>
                                <p className="text-2xl font-bold text-white">${order.amount.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <Activity size={16} className="text-blue-500" /> Market Price Action
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/40 font-mono">24H</span>
                                </div>
                            </div>
                            <div className="h-48 w-full relative">
                                <MiniPriceChart
                                    marketId={order.marketId}
                                    entryPrice={order.entryPrice}
                                    outcome={order.outcome}
                                    className="w-full h-full"
                                />
                                {/* Overlay if no data logic is handled inside component, but we can verify here if needed */}
                            </div>
                        </div>

                        {/* Trade Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/40">Entry Price</span>
                                    <span className="text-sm font-mono font-bold text-white">${order.entryPrice.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/40">Current Price</span>
                                    <span className="text-sm font-mono font-bold text-white">${currentPrice.toFixed(3)}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/40">Shares</span>
                                    <span className="text-sm font-mono font-bold text-white">{order.shares.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/40">Holding Time</span>
                                    <span className="text-sm font-mono font-bold text-white flex items-center gap-1">
                                        <Clock size={12} className="text-white/20" />
                                        {durationHours < 1 ? '< 1h' : `${durationHours.toFixed(1)}h`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Visual Card & Actions */}
                <div className="w-full md:w-[380px] bg-[#0c0c0e] border-l border-white/5 p-6 flex flex-col gap-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Shareable Card</h3>
                        <button
                            onClick={handleCopyStats}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {copied ? <span className="text-emerald-400">Copied!</span> : <><Copy size={12} /> Copy Stats</>}
                        </button>
                    </div>

                    {/* The Visual Card */}
                    <div className={`relative aspect-[4/5] rounded-[2rem] overflow-hidden p-6 flex flex-col justify-between shadow-2xl group select-none transition-transform hover:scale-[1.02] duration-500 ${isProfit
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-950'
                            : 'bg-gradient-to-br from-rose-600 to-red-950'
                        }`}>
                        {/* Background Grain/Noise or patterns */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/40 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                                {/* Logo or Icon */}
                                <Wallet size={20} className="text-white" />
                            </div>
                            <div className={`px-3 py-1 rounded-full backdrop-blur-md border ${isProfit ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-rose-400/20 border-rose-400/30'}`}>
                                <span className="text-[10px] font-bold text-white tracking-wider flex items-center gap-1">
                                    {isProfit ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {isProfit ? 'PROFIT' : 'LOSS'}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-4">
                            <h3 className="text-white/90 font-bold text-lg leading-tight line-clamp-3 drop-shadow-sm">
                                {order.marketTitle}
                            </h3>
                        </div>

                        <div className="relative z-10 my-auto text-center py-6">
                            <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-bold mb-2">Total Return</p>
                            <p className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                                {isProfit ? '+' : ''}{roi.toFixed(1)}<span className="text-3xl aligned-top">%</span>
                            </p>
                            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                                <span className="text-white font-mono font-bold">${pnl.toFixed(2)}</span>
                                <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">PNL</span>
                            </div>
                        </div>

                        <div className="relative z-10 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Entry</p>
                                    <p className="text-white font-mono text-sm">${order.entryPrice.toFixed(3)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Current</p>
                                    <p className="text-white font-mono text-sm">${currentPrice.toFixed(3)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-3">
                        {order.status === 'OPEN' && (
                            <button
                                onClick={onClosePosition}
                                className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <span>Close Position</span>
                                <ArrowRight size={18} />
                            </button>
                        )}
                        <a
                            href={`https://polymarket.com/event/${order.marketId}`}
                            target="_blank"
                            className="w-full py-4 rounded-xl font-bold text-white/80 bg-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
                        >
                            <span>Open on Polymarket</span>
                            <ExternalLink size={18} />
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
