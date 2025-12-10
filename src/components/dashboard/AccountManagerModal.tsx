"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, DollarSign, Target, TrendingDown, TrendingUp, AlertTriangle,
    Save, Wallet, ShieldCheck, Zap, Layers, Activity, Lock
} from "lucide-react";
import { paperStore, PaperTradingSettings } from "@/lib/paper-trading";

type AccountManagerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
};

// Animation variants
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring" as const, damping: 25, stiffness: 300, mass: 1 }
    },
    exit: { opacity: 0, scale: 0.98, y: -20, transition: { duration: 0.2 } }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function AccountManagerModal({ isOpen, onClose, onUpdate }: AccountManagerModalProps) {
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [walletName, setWalletName] = useState("");
    const [activeTab, setActiveTab] = useState<'general' | 'risk'>('general');

    useEffect(() => {
        if (isOpen) {
            setSettings(paperStore.getSettings());
            const profile = paperStore.getProfile();
            setWalletName(profile.username || "Paper Trader");
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!settings) return;

        // Save settings and reset profile with new init balance
        paperStore.saveSettings(settings);
        paperStore.resetProfile(settings.initialBalance);
        paperStore.saveProfile({ username: walletName });

        onUpdate();
        onClose();
    };

    if (!settings) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Container - EXPERT SIZE: max-w-5xl */}
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0A0A0A] w-full max-w-5xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative group"
                        >
                            {/* Dynamic Background FX */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[128px] pointer-events-none -mr-32 -mt-32 opacity-30 group-hover:opacity-40 transition-opacity duration-1000" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px] pointer-events-none -ml-32 -mb-32 opacity-30 group-hover:opacity-40 transition-opacity duration-1000" />

                            {/* Neural Grid Overlay */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

                            <div className="relative flex flex-col md:flex-row h-full max-h-[85vh]">

                                {/* SIDEBAR / HEADER */}
                                <div className="md:w-72 bg-white/5 border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col justify-between backdrop-blur-sm">
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-3 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg shadow-primary/25 text-white">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white leading-none">Paper<br />Account</h2>
                                            </div>
                                        </div>

                                        <nav className="space-y-2">
                                            <button
                                                onClick={() => setActiveTab('general')}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-medium ${activeTab === 'general' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <Target size={18} />
                                                General & Capital
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('risk')}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-medium ${activeTab === 'risk' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <ShieldCheck size={18} />
                                                Risk Management
                                            </button>
                                        </nav>
                                    </div>

                                    <div className="mt-8 md:mt-0 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
                                        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                            <AlertTriangle size={16} />
                                            Reset Warning
                                        </div>
                                        <p className="text-xs opacity-80 leading-relaxed">
                                            Saving will create a new portfolio instance. History will be archived.
                                        </p>
                                    </div>
                                </div>

                                {/* MAIN CONTENT AREA */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    {/* Top Bar (Mobile Close) */}
                                    <div className="p-4 flex justify-end md:hidden">
                                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Scrollable Content */}
                                    <motion.div
                                        key={activeTab}
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-8"
                                    >
                                        {activeTab === 'general' && (
                                            <>
                                                <div className="mb-6">
                                                    <h3 className="text-2xl font-bold text-white mb-2">Portfolio Identity</h3>
                                                    <p className="text-muted-foreground">Define the persona for this trading simulation.</p>
                                                </div>

                                                <motion.div variants={itemVariants} className="grid grid-cols-1 gap-8">
                                                    <div className="group">
                                                        <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Wallet Alias</label>
                                                        <input
                                                            type="text"
                                                            value={walletName}
                                                            onChange={(e) => setWalletName(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-2xl font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                                            placeholder="Enter wallet name..."
                                                        />
                                                    </div>

                                                    <div className="group">
                                                        <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Starting Capital</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                                <span className="text-3xl text-emerald-500 font-light">$</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={settings.initialBalance}
                                                                onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-12 pr-6 text-4xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all font-mono"
                                                            />
                                                        </div>
                                                        <div className="mt-4 flex gap-3">
                                                            {[1000, 5000, 10000, 50000].map(amount => (
                                                                <button
                                                                    key={amount}
                                                                    onClick={() => setSettings({ ...settings, initialBalance: amount })}
                                                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-mono"
                                                                >
                                                                    ${amount.toLocaleString()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}

                                        {activeTab === 'risk' && (
                                            <>
                                                <div className="mb-6">
                                                    <h3 className="text-2xl font-bold text-white mb-2">Risk Parameters</h3>
                                                    <p className="text-muted-foreground">Configure automated risk management rules.</p>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    {/* Risk Per Trade */}
                                                    <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-3 opacity-20">
                                                            <Zap size={64} />
                                                        </div>
                                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                                    Risk Per Trade
                                                                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60 font-medium">Kelly Criterion</span>
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground mt-1">Percentage of total balance allocated to each trade.</p>
                                                            </div>
                                                            <div className="text-3xl font-bold text-white font-mono">{settings.riskPerTrade}%</div>
                                                        </div>

                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="25"
                                                            step="1"
                                                            value={settings.riskPerTrade}
                                                            onChange={(e) => setSettings({ ...settings, riskPerTrade: parseInt(e.target.value) })}
                                                            className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"
                                                        />
                                                        <div className="flex justify-between text-xs text-white/40 font-mono">
                                                            <span>MIN 1%</span>
                                                            <span>MAX 25%</span>
                                                        </div>
                                                    </motion.div>

                                                    {/* Auto Stop Loss */}
                                                    <motion.div variants={itemVariants} className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-sm font-bold text-white flex items-center gap-2">
                                                                <div className="p-1.5 bg-red-500/20 rounded text-red-500">
                                                                    <TrendingDown size={14} />
                                                                </div>
                                                                Auto Stop Loss
                                                            </label>
                                                            <span className="text-lg font-mono font-bold text-red-500">
                                                                {settings.autoStopLoss > 0 ? `-${settings.autoStopLoss}%` : 'OFF'}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-red-500/30 transition-colors">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="50"
                                                                value={settings.autoStopLoss}
                                                                onChange={(e) => setSettings({ ...settings, autoStopLoss: parseInt(e.target.value) })}
                                                                className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                        </div>
                                                    </motion.div>

                                                    {/* Auto Take Profit */}
                                                    <motion.div variants={itemVariants} className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-sm font-bold text-white flex items-center gap-2">
                                                                <div className="p-1.5 bg-green-500/20 rounded text-green-500">
                                                                    <TrendingUp size={14} />
                                                                </div>
                                                                Auto Take Profit
                                                            </label>
                                                            <span className="text-lg font-mono font-bold text-green-500">
                                                                {settings.autoTakeProfit > 0 ? `+${settings.autoTakeProfit}%` : 'OFF'}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-green-500/30 transition-colors">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={settings.autoTakeProfit}
                                                                onChange={(e) => setSettings({ ...settings, autoTakeProfit: parseInt(e.target.value) })}
                                                                className="w-full accent-green-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                        </div>
                                                    </motion.div>

                                                    {/* Additional Rules */}
                                                    <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 pt-6 border-t border-white/5">
                                                        <div className="flex flex-col md:flex-row gap-6">
                                                            <div className="flex-1">
                                                                <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                                                    <Layers size={16} />
                                                                    Max Open Positions
                                                                </label>
                                                                <select
                                                                    value={settings.maxOpenPositions}
                                                                    onChange={(e) => setSettings({ ...settings, maxOpenPositions: parseInt(e.target.value) })}
                                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                                                                >
                                                                    {[1, 3, 5, 10, 20, 50].map(num => (
                                                                        <option key={num} value={num} className="bg-gray-900">{num} Concurrent Trades</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="flex-1">
                                                                <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                                                    <Activity size={16} />
                                                                    Market Direction
                                                                </label>
                                                                <button
                                                                    onClick={() => setSettings({ ...settings, allowShorts: !settings.allowShorts })}
                                                                    className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${settings.allowShorts ? 'bg-primary/20 border-primary/50 text-white' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                                                                >
                                                                    <span>Allow Short Selling</span>
                                                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.allowShorts ? 'bg-primary' : 'bg-white/10'}`}>
                                                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.allowShorts ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                </div>
                                            </>
                                        )}
                                    </motion.div>

                                    {/* Footer Actions */}
                                    <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-4 rounded-xl font-bold text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="flex-1 px-8 py-4 rounded-xl font-bold bg-primary text-black hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                                        >
                                            <Save size={20} />
                                            Initialize & Save System
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
