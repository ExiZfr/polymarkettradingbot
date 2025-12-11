"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Copy,
    DollarSign,
    ShieldCheck,
    AlertTriangle,
    Zap,
    Repeat
} from "lucide-react";

interface WhaleSignal {
    id: number;
    wallet_address: string;
    market_id: string;
    outcome: 'YES' | 'NO';
    amount_usd: number;
    price: number;
    timestamp: number;
    tx_hash: string;
    wallet_category: string | null;
    reputation_score: number | null;
    was_copied: number;
    copy_position_size: number;
    created_at: string;
}

interface SignalDetailsModalProps {
    signal: WhaleSignal | null;
    isOpen: boolean;
    onClose: () => void;
    onCopyTrade: (signal: WhaleSignal, type: 'COPY' | 'INVERSE') => void;
}

export default function SignalDetailsModal({ signal, isOpen, onClose, onCopyTrade }: SignalDetailsModalProps) {
    if (!signal) return null;

    const isYes = signal.outcome === 'YES';
    const colorClass = isYes ? 'text-green-500' : 'text-red-500';
    const bgClass = isYes ? 'bg-green-500/10' : 'bg-red-500/10';
    const borderClass = isYes ? 'border-green-500/20' : 'border-red-500/20';

    // Simulate Polymarket URL (in real app, use slug or ID)
    const polymarketUrl = `https://polymarket.com/event/${signal.market_id}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[600px] bg-card border border-border rounded-2xl shadow-2xl z-[160] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Trade Details
                                    <span className={`px-2 py-0.5 text-xs rounded border ${signal.wallet_category === 'SMART_MONEY' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                        {signal.wallet_category || 'UNKNOWN'}
                                    </span>
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1 font-mono">
                                    {signal.wallet_address}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Main Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl border ${bgClass} ${borderClass} flex flex-col items-center justify-center text-center`}>
                                    <span className={`text-sm font-medium opacity-80 ${colorClass}`}>Direction</span>
                                    <span className={`text-3xl font-black ${colorClass} flex items-center gap-2 my-1`}>
                                        {isYes ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                                        {signal.outcome}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Entry Price: ${signal.price.toFixed(2)}</span>
                                </div>

                                <div className="p-4 rounded-xl border border-border bg-secondary/30 flex flex-col items-center justify-center text-center">
                                    <span className="text-sm font-medium text-muted-foreground">Volume</span>
                                    <span className="text-3xl font-black text-foreground flex items-center gap-1 my-1">
                                        <DollarSign size={24} className="text-muted-foreground" />
                                        {signal.amount_usd.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground">One-time Order</span>
                                </div>
                            </div>

                            {/* Market Info */}
                            <div className="p-4 rounded-xl bg-secondary/20 border border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-foreground">Market Information</h3>
                                    <a
                                        href={polymarketUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 hover:underline"
                                    >
                                        View on Polymarket <ExternalLink size={12} />
                                    </a>
                                </div>
                                <div className="p-3 bg-background rounded-lg border border-border text-sm text-muted-foreground font-mono">
                                    Market ID: {signal.market_id}<br />
                                    Transaction: {signal.tx_hash.slice(0, 16)}...
                                </div>
                            </div>

                            {/* Analysis */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-500" />
                                    Bot Analysis
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                                        <div className="text-xs text-green-500 font-bold uppercase mb-1">Confidence Score</div>
                                        <div className="text-lg font-bold">85/100</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <div className="text-xs text-blue-500 font-bold uppercase mb-1">Timing</div>
                                        <div className="text-lg font-bold">Excellent</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-border bg-background flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => onCopyTrade(signal, 'COPY')}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all text-sm"
                            >
                                <Copy size={18} />
                                Copy Whale (Use {signal.outcome})
                            </button>

                            <button
                                onClick={() => onCopyTrade(signal, 'INVERSE')}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-bold border border-border hover:-translate-y-0.5 transition-all text-sm"
                            >
                                <Repeat size={18} />
                                Inverse Trade (Buy {isYes ? 'NO' : 'YES'})
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
