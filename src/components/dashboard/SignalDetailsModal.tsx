"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Copy,
    DollarSign,
    Zap,
    Repeat,
    Info,
    Calendar,
    ArrowRight
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
                    const res = await fetch(`/api/markets/resolve?id=${signal.market_id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMarketDetails({
                            title: data.title,
                            slug: data.slug,
                            imageUrl: data.imageUrl,
                            description: data.description, // Use REAL description only
                            endDate: data.endDate ? new Date(data.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Unknown Deadline"
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch market details", e);
                    setMarketDetails({
                        title: `Market #${signal.market_id}`,
                        slug: '',
                        description: "Could not load market details."
                    });
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
    const colorClass = isYes ? 'text-emerald-400' : 'text-rose-400';
    const bgClass = isYes ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    const borderClass = isYes ? 'border-emerald-500/20' : 'border-rose-500/20';

    // Simplified analysis text focused on action
    const analysisText = signal.amount_usd > 5000
        ? "⚠️ HIGH VOLUME ALERT: Significant whale activity detected."
        : "Standard liquidity movement tracked.";

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
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[150]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[700px] bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl z-[160] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header Image Area */}
                        <div className="h-40 w-full relative bg-[#111]">
                            {marketDetails?.imageUrl ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent z-10" />
                                    <img
                                        src={marketDetails.imageUrl}
                                        alt="Market"
                                        className="w-full h-full object-cover opacity-60"
                                    />
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
                            )}

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors text-white z-30 border border-white/5"
                            >
                                <X size={20} />
                            </button>

                            {/* Badge & Timing */}
                            <div className="absolute top-4 left-6 z-20 flex gap-2">
                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                                    {signal.wallet_category || 'Whale Alert'}
                                </span>
                            </div>
                        </div>

                        {/* Main Content Body */}
                        <div className="flex-1 overflow-y-auto px-8 pb-6 -mt-12 relative z-20">

                            {/* Market Title Card */}
                            <div className="flex items-start gap-5 mb-8">
                                {marketDetails?.imageUrl && (
                                    <img
                                        src={marketDetails.imageUrl}
                                        alt="Icon"
                                        className="w-20 h-20 rounded-2xl border-4 border-[#0A0A0B] shadow-2xl bg-[#0A0A0B] object-cover shrink-0"
                                    />
                                )}
                                <div className="pt-12">
                                    <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                                        {marketDetails?.title || `Loading Market #${signal.market_id}...`}
                                    </h2>
                                    {marketDetails?.endDate && (
                                        <div className="flex items-center gap-2 text-sm text-white/50">
                                            <Calendar size={14} />
                                            <span>Deadline: <span className="text-white font-medium">{marketDetails.endDate}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description - The "Real Information" Section */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info size={14} />
                                    About this Market
                                </h3>
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                    {isLoadingDetails ? (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-4 bg-white/10 rounded w-full"></div>
                                            <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                        </div>
                                    ) : (
                                        <p className="text-base text-gray-300 leading-relaxed">
                                            {marketDetails?.description || "No detailed description available for this market."}
                                        </p>
                                    )}

                                    {/* Link to source - Big & Visible */}
                                    {marketDetails?.slug && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <PolymarketLink
                                                marketId={signal.market_id}
                                                className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors"
                                            >
                                                View Source on Polymarket <ArrowRight size={16} />
                                            </PolymarketLink>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* The Trade - Simple & Clear */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className={`p-6 rounded-2xl border ${bgClass} ${borderClass} flex flex-col items-center justify-center text-center`}>
                                    <span className={`text-xs font-bold uppercase tracking-widest opacity-70 ${colorClass} mb-2`}>Whale Choice</span>
                                    <span className={`text-5xl font-black ${colorClass} flex items-center gap-2 my-2`}>
                                        {isYes ? <TrendingUp size={36} /> : <TrendingDown size={36} />}
                                        {signal.outcome}
                                    </span>
                                    <span className="text-sm text-white/60">Entry Price: <strong className="text-white">${signal.price.toFixed(2)}</strong></span>
                                </div>

                                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Total Bet</span>
                                    <span className="text-4xl font-black text-white flex items-center gap-1 my-2">
                                        <span className="text-2xl text-white/40">$</span>
                                        {signal.amount_usd.toLocaleString()}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/60">One-time Order</span>
                                </div>
                            </div>

                        </div>

                        {/* Footer Actions - Big Buttons */}
                        <div className="p-6 border-t border-white/10 bg-[#0A0A0B] flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => onCopyTrade(signal, 'COPY')}
                                className="flex-1 py-4 px-6 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all text-base tracking-tight flex items-center justify-center gap-2"
                            >
                                <Copy size={20} />
                                Copy Whale (Use {signal.outcome})
                            </button>

                            <button
                                onClick={() => onCopyTrade(signal, 'INVERSE')}
                                className="flex-1 py-4 px-6 bg-white/5 text-white hover:bg-white/10 rounded-xl font-bold border border-white/10 transition-all text-base tracking-tight flex items-center justify-center gap-2"
                            >
                                <Repeat size={20} />
                                Inverse Trade (Buy {isYes ? 'NO' : 'YES'})
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
