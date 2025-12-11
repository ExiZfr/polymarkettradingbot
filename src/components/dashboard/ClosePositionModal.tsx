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
    ExternalLink,
    Eye,
    Share2
} from "lucide-react";
import { PaperOrder } from "@/lib/paper-trading";

interface ClosePositionModalProps {
    order: PaperOrder;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ClosePositionModal({ order, onClose, onConfirm }: ClosePositionModalProps) {
    const [showPnLPreview, setShowPnLPreview] = useState(false);

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

    const handleSaveImage = async () => {
        try {
            const cardElement = document.getElementById('pnl-preview-card');
            if (!cardElement) return;

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardElement, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `PolyGraalX_Preview_${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    return (
        <>
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
                        <div className="grid grid-cols-2 gap-4 mb-6">
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

                        {/* Market Info + Polymarket Link */}
                        <div className="p-4 rounded-lg bg-white/5 mb-6 border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className={`shrink-0 w-1 h-12 rounded-full ${order.outcome === 'YES' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white/40 mb-1">Market Outcome</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`font-bold text-sm ${order.outcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                            {order.outcome}
                                        </span>
                                        <span className="text-sm text-white/80 truncate">{order.marketTitle}</span>
                                    </div>
                                    <a
                                        href={`https://polymarket.com/market/${order.marketId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                    >
                                        <ExternalLink size={12} />
                                        View Live on Polymarket
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Preview PnL Card Button */}
                        <button
                            onClick={() => setShowPnLPreview(true)}
                            className="w-full py-3 mb-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            <Eye size={16} />
                            Visualize PnL Card
                        </button>

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

            {/* PnL Card Preview Modal */}
            <AnimatePresence>
                {showPnLPreview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPnLPreview(false)}
                            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200]"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] flex flex-col items-center"
                        >
                            <button
                                onClick={() => setShowPnLPreview(false)}
                                className="absolute -right-12 top-0 w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center transition-all z-20"
                            >
                                <X size={20} />
                            </button>

                            {/* The PnL Card */}
                            <div
                                id="pnl-preview-card"
                                className="w-[700px] h-[400px] rounded-[32px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] border border-white/10 relative"
                                style={{
                                    backgroundImage: 'url(/images/pnl-card-clean.png)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${isWin ? 'from-emerald-500/20 via-black/50 to-emerald-900/40' : 'from-rose-500/20 via-black/50 to-rose-900/40'} pointer-events-none mix-blend-overlay`} />
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />

                                <div className="relative z-10 h-full flex flex-col justify-between p-7">
                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full pl-1.5 pr-6 py-1.5 border border-white/10 shadow-lg">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
                                                <span className="font-black text-white text-xs">P</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 leading-none mb-1">
                                                    <span className="text-white font-bold text-sm tracking-tight">PolyGraalX.app</span>
                                                    <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24">
                                                        <path d="M20.285 2l-11.285 11.561-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                                                    </svg>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono font-medium uppercase tracking-wider leading-none">
                                                    <span className="text-blue-200/80">@WhaleHunter</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
                                                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-lg ${isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isWin ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">PREVIEW</span>
                                        </div>
                                    </div>

                                    {/* Big Numbers */}
                                    <div className="flex-1 flex flex-col justify-center pl-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-3xl font-black text-white tracking-tight">{order.outcome}</h2>
                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-white/5 text-white/40 border border-white/5 uppercase tracking-wider">PREDICTION</span>
                                        </div>

                                        <h1
                                            className={`text-[96px] leading-[0.85] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white ${isWin ? 'via-emerald-50 to-emerald-200' : 'via-rose-50 to-rose-200'}`}
                                            style={{ filter: `drop-shadow(0 0 40px ${isWin ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'})` }}
                                        >
                                            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                        </h1>
                                        <div className="flex items-center gap-3 mt-2 ml-2">
                                            <p className={`font-mono text-3xl font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                                            </p>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isWin ? 'border-emerald-500/30 text-emerald-500/50' : 'border-rose-500/30 text-rose-500/50'}`}>USDC</div>
                                        </div>
                                    </div>

                                    {/* Footer Metrics */}
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3">
                                            <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">Entry Price</div>
                                            <div className="text-white font-mono font-medium">{order.entryPrice.toFixed(4)}</div>
                                        </div>
                                        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3">
                                            <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">Mark Price</div>
                                            <div className="text-white font-mono font-medium">{currentPrice.toFixed(4)}</div>
                                        </div>
                                        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3">
                                            <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">Position</div>
                                            <div className="text-white/60 font-mono font-medium">${order.amount}</div>
                                        </div>
                                        <div className="bg-blue-600/10 backdrop-blur-md border border-blue-500/20 rounded-xl p-3 flex flex-col justify-center items-center">
                                            <div className="text-[8px] uppercase text-blue-300/60 font-bold tracking-wider">Powered by</div>
                                            <div className="text-blue-300 font-bold text-xs leading-none mt-0.5">PolyGraalX</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveImage}
                                className="mt-6 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <Share2 size={16} />
                                Save Card
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
