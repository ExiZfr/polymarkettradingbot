"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Settings as SettingsIcon,
    Wallet,
    Shield,
    Zap,
    Radar,
    Users,
    Brain,
    Save,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Percent,
    Target,
    Layers,
    Radio,
    Plus,
    X,
    Tag
} from "lucide-react";
import { paperStore, PaperTradingSettings, PaperProfile } from "@/lib/paper-trading";
import { KEYWORD_CATEGORIES, LISTENER_KEYWORDS } from "@/lib/keywords-config";

// Listener Settings Type
type ListenerSettings = {
    enabled: boolean;
    scanInterval: number; // seconds
    minScore: number;
    maxMarkets: number;
    prioritizeFavorites: boolean;
    customKeywords: string[];
    enabledCategories: string[];
    // [NEW] Auto-Trade / Sniper
    autoTrade: boolean;
    minAutoScore: number;
    autoTradeAmount: number;
};

type ModuleConfig = {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    enabled: boolean;
    usePaperTrading: boolean;
};

const DEFAULT_MODULES: ModuleConfig[] = [
    { id: 'sniper', name: 'Sniper Engine', description: 'Auto-snipe high-score opportunities', icon: Zap, enabled: true, usePaperTrading: true },
    { id: 'radar', name: 'Market Radar', description: 'Live market scanning & alerts', icon: Radar, enabled: true, usePaperTrading: true },
    { id: 'copy', name: 'Copy Trading', description: 'Follow whale wallets automatically', icon: Users, enabled: false, usePaperTrading: true },
    { id: 'oracle', name: 'Oracle AI', description: 'AI-powered predictions & signals', icon: Brain, enabled: false, usePaperTrading: true },
];

export default function SettingsPage() {
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [profile, setProfile] = useState<PaperProfile | null>(null);
    const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'trading' | 'modules' | 'listener' | 'account'>('trading');
    const [newKeyword, setNewKeyword] = useState("");
    const [newRssUrl, setNewRssUrl] = useState("");

    // Listener Settings State
    const [listenerSettings, setListenerSettings] = useState<ListenerSettings>({
        enabled: true,
        scanInterval: 60,
        minScore: 15,
        maxMarkets: 150,
        prioritizeFavorites: true,
        customKeywords: [],
        enabledCategories: Object.keys(LISTENER_KEYWORDS),
        turboMode: false,
        enableRss: false,
        enableReddit: false,
        enableTwitter: false,
        // Auto-Trade Defaults
        autoTrade: false,
        minAutoScore: 90,
        autoTradeAmount: 50,
        rssUrls: [
            // Crypto News
            'https://cointelegraph.com/rss',
            'https://decrypt.co/feed',
            'https://www.coindesk.com/arc/outboundfeeds/rss/',
            'https://cryptoslate.com/feed/',
            'https://bitcoinmagazine.com/.rss/full/',
            'https://news.bitcoin.com/feed/',
            'https://thedefiant.io/api/feed',
            'https://blockworks.co/feed/',
            'https://dailyhodl.com/feed/',
            'https://u.today/rss',
            'https://ambcrypto.com/feed/',
            'https://cryptonews.com/news/feed',
            'https://beincrypto.com/feed/',

            // Major Finance & Tech
            'https://feeds.bloomberg.com/crypto/news.xml',
            'https://www.cnbc.com/id/19854910/device/rss/rss.html', // Tech
            'https://www.cnbc.com/id/10000664/device/rss/rss.html', // Finance
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml',
            'https://feeds.arstechnica.com/arstechnica/index',
            'https://www.wired.com/feed/rss',
            'https://www.engadget.com/rss.xml',
            'https://mashable.com/feeds/rss/all',

            // General News (Political/World)
            'http://feeds.bbci.co.uk/news/world/rss.xml',
            'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
            'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
            'https://www.theguardian.com/world/rss',
            'https://feeds.npr.org/1001/rss.xml',
            'https://www.aljazeera.com/xml/rss/all.xml',
            'https://www.politico.com/rss/politicopicks.xml',

            // Gaming & Entertainment
            'https://www.gamespot.com/feeds/news/',
            'https://www.ign.com/rss/articles/news',
            'https://kotaku.com/rss',
            'https://www.polygon.com/rss/index.xml',
            'https://www.eurogamer.net/?format=rss',
            'https://variety.com/feed/',
            'https://deadline.com/feed/',
            'https://www.hollywoodreporter.com/feed/'
        ]
    });

    useEffect(() => {
        setSettings(paperStore.getSettings());
        setProfile(paperStore.getProfile());

        // Load modules config from localStorage
        const savedModules = localStorage.getItem('polybot_modules_config');
        if (savedModules) {
            setModules(JSON.parse(savedModules));
        }

        // Load listener settings from localStorage
        const savedListener = localStorage.getItem('polybot_listener_settings');
        if (savedListener) {
            setListenerSettings(JSON.parse(savedListener));
        }
    }, []);

    const handleSettingsChange = (key: keyof PaperTradingSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        setSaved(false);
    };

    const handleModuleChange = (moduleId: string, key: 'enabled' | 'usePaperTrading', value: boolean) => {
        setModules(prev => prev.map(m =>
            m.id === moduleId ? { ...m, [key]: value } : m
        ));
        setSaved(false);
    };

    const saveAllSettings = async () => {
        if (settings) {
            paperStore.saveSettings(settings);
        }
        localStorage.setItem('polybot_modules_config', JSON.stringify(modules));
        localStorage.setItem('polybot_listener_settings', JSON.stringify(listenerSettings));

        // Sync to backend for the listener script
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(listenerSettings)
            });
        } catch (e) {
            console.error("Failed to sync settings to backend", e);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const addCustomKeyword = () => {
        if (newKeyword.trim() && !listenerSettings.customKeywords.includes(newKeyword.trim())) {
            setListenerSettings(prev => ({
                ...prev,
                customKeywords: [...prev.customKeywords, newKeyword.trim()]
            }));
            setNewKeyword("");
            setSaved(false);
        }
    };

    const removeCustomKeyword = (keyword: string) => {
        setListenerSettings(prev => ({
            ...prev,
            customKeywords: prev.customKeywords.filter(k => k !== keyword)
        }));
        setSaved(false);
    };

    const toggleCategory = (categoryId: string) => {
        setListenerSettings(prev => ({
            ...prev,
            enabledCategories: prev.enabledCategories.includes(categoryId)
                ? prev.enabledCategories.filter(c => c !== categoryId)
                : [...prev.enabledCategories, categoryId]
        }));
        setSaved(false);
    };

    const addRssUrl = () => {
        if (newRssUrl.trim() && !listenerSettings.rssUrls?.includes(newRssUrl.trim())) {
            setListenerSettings(prev => ({
                ...prev,
                rssUrls: [...(prev.rssUrls || []), newRssUrl.trim()]
            }));
            setNewRssUrl("");
            setSaved(false);
        }
    };

    const removeRssUrl = (url: string) => {
        setListenerSettings(prev => ({
            ...prev,
            rssUrls: (prev.rssUrls || []).filter(u => u !== url)
        }));
        setSaved(false);
    };

    const resetPaperTrading = () => {
        if (settings && confirm('Are you sure you want to reset your paper trading account? All history will be lost.')) {
            paperStore.resetProfile(settings.initialBalance);
            setProfile(paperStore.getProfile());
        }
    };

    if (!settings || !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-indigo-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <SettingsIcon className="text-indigo-400" />
                        Settings
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Configure your trading bot and preferences</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveAllSettings}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${saved
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                >
                    <Save size={18} />
                    {saved ? 'Saved!' : 'Save All Settings'}
                </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit flex-wrap">
                {[
                    { id: 'trading', label: 'Paper Trading', icon: Wallet },
                    { id: 'modules', label: 'Modules', icon: Layers },
                    { id: 'listener', label: 'Listener', icon: Radio },
                    { id: 'account', label: 'Account', icon: Shield }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Paper Trading Settings */}
            {activeTab === 'trading' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Main Settings Card */}
                    <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Wallet className="text-indigo-400" size={20} />
                                Paper Trading Mode
                            </h3>
                            <button
                                onClick={() => handleSettingsChange('enabled', !settings.enabled)}
                                className={`p-2 rounded-lg transition-colors ${settings.enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-500'
                                    }`}
                            >
                                {settings.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Initial Balance */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    <DollarSign className="inline-block mr-1" size={14} />
                                    Initial Balance
                                </label>
                                <input
                                    type="number"
                                    value={settings.initialBalance}
                                    onChange={(e) => handleSettingsChange('initialBalance', parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            {/* Position Sizing Mode */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Position Sizing</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSettingsChange('useRiskBasedSizing', true)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.useRiskBasedSizing
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        Risk % Based
                                    </button>
                                    <button
                                        onClick={() => handleSettingsChange('useRiskBasedSizing', false)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!settings.useRiskBasedSizing
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        Fixed Amount
                                    </button>
                                </div>
                            </div>

                            {/* Risk Per Trade or Fixed Amount */}
                            {settings.useRiskBasedSizing ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        <Percent className="inline-block mr-1" size={14} />
                                        Risk Per Trade (% of Balance)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="25"
                                            value={settings.riskPerTrade}
                                            onChange={(e) => handleSettingsChange('riskPerTrade', parseInt(e.target.value))}
                                            className="flex-1 accent-indigo-500"
                                        />
                                        <span className="text-white font-mono w-12 text-right">{settings.riskPerTrade}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        <DollarSign className="inline-block mr-1" size={14} />
                                        Fixed Position Size
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.defaultPositionSize}
                                        onChange={(e) => handleSettingsChange('defaultPositionSize', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            )}

                            {/* Max Open Positions */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    <Layers className="inline-block mr-1" size={14} />
                                    Max Open Positions
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={settings.maxOpenPositions}
                                    onChange={(e) => handleSettingsChange('maxOpenPositions', parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Risk Management Card */}
                    <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target className="text-amber-400" size={20} />
                            Risk Management
                        </h3>

                        <div className="space-y-4">
                            {/* Auto Stop Loss */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-medium text-slate-400 mb-2">
                                    <span className="flex items-center gap-1">
                                        <TrendingDown className="text-red-400" size={14} />
                                        Auto Stop Loss
                                    </span>
                                    <span className="text-xs">(0 = disabled)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={settings.autoStopLoss}
                                        onChange={(e) => handleSettingsChange('autoStopLoss', parseInt(e.target.value))}
                                        className="flex-1 accent-red-500"
                                    />
                                    <span className="text-red-400 font-mono w-12 text-right">
                                        {settings.autoStopLoss > 0 ? `-${settings.autoStopLoss}%` : 'OFF'}
                                    </span>
                                </div>
                            </div>

                            {/* Auto Take Profit */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-medium text-slate-400 mb-2">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="text-green-400" size={14} />
                                        Auto Take Profit
                                    </span>
                                    <span className="text-xs">(0 = disabled)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={settings.autoTakeProfit}
                                        onChange={(e) => handleSettingsChange('autoTakeProfit', parseInt(e.target.value))}
                                        className="flex-1 accent-green-500"
                                    />
                                    <span className="text-green-400 font-mono w-12 text-right">
                                        {settings.autoTakeProfit > 0 ? `+${settings.autoTakeProfit}%` : 'OFF'}
                                    </span>
                                </div>
                            </div>

                            {/* Risk/Reward Display */}
                            {settings.autoStopLoss > 0 && settings.autoTakeProfit > 0 && (
                                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 mb-1">Risk/Reward Ratio</div>
                                    <div className="text-2xl font-bold text-white">
                                        1 : {(settings.autoTakeProfit / settings.autoStopLoss).toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reset Button */}
                        <div className="pt-4 border-t border-white/5">
                            <button
                                onClick={resetPaperTrading}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-medium transition-colors"
                            >
                                <AlertTriangle size={18} />
                                Reset Paper Trading Account
                            </button>
                        </div>
                    </div>

                    {/* Current Stats Preview */}
                    <div className="lg:col-span-2 bg-[#0C0D12] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Current Account Status</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Balance', value: `$${profile.currentBalance.toFixed(2)}`, color: 'text-white' },
                                { label: 'Total PnL', value: `$${profile.totalPnL.toFixed(2)}`, color: profile.totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
                                { label: 'Win Rate', value: `${profile.winRate.toFixed(1)}%`, color: 'text-indigo-400' },
                                { label: 'Trades', value: profile.tradesCount.toString(), color: 'text-white' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 rounded-xl p-4">
                                    <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                                    <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modules Settings */}
            {activeTab === 'modules' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((module) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0C0D12] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${module.enabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}>
                                        <module.icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{module.name}</h4>
                                        <p className="text-xs text-slate-500">{module.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Enable Toggle */}
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <span className="text-sm text-slate-300">Module Enabled</span>
                                    <button
                                        onClick={() => handleModuleChange(module.id, 'enabled', !module.enabled)}
                                        className={`p-1 rounded-lg transition-colors ${module.enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-500'
                                            }`}
                                    >
                                        {module.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>

                                {/* Paper Trading Toggle */}
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <span className="text-sm text-slate-300">Use Paper Trading</span>
                                    <button
                                        onClick={() => handleModuleChange(module.id, 'usePaperTrading', !module.usePaperTrading)}
                                        className={`p-1 rounded-lg transition-colors ${module.usePaperTrading ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'
                                            }`}
                                    >
                                        {module.usePaperTrading ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Listener Settings */}
            {activeTab === 'listener' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Scan Settings Card */}
                    <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Radio className="text-indigo-400" size={20} />
                                Scan Settings
                            </h3>
                            <button
                                onClick={() => setListenerSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`p-2 rounded-lg transition-colors ${listenerSettings.enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-500'}`}
                            >
                                {listenerSettings.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Scan Interval */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Scan Interval (seconds)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="10"
                                        max="300"
                                        step="10"
                                        value={listenerSettings.scanInterval}
                                        onChange={(e) => setListenerSettings(prev => ({ ...prev, scanInterval: parseInt(e.target.value) }))}
                                        className="flex-1 accent-indigo-500"
                                    />
                                    <span className="text-white font-mono w-16 text-right">{listenerSettings.scanInterval}s</span>
                                </div>
                            </div>

                            {/* Min Score */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Minimum Score Threshold
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="80"
                                        step="5"
                                        value={listenerSettings.minScore}
                                        onChange={(e) => setListenerSettings(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                                        className="flex-1 accent-orange-500"
                                    />
                                    <span className="text-orange-400 font-mono w-12 text-right">{listenerSettings.minScore}</span>
                                </div>
                            </div>

                            {/* Max Markets */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Max Markets to Display
                                </label>
                                <input
                                    type="number"
                                    min="10"
                                    max="500"
                                    value={listenerSettings.maxMarkets}
                                    onChange={(e) => setListenerSettings(prev => ({ ...prev, maxMarkets: parseInt(e.target.value) || 50 }))}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            {/* Prioritize Favorites */}
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-sm text-slate-300">Prioritize Favorited Markets</span>
                                <button
                                    onClick={() => setListenerSettings(prev => ({ ...prev, prioritizeFavorites: !prev.prioritizeFavorites }))}
                                    className={`p-1 rounded-lg transition-colors ${listenerSettings.prioritizeFavorites ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}
                                >
                                    {listenerSettings.prioritizeFavorites ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Keyword Categories Card */}
                    <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Tag className="text-purple-400" size={20} />
                            Keyword Categories
                        </h3>
                        <p className="text-xs text-slate-500">Enable/disable keyword categories for market matching</p>

                        <div className="grid grid-cols-2 gap-2">
                            {KEYWORD_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`p-3 rounded-xl text-left transition-all ${listenerSettings.enabledCategories.includes(cat.id)
                                        ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                                        : 'bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="text-sm font-bold">{cat.label}</div>
                                    <div className="text-xs opacity-70">{cat.count} keywords</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sources & Performance Card */}
                    <div className="lg:col-span-2 bg-[#0C0D12]/50 border border-white/5 rounded-2xl p-6 space-y-6">
                        {/* Auto-Trading / Sniper Configuration */}
                        <div className="bg-[#0C0D12]/50 border border-white/5 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-bold text-white flex items-center gap-2">
                                    <Zap className="text-indigo-400" size={18} />
                                    Auto-Sniper Engine
                                </h4>
                                <button
                                    onClick={() => setListenerSettings(prev => ({ ...prev, autoTrade: !prev.autoTrade }))}
                                    className={`p-2 rounded-lg transition-colors ${listenerSettings.autoTrade ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}
                                >
                                    {listenerSettings.autoTrade ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                            </div>

                            {listenerSettings.autoTrade && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    {/* Min Auto Score */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Minimum Consensus Score to Snipe
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="50"
                                                max="99"
                                                value={listenerSettings.minAutoScore || 90}
                                                onChange={(e) => setListenerSettings(prev => ({ ...prev, minAutoScore: parseInt(e.target.value) }))}
                                                className="flex-1 accent-indigo-500"
                                            />
                                            <span className="text-white font-mono w-12 text-right">{listenerSettings.minAutoScore || 90}</span>
                                        </div>
                                    </div>

                                    {/* Trade Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Amount Per Snipe ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={listenerSettings.autoTradeAmount || 50}
                                            onChange={(e) => setListenerSettings(prev => ({ ...prev, autoTradeAmount: parseFloat(e.target.value) }))}
                                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="text-yellow-400" size={20} />
                                Hyper-Listener Performance
                            </h3>
                            {/* Turbo Mode Toggle */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-transparent bg-clip-text bg-linear-to-r from-red-500 to-orange-500">
                                    TURBO MODE
                                </span>
                                <button
                                    onClick={() => setListenerSettings(prev => ({ ...prev, turboMode: !prev.turboMode }))}
                                    className={`p-1 rounded-lg transition-colors ${listenerSettings.turboMode ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-slate-500'}`}
                                >
                                    {listenerSettings.turboMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>

                        {/* Source Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* RSS Toggle */}
                            <button
                                onClick={() => setListenerSettings(prev => ({ ...prev, enableRss: !prev.enableRss }))}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${listenerSettings.enableRss
                                    ? 'bg-orange-500/10 border-orange-500/50 text-white'
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                    }`}
                            >
                                <Radio size={24} className={listenerSettings.enableRss ? "text-orange-400" : ""} />
                                <div className="text-center">
                                    <div className="font-bold">RSS Feeds</div>
                                    <div className="text-xs opacity-70">Monitor news & blogs</div>
                                </div>
                            </button>

                            {/* Reddit Toggle */}
                            <button
                                onClick={() => setListenerSettings(prev => ({ ...prev, enableReddit: !prev.enableReddit }))}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${listenerSettings.enableReddit
                                    ? 'bg-orange-600/10 border-orange-600/50 text-white'
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-2xl">🤖</span>
                                <div className="text-center">
                                    <div className="font-bold">Reddit</div>
                                    <div className="text-xs opacity-70">Subreddit monitoring</div>
                                </div>
                            </button>

                            {/* Twitter Toggle */}
                            <button
                                onClick={() => setListenerSettings(prev => ({ ...prev, enableTwitter: !prev.enableTwitter }))}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${listenerSettings.enableTwitter
                                    ? 'bg-blue-500/10 border-blue-500/50 text-white'
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-2xl">🐦</span>
                                <div className="text-center">
                                    <div className="font-bold">Twitter/X</div>
                                    <div className="text-xs opacity-70">Nitter RSS Bridge</div>
                                </div>
                            </button>
                        </div>

                        {/* RSS Feed Management */}
                        {listenerSettings.enableRss && (
                            <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-4">
                                <h4 className="text-sm font-bold text-slate-300">Active RSS Feeds</h4>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newRssUrl}
                                        onChange={(e) => setNewRssUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addRssUrl()}
                                        placeholder="https://example.com/feed.xml"
                                        className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                                    />
                                    <button
                                        onClick={addRssUrl}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {listenerSettings.rssUrls?.map((url, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 group hover:border-white/10">
                                            <span className="text-xs text-slate-300 truncate">{url}</span>
                                            <button
                                                onClick={() => removeRssUrl(url)}
                                                className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Keywords Card */}
                    <div className="lg:col-span-2 bg-[#0C0D12] border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Plus className="text-green-400" size={20} />
                            Custom Keywords
                        </h3>
                        <p className="text-xs text-slate-500">Add your own keywords to track specific markets</p>

                        {/* Add Keyword Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomKeyword()}
                                placeholder="Enter a keyword..."
                                className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                            />
                            <button
                                onClick={addCustomKeyword}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>

                        {/* Keywords List */}
                        {listenerSettings.customKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {listenerSettings.customKeywords.map(keyword => (
                                    <div
                                        key={keyword}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300"
                                    >
                                        <span className="text-sm font-medium">{keyword}</span>
                                        <button
                                            onClick={() => removeCustomKeyword(keyword)}
                                            className="p-0.5 rounded hover:bg-white/10 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No custom keywords added yet
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
                <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                    <p className="text-slate-400">Account settings and API keys will be available here in a future update.</p>
                </div>
            )}
        </div>
    );
}
