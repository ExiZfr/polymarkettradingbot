"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, TrendingDown, TrendingUp, AlertTriangle,
    Save, Wallet, Zap, ArrowRight, Info
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
    exit: { opacity: 0, transition: { duration: 0.15 } }
};

const pageVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 5 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", damping: 25, stiffness: 350, mass: 0.8 }
    },
    exit: { opacity: 0, scale: 0.99, y: 5, transition: { duration: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function AccountManagerModal({ isOpen, onClose, onUpdate }: AccountManagerModalProps) {
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [walletName, setWalletName] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!settings || !mounted) return null;

    // Polymarket Theme Constants
    const POLY_BLUE = "text-[#2e7cf6]";
    const POLY_BG_ACCENT = "bg-[#2e7cf6]";

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
                    className="bg-[#0e1115]/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
                >
                    <motion.div
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[1000px] max-h-[95vh] overflow-y-auto bg-[#1a1d21] rounded-xl border border-[#2d323b] shadow-2xl"
                        style={{
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 20px 50px -10px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-20 text-[#6a7380] hover:text-[#e4e6ea] transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Content */}
                        <div className="relative z-10 p-8 space-y-10">

                            {/* Header */}
                            <motion.div variants={itemVariants} className="flex items-center gap-4 border-b border-[#2d323b] pb-6">
                                <div className="w-12 h-12 rounded-lg bg-[#2e7cf6] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-[#e4e6ea] tracking-tight">Paper Trading</h1>
                                    <p className="text-sm text-[#8ba1be]">Simulate trades with zero risk using real market data.</p>
                                </div>
                            </motion.div>

                            {/* === SECTION: IDENTITY === */}
                            <motion.div variants={itemVariants} className="space-y-6">
                                <h2 className="text-sm font-semibold text-[#8ba1be] uppercase tracking-wider flex items-center gap-2">
                                    <Info size={14} />
                                    Account Configuration
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Wallet Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#8ba1be] mb-2">Wallet Alias</label>
                                        <input
                                            type="text"
                                            value={walletName}
                                            onChange={(e) => setWalletName(e.target.value)}
                                            className="w-full bg-[#0e1115] border border-[#2d323b] rounded-lg p-3 text-base text-[#e4e6ea] placeholder:text-[#2d323b] focus:outline-none focus:border-[#2e7cf6] transition-all font-medium"
                                            placeholder="e.g., Alpha Portfolio"
                                        />
                                    </div>
                                    {/* Starting Balance */}
                                    <div>
                                        <label className="block text-xs font-medium text-[#8ba1be] mb-2">Initial Capital (USDC)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-3 flex items-center text-xl text-[#27aa80]">$</span>
                                            <input
                                                type="number"
                                                value={settings.initialBalance}
                                                onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-[#0e1115] border border-[#2d323b] rounded-lg py-3 pl-8 pr-3 text-xl font-bold text-[#e4e6ea] focus:outline-none focus:border-[#27aa80] transition-all font-mono"
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {[1000, 5000, 10000, 50000].map(amount => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setSettings({ ...settings, initialBalance: amount })}
                                                    className="px-3 py-1.5 rounded bg-[#2d323b]/50 border border-[#2d323b] text-xs font-mono text-[#8ba1be] hover:text-[#e4e6ea] hover:border-[#2e7cf6] transition-all"
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
                                <h2 className="text-sm font-semibold text-[#8ba1be] uppercase tracking-wider flex items-center gap-2">
                                    <Zap size={14} />
                                    Risk Controls
                                </h2>

                                {/* Risk Per Trade */}
                                <div className="bg-[#0e1115] border border-[#2d323b] rounded-lg p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-base font-medium text-[#e4e6ea]">Position Sizing</h3>
                                            <p className="text-xs text-[#6a7380] mt-0.5">Percentage of balance allocated per trade</p>
                                        </div>
                                        <div className="text-2xl font-mono font-bold text-[#e4e6ea]">{settings.riskPerTrade}<span className="text-sm text-[#2e7cf6]">%</span></div>
                                    </div>
                                    <div className="relative h-2 bg-[#2d323b] rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-[#2e7cf6] transition-all duration-300"
                                            style={{ width: `${(settings.riskPerTrade / 25) * 100}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range" min="1" max="25" step="1"
                                        value={settings.riskPerTrade}
                                        onChange={(e) => setSettings({ ...settings, riskPerTrade: parseInt(e.target.value) })}
                                        className="absolute w-full h-2 -mt-2 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-mono text-[#6a7380] pt-2">
                                        <span>1% (Safe)</span>
                                        <span>25% (Aggressive)</span>
                                    </div>
                                </div>

                                {/* Automation Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Stop Loss */}
                                    <div className="bg-[#0e1115] border border-[#2d323b] rounded-lg p-4 group hover:border-[#ef4444]/50 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-[#e4e6ea]">Stop Loss</span>
                                            <TrendingDown size={16} className="text-[#ef4444]" />
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-2xl font-mono font-bold text-[#e4e6ea]">-{settings.autoStopLoss}</span>
                                            <span className="text-xs text-[#8ba1be]">%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="50"
                                            value={settings.autoStopLoss}
                                            onChange={(e) => setSettings({ ...settings, autoStopLoss: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-[#2d323b] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ef4444]"
                                        />
                                    </div>
                                    {/* Take Profit */}
                                    <div className="bg-[#0e1115] border border-[#2d323b] rounded-lg p-4 group hover:border-[#22c55e]/50 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-[#e4e6ea]">Take Profit</span>
                                            <TrendingUp size={16} className="text-[#22c55e]" />
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-2xl font-mono font-bold text-[#e4e6ea]">+{settings.autoTakeProfit}</span>
                                            <span className="text-xs text-[#8ba1be]">%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={settings.autoTakeProfit}
                                            onChange={(e) => setSettings({ ...settings, autoTakeProfit: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-[#2d323b] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#22c55e]"
                                        />
                                    </div>
                                </div>

                                {/* Advanced Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8ba1be] mb-2">Concurrency Limit</label>
                                        <select
                                            value={settings.maxOpenPositions}
                                            onChange={(e) => setSettings({ ...settings, maxOpenPositions: parseInt(e.target.value) })}
                                            className="w-full px-3 py-3 bg-[#0e1115] border border-[#2d323b] rounded-lg text-[#e4e6ea] text-sm focus:outline-none focus:border-[#2e7cf6] transition-colors"
                                        >
                                            {[1, 3, 5, 10, 20, 50].map(num => (
                                                <option key={num} value={num} className="bg-[#0e1115]">{num} Open Positions Max</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8ba1be] mb-2">Strategy Options</label>
                                        <button
                                            onClick={() => setSettings({ ...settings, allowShorts: !settings.allowShorts })}
                                            className={`w-full px-4 py-2.5 rounded-lg border flex items-center justify-between transition-all ${settings.allowShorts ? 'bg-[#2e7cf6]/10 border-[#2e7cf6] text-[#e4e6ea]' : 'bg-[#0e1115] border-[#2d323b] text-[#8ba1be] hover:border-[#8ba1be]'}`}
                                        >
                                            <span className="text-sm font-medium">Allow Shorting</span>
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${settings.allowShorts ? 'bg-[#2e7cf6]' : 'bg-[#2d323b]'}`}>
                                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.allowShorts ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Warning */}
                            <motion.div variants={itemVariants} className="p-4 rounded-lg bg-[#eab308]/10 border border-[#eab308]/20 flex items-start gap-3">
                                <AlertTriangle size={18} className="text-[#eab308] flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-[#eab308]/90 leading-relaxed">
                                    <strong className="font-semibold text-[#eab308]">System Reset Required:</strong> Saving changes will archive current performance data and initialize a new trading epoch with the specified capital.
                                </div>
                            </motion.div>

                            {/* Footer Actions */}
                            <motion.div variants={itemVariants} className="flex gap-4 pt-2 border-t border-[#2d323b]">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-lg font-medium text-sm text-[#8ba1be] hover:text-[#e4e6ea] hover:bg-[#2d323b]/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleSave}
                                    className="flex-1 px-8 py-3 rounded-lg font-semibold text-sm bg-[#e4e6ea] text-[#0e1115] hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                                >
                                    <Save size={18} />
                                    Confirm Configuration
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
