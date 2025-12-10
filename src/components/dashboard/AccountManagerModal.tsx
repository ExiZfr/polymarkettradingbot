"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Target, TrendingDown, TrendingUp, AlertTriangle, Save, Wallet, ShieldCheck, Zap } from "lucide-react";
import { paperStore, PaperTradingSettings } from "@/lib/paper-trading";

type AccountManagerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
};


// Animation variants
const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.95, y: -20 }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
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

        // Confirmation is handled by the UI clearly now, but a final check is good
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
                    >
                        {/* Modal Container */}
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card/50 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl relative"
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32 opacity-50" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none -ml-32 -mb-32 opacity-50" />

                            {/* Header */}
                            <div className="relative flex items-center justify-between p-8 border-b border-white/5">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                            <Wallet size={24} />
                                        </div>
                                        Configure Paper Account
                                    </h2>
                                    <p className="text-muted-foreground mt-1 ml-14">
                                        Set up your trading simulation parameters
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-secondary/50 hover:bg-secondary rounded-full transition-all text-muted-foreground hover:text-foreground group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            {/* Body */}
                            <motion.div
                                className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {/* Warning Box */}
                                <motion.div variants={itemVariants} className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4 text-amber-500 shadow-sm shadow-amber-900/10">
                                    <div className="p-2 bg-amber-500/20 rounded-lg h-fit">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">Reset Warning</h4>
                                        <p className="text-sm opacity-90 leading-relaxed">
                                            Applying these changes will <strong>create a fresh portfolio instance</strong>.
                                            Your current balance will be reset to the initial amount and all trade history will be archived.
                                        </p>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Wallet Name */}
                                        <motion.div variants={itemVariants}>
                                            <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                <Target size={16} className="text-primary" />
                                                Wallet Profile Name
                                            </label>
                                            <input
                                                type="text"
                                                value={walletName}
                                                onChange={(e) => setWalletName(e.target.value)}
                                                placeholder="e.g. Aggressive Growth Fund"
                                                className="w-full px-5 py-4 bg-secondary/50 border border-white/5 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-lg font-medium"
                                            />
                                        </motion.div>

                                        {/* Initial Balance */}
                                        <motion.div variants={itemVariants}>
                                            <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                <DollarSign size={16} className="text-green-500" />
                                                Initial Capital
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                                                <input
                                                    type="number"
                                                    value={settings.initialBalance}
                                                    onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-10 pr-5 py-4 bg-secondary/50 border border-white/5 rounded-2xl text-foreground font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                                                />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Right Column (Risk Stack) */}
                                    <div className="space-y-6">
                                        {/* Risk Per Trade */}
                                        <motion.div variants={itemVariants} className="bg-secondary/30 p-5 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <Zap size={16} className="text-yellow-500" />
                                                    Risk Per Trade
                                                </label>
                                                <span className="text-xl font-mono font-bold text-foreground">{settings.riskPerTrade}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="25"
                                                step="1"
                                                value={settings.riskPerTrade}
                                                onChange={(e) => setSettings({ ...settings, riskPerTrade: parseInt(e.target.value) })}
                                                className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                                <span>Conservative (1%)</span>
                                                <span>Aggressive (25%)</span>
                                            </div>
                                        </motion.div>

                                        {/* Auto Stop Loss */}
                                        <motion.div variants={itemVariants} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <TrendingDown size={14} className="text-red-500" />
                                                    Auto Stop Loss
                                                </label>
                                                <span className="text-sm font-mono font-bold text-red-500">
                                                    {settings.autoStopLoss > 0 ? `-${settings.autoStopLoss}%` : 'OFF'}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={settings.autoStopLoss}
                                                onChange={(e) => setSettings({ ...settings, autoStopLoss: parseInt(e.target.value) })}
                                                className="w-full accent-red-500 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
                                            />
                                        </motion.div>

                                        {/* Auto Take Profit */}
                                        <motion.div variants={itemVariants} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <TrendingUp size={14} className="text-green-500" />
                                                    Auto Take Profit
                                                </label>
                                                <span className="text-sm font-mono font-bold text-green-500">
                                                    {settings.autoTakeProfit > 0 ? `+${settings.autoTakeProfit}%` : 'OFF'}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={settings.autoTakeProfit}
                                                onChange={(e) => setSettings({ ...settings, autoTakeProfit: parseInt(e.target.value) })}
                                                className="w-full accent-green-500 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Footer */}
                            <div className="p-8 border-t border-white/5 bg-secondary/20 backdrop-blur-md flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="px-8 py-4 rounded-2xl font-bold text-muted-foreground hover:bg-secondary/80 transition-colors w-1/3"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    className="flex-1 px-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/25"
                                >
                                    <ShieldCheck size={20} />
                                    Initialize New Portfolio
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
