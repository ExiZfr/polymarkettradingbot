"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, RefreshCw, Star, TrendingUp, HelpCircle, XCircle } from "lucide-react";
import { FluxCard, SnipingData } from "@/components/radar/FluxCard";
import { fetchPolymarketMarkets, ProcessedMarket } from "@/lib/polymarket";
import { calculateSnipability, EventType, UrgencyLevel } from "@/lib/snipability-algo";
import { filterSnipableMarkets } from "@/lib/dynamic-filter";
import { listener, ListenerStatus } from "@/lib/listener";

type FilterEventType = EventType | 'all';
type FilterUrgency = UrgencyLevel | 'ALL';
type FilterCategory = 'All' | 'Crypto' | 'Politics' | 'Sports' | 'Finance' | 'Other';

export default function RadarView() {
    const [markets, setMarkets] = useState<Array<{ market: ProcessedMarket; sniping: SnipingData & { eventType: EventType } }>>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"score" | "volume">("score");
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [listenerStatus, setListenerStatus] = useState<ListenerStatus | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Filters
    const [filterEventType, setFilterEventType] = useState<FilterEventType>('all');
    const [filterUrgency, setFilterUrgency] = useState<FilterUrgency>('ALL');
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('All');

    useEffect(() => {
        loadMarkets();
        listener.start();
        const statusInterval = setInterval(() => setListenerStatus(listener.getStatus()), 10000);
        const refreshInterval = setInterval(loadMarkets, 60000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(refreshInterval);
            listener.stop();
        };
    }, []);

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

    const toggleFavorite = (id: string) => {
        const newFavs = new Set(favorites);
        if (newFavs.has(id)) newFavs.delete(id);
        else newFavs.add(id);
        setFavorites(newFavs);
    };

    // Filter Logic
    const filteredMarkets = markets.filter(item => {
        if (!item.market.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterEventType !== 'all' && item.sniping.eventType !== filterEventType) return false;
        if (filterUrgency !== 'ALL' && item.sniping.urgency !== filterUrgency) return false;
        if (filterCategory !== 'All' && item.market.category !== filterCategory) return false;
        return true;
    }).sort((a, b) => {
        if (favorites.has(a.market.id) && !favorites.has(b.market.id)) return -1;
        if (!favorites.has(a.market.id) && favorites.has(b.market.id)) return 1;
        if (sortBy === "score") return b.sniping.score - a.sniping.score;
        return 0; // Simplified volume sort for now as helper is complex to migrate instantly
    });

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-4 sm:p-6 sticky top-0 z-30 shadow-xl backdrop-blur-xl">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">

                    {/* Title & Status */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Market Radar</h2>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Live Scanning
                                    </span>
                                    <span>•</span>
                                    <span>{filteredMarkets.length} Opportunities</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search markets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value as any)}
                                className="px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none"
                            >
                                <option value="All">All Categories</option>
                                <option value="Crypto">Crypto</option>
                                <option value="Politics">Politics</option>
                                <option value="Sports">Sports</option>
                            </select>

                            <button
                                onClick={() => loadMarkets()}
                                disabled={loading}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredMarkets.map((item, index) => (
                        <motion.div
                            key={item.market.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <FluxCard
                                market={item.market}
                                sniping={item.sniping}
                                onSnip={(id) => console.log('Snip', id)}
                                isTracked={favorites.has(item.market.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
