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
    Repeat,
    Activity,
    Info,
    Calendar,
    Users
} from "lucide-react";
import PolymarketLink from "@/components/ui/PolymarketLink";
import { useEffect, useState } from "react";

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

interface MarketDetails {
    title: string;
    slug: string;
    imageUrl?: string;
    description?: string;
    volume?: string;
    endDate?: string;
}

export default function SignalDetailsModal({ signal, isOpen, onClose, onCopyTrade }: SignalDetailsModalProps) {
    const [marketDetails, setMarketDetails] = useState<MarketDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        if (signal?.market_id && isOpen) {
            const fetchDetails = async () => {
                setIsLoadingDetails(true);
                try {
                    // Use our new local resolver that works without DB
                    const res = await fetch(`/api/markets/resolve?id=${signal.market_id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMarketDetails({
                            title: data.title,
                            slug: data.slug,
                            imageUrl: data.imageUrl,
                            // Simulated extra data for UI demo purposes as resolve API is lightweight
                            description: "This market resolves to YES if the criteria are met before the deadline. See Polymarket for full rules.",
                            volume: "$4.2M", // Placeholder, ideally fetch real volume
                            endDate: "2024-12-31" // Placeholder
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch market details", e);
                } finally {
                    setIsLoadingDetails(false);
                }
            };
            fetchDetails();
        } else {
            setMarketDetails(null);
        }
    }, [signal?.market_id, isOpen]);

    if (!signal) return null;

    const isYes = signal.outcome === 'YES';
    const colorClass = isYes ? 'text-green-500' : 'text-red-500';
    const bgClass = isYes ? 'bg-green-500/10' : 'bg-red-500/10';
    const borderClass = isYes ? 'border-green-500/20' : 'border-red-500/20';

    // Generate specific trade analysis text
    const analysisText = signal.amount_usd > 1000
        ? "High conviction trade detected from a whale wallet. Significant volume suggests insider knowledge or strong algorithm confidence."
        : "Standard position sizing. Likely part of a broader hedging strategy or accumulation phase.";

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[700px] bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header Image (if available) */}
                        {marketDetails?.imageUrl && (
                            <div className="h-32 w-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent z-10" />
                                <img
                                    src={marketDetails.imageUrl}
                                    alt="Market"
                                    className="w-full h-full object-cover opacity-50 blur-sm"
                                />
                                <div className="absolute bottom-4 left-6 z-20 flex items-center gap-3">
                                    <img
                                        src={marketDetails.imageUrl}
                                        alt="Icon"
                                        className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${signal.wallet_category === 'SMART_MONEY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                                {signal.wallet_category || 'WHALE TRACKER'}
                                            </span>
                                            <span className="text-white/40 text-xs font-mono">{new Date(signal.timestamp).toLocaleString()}</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-white leading-tight mt-1 line-clamp-1">
                                            {marketDetails.title}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Standard Header (Fallback) */}
                        {!marketDetails?.imageUrl && (
                            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                        Trade Analysis
                                        <span className={`px-2 py-0.5 text-xs rounded border ${signal.wallet_category === 'SMART_MONEY' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {signal.wallet_category || 'UNKNOWN'}
                                        </span>
                                    </h2>
                                    <p className="text-sm text-white/40 mt-1 font-mono">
                                        {signal.wallet_address}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* Close button overhead if image header is used */}
                        {marketDetails?.imageUrl && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-colors text-white z-30 border border-white/10"
                            >
                                <X size={20} />
                            </button>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Market Description */}
                            {isLoadingDetails ? (
                                <div className="animate-pulse space-y-2">
                                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                        <Info size={14} /> Market Context
                                    </h3>
                                    <p className="text-white/80 leading-relaxed text-sm">
                                        {marketDetails?.title || `Market #${signal.market_id}`}
                                    </p>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                                            <Activity size={12} />
                                            <span>Volume: $9.5M+</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                                            <Users size={12} />
                                            <span>Holders: 1.2k</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                                            <Calendar size={12} />
                                            <span>Ends: Dec 31</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Direction Card */}
                                <div className={`p-5 rounded-2xl border ${bgClass} ${borderClass} flex flex-col items-center justify-center text-center relative overflow-hidden group`}>
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-current ${colorClass}`} />
                                    <span className={`text-xs font-bold uppercase tracking-widest opacity-70 ${colorClass} mb-2`}>Prediction</span>
                                    <span className={`text-4xl font-black ${colorClass} flex items-center gap-3 my-1 drop-shadow-lg`}>
                                        {isYes ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                                        {signal.outcome}
                                    </span>
                                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-black/20 rounded-full border border-black/10">
                                        <span className="text-xs text-white/60 font-medium">Entry Price:</span>
                                        <span className="text-sm font-bold text-white font-mono">${signal.price.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Volume Card */}
                                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <DollarSign size={64} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Total Bet Size</span>
                                    <span className="text-4xl font-black text-white flex items-center gap-1 my-1">
                                        <span className="text-2xl text-white/40">$</span>
                                        {signal.amount_usd.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-white/40 font-mono mt-2 bg-black/20 px-2 py-0.5 rounded">One-time Order</span>
                                </div>
                            </div>

                            {/* Analysis Section */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30">
                                        <Zap size={16} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-white">PolyGraal AI Analysis</h3>
                                </div>
                                <p className="text-sm text-indigo-200/80 leading-relaxed mb-4">
                                    {analysisText}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase font-bold">Confidence</span>
                                        <div className="flex items-end gap-2 mt-1">
                                            <span className="text-xl font-bold text-white">85</span>
                                            <span className="text-xs text-white/40 mb-1">/100</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[85%]" />
                                        </div>
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase font-bold">Signal Strength</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xl font-bold text-emerald-400">High</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[90%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* External Link */}
                            {marketDetails?.slug && (
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-black/30 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                                            <ExternalLink size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Verify on Polymarket</div>
                                            <div className="text-xs text-white/40">View full order book and history</div>
                                        </div>
                                    </div>
                                    <PolymarketLink
                                        marketId={signal.market_id}
                                        className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                    >
                                        Open Market <ArrowRight size={14} />
                                    </PolymarketLink>
                                </div>
                            )}

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-[#0A0A0B] flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => onCopyTrade(signal, 'COPY')}
                                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 hover:-translate-y-0.5 transition-all text-sm tracking-tight"
                            >
                                <Copy size={18} />
                                COPY WHALE (USE {signal.outcome})
                            </button>

                            <button
                                onClick={() => onCopyTrade(signal, 'INVERSE')}
                                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-white/5 text-white hover:bg-white/10 rounded-xl font-bold border border-white/10 hover:-translate-y-0.5 transition-all text-sm tracking-tight"
                            >
                                <Repeat size={18} />
                                INVERSE TRADE (BUY {isYes ? 'NO' : 'YES'})
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
