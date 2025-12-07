"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight, AlertTriangle, TrendingUp, Info, Flame, Droplets, Clock, ExternalLink, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MarketData {
    id: string
    title: string
    image: string
    outcome: string
    probability: number
    volume: string
    liquidity?: number
    endDate?: string | Date
    category?: string
    tags?: string[]
}

export interface SnipingData {
    score: number // 0-100
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    whaleActivity: boolean
    description: string
    factors?: {
        timeScore: number;
        volumeScore: number;
        liquidityScore: number;
        probabilityScore: number;
        categoryScore: number;
    }
}

interface FluxCardProps {
    market: MarketData
    sniping: SnipingData
    onSnip?: (id: string) => void
}

export function FluxCard({ market, sniping, onSnip }: FluxCardProps) {
    const [isFlipped, setIsFlipped] = React.useState(false)

    // Color coding based on snipability score
    const isHot = sniping.score >= 80;
    const isWarm = sniping.score >= 50;

    const scoreColor = isHot ? "text-red-500" : isWarm ? "text-orange-400" : "text-blue-400";
    const badgeBg = isHot ? "bg-red-500/20 border-red-500/50" : isWarm ? "bg-orange-500/20 border-orange-500/50" : "bg-blue-500/20 border-blue-500/50";

    // Format helpers
    const formatLiquidity = (liq: number | undefined) => {
        if (!liq) return "$0";
        if (liq >= 1000000) return `$${(liq / 1000000).toFixed(1)}M`;
        if (liq >= 1000) return `$${(liq / 1000).toFixed(1)}K`;
        return `$${liq}`;
    };

    const formatDate = (date: string | Date | undefined) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className="relative h-96 w-full cursor-pointer perspective-1000 group/card"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative h-full w-full preserve-3d transition-all duration-500"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* --- FRONT SIDE --- */}
                <div className="absolute inset-0 h-full w-full backface-hidden">
                    <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0F1116] shadow-2xl transition-colors hover:border-white/20">

                        {/* Image Header with Score Badge overlay - FIXED POSITION */}
                        <div className="relative h-40 w-full overflow-hidden">
                            <img
                                src={market.image}
                                alt={market.title}
                                className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover/card:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1116] to-transparent" />

                            {/* FLAME SCORE BADGE (Top Left) */}
                            <div className={cn("absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border backdrop-blur-md shadow-lg z-10", badgeBg)}>
                                <Flame className={cn("h-4 w-4 fill-current animate-pulse", scoreColor)} />
                                <span className="text-sm font-bold text-white">{sniping.score}</span>
                            </div>

                            {/* Tags (Top Right) */}
                            {market.tags && market.tags.length > 0 && (
                                <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1 max-w-[60%]">
                                    <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[10px] uppercase font-medium text-slate-300 backdrop-blur-sm">
                                        {market.tags[0]}
                                    </span>
                                </div>
                            )}

                            {/* Volume Badge (Bottom Left of Image) */}
                            <div className="absolute bottom-2 left-3 rounded-md bg-black/60 border border-white/5 px-2 py-1 flex items-center gap-1.5 backdrop-blur-sm">
                                <Activity className="h-3 w-3 text-slate-400" />
                                <span className="text-xs font-medium text-slate-200">Vol: {market.volume}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col h-[calc(100%-160px)] justify-between">
                            <div>
                                {/* Category Label */}
                                <div className="text-[10px] font-bold tracking-wider text-blue-400 uppercase mb-2">
                                    {market.category || "General"}
                                </div>
                                <h3 className="line-clamp-3 text-lg font-bold text-white leading-snug">
                                    {market.title}
                                </h3>
                            </div>

                            <div className="flex items-end justify-between mt-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Probability (Yes)</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-3xl font-black", market.probability > 50 ? "text-green-400" : "text-slate-200")}>
                                            {market.probability}%
                                        </span>
                                    </div>
                                </div>

                                {/* Fake "Flip" hint button */}
                                <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BACK SIDE (Analysis Dashboard) --- */}
                <div
                    className="absolute inset-0 h-full w-full backface-hidden rounded-2xl overflow-hidden"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className={cn(
                        "h-full w-full flex flex-col rounded-2xl border bg-[#0A0B10] shadow-2xl relative",
                        isHot ? "border-red-500/30" : "border-blue-500/30"
                    )}>
                        {/* Header Fixed */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-slate-400">Market Analysis</span>
                                <div className={cn("flex items-center gap-1 text-sm font-bold", scoreColor)}>
                                    <Flame className="h-3 w-3 fill-current" />
                                    {sniping.score}/100
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <Droplets className="h-3 w-3" /> Liquidity
                                    </div>
                                    <div className="text-sm font-mono font-bold text-white">{formatLiquidity(market.liquidity)}</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <Clock className="h-3 w-3" /> Ends On
                                    </div>
                                    <div className="text-sm font-mono font-bold text-white">{formatDate(market.endDate)}</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <Activity className="h-3 w-3" /> Volume
                                    </div>
                                    <div className="text-sm font-mono font-bold text-white">{market.volume}</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <AlertTriangle className="h-3 w-3" /> Urgency
                                    </div>
                                    <div className={cn("text-xs font-bold px-1.5 py-0.5 rounded w-fit",
                                        sniping.urgency === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                                    )}>
                                        {sniping.urgency}
                                    </div>
                                </div>
                            </div>

                            {/* Deep Analysis */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase">AI Reasoning</h4>
                                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-xs leading-relaxed text-blue-200">
                                        "{sniping.description}"
                                    </p>
                                </div>

                                {sniping.whaleActivity && (
                                    <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                                        <TrendingUp className="h-4 w-4 text-green-400" />
                                        <span className="text-xs font-bold text-green-300">Whale Activity Detected</span>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Actions Footer (Fixed at bottom) */}
                        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md space-y-2 z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSnip?.(market.id);
                                }}
                                className="w-full py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Flame className="h-4 w-4" /> SNIP NOW
                            </button>

                            <a
                                href={`https://polymarket.com/market/${market.id}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                View on Polymarket <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
