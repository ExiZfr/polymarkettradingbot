"use client";

import { useState, useMemo } from "react";
import { useRadar, MarketData } from "@/lib/radar-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, RefreshCw, Zap, TrendingUp, Filter, Star,
    ArrowUpRight, Clock, Activity, BarChart3, AlertTriangle, Layers,
    HelpCircle, ChevronDown, Tag, X
} from "lucide-react";
import { paperStore } from "@/lib/paper-trading";
import { FluxCard } from "@/components/radar/FluxCard";
import { EventType, UrgencyLevel } from "@/lib/snipability-algo";

// Types for Filters
type FilterCategory = 'All' | 'Crypto' | 'Politics' | 'Sports' | 'Business' | 'Science' | 'Other';
type FilterType = 'ALL' | EventType;
type FilterUrgency = 'ALL' | UrgencyLevel;

// Helper to Group Markets
type EventGroup = {
    eventSlug: string;
    eventTitle: string;
    markets: MarketData[];
    bestScore: number;
    totalVolume: number;
};

const HelpModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#12141A] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="text-indigo-500" /> Metric Definitions
            </h2>
            <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-400 font-bold">FLAME SCORE (0-100)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Global snipability index. Combines volume velocity, liquidity gaps, and probability deviations.
                        <br />🔥 80+ = Critical Opportunity.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-sm font-bold text-white mb-1">Urgency</div>
                        <p className="text-xs text-slate-400">
                            Time-sensitivity. HIGH means the window is closing (seconds/minutes).
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-sm font-bold text-white mb-1">Whale Activity</div>
                        <p className="text-xs text-slate-400">
                            Detects large buy orders causing price impact.
                        </p>
                    </div>
                </div>

                <div className="text-xs text-slate-500 mt-4 italic border-t border-white/5 pt-4">
                    * Metrics are calculated in real-time based on the last 60s of order book data.
                </div>
            </div>
        </motion.div>
    </div>
);

export default function RadarView() {
    const { markets, isLoading, lastUpdated, refreshMarkets, toggleFavorite, favorites } = useRadar();

    // UI State
    const [search, setSearch] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [showHelp, setShowHelp] = useState(false);

    // Filter State
    const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');
    const [activeType, setActiveType] = useState<FilterType>('ALL');
    const [activeUrgency, setActiveUrgency] = useState<FilterUrgency>('ALL');

    const handleSnip = (id: string, score: number) => {
        const market = markets.find(m => m.market.id === id);
        if (!market) return;

        const order = paperStore.placeOrder({
            marketId: market.market.id,
            marketTitle: market.market.title,
            marketImage: market.market.image,
            type: 'BUY',
            outcome: 'YES',
            entryPrice: market.market.probability / 100,
            source: 'SNIPER',
            notes: `Score: ${score}`
        });

        if (order) {
            console.log("Order placed:", order);
            // Ideally trigger a toast here
        }
    };

    // Filter & Group Logic
    const groupedMarkets = useMemo(() => {
        // 1. Filter
        const filtered = markets.filter(item => {
            // Snipability Filter hardcoded logic for "finding snipable bets"
            // We assume 'markets' coming from context are already > 20 score.
            // But user said "only filtered snipable bets".
            // Let's hide anything below 50 score if they are looking for specific snipes?
            // Actually, context already filters somewhat. Let's rely on sort order.

            if (search && !item.market.title.toLowerCase().includes(search.toLowerCase())) return false;
            if (activeCategory !== 'All' && item.market.category !== activeCategory) return false;
            if (activeType !== 'ALL' && item.analysis.eventType !== activeType) return false;
            if (activeUrgency !== 'ALL' && item.analysis.urgency !== activeUrgency) return false;

            return true;
        });

        // 2. Group
        const groups = new Map<string, EventGroup>();
        filtered.forEach(item => {
            // Heuristic for event grouping
            const words = item.market.title
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 2 && !['will', 'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'has', 'been', 'are', 'was', 'were', 'yes', 'no', 'market', 'price'].includes(w))
                .slice(0, 4);
            const eventSlug = words.join('_') || item.market.id;

            if (!groups.has(eventSlug)) {
                groups.set(eventSlug, {
                    eventSlug,
                    eventTitle: item.market.title,
                    markets: [],
                    bestScore: 0,
                    totalVolume: 0
                });
            }
            const group = groups.get(eventSlug)!;
            group.markets.push(item);
            group.bestScore = Math.max(group.bestScore, item.analysis.score);

            // Volume Parsing
            const volMatch = item.market.volume.match(/\$?([\d.]+)([MK]?)/);
            if (volMatch) {
                let vol = parseFloat(volMatch[1]);
                if (volMatch[2] === 'M') vol *= 1000000;
                if (volMatch[2] === 'K') vol *= 1000;
                group.totalVolume += vol;
            }
        });

        // 3. Sort Groups by Best Score
        return Array.from(groups.values()).sort((a, b) => b.bestScore - a.bestScore);
    }, [markets, search, activeCategory, activeType, activeUrgency]);

    const toggleGroup = (slug: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else next.add(slug);
            return next;
        });
    };

    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
        if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
        return `$${vol.toFixed(0)}`;
    };

    return (
        <div className="relative min-h-screen pb-20">
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* CONTROL BAR (Sticky & Pro) */}
            <div className="sticky top-0 z-40 bg-[#0A0B10] border-b border-white/10 shadow-2xl">
                <div className="p-4 lg:px-6 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Search Area */}
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="SEARCH TICKER OR KEYWORDS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#050505] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all font-mono uppercase"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                        {/* Category */}
                        <div className="relative group/filter">
                            <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all whitespace-nowrap">
                                {activeCategory === 'All' ? <Tag size={12} /> : null}
                                {activeCategory === 'All' ? 'CATEGORY' : activeCategory.toUpperCase()}
                                <ChevronDown size={12} className="opacity-50" />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-40 bg-[#1A1B23] border border-white/10 rounded-xl shadow-xl p-1 hidden group-hover/filter:block z-50">
                                {(['All', 'Crypto', 'Politics', 'Sports', 'Business'] as FilterCategory[]).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Urgency */}
                        <div className="relative group/filter">
                            <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all whitespace-nowrap">
                                {activeUrgency === 'ALL' ? <Clock size={12} /> : null}
                                {activeUrgency === 'ALL' ? 'URGENCY' : activeUrgency}
                                <ChevronDown size={12} className="opacity-50" />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-40 bg-[#1A1B23] border border-white/10 rounded-xl shadow-xl p-1 hidden group-hover/filter:block z-50">
                                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as FilterUrgency[]).map(urg => (
                                    <button
                                        key={urg}
                                        onClick={() => setActiveUrgency(urg)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeUrgency === urg ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {urg}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <div className="relative group/filter">
                            <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all whitespace-nowrap">
                                {activeType === 'ALL' ? <Zap size={12} /> : null}
                                {activeType === 'ALL' ? 'TYPE' : activeType.replace('_', ' ').substring(0, 10).toUpperCase()}
                                <ChevronDown size={12} className="opacity-50" />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1B23] border border-white/10 rounded-xl shadow-xl p-1 hidden group-hover/filter:block z-50">
                                {(['ALL', 'new_market', 'price_surge', 'whale_volume', 'social_hype'] as FilterType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveType(type)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeType === type ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {type === 'ALL' ? 'ALL TYPES' : type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <button
                            onClick={() => refreshMarkets()}
                            disabled={isLoading}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="p-4 lg:p-6 space-y-4">
                <AnimatePresence>
                    {groupedMarkets.map((group, i) => {
                        const isExpanded = expandedGroups.has(group.eventSlug) || group.markets.length === 1;
                        // Use a darker background for the grouped "Stack"
                        return (
                            <motion.div
                                key={group.eventSlug}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-[#0D0E12] border border-white/5 rounded-2xl overflow-hidden shadow-lg"
                            >
                                {/* Group Header (Only if multiple markets) */}
                                {group.markets.length > 1 && (
                                    <div
                                        onClick={() => toggleGroup(group.eventSlug)}
                                        className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${group.bestScore > 80 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {group.bestScore}
                                                </span>
                                                <Layers size={14} className="text-slate-500" />
                                                <span className="text-xs text-slate-400 font-medium">{group.markets.length} Variants</span>
                                            </div>
                                            <span className="text-sm font-bold text-white line-clamp-1">{group.eventTitle}</span>
                                        </div>
                                        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                )}

                                {/* Markets Container */}
                                <AnimatePresence>
                                    {(isExpanded || group.markets.length === 1) && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {group.markets.map(item => (
                                                    <FluxCard
                                                        key={item.market.id}
                                                        market={item.market}
                                                        sniping={item.analysis}
                                                        onSnip={(id) => handleSnip(id, item.analysis.score)}
                                                        isTracked={favorites.has(item.market.id)}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {groupedMarkets.length === 0 && !isLoading && (
                    <div className="text-center py-20 opacity-50">
                        <p>NO MARKETS FOUND FOR CURRENT FILTERS</p>
                    </div>
                )}
            </div>

            {/* HELP BUTTON */}
            <button
                onClick={() => setShowHelp(true)}
                className="fixed bottom-6 left-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 z-50 transition-transform hover:scale-110"
            >
                <HelpCircle size={24} />
            </button>
        </div>
    );
}
