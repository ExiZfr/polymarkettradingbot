"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Radio,
    Play,
    Pause,
    RefreshCw,
    Rss,
    Twitter,
    MessageSquare,
    Globe,
    Bell,
    Star,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    Trash2,
    Download,
    Settings,
    Zap
} from "lucide-react";

// Types
type SourceType = 'twitter' | 'rss' | 'reddit' | 'news' | 'telegram' | 'polymarket';

type ListenerLog = {
    id: string;
    timestamp: Date;
    source: SourceType;
    type: 'info' | 'signal' | 'alert' | 'error' | 'success';
    message: string;
    relatedMarket?: string;
    priority: 'low' | 'medium' | 'high';
};

type SourceConfig = {
    id: SourceType;
    name: string;
    icon: React.ElementType;
    color: string;
    enabled: boolean;
    lastUpdate?: Date;
    status: 'active' | 'paused' | 'error';
};

type FavoriteMarket = {
    id: string;
    title: string;
    keywords: string[];
};

// Default sources
const DEFAULT_SOURCES: SourceConfig[] = [
    { id: 'twitter', name: 'X / Twitter', icon: Twitter, color: 'text-sky-400 bg-sky-400/10', enabled: true, status: 'active' },
    { id: 'rss', name: 'RSS Feeds', icon: Rss, color: 'text-orange-400 bg-orange-400/10', enabled: true, status: 'active' },
    { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'text-red-400 bg-red-400/10', enabled: true, status: 'active' },
    { id: 'news', name: 'News APIs', icon: Globe, color: 'text-green-400 bg-green-400/10', enabled: true, status: 'active' },
    { id: 'telegram', name: 'Telegram', icon: Bell, color: 'text-blue-400 bg-blue-400/10', enabled: false, status: 'paused' },
    { id: 'polymarket', name: 'Polymarket', icon: TrendingUp, color: 'text-purple-400 bg-purple-400/10', enabled: true, status: 'active' },
];

// Simulated keywords for demo
const DEMO_KEYWORDS = [
    'Trump', 'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'Fed', 'FOMC', 'rate cut',
    'election', 'poll', 'Ukraine', 'Russia', 'SpaceX', 'Elon Musk', 'SEC',
    'crypto', 'regulation', 'breaking', 'NFL', 'Super Bowl'
];

// Simulated log messages for demo
const DEMO_MESSAGES: { source: SourceType; type: ListenerLog['type']; message: string; priority: ListenerLog['priority'] }[] = [
    { source: 'twitter', type: 'info', message: 'Monitoring @realDonaldTrump for breaking statements...', priority: 'low' },
    { source: 'twitter', type: 'signal', message: '🔥 High engagement detected on crypto-related post from @elonmusk', priority: 'high' },
    { source: 'rss', type: 'info', message: 'Fetching latest from Reuters, Bloomberg, AP News...', priority: 'low' },
    { source: 'news', type: 'alert', message: '⚡ BREAKING: Fed announces policy decision coming tomorrow', priority: 'high' },
    { source: 'reddit', type: 'info', message: 'Scanning r/cryptocurrency, r/politics, r/wallstreetbets...', priority: 'low' },
    { source: 'reddit', type: 'signal', message: 'Unusual activity in r/Bitcoin - sentiment shift detected', priority: 'medium' },
    { source: 'polymarket', type: 'success', message: 'Connected to Polymarket WebSocket - monitoring odds changes', priority: 'low' },
    { source: 'polymarket', type: 'alert', message: '📈 Significant odds movement on "Bitcoin $100K by Dec 2024"', priority: 'high' },
    { source: 'telegram', type: 'info', message: 'Telegram channels paused - enable to monitor', priority: 'low' },
    { source: 'twitter', type: 'signal', message: 'Keyword match: "election" trending with 50K+ mentions', priority: 'medium' },
    { source: 'news', type: 'info', message: 'Processed 127 articles in last 5 minutes', priority: 'low' },
    { source: 'rss', type: 'signal', message: 'New article matches tracked market: "Will Trump win 2024?"', priority: 'high' },
];

export default function ListenerPage() {
    const [isRunning, setIsRunning] = useState(true);
    const [logs, setLogs] = useState<ListenerLog[]>([]);
    const [sources, setSources] = useState<SourceConfig[]>(DEFAULT_SOURCES);
    const [filterSource, setFilterSource] = useState<SourceType | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [favorites, setFavorites] = useState<FavoriteMarket[]>([]);
    const [stats, setStats] = useState({ signals: 0, alerts: 0, processed: 0 });
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Load favorites from localStorage
    useEffect(() => {
        const savedFavs = localStorage.getItem('polybot_radar_favorites');
        if (savedFavs) {
            try {
                setFavorites(JSON.parse(savedFavs));
            } catch (e) {
                console.error('Failed to load favorites');
            }
        }

        // Add initial logs
        const initialLogs: ListenerLog[] = [
            { id: '1', timestamp: new Date(), source: 'polymarket', type: 'success', message: '🚀 Listener v2.0 initialized', priority: 'low' },
            { id: '2', timestamp: new Date(), source: 'polymarket', type: 'info', message: 'Connected to all active sources', priority: 'low' },
        ];
        setLogs(initialLogs);
    }, []);

    // Simulate listener activity
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            // Random log
            const msg = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
            const source = sources.find(s => s.id === msg.source);

            if (source?.enabled) {
                const newLog: ListenerLog = {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date(),
                    source: msg.source,
                    type: msg.type,
                    message: msg.message,
                    priority: msg.priority
                };

                setLogs(prev => [...prev.slice(-200), newLog]); // Keep last 200 logs

                // Update stats
                setStats(prev => ({
                    processed: prev.processed + 1,
                    signals: prev.signals + (msg.type === 'signal' ? 1 : 0),
                    alerts: prev.alerts + (msg.type === 'alert' ? 1 : 0)
                }));
            }
        }, 2000 + Math.random() * 3000); // Random interval 2-5s

        return () => clearInterval(interval);
    }, [isRunning, sources]);

    // Auto-scroll to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const toggleSource = (sourceId: SourceType) => {
        setSources(prev => prev.map(s =>
            s.id === sourceId
                ? { ...s, enabled: !s.enabled, status: s.enabled ? 'paused' : 'active' }
                : s
        ));
    };

    const clearLogs = () => {
        setLogs([]);
        setStats({ signals: 0, alerts: 0, processed: 0 });
    };

    const filteredLogs = logs.filter(log => {
        if (filterSource !== 'all' && log.source !== filterSource) return false;
        if (filterPriority !== 'all' && log.priority !== filterPriority) return false;
        return true;
    });

    const getLogIcon = (type: ListenerLog['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={14} className="text-green-400" />;
            case 'alert': return <AlertCircle size={14} className="text-red-400" />;
            case 'signal': return <Zap size={14} className="text-amber-400" />;
            case 'error': return <AlertCircle size={14} className="text-red-500" />;
            default: return <Clock size={14} className="text-slate-500" />;
        }
    };

    const getLogColor = (type: ListenerLog['type']) => {
        switch (type) {
            case 'success': return 'text-green-400';
            case 'alert': return 'text-red-400';
            case 'signal': return 'text-amber-400';
            case 'error': return 'text-red-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isRunning ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <Radio size={24} className={isRunning ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">News Listener</h1>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                {isRunning ? 'Running' : 'Paused'}
                            </span>
                            <span>•</span>
                            <span>{sources.filter(s => s.enabled).length}/{sources.length} sources</span>
                            <span>•</span>
                            <span>{favorites.length} markets tracked</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${isRunning
                                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                            }`}
                    >
                        {isRunning ? <Pause size={18} /> : <Play size={18} />}
                        {isRunning ? 'Pause' : 'Start'}
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Processed', value: stats.processed, icon: RefreshCw, color: 'text-slate-400' },
                    { label: 'Signals', value: stats.signals, icon: Zap, color: 'text-amber-400' },
                    { label: 'Alerts', value: stats.alerts, icon: AlertCircle, color: 'text-red-400' },
                    { label: 'Active Sources', value: sources.filter(s => s.enabled).length, icon: Radio, color: 'text-green-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0C0D12] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <stat.icon size={14} />
                            {stat.label}
                        </div>
                        <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sources Panel */}
                <div className="lg:col-span-1 bg-[#0C0D12] border border-white/5 rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Settings size={16} />
                        Sources
                    </h3>
                    <div className="space-y-2">
                        {sources.map(source => {
                            const Icon = source.icon;
                            return (
                                <button
                                    key={source.id}
                                    onClick={() => toggleSource(source.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${source.enabled
                                            ? 'bg-white/5 border border-white/10'
                                            : 'bg-transparent border border-transparent opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${source.color}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className="text-sm text-white font-medium">{source.name}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-slate-600'
                                        }`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Tracked Markets */}
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Star size={14} className="text-amber-400" />
                            Tracked Markets
                        </h4>
                        {favorites.length === 0 ? (
                            <p className="text-xs text-slate-500">
                                Star markets in Radar to track them here
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {favorites.map(fav => (
                                    <div key={fav.id} className="text-xs text-slate-400 p-2 bg-white/5 rounded-lg truncate">
                                        {fav.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Console */}
                <div className="lg:col-span-3 bg-[#0C0D12] border border-white/5 rounded-2xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
                    {/* Console Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Radio size={16} className={isRunning ? 'text-green-400 animate-pulse' : 'text-slate-500'} />
                                Live Console
                            </h3>
                            <div className="flex items-center gap-2">
                                <select
                                    value={filterSource}
                                    onChange={(e) => setFilterSource(e.target.value as any)}
                                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300"
                                >
                                    <option value="all">All Sources</option>
                                    {sources.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value as any)}
                                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="high">🔴 High</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="low">⚪ Low</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{filteredLogs.length} entries</span>
                            <button
                                onClick={clearLogs}
                                className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Console Body */}
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/30">
                        <AnimatePresence initial={false}>
                            {filteredLogs.map(log => {
                                const SourceIcon = sources.find(s => s.id === log.source)?.icon || Globe;
                                const sourceColor = sources.find(s => s.id === log.source)?.color || '';

                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors ${log.priority === 'high' ? 'bg-white/5 border-l-2 border-red-500' :
                                                log.priority === 'medium' ? 'border-l-2 border-amber-500/50' : ''
                                            }`}
                                    >
                                        <span className="text-slate-600 shrink-0 w-16">
                                            {log.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <div className={`p-1 rounded ${sourceColor} shrink-0`}>
                                            <SourceIcon size={12} />
                                        </div>
                                        {getLogIcon(log.type)}
                                        <span className={`${getLogColor(log.type)} break-all`}>
                                            {log.message}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={logsEndRef} />
                    </div>

                    {/* Console Footer */}
                    <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {isRunning ? 'Listening for signals...' : 'Listener paused'}
                        </div>
                        <div className="text-xs text-slate-600">
                            Keywords: {DEMO_KEYWORDS.slice(0, 5).join(', ')}...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
