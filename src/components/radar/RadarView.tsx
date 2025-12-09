"use client";

import { useState, useMemo } from "react";
import { useRadar, MarketData } from "@/lib/radar-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, RefreshCw, Zap, TrendingUp, Filter, Star,
    ArrowUpRight, Clock, Activity, BarChart3, AlertTriangle, Layers,
    HelpCircle, ChevronDown, Tag, X, Flame
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-gradient-to-b from-[#0F1115] to-[#0A0B0F] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative"
        >
            {/* Header */}
            <div className="sticky top-0 bg-[#0F1115]/95 backdrop-blur-sm border-b border-white/5 p-6 z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                    <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl">
                        <Flame className="text-orange-400" size={28} />
                    </div>
                    Snipability Metrics Guide
                </h2>
                <p className="text-sm text-slate-400 mt-2">Comprendre comment nos algorithmes identifient les opportunités de sniping.</p>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
                {/* Flame Score Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-500/20 rounded-xl">
                            <Flame className="text-orange-400 fill-orange-400/30" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">FLAME SCORE</h3>
                            <p className="text-xs text-slate-400">Score composite 0-100</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-4">
                        Le Flame Score est notre algorithme propriétaire qui combine 5 facteurs pour déterminer la "snipabilité" d'un marché.
                    </p>

                    {/* Score Factors */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400">⏱️ Time Score</span>
                            <span className="text-xs text-orange-400">0-30 pts</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.3, duration: 1 }}
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-slate-500">&lt;24h = 30pts | &lt;48h = 25pts | &lt;1 semaine = 18pts | &lt;1 mois = 10pts</p>

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-medium text-slate-400">📊 Volume Score</span>
                            <span className="text-xs text-blue-400">0-30 pts</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Basé sur $500k seuil. Plus le volume est élevé, plus le marché est actif.</p>

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-medium text-slate-400">💧 Liquidity Score</span>
                            <span className="text-xs text-green-400">0-25 pts</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "83%" }}
                                transition={{ delay: 0.7, duration: 1 }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Seuil de $200k. Une liquidité élevée permet des trades sans slippage.</p>

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-medium text-slate-400">🎯 Probability Score</span>
                            <span className="text-xs text-purple-400">0-10 pts</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "33%" }}
                                transition={{ delay: 0.9, duration: 1 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Plus proche de 50% = meilleur potentiel de profit.</p>

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-medium text-slate-400">🏷️ Category Score</span>
                            <span className="text-xs text-yellow-400">0-15 pts</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "50%" }}
                                transition={{ delay: 1.1, duration: 1 }}
                                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Bonus pour Politics, Crypto, Sports. Tags comme "election", "btc" ajoutent des points.</p>
                    </div>
                </motion.div>

                {/* Urgency & Whale Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-2xl"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="text-red-400" size={20} />
                            <h4 className="font-bold text-white">Urgency Levels</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-bold">CRITICAL</span>
                                <span className="text-slate-400">&lt;24h ou Score &gt;85</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded font-bold">HIGH</span>
                                <span className="text-slate-400">&lt;48h ou Score &gt;70</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded font-bold">MEDIUM</span>
                                <span className="text-slate-400">&lt;1 sem ou Score &gt;50</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded font-bold">LOW</span>
                                <span className="text-slate-400">Long terme</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="text-yellow-400" size={20} />
                            <h4 className="font-bold text-white">Whale Activity</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                            Détecté quand:
                        </p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                <span className="text-slate-300">Volume &gt; $500k</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                <span className="text-slate-300">Liquidité &gt; $100k</span>
                            </div>
                        </div>
                        <p className="text-xs text-yellow-400/70 mt-3">
                            ⚡ Indique des mouvements de gros portefeuilles.
                        </p>
                    </motion.div>
                </div>

                {/* Event Types */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="text-indigo-400" size={20} />
                        <h4 className="font-bold text-white">Event Types</h4>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <span className="block text-lg mb-1">🐦</span>
                            <span className="text-slate-400">Tweet</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                            <span className="block text-lg mb-1">📢</span>
                            <span className="text-slate-400">Annonce</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                            <span className="block text-lg mb-1">🎪</span>
                            <span className="text-slate-400">Event</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                            <span className="block text-lg mb-1">📰</span>
                            <span className="text-slate-400">News</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                            <span className="block text-lg mb-1">❓</span>
                            <span className="text-slate-400">Other</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    </div>
);


// --- STACK COMPONENT ---
const StackedGroup = ({ group, isExpanded, onToggle, onSnip, onToggleFavorite, favorites }: {
    group: EventGroup,
    isExpanded: boolean,
    onToggle: () => void,
    onSnip: (id: string, score: number) => void,
    onToggleFavorite: (id: string) => void,
    favorites: Set<string>
}) => {
    // If only 1 market, just show the card directly, no stack effect needed
    if (group.markets.length === 1) {
        const item = group.markets[0];
        return (
            <FluxCard
                market={item.market}
                sniping={item.analysis}
                onSnip={(id) => onSnip(id, item.analysis.score)}
                onToggleFavorite={onToggleFavorite}
                isTracked={favorites.has(item.market.id)}
            />
        );
    }

    // STACK EFFECT
    return (
        <motion.div
            layout
            className={`relative transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}
        >
            <AnimatePresence mode="popLayout">
                {isExpanded ? (
                    // EXPANDED GRID VIEW
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-[#0C0D12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden relative"
                    >
                        <div
                            onClick={onToggle}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10 transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white max-w-2xl leading-normal">{group.eventTitle}</h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs">{group.markets.length} VARIANTS</span>
                                <span>Total Vol: <span className="text-green-400 font-mono font-bold">${(group.totalVolume / 1000).toFixed(0)}k</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {group.markets.map(item => (
                                <FluxCard
                                    key={item.market.id}
                                    market={item.market}
                                    sniping={item.analysis}
                                    onSnip={(id) => onSnip(id, item.analysis.score)}
                                    onToggleFavorite={onToggleFavorite}
                                    isTracked={favorites.has(item.market.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    // COLLAPSED STACK VIEW (Pile of papers)
                    <motion.div
                        layout
                        onClick={onToggle}
                        className="relative h-[280px] w-full cursor-pointer group perspective-1000"
                        whileHover={{ scale: 1.02 }}
                    >
                        {/* Background Cards (The Stack) */}
                        {group.markets.slice(1, 4).map((_, index) => (
                            <div
                                key={index}
                                className="absolute top-0 w-full h-full rounded-2xl border border-white/5 bg-[#14161C] shadow-xl transition-transform duration-300"
                                style={{
                                    left: (index + 1) * 4 + 'px',
                                    top: (index + 1) * 4 + 'px',
                                    zIndex: -index,
                                    transform: `translateZ(-${(index + 1) * 10}px)`,
                                    opacity: 1 - (index * 0.2)
                                }}
                            />
                        ))}

                        {/* Top Card (Preview) */}
                        <div className="absolute inset-0 bg-[#0C0D12] rounded-2xl border border-white/10 shadow-2xl p-5 flex flex-col justify-between overflow-hidden">
                            {/* Decorative blurred gradient */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block w-fit">
                                        EVENT STACK
                                    </span>
                                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                        <Layers size={14} /> {group.markets.length}
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-lg leading-snug line-clamp-3 group-hover:text-indigo-400 transition-colors">
                                    {group.eventTitle}
                                </h3>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                    <span>Best Opportunity</span>
                                    <div className="flex items-center gap-1 text-orange-400 font-bold">
                                        <Flame size={12} className="fill-current" /> {group.bestScore}/100
                                    </div>
                                </div>
                                <div className="w-full py-2 bg-indigo-600/10 border border-indigo-600/20 rounded-lg text-center text-indigo-400 text-xs font-bold group-hover:bg-indigo-600/20 transition-colors">
                                    CLICK TO REVEAL ALL
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default function RadarView() {
    const { markets, isLoading, lastUpdated, refreshMarkets, toggleFavorite, favorites } = useRadar();

    // UI State
    const [search, setSearch] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [showHelp, setShowHelp] = useState(false);
    const [openFilter, setOpenFilter] = useState<'category' | 'urgency' | 'type' | null>(null);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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
        }
    };

    // Filter & Group Logic
    const groupedMarkets = useMemo(() => {
        // 1. Filter
        const filtered = markets.filter(item => {
            // Favorites filter
            if (showFavoritesOnly && !favorites.has(item.market.id)) return false;

            // Search
            if (search && !item.market.title.toLowerCase().includes(search.toLowerCase())) return false;

            // Fix Filter Logic: Normalize Strings for comparison
            // Category
            if (activeCategory !== 'All') {
                if (!item.market.category) return false;
                if (item.market.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
            }

            // Type
            if (activeType !== 'ALL') {
                if (item.analysis.eventType !== activeType) return false;
            }

            // Urgency
            if (activeUrgency !== 'ALL') {
                if (item.analysis.urgency !== activeUrgency) return false;
            }

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

    return (
        <div className="relative min-h-screen pb-20 p-6 md:p-8">
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* HEADER DESIGN VINTAGE / PREMIUM */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30">
                            <TrendingUp className="text-white" size={20} />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Market Radar</h1>
                    </div>
                    <p className="text-slate-400 text-sm max-w-lg">
                        Real-time AI analysis of liquidity gaps and volume anomalies across {markets.length} active markets.
                    </p>
                </div>

                {/* Main Stats / Status */}
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-2xl bg-[#0F1115] border border-white/5 flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">EVENTS</span>
                        <span className="text-xl font-bold text-white">{groupedMarkets.length}</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0F1115] border border-white/5 flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SNIPES</span>
                        <span className="text-xl font-bold text-indigo-400">{markets.filter(m => m.analysis.score > 80).length}</span>
                    </div>
                </div>
            </div>

            {/* CONTROLS BAR (Floating Glass) */}
            <div className="sticky top-4 z-40 mb-8 p-1.5 bg-[#0C0D12]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 overflow-visible">
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search markets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-transparent rounded-xl text-sm text-white placeholder:text-slate-600 focus:bg-white/5 outline-none transition-all"
                    />
                </div>

                <div className="h-8 w-px bg-white/10 self-center hidden md:block mx-2" />

                {/* Filters Row */}
                <div className="flex items-center gap-2 overflow-visible pb-1 md:pb-0 px-2 md:px-0">
                    {/* Category Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
                            className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeCategory !== 'All' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            {activeCategory === 'All' ? 'Category' : activeCategory}
                            <ChevronDown size={14} className={`opacity-50 transition-transform ${openFilter === 'category' ? 'rotate-180' : ''}`} />
                        </button>
                        {openFilter === 'category' && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-[#15171E] border border-white/10 rounded-xl shadow-xl p-1 z-[9999] pointer-events-auto">
                                {(['All', 'Crypto', 'Politics', 'Sports', 'Business'] as FilterCategory[]).map(cat => (
                                    <button key={cat} onClick={() => { setActiveCategory(cat); setOpenFilter(null); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{cat}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Urgency Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenFilter(openFilter === 'urgency' ? null : 'urgency')}
                            className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeUrgency !== 'ALL' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            {activeUrgency === 'ALL' ? 'Urgency' : activeUrgency}
                            <ChevronDown size={14} className={`opacity-50 transition-transform ${openFilter === 'urgency' ? 'rotate-180' : ''}`} />
                        </button>
                        {openFilter === 'urgency' && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-[#15171E] border border-white/10 rounded-xl shadow-xl p-1 z-[9999] pointer-events-auto">
                                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as FilterUrgency[]).map(urg => (
                                    <button key={urg} onClick={() => { setActiveUrgency(urg); setOpenFilter(null); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeUrgency === urg ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{urg}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
                            className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeType !== 'ALL' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            {activeType === 'ALL' ? 'Type' : activeType.replace('_', ' ')}
                            <ChevronDown size={14} className={`opacity-50 transition-transform ${openFilter === 'type' ? 'rotate-180' : ''}`} />
                        </button>
                        {openFilter === 'type' && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#15171E] border border-white/10 rounded-xl shadow-xl p-1 z-[9999] pointer-events-auto">
                                {(['ALL', 'new_market', 'price_surge', 'whale_volume', 'social_hype'] as FilterType[]).map(type => (
                                    <button key={type} onClick={() => { setActiveType(type); setOpenFilter(null); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeType === type ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{type === 'ALL' ? 'All Types' : type.replace('_', ' ')}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Favorites Toggle */}
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showFavoritesOnly ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        <Star size={14} className={showFavoritesOnly ? 'fill-current' : ''} />
                        <span className="hidden sm:inline">Favorites</span>
                        {favorites.size > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${showFavoritesOnly ? 'bg-black/20 text-black' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {favorites.size}
                            </span>
                        )}
                    </button>                    <button
                        onClick={() => refreshMarkets()}
                        disabled={isLoading}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <AnimatePresence>
                    {groupedMarkets.map(group => (
                        <StackedGroup
                            key={group.eventSlug}
                            group={group}
                            isExpanded={expandedGroups.has(group.eventSlug)}
                            onToggle={() => toggleGroup(group.eventSlug)}
                            onSnip={handleSnip}
                            onToggleFavorite={toggleFavorite}
                            favorites={favorites}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {groupedMarkets.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 opacity-50">
                    <Layers size={64} className="mb-4 text-slate-700" />
                    <p className="text-lg font-medium">No active opportunities found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            )}

            {/* HELP BUTTON */}
            <button
                onClick={() => setShowHelp(true)}
                className="fixed bottom-8 left-8 h-12 w-12 bg-white/5 hover:bg-indigo-600 backdrop-blur-md border border-white/10 hover:border-indigo-500 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-2xl transition-all duration-300 z-50 group origin-center hover:scale-110"
            >
                <HelpCircle size={22} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
    );
}
