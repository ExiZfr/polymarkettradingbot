"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, TrendingDown, TrendingUp, AlertTriangle,
    Save, Wallet, Zap, ArrowRight
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
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

const pageVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, damping: 30, stiffness: 350 }
    },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function AccountManagerModal({ isOpen, onClose, onUpdate }: AccountManagerModalProps) {
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [walletName, setWalletName] = useState("");

    useEffect(() => {
        if (isOpen) {
            setSettings(paperStore.getSettings());
            const profile = paperStore.getProfile();
            setWalletName(profile.username || "Paper Trader");
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!settings) return;
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
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                    className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                >
                    {/* === THE PAGE === */}
                    <motion.div
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0c] rounded-3xl border border-white/10 shadow-2xl"
                        style={{ boxShadow: '0 25px 80px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={22} />
                        </button>

                        {/* Background Glow */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-500/10 blur-[100px] rounded-full" />
                            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/10 blur-[100px] rounded-full" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-8 md:p-12 space-y-10">

                            {/* Header */}
                            <motion.div variants={itemVariants} className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-black shadow-lg shadow-primary/30">
                                    <Wallet size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Paper Trading Setup</h1>
                                    <p className="text-muted-foreground">Configure your simulation account parameters.</p>
                                </div>
                            </motion.div>

                            {/* === SECTION: IDENTITY === */}
                            <motion.div variants={itemVariants} className="space-y-6">
                                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Account Identity</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Wallet Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/50 mb-2 uppercase tracking-wider">Wallet Name</label>
                                        <input
                                            type="text"
                                            value={walletName}
                                            onChange={(e) => setWalletName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                                            placeholder="e.g., My Trading Bot"
                                        />
                                    </div>
                                    {/* Starting Balance */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/50 mb-2 uppercase tracking-wider">Starting Balance</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-4 flex items-center text-2xl text-emerald-500">$</span>
                                            <input
                                                type="number"
                                                value={settings.initialBalance}
                                                onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {[1000, 5000, 10000, 50000, 100000].map(amount => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setSettings({ ...settings, initialBalance: amount })}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all font-mono"
                                                >
                                                    ${amount.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* === SECTION: RISK MANAGEMENT === */}
                            <motion.div variants={itemVariants} className="space-y-6">
                                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Risk Management</h2>

                                {/* Risk Per Trade Card */}
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Zap size={64} />
                                    </div>
                                    <div className="flex justify-between items-end mb-5">
                                        <div>
                                            <div className="text-sm font-medium text-white/50 uppercase mb-1">Position Sizing</div>
                                            <h3 className="text-lg font-bold text-white">Risk Per Trade</h3>
                                        </div>
                                        <div className="text-4xl font-mono font-bold text-white">{settings.riskPerTrade}<span className="text-lg text-primary">%</span></div>
                                    </div>
                                    <input
                                        type="range" min="1" max="25" step="1"
                                        value={settings.riskPerTrade}
                                        onChange={(e) => setSettings({ ...settings, riskPerTrade: parseInt(e.target.value) })}
                                        className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs font-mono text-white/30 pt-2">
                                        <span>Conservative (1%)</span>
                                        <span>Aggressive (25%)</span>
                                    </div>
                                </div>

                                {/* Stop Loss & Take Profit */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Stop Loss */}
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="text-red-500" size={20} />
                                                <span className="font-semibold text-white">Auto Stop Loss</span>
                                            </div>
                                            <span className="text-2xl font-mono font-bold text-red-400">
                                                {settings.autoStopLoss > 0 ? `-${settings.autoStopLoss}%` : 'OFF'}
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0" max="50"
                                            value={settings.autoStopLoss}
                                            onChange={(e) => setSettings({ ...settings, autoStopLoss: parseInt(e.target.value) })}
                                            className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Take Profit */}
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="text-green-500" size={20} />
                                                <span className="font-semibold text-white">Auto Take Profit</span>
                                            </div>
                                            <span className="text-2xl font-mono font-bold text-green-400">
                                                {settings.autoTakeProfit > 0 ? `+${settings.autoTakeProfit}%` : 'OFF'}
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={settings.autoTakeProfit}
                                            onChange={(e) => setSettings({ ...settings, autoTakeProfit: parseInt(e.target.value) })}
                                            className="w-full accent-green-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Max Positions & Shorts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/50 mb-2">Max Open Positions</label>
                                        <select
                                            value={settings.maxOpenPositions}
                                            onChange={(e) => setSettings({ ...settings, maxOpenPositions: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 text-base transition-colors"
                                        >
                                            {[1, 3, 5, 10, 20, 50].map(num => (
                                                <option key={num} value={num} className="bg-gray-900">{num} Concurrent Trades</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/50 mb-2">Short Selling</label>
                                        <button
                                            onClick={() => setSettings({ ...settings, allowShorts: !settings.allowShorts })}
                                            className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${settings.allowShorts ? 'bg-primary/10 border-primary/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                        >
                                            <span>{settings.allowShorts ? 'Enabled' : 'Disabled'}</span>
                                            <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.allowShorts ? 'bg-primary' : 'bg-white/10'}`}>
                                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.allowShorts ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Warning */}
                            <motion.div variants={itemVariants} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-500/90">
                                    <strong>Warning:</strong> Saving will reset your paper trading history and start a new simulation with the specified balance.
                                </p>
                            </motion.div>

                            {/* Footer Actions */}
                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    className="flex-1 px-8 py-4 rounded-xl font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-lg order-1 sm:order-2"
                                >
                                    <Save size={20} />
                                    Initialize & Save
                                    <ArrowRight size={20} />
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
