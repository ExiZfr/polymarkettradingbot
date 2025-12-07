"use client";

import { useState, useEffect } from "react";
import { FluxCard, MarketData, SnipingData } from "@/components/radar/FluxCard";
import { HelpCircle, Search, XCircle, RefreshCw, Star, Filter, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchPolymarketMarkets, ProcessedMarket } from "@/lib/polymarket";
import { calculateSnipability, EventType, UrgencyLevel } from "@/lib/snipability-algo";
import { filterSnipableMarkets } from "@/lib/dynamic-filter";
import { listener, ListenerStatus } from "@/lib/listener";

type FilterEventType = EventType | 'all';
type FilterUrgency = UrgencyLevel | 'ALL';
type FilterCategory = 'All' | 'Crypto' | 'Politics' | 'Sports' | 'Finance' | 'Other';

export default function RadarPage() {
    const [markets, setMarkets] = useState<Array<{ market: ProcessedMarket; sniping: SnipingData & { eventType: EventType } }>>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"score" | "volume">("score");
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [listenerStatus, setListenerStatus] = useState<ListenerStatus | null>(null);
    const [toasts, setToasts] = useState<Array<{ id: string, title: string, msg: string, type: 'info' | 'success' }>>([]);

    // Filters
    const [filterEventType, setFilterEventType] = useState<FilterEventType>('all');
    const [filterUrgency, setFilterUrgency] = useState<FilterUrgency>('ALL');
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('All');

    // Toast Helper
    const addToast = (title: string, msg: string, type: 'info' | 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    // Load markets on mount & Subscribe to Listener
    useEffect(() => {
        loadMarkets();
        listener.start();

        const statusInterval = setInterval(() => {
            setListenerStatus(listener.getStatus());
        }, 10000);

        // Listener Subscriptions
        const onMarketFound = (data: any) => {
            addToast('New Opportunity', data.title, 'info');
            loadMarkets(); // Auto-refresh data when new market found
        };

        const onSignalDetected = (data: any) => {
            addToast('SNIPE SIGNAL', `${data.marketTitle} (${data.score}/100)`, 'success');
        };

        listener.on('market_found', onMarketFound);
        listener.on('signal_detected', onSignalDetected);

        return () => {
            clearInterval(statusInterval);
            listener.off('market_found', onMarketFound);
            listener.off('signal_detected', onSignalDetected);
            listener.stop();
        };
    }, []);

    // Reload markets every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadMarkets();
        }, 60000);
        return () => clearInterval(interval);
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

            // Dynamic filtering
            const filtered = filterSnipableMarkets(scored, 25, 500);

            // Client-side deduplication
            const uniqueMap = new Map();
            const uniqueFiltered = filtered.filter(item => {
                if (uniqueMap.has(item.market.id)) return false;
                uniqueMap.set(item.market.id, true);
                return true;
            });

            setMarkets(uniqueFiltered);

            uniqueFiltered.forEach(({ market }) => {
                listener.trackMarket(market, favorites.has(market.id));
            });
        } catch (error) {
            console.error('[Radar] Failed to load markets:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleFavorite(marketId: string) {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(marketId)) {
            newFavorites.delete(marketId);
        } else {
            newFavorites.add(marketId);
        }
        setFavorites(newFavorites);
        listener.toggleFavorite(marketId);
    }

    function parseVolume(volume: string): number {
        const match = volume.match(/\$([\d.]+)([MK]?)/);
        if (!match) return 0;
        const num = parseFloat(match[1]);
        const unit = match[2];
        if (unit === 'M') return num * 1000000;
        if (unit === 'K') return num * 1000;
        return num;
    }

    // Filtered & Sorted Markets
    const filteredMarkets = markets
        .filter(item => {
            if (!item.market.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterEventType !== 'all' && item.sniping.eventType !== filterEventType) return false;
            if (filterUrgency !== 'ALL' && item.sniping.urgency !== filterUrgency) return false;
            if (filterCategory !== 'All' && item.market.category !== filterCategory) return false;
            return true;
        })
        .sort((a, b) => {
            if (favorites.has(a.market.id) && !favorites.has(b.market.id)) return -1;
            if (!favorites.has(a.market.id) && favorites.has(b.market.id)) return 1;

            if (sortBy === "score") return b.sniping.score - a.sniping.score;

            const aVol = parseVolume(a.market.volume);
            const bVol = parseVolume(b.market.volume);
            return bVol - aVol;
        });

    // GROUPING LOGIC - REVISED (More Aggressive)
    function groupMarkets(markets: typeof filteredMarkets) {
        const groups = new Map<string, typeof filteredMarkets[0] & { variants?: typeof markets[0]['market'][] }>();

        markets.forEach(item => {
            // Aggressive Normalization for grouping
            const normalizedTitle = item.market.title
                .toLowerCase()
                .replace(/[0-9.,%]+/g, '#') // Replace numbers, dots, commas, % with #
                .replace(/\s+/g, ' ')       // Collapse spaces
                .trim();

            const key = normalizedTitle;

            if (!groups.has(key)) {
                groups.set(key, { ...item, variants: [] });
            } else {
                const group = groups.get(key)!;

                // Add current market to variants
                group.variants = group.variants || [];
                group.variants.push(item.market);

                // Keep best scoring item as the "face"
                if (item.sniping.score > group.sniping.score) {
                    group.variants.push(group.market);
                    group.market = item.market;
                    group.sniping = item.sniping;
                }
            }
        });

        // Flatten map to array
        return Array.from(groups.values()).sort((a, b) => b.sniping.score - a.sniping.score);
    }

    const groupedMarkets = groupMarkets(filteredMarkets);

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <div className="p-6">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                                        <TrendingUp size={24} />
                                    </div>
                                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-400 to-pink-400">
                                        Market Radar
                                    </h1>
                                </div>
                                <p className="text-slate-300 ml-14 text-base">
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw size={14} className="animate-spin" />
                                            Scanning markets...
                                        </span>
                                    ) : (
                                        `${filteredMarkets.length} snipable opportunities detected`
                                    )}
                                </p>

                                {listenerStatus && (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="mt-3 ml-14 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 text-sm shadow-lg shadow-green-500/20"
                                    >
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400" />
                                        <span className="font-medium">AI Listener Active</span>
                                        <span className="text-green-400/70">·</span>
                                        <span className="text-xs">{listenerStatus.marketsTracked} tracked</span>
                                        <span className="text-green-400/70">·</span>
                                        <span className="text-xs">{listenerStatus.signalsDetected} signals</span>
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={loadMarkets}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 border border-white/10 text-white hover:from-slate-600 hover:to-slate-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                    <span className="text-sm font-medium">Refresh</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowHelpModal(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30 transition shadow-lg shadow-blue-500/10"
                                >
                                    <HelpCircle size={18} />
                                    <span className="text-sm font-medium">Help</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search markets by title, keywords..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                                    />
                                </div>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as "score" | "volume")}
                                    className="px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-medium text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                                >
                                    <option value="score" className="bg-slate-900 text-white">🎯 Sort by Score</option>
                                    <option value="volume" className="bg-slate-900 text-white">💰 Sort by Volume</option>
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 rounded-xl border border-white/10">
                                    <Filter size={16} className="text-blue-400" />
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                                        className="bg-transparent text-base font-medium text-white focus:outline-none cursor-pointer"
                                    >
                                        <option value="All" className="bg-slate-900 text-white">All Categories</option>
                                        <option value="Crypto" className="bg-slate-900 text-white">💰 Crypto</option>
                                        <option value="Politics" className="bg-slate-900 text-white">🏛️ Politics</option>
                                        <option value="Sports" className="bg-slate-900 text-white">⚽ Sports</option>
                                        <option value="Finance" className="bg-slate-900 text-white">📈 Finance</option>
                                        <option value="Other" className="bg-slate-900 text-white">🔮 Other</option>
                                    </select>
                                </div>

                                <select
                                    value={filterEventType}
                                    onChange={(e) => setFilterEventType(e.target.value as FilterEventType)}
                                    className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-base font-medium text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="all" className="bg-slate-900 text-white">All Events</option>
                                    <option value="tweet" className="bg-slate-900 text-white">🐦 Tweets</option>
                                    <option value="announcement" className="bg-slate-900 text-white">📢 Announcements</option>
                                    <option value="event" className="bg-slate-900 text-white">🎪 Events</option>
                                    <option value="news" className="bg-slate-900 text-white">📰 News</option>
                                </select>

                                <select
                                    value={filterUrgency}
                                    onChange={(e) => setFilterUrgency(e.target.value as FilterUrgency)}
                                    className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-base font-medium text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="ALL" className="bg-slate-900 text-white">All Urgency</option>
                                    <option value="CRITICAL" className="bg-slate-900 text-white">🔥 Critical</option>
                                    <option value="HIGH" className="bg-slate-900 text-white">⚡ High</option>
                                    <option value="MEDIUM" className="bg-slate-900 text-white">📊 Medium</option>
                                    <option value="LOW" className="bg-slate-900 text-white">⏳ Low</option>
                                </select>

                                {favorites.size > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl text-yellow-300 text-base font-medium shadow-lg shadow-yellow-500/10">
                                        <Star size={16} className="fill-current" />
                                        {favorites.size} Favorite{favorites.size > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Grid */}
                <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="popLayout">
                        {groupedMarkets.length === 0 && !loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-2xl font-bold text-white mb-2">No markets found</h3>
                                <p className="text-slate-400">Try adjusting your filters or search query</p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groupedMarkets.map((item, index) => (
                                    <motion.div
                                        key={item.market.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                        transition={{ delay: index * 0.05, type: "spring" }}
                                        className="relative group"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => toggleFavorite(item.market.id)}
                                            className={`absolute top-4 right-4 z-20 p-2.5 backdrop-blur-xl rounded-full border transition-all duration-300 ${favorites.has(item.market.id)
                                                ? 'bg-yellow-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/50'
                                                : 'bg-black/40 border-white/10 hover:border-yellow-400/30'
                                                }`}
                                        >
                                            <Star
                                                size={18}
                                                className={favorites.has(item.market.id) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}
                                            />
                                        </motion.button>

                                        <FluxCard
                                            market={{
                                                id: item.market.id,
                                                title: item.market.title,
                                                image: item.market.image,
                                                outcome: item.market.outcome,
                                                probability: item.market.probability,
                                                volume: item.market.volume,
                                                liquidity: item.market.liquidity,
                                                endDate: item.market.endDate,
                                                category: item.market.category,
                                                tags: item.market.tags
                                            }}
                                            sniping={item.sniping}
                                            variants={item.variants}
                                            onSnip={(id) => console.log('[Radar] Sniping:', id)}
                                            onTrackGroup={(ids) => console.log('[Radar] Tracking Group:', ids)}
                                            isTracked={favorites.has(item.market.id)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Help Modal - SIMPLIFIED */}
                <AnimatePresence>
                    {showHelpModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                            onClick={() => setShowHelpModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">Comment ça marche ?</h2>
                                    <button
                                        onClick={() => setShowHelpModal(false)}
                                        className="p-2 hover:bg-white/5 rounded-lg transition"
                                    >
                                        <XCircle size={28} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6 text-slate-300">
                                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                                            <span className="text-3xl">🎯</span>
                                            Le Score de "Snipabilité"
                                        </h3>
                                        <p className="text-base leading-relaxed mb-2">
                                            C'est la note de 0 à 100 qui vous dit si ça vaut le coup d'entrer maintennant.
                                        </p>
                                        <ul className="space-y-2 ml-1">
                                            <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> <span className="text-white font-medium">80+ (Excellent)</span> : L'IA détecte une opportunité en or. Foncez !</li>
                                            <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> <span className="text-white font-medium">50-79 (Bon)</span> : Potentiel intéressant, surveillez-le.</li>
                                            <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> <span className="text-white font-medium">-50 (Bof)</span> : Peu d'activité ou trop risqué.</li>
                                        </ul>
                                    </div>

                                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                                            <span className="text-3xl">⏱️</span>
                                            L'Urgence (Ça brule !)
                                        </h3>
                                        <p className="text-base leading-relaxed">
                                            C'est le chrono avant que l'opportunité ne disparaisse.
                                            <br />
                                            <span className="text-red-400 font-bold">🔥 CRITICAL</span> veut dire qu'il se passe quelque chose de majeur DANS L'HEURE (annonce Fed, tweet d'Elon, fin de match). Soyez prêts.
                                        </p>
                                    </div>

                                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                                            <span className="text-3xl">🕵️</span>
                                            L'Espion IA (Listener)
                                        </h3>
                                        <p className="text-base leading-relaxed">
                                            Imaginez une armée d'espions qui lisent Twitter et les news financières 24h/24 pour vous. Dès qu'une info tombe (ex: "Trump va parler"), l'IA la relie au bon pari et vous alerte avant tout le monde.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowHelpModal(false)}
                                    className="mt-8 w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-bold text-lg text-white transition shadow-lg shadow-blue-500/20"
                                >
                                    Compris ! 🚀
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toast Notifications */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                    <AnimatePresence>
                        {toasts.map(toast => (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                className={`pointer-events-auto p-4 rounded-xl shadow-2xl border min-w-[300px] backdrop-blur-xl flex items-start gap-3 ${toast.type === 'success'
                                    ? 'bg-green-500/10 border-green-500/20 text-green-100'
                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-100'
                                    }`}
                            >
                                <div className={`mt-1 p-1 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <div>
                                    <h4 className="font-bold text-sm">{toast.title}</h4>
                                    <p className="text-xs opacity-80">{toast.msg}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
