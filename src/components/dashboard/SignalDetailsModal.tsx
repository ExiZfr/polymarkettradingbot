"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Copy,
    Repeat,
    Info,
    Calendar,
    ArrowRight,
    Loader2,
    Share2,
    ShieldCheck,
    Wallet
} from "lucide-react";
import PolymarketLink from "@/components/ui/PolymarketLink";
import { useEffect, useState } from "react";

interface WhaleSignal {
    id: number;
    wallet_address: string;
    market_id: string;
    market_slug?: string | null;           // ✅ NEW
    market_question?: string;              // ✅ NEW
    market_description?: string | null;    // ✅ NEW
    market_image?: string | null;          // ✅ NEW
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
                            description: data.description,
                            endDate: data.endDate ? new Date(data.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Unknown Deadline"
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch details", e);
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
    const themeColor = isYes ? 'emerald' : 'rose';

    // Dynamic styles based on outcome
    const styles = {
        bg: isYes ? 'bg-emerald-500/10' : 'bg-rose-500/10',
        border: isYes ? 'border-emerald-500/20' : 'border-rose-500/20',
        text: isYes ? 'text-emerald-400' : 'text-rose-400',
        gradient: isYes ? 'from-emerald-500/20 to-emerald-900/10' : 'from-rose-500/20 to-rose-900/10',
        glow: isYes ? 'shadow-emerald-500/10' : 'shadow-rose-500/10'
    };

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

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-3xl shadow-2xl z-[160] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* --- HEADER IMAGE AREA --- */}
                        <div className="relative h-32 w-full bg-[#111] overflow-hidden">
                            {/* Background Image or Gradient */}
                            {marketDetails?.imageUrl ? (
                                <img
                                    src={marketDetails.imageUrl}
                                    alt="Market"
                                    className="w-full h-full object-cover opacity-60 blur-sm scale-110"
                                />
                            ) : (
                                <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient}`} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent" />

                            {/* Top Badge */}
                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck size={12} className="text-blue-400" />
                                    {signal.wallet_category || 'Insider Alert'}
                                </span>
                            </div>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors text-white/70 hover:text-white border border-white/5"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* --- MAIN CONTENT --- */}
                        <div className="px-8 pb-6 -mt-10 relative z-10 flex flex-col gap-6 overflow-y-auto">

                            {/* 1. Market Identity */}
                            <div className="flex gap-5">
                                <div className="shrink-0 relative">
                                    {marketDetails?.imageUrl ? (
                                        <img
                                            src={marketDetails.imageUrl}
                                            alt="Icon"
                                            className="w-20 h-20 rounded-2xl border-4 border-[#0A0A0B] shadow-lg bg-[#1a1a1a] object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl border-4 border-[#0A0A0B] shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                            <Wallet className="text-white opacity-50" />
                                        </div>
                                    )}
                                    {/* Platform Icon Overlay */}
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0A0A0B] rounded-full flex items-center justify-center border border-white/10">
                                        <img src="https://polymarket.com/favicon.ico" alt="Poly" className="w-4 h-4 rounded-full" />
                                    </div>
                                </div>

                                <div className="pt-2 flex-1 min-w-0">
                                    {isLoadingDetails ? (
                                        <div className="space-y-2 animate-pulse mt-1">
                                            <div className="h-6 w-3/4 bg-white/10 rounded" />
                                            <div className="h-4 w-1/4 bg-white/10 rounded" />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-bold text-white leading-tight line-clamp-2">
                                                {marketDetails?.title || `Market #${signal.market_id}`}
                                            </h2>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium">
                                                    <Calendar size={12} />
                                                    {marketDetails?.endDate || 'No deadline'}
                                                </div>

                                                {/* POLYMARKET LINK BUTTON */}
                                                <a
                                                    href={`https://polymarket.com/market/${marketDetails?.slug || signal.market_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors border border-blue-500/20"
                                                >
                                                    Polymarket <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 2. Key Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left: Whale Choice */}
                                <div className={`relative p-5 rounded-2xl border overflow-hidden group ${styles.bg} ${styles.border} ${styles.glow}`}>
                                    <div className={`absolute top-0 right-0 p-3 opacity-10 transition-transform group-hover:scale-110 ${styles.text}`}>
                                        {isYes ? <TrendingUp size={48} /> : <TrendingDown size={48} />}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Whale Position</div>
                                        <div className={`text-4xl font-black ${styles.text} flex items-center gap-2`}>
                                            {signal.outcome}
                                        </div>
                                        <div className="text-xs text-white/50 font-mono mt-2">
                                            Entry: <span className="text-white">${signal.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Amount */}
                                <div className="relative p-5 rounded-2xl border border-white/5 bg-white/5 overflow-hidden hover:bg-white/[0.07] transition-colors group">
                                    <div className="absolute top-0 right-0 p-3 opacity-5">
                                        <Wallet size={48} className="text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Bet Size</div>
                                        <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                            <span className="text-xl text-white/40">$</span>
                                            {signal.amount_usd.toLocaleString()}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 border border-white/5">
                                                Immediate Execution
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Description Section */}
                            <div className="bg-[#111] rounded-2xl p-5 border border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info size={14} className="text-blue-400" />
                                    <h3 className="text-xs font-bold text-white/90 uppercase tracking-widest">About this Market</h3>
                                </div>

                                {isLoadingDetails ? (
                                    <div className="space-y-2 animate-pulse px-1">
                                        <div className="h-3 bg-white/10 rounded w-full" />
                                        <div className="h-3 bg-white/10 rounded w-5/6" />
                                        <div className="h-3 bg-white/10 rounded w-4/6" />
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {marketDetails?.description || "No detailed description available from Polymarket API."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 4. Action Buttons */}
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={() => onCopyTrade(signal, 'COPY')}
                                    className="w-full py-4 rounded-xl bg-white text-black font-bold text-sm tracking-wide shadow-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Copy size={16} className="group-hover:scale-110 transition-transform" />
                                    Copy Whale Trade (Buy {signal.outcome})
                                </button>

                                <button
                                    onClick={() => onCopyTrade(signal, 'INVERSE')}
                                    className="w-full py-3 rounded-xl bg-transparent border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <Repeat size={14} />
                                    Inverse Trade (Buy {isYes ? 'NO' : 'YES'})
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
