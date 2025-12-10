"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, DollarSign, Target, TrendingDown, TrendingUp, AlertTriangle,
    Save, Wallet, ShieldCheck, Zap, Layers, Activity, Lock, ArrowRight
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
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 0 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring" as const, damping: 25, stiffness: 300, mass: 1 }
    },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
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
                    {/* Full Screen Backdrop - Z-Index 100 to stay on top of everything */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] grid place-items-center p-4 sm:p-8 overflow-y-auto"
                    >
                        {/* Centered Card Container - "The Page" */}
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#09090B] w-full max-w-6xl aspect-[16/10] min-h-[600px] max-h-[90vh] rounded-[24px] border border-white/10 shadow-2xl relative flex overflow-hidden ring-1 ring-white/5"
                            style={{
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px -10px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Top-Right Decorative "Close" for aesthetics (functional one is better placed) */}
                            <div className="absolute top-6 right-6 z-20">
                                <button
                                    onClick={onClose}
                                    className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Background FX inside the card for "page" feel */}
                            <div className="absolute inset-0 z-0">
                                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen" />
                                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen" />
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                            </div>

                            {/* Sidebar / Navigation Panel */}
                            <div className="w-80 border-r border-white/5 bg-white/[0.01] backdrop-blur-sm relative z-10 flex flex-col p-8">
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-black font-bold shadow-lg shadow-primary/20">
                                            <Wallet size={20} />
                                        </div>
                                        <span className="text-xl font-bold text-white tracking-tight">Paper<span className="text-primary">Trade</span></span>
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-[52px]">Configuration Console</p>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <button
                                        onClick={() => setActiveTab('general')}
                                        className={`w-full text-left p-4 rounded-xl transition-all border group relative overflow-hidden ${activeTab === 'general' ? 'bg-primary/10 border-primary/20 text-white' : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-3 font-medium">
                                                <Target size={18} className={activeTab === 'general' ? 'text-primary' : 'text-muted-foreground'} />
                                                Identity & Capital
                                            </div>
                                            {activeTab === 'general' && <motion.div layoutId="active-nav" className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('risk')}
                                        className={`w-full text-left p-4 rounded-xl transition-all border group relative overflow-hidden ${activeTab === 'risk' ? 'bg-primary/10 border-primary/20 text-white' : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-3 font-medium">
                                                <ShieldCheck size={18} className={activeTab === 'risk' ? 'text-primary' : 'text-muted-foreground'} />
                                                Risk Controls
                                            </div>
                                            {activeTab === 'risk' && <motion.div layoutId="active-nav" className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </div>
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 mt-auto">
                                    <div className="flex items-center gap-2 text-amber-500 font-medium text-xs mb-2 uppercase tracking-wider">
                                        <AlertTriangle size={12} />
                                        System Reset
                                    </div>
                                    <p className="text-xs text-amber-500/80 leading-relaxed">
                                        Saving changes will enhance a new portfolio instance. Previous history will be archived.
                                    </p>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 relative z-10 flex flex-col min-w-0 bg-transparent">
                                <motion.div
                                    key={activeTab}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex-1 overflow-y-auto custom-scrollbar p-12"
                                >
                                    {activeTab === 'general' && (
                                        <div className="max-w-2xl mx-auto space-y-10">
                                            <div className="space-y-2">
                                                <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio Identity</h1>
                                                <p className="text-lg text-muted-foreground">Define the parameters for your new trading simulation.</p>
                                            </div>

                                            <div className="space-y-8">
                                                <motion.div variants={itemVariants} className="group cursor-text">
                                                    <label className="block text-sm font-medium text-white/50 mb-3 ml-1 uppercase tracking-wider">Wallet Alias</label>
                                                    <div className="relative transition-all duration-300 group-focus-within:scale-[1.02]">
                                                        <input
                                                            type="text"
                                                            value={walletName}
                                                            onChange={(e) => setWalletName(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-2xl text-white placeholder:text-white/20 focus:outline-none focus:bg-black/40 focus:border-primary/50 transition-all font-medium"
                                                            placeholder="Name your wallet..."
                                                        />
                                                    </div>
                                                </motion.div>

                                                <motion.div variants={itemVariants} className="group cursor-text">
                                                    <label className="block text-sm font-medium text-white/50 mb-3 ml-1 uppercase tracking-wider">Starting Capital</label>
                                                    <div className="relative transition-all duration-300 group-focus-within:scale-[1.02]">
                                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                            <span className="text-4xl text-emerald-500 font-light">$</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={settings.initialBalance}
                                                            onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-8 pl-14 pr-6 text-5xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:bg-black/40 focus:border-emerald-500/50 transition-all font-mono"
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
                                                </motion.div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'risk' && (
                                        <div className="max-w-3xl mx-auto space-y-10">
                                            <div className="space-y-2">
                                                <h1 className="text-3xl font-bold text-white tracking-tight">Risk Protocols</h1>
                                                <p className="text-lg text-muted-foreground">Automated safeguards for your trading strategy.</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Risk Card */}
                                                <motion.div variants={itemVariants} className="col-span-2 bg-gradient-to-br from-secondary/50 to-secondary/10 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/20 transition-colors">
                                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Zap size={96} />
                                                    </div>

                                                    <div className="flex justify-between items-end mb-6 relative z-10">
                                                        <div>
                                                            <div className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">Position Sizing</div>
                                                            <h2 className="text-2xl font-bold text-white">Risk Per Trade</h2>
                                                        </div>
                                                        <div className="text-4xl font-mono font-bold text-white">{settings.riskPerTrade}<span className="text-xl text-primary">%</span></div>
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
                                                    <div className="flex justify-between text-xs font-mono text-white/30 pt-2">
                                                        <span>CONSERVATIVE (1%)</span>
                                                        <span>DEGEN (25%)</span>
                                                    </div>
                                                </motion.div>

                                                {/* Automation Cards */}
                                                <motion.div variants={itemVariants} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.07] transition-colors">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <div className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">Defensive</div>
                                                            <h3 className="text-lg font-bold text-white">Stop Loss</h3>
                                                        </div>
                                                        <TrendingDown className="text-red-500" size={24} />
                                                    </div>
                                                    <div className="flex items-baseline gap-1 mb-4">
                                                        <span className="text-3xl font-mono font-bold text-white">-{settings.autoStopLoss}</span>
                                                        <span className="text-sm text-white/50">%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={settings.autoStopLoss}
                                                        onChange={(e) => setSettings({ ...settings, autoStopLoss: parseInt(e.target.value) })}
                                                        className="w-full accent-red-500 h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </motion.div>

                                                <motion.div variants={itemVariants} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.07] transition-colors">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <div className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1">Offensive</div>
                                                            <h3 className="text-lg font-bold text-white">Take Profit</h3>
                                                        </div>
                                                        <TrendingUp className="text-green-500" size={24} />
                                                    </div>
                                                    <div className="flex items-baseline gap-1 mb-4">
                                                        <span className="text-3xl font-mono font-bold text-white">+{settings.autoTakeProfit}</span>
                                                        <span className="text-sm text-white/50">%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={settings.autoTakeProfit}
                                                        onChange={(e) => setSettings({ ...settings, autoTakeProfit: parseInt(e.target.value) })}
                                                        className="w-full accent-green-500 h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </motion.div>
                                            </div>

                                            <motion.div variants={itemVariants} className="pt-8 border-t border-white/5">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="text-sm font-medium text-white/50 mb-3 block">Max Positions</label>
                                                        <select
                                                            value={settings.maxOpenPositions}
                                                            onChange={(e) => setSettings({ ...settings, maxOpenPositions: parseInt(e.target.value) })}
                                                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 text-lg transition-colors"
                                                        >
                                                            {[1, 3, 5, 10, 20, 50].map(num => (
                                                                <option key={num} value={num} className="bg-gray-900">{num} Concurrent Trades</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={() => setSettings({ ...settings, allowShorts: !settings.allowShorts })}
                                                            className={`w-full px-5 py-4 rounded-2xl border flex items-center justify-between transition-all ${settings.allowShorts ? 'bg-primary/10 border-primary/50 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                                        >
                                                            <span className="font-medium text-lg">Short Selling</span>
                                                            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.allowShorts ? 'bg-primary' : 'bg-white/10'}`}>
                                                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings.allowShorts ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Bottom Action Bar */}
                                <div className="p-8 border-t border-white/5 bg-white/[0.01] backdrop-blur-sm flex justify-between items-center gap-6">
                                    <button
                                        onClick={onClose}
                                        className="text-muted-foreground hover:text-white font-medium px-4 py-2 transition-colors"
                                    >
                                        Cancel Configuration
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSave}
                                        className="px-10 py-5 rounded-2xl font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center gap-3 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] text-lg"
                                    >
                                        <Save size={20} />
                                        Initialize System
                                        <ArrowRight size={20} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
