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


const HelpModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'score' | 'urgency' | 'tips'>('score');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-[#0A0B0F] border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.15)] relative"
            >
                {/* Animated Header - Improved styling */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="relative px-6 pt-12 pb-4">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:rotate-90 duration-300 z-10"
                        >
                            <X size={18} />
                        </button>

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-white/20"
                        >
                            <HelpCircle className="text-white" size={28} />
                        </motion.div>

                        <h2 className="text-2xl font-black text-white mb-2 drop-shadow-lg">Comment ça marche ? 🤔</h2>
                        <p className="text-white/80 text-sm font-medium mb-4">Explications simples pour tout comprendre !</p>
                    </div>

                    {/* Tabs - Ensure clickable */}
                    <div className="relative z-20 flex gap-2 px-6 pb-4">
                        {[
                            { id: 'score', label: '🔥 Score' },
                            { id: 'urgency', label: '⏰ Urgence' },
                            { id: 'tips', label: '💡 Astuces' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as 'score' | 'urgency' | 'tips')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-lg'
                                    : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'score' && (
                            <motion.div
                                key="score"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Main Explanation */}
                                <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">🔥</span>
                                        <div>
                                            <h3 className="text-lg font-black text-white">Le Flame Score</h3>
                                            <p className="text-xs text-orange-300">Note de 0 à 100</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        <strong className="text-white">C'est comme une note de restaurant !</strong> Plus le score est élevé,
                                        plus le marché est "chaud" et intéressant pour faire un trade rapide.
                                    </p>
                                    <div className="mt-3 p-3 bg-black/30 rounded-xl">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-slate-400">Exemple</span>
                                            <span className="text-orange-400 font-bold">Score: 85/100</span>
                                        </div>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "85%" }}
                                                transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs text-green-400 mt-2">✨ Super opportunité !</p>
                                    </div>
                                </div>

                                {/* Score Components */}
                                <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                                    <span className="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center text-xs">📊</span>
                                    Comment on calcule ?
                                </h4>

                                <div className="space-y-3">
                                    {[
                                        { emoji: '⏱️', name: 'Temps restant', pts: '30 pts', desc: 'Plus c\'est proche de la fin, plus c\'est urgent = plus de points !', color: 'orange' },
                                        { emoji: '💰', name: 'Volume d\'argent', pts: '30 pts', desc: 'Beaucoup d\'argent qui circule = marché actif = plus de points !', color: 'blue' },
                                        { emoji: '💧', name: 'Liquidité', pts: '25 pts', desc: 'Facile d\'acheter/vendre sans faire bouger le prix = parfait !', color: 'green' },
                                        { emoji: '🎲', name: 'Probabilité', pts: '10 pts', desc: 'Proche de 50% = incertain = potentiel de gain !', color: 'purple' },
                                        { emoji: '🏷️', name: 'Catégorie', pts: '15 pts', desc: 'Crypto, politique, sport = sujets qui bougent vite !', color: 'yellow' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.name}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * i }}
                                            className={`p-3 bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl`}
                                            style={{
                                                background: `linear-gradient(135deg, var(--tw-gradient-from) 0%, transparent 100%)`,
                                                ['--tw-gradient-from' as any]: `rgb(var(--${item.color}-500) / 0.1)`
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                                    <span>{item.emoji}</span> {item.name}
                                                </span>
                                                <span className="text-xs font-mono px-2 py-0.5 bg-white/10 rounded text-slate-300">{item.pts}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">{item.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'urgency' && (
                            <motion.div
                                key="urgency"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                                        <span>⏰</span> Niveaux d'urgence
                                    </h3>
                                    <p className="text-sm text-slate-300">
                                        C'est comme un feu tricolore pour savoir quand agir !
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { level: 'CRITICAL', color: 'red', emoji: '🚨', desc: 'FONCE ! Ça finit dans moins de 24h ou score > 85', action: 'Agir maintenant !' },
                                        { level: 'HIGH', color: 'orange', emoji: '⚠️', desc: 'Bonne opportunité, se termine bientôt (< 48h)', action: 'À surveiller de près' },
                                        { level: 'MEDIUM', color: 'yellow', emoji: '👀', desc: 'Intéressant mais tu as le temps (< 1 semaine)', action: 'Ajoute en favoris' },
                                        { level: 'LOW', color: 'slate', emoji: '😴', desc: 'Pas urgent, c\'est dans longtemps', action: 'Reviens plus tard' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.level}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 * i }}
                                            className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.emoji}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 text-xs font-black rounded bg-${item.color}-500/20 text-${item.color}-400`}
                                                            style={{ backgroundColor: `var(--${item.color}-500, #64748b) / 0.2` }}
                                                        >
                                                            {item.level}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{item.action}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-300 mt-1">{item.desc}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Whale Activity */}
                                <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-2xl mt-4">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                                        <span>🐋</span> Whale Activity
                                    </h3>
                                    <p className="text-sm text-slate-300 mb-3">
                                        Une "baleine" = quelqu'un avec BEAUCOUP d'argent. Quand tu vois ce badge,
                                        ça veut dire que de gros investisseurs bougent sur ce marché !
                                    </p>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1.5 bg-yellow-500/30 text-yellow-300 text-xs font-bold rounded-lg">
                                            ⚡ Volume &gt; $500k
                                        </span>
                                        <span className="px-3 py-1.5 bg-green-500/30 text-green-300 text-xs font-bold rounded-lg">
                                            💧 Liquidité &gt; $100k
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'tips' && (
                            <motion.div
                                key="tips"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-2xl">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                                        <span>💡</span> Pro Tips
                                    </h3>
                                    <p className="text-sm text-slate-300">
                                        Conseils pour maximiser tes gains !
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { tip: 'Utilise le bouton ⭐ Favoris', desc: 'Garde un œil sur les marchés qui t\'intéressent', icon: '⭐' },
                                        { tip: 'Filtre par catégorie', desc: 'Concentre-toi sur ce que tu connais (crypto, sport, politique...)', icon: '🎯' },
                                        { tip: 'Check les notifications', desc: 'La cloche 🔔 t\'alerte des opportunités chaudes', icon: '🔔' },
                                        { tip: 'Score > 70 = Go', desc: 'En dessous de 70, c\'est moins intéressant', icon: '🔥' },
                                        { tip: 'Attention à la liquidité', desc: 'Si elle est basse, tu risques du slippage (mauvais prix)', icon: '💧' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.tip}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * i }}
                                            className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.tip}</p>
                                                <p className="text-xs text-slate-400">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-center"
                                >
                                    <p className="text-white font-bold mb-2">🚀 Prêt à sniper ?</p>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-xl hover:bg-white/90 transition-colors"
                                    >
                                        C'est parti !
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};



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

            {/* CONTENT - GROUPED BY CATEGORY */}
            {(() => {
                // Group markets by category
                const categoryGroups = new Map<string, typeof groupedMarkets>();
                const categoryIcons: Record<string, string> = {
                    'Crypto': '₿',
                    'Politics': '🏛️',
                    'Sports': '⚽',
                    'Business': '📈',
                    'Science': '🔬',
                    'Other': '🌍'
                };
                const categoryColors: Record<string, string> = {
                    'Crypto': 'from-orange-500 to-yellow-500',
                    'Politics': 'from-blue-500 to-indigo-500',
                    'Sports': 'from-green-500 to-emerald-500',
                    'Business': 'from-purple-500 to-pink-500',
                    'Science': 'from-cyan-500 to-teal-500',
                    'Other': 'from-slate-500 to-gray-500'
                };

                groupedMarkets.forEach(group => {
                    const cat = group.markets[0]?.market.category || 'Other';
                    if (!categoryGroups.has(cat)) {
                        categoryGroups.set(cat, []);
                    }
                    categoryGroups.get(cat)!.push(group);
                });

                return Array.from(categoryGroups.entries()).map(([category, groups]) => (
                    <div key={category} className="mb-10">
                        {/* Category Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryColors[category] || categoryColors['Other']} flex items-center justify-center text-lg shadow-lg`}>
                                {categoryIcons[category] || '🌍'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{category}</h2>
                                <p className="text-xs text-slate-500">{groups.length} events • {groups.reduce((sum, g) => sum + g.markets.length, 0)} markets</p>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
                        </div>

                        {/* Markets Grid for this category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {groups.map(group => (
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
                    </div>
                ));
            })()}

            {groupedMarkets.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 opacity-50">
                    <Layers size={64} className="mb-4 text-slate-700" />
                    <p className="text-lg font-medium">No active opportunities found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            )}

            {/* HELP BUTTON - Fixed bottom right */}
            <button
                onClick={() => setShowHelp(true)}
                className="fixed bottom-8 right-8 h-14 w-14 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 backdrop-blur-md border border-indigo-400/30 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 transition-all duration-300 z-50 group origin-center hover:scale-110"
            >
                <HelpCircle size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
    );
}
