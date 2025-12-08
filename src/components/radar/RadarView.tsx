"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RefreshCw, TrendingUp, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { FluxCard, SnipingData } from "@/components/radar/FluxCard";
import { fetchPolymarketMarkets, ProcessedMarket } from "@/lib/polymarket";
import { calculateSnipability, EventType, UrgencyLevel } from "@/lib/snipability-algo";
import { filterSnipableMarkets } from "@/lib/dynamic-filter";
import { listener, ListenerStatus } from "@/lib/listener";
import { paperStore } from "@/lib/paper-trading";

type FilterCategory = 'All' | 'Crypto' | 'Politics' | 'Sports' | 'Finance' | 'Other';

type MarketWithSniping = {
    market: ProcessedMarket;
    sniping: SnipingData & { eventType: EventType };
};

type EventGroup = {
    eventSlug: string;
    eventTitle: string;
    markets: MarketWithSniping[];
    bestScore: number;
    totalVolume: number;
};

type Toast = {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
};

export default function RadarView() {
    const [markets, setMarkets] = useState<MarketWithSniping[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('All');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        loadMarkets();
        listener.start();
        const refreshInterval = setInterval(loadMarkets, 60000);

        // Scroll listener for header effect
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            clearInterval(refreshInterval);
            listener.stop();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const showToast = (type: Toast['type'], message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    async function loadMarkets() {
        setLoading(true);
        try {
            const rawMarkets = await fetchPolymarketMarkets();
            const scored = rawMarkets.map(market => {
                const snipability = calculateSnipability(market);
                return {
                    market,
                    sniping: {
                        score: snipability.score,
                        urgency: snipability.urgency,
                        whaleActivity: snipability.whaleActivity,
                        description: snipability.description,
                        eventType: snipability.eventType,
                        factors: snipability.factors
                    }
                };
            });

            const filtered = filterSnipableMarkets(scored, 25, 500);

            // Deduplication
            const uniqueMap = new Map();
            const uniqueFiltered = filtered.filter(item => {
                if (uniqueMap.has(item.market.id)) return false;
                uniqueMap.set(item.market.id, true);
                return true;
            });

            setMarkets(uniqueFiltered);
        } catch (error) {
            console.error('[Radar] Failed to load markets:', error);
        } finally {
            setLoading(false);
        }
    }

    // SNIPE FUNCTION
    const handleSnipe = (marketId: string) => {
        const settings = paperStore.getSettings();
        if (!settings.enabled) {
            showToast('error', 'Paper Trading désactivé. Activez-le dans Settings.');
            return;
        }

        const marketData = markets.find(m => m.market.id === marketId);
        if (!marketData) return;

        const { market } = marketData;
        const order = paperStore.placeOrder({
            marketId: market.id,
            marketTitle: market.title,
            marketImage: market.image,
            type: 'BUY',
            outcome: 'YES',
            entryPrice: market.probability / 100,
            source: 'SNIPER',
            notes: `Score: ${marketData.sniping.score}`
        });

        if (order) {
            showToast('success', `Sniped! $${order.amount.toFixed(2)} sur ${market.title.slice(0, 30)}...`);
        } else {
            showToast('error', 'Échec: vérifiez balance/settings');
        }
    };

    // Group markets by event
    const groupedMarkets = useMemo(() => {
        // Filter first
        const filtered = markets.filter(item => {
            if (!item.market.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterCategory !== 'All' && item.market.category !== filterCategory) return false;
            return true;
        });

        // Group by event slug (extract from title or use a heuristic)
        const groups = new Map<string, EventGroup>();

        filtered.forEach(item => {
            // Extract event slug - use first significant words as key
            // This is a heuristic: take first 3-4 significant words
            const words = item.market.title
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 2 && !['will', 'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'has', 'been', 'are', 'was', 'were', 'yes', 'no'].includes(w))
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
            group.bestScore = Math.max(group.bestScore, item.sniping.score);

            // Parse volume
            const volMatch = item.market.volume.match(/\$?([\d.]+)([MK]?)/);
            if (volMatch) {
                let vol = parseFloat(volMatch[1]);
                if (volMatch[2] === 'M') vol *= 1000000;
                if (volMatch[2] === 'K') vol *= 1000;
                group.totalVolume += vol;
            }
        });

        // Convert to array and sort by best score
        return Array.from(groups.values())
            .sort((a, b) => b.bestScore - a.bestScore);
    }, [markets, searchQuery, filterCategory]);

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
        <div className="relative">
            {/* Toast Notifications */}
            <div className="fixed top-24 right-6 z-[60] flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className={`px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl backdrop-blur-xl border ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                                    'bg-blue-500/20 border-blue-500/30 text-blue-400'
                                }`}
                        >
                            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-medium">{toast.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Fixed Search Bar - Always Opaque */}
            <div className="sticky top-0 z-40 bg-[#0A0B10] border-b border-white/10 shadow-xl">
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        {/* Title & Stats */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">Market Radar</h2>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Live
                                    </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">{groupedMarkets.length} Events</span>
                                    <span>•</span>
                                    <span>{markets.length} Markets</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${paperStore.getSettings().enabled
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {paperStore.getSettings().enabled ? 'PAPER' : 'OFF'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un marché ou un événement..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <option value="All" className="bg-[#0C0D12]">Toutes catégories</option>
                                    <option value="Crypto" className="bg-[#0C0D12]">💰 Crypto</option>
                                    <option value="Politics" className="bg-[#0C0D12]">🏛️ Politics</option>
                                    <option value="Sports" className="bg-[#0C0D12]">⚽ Sports</option>
                                </select>

                                <button
                                    onClick={() => loadMarkets()}
                                    disabled={loading}
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Groups */}
            <div className="p-4 sm:p-6 space-y-4">
                <AnimatePresence>
                    {groupedMarkets.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-slate-500"
                        >
                            <Layers size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Aucun marché trouvé</p>
                        </motion.div>
                    ) : (
                        groupedMarkets.map((group, groupIndex) => {
                            const isExpanded = expandedGroups.has(group.eventSlug) || group.markets.length === 1;
                            const displayMarkets = isExpanded ? group.markets : group.markets.slice(0, 1);

                            return (
                                <motion.div
                                    key={group.eventSlug}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: groupIndex * 0.05 }}
                                    className="bg-[#0C0D12] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
                                >
                                    {/* Group Header */}
                                    {group.markets.length > 1 && (
                                        <button
                                            onClick={() => toggleGroup(group.eventSlug)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${group.bestScore >= 80 ? 'bg-red-500/20 text-red-400' :
                                                        group.bestScore >= 60 ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {group.bestScore}
                                                    </div>
                                                    <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold">
                                                        {group.markets.length} variants
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-white font-medium line-clamp-1">{group.eventTitle}</div>
                                                    <div className="text-xs text-slate-500">
                                                        Volume total: {formatVolume(group.totalVolume)}
                                                    </div>
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="text-slate-400" size={20} />
                                            ) : (
                                                <ChevronDown className="text-slate-400" size={20} />
                                            )}
                                        </button>
                                    )}

                                    {/* Markets Grid */}
                                    <AnimatePresence>
                                        {(isExpanded || group.markets.length === 1) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className={`p-4 ${group.markets.length > 1 ? 'pt-0' : ''} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`}>
                                                    {displayMarkets.map((item, index) => (
                                                        <motion.div
                                                            key={item.market.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <FluxCard
                                                                market={item.market}
                                                                sniping={item.sniping}
                                                                onSnip={handleSnipe}
                                                                isTracked={false}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
