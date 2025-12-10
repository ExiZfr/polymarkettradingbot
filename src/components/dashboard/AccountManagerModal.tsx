"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, TrendingDown, TrendingUp, AlertTriangle,
    Save, Wallet, Zap, ArrowRight, Info, Plus, Check, Settings, User
} from "lucide-react";
import { paperStore, PaperTradingSettings, PaperProfile } from "@/lib/paper-trading";

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
    const [view, setView] = useState<'list' | 'settings' | 'create'>('list');
    const [profiles, setProfiles] = useState<PaperProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>("");

    // Settings State (for the active/selected profile)
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [walletName, setWalletName] = useState("");

    // New Profile State
    const [newProfileName, setNewProfileName] = useState("");
    const [newProfileBalance, setNewProfileBalance] = useState(1000);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Refresh data when modal opens or view changes
    const reloadData = () => {
        const allProfiles = paperStore.getProfiles();
        setProfiles(allProfiles);

        const activeId = paperStore.getActiveProfileId();
        setActiveProfileId(activeId);

        // Load settings for current active profile
        setSettings(paperStore.getSettings());
        const currentProfile = paperStore.getActiveProfile();
        setWalletName(currentProfile.username || "Paper Trader");
    };

    useEffect(() => {
        if (isOpen) {
            reloadData();
            setView('list'); // Default to list view on open
        }
    }, [isOpen]);

    const handleSwitchProfile = (id: string) => {
        paperStore.switchProfile(id);
        reloadData();
        onUpdate(); // Update parent widget
    };

    const handleCreateProfile = () => {
        if (!newProfileName.trim()) return;
        const newProfile = paperStore.createProfile(newProfileName, newProfileBalance);
        paperStore.switchProfile(newProfile.id); // Auto-switch to new
        reloadData();
        onUpdate();
        setView('list');
        setNewProfileName("");
        setNewProfileBalance(1000);
    };

    const handleSaveSettings = () => {
        if (!settings) return;
        paperStore.saveSettings(settings); // Saves global settings (could be per-profile if expanded)
        // Resetting profile actually resets the CURRENT active profile structure if confirmed
        // But here we likely just want to update the name and maybe re-init balance if changed drastically?
        // For now, we follow original logic: update name and save settings.
        // User warning says "System Reset", so we resets balance + stats.

        paperStore.resetProfile(settings.initialBalance);
        paperStore.saveProfile({ username: walletName });

        reloadData();
        onUpdate();
        setView('list');
    };

    if (!mounted) return null;

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

                        <div className="relative z-10 p-8 space-y-8">

                            {/* --- HEADER --- */}
                            <motion.div variants={itemVariants} className="flex items-center gap-4 border-b border-[#2d323b] pb-6">
                                <div className="w-12 h-12 rounded-lg bg-[#2e7cf6] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-[#e4e6ea] tracking-tight">Paper Trading</h1>
                                    <p className="text-sm text-[#8ba1be]">
                                        {view === 'list' && "Manage your simulation portfolios."}
                                        {view === 'settings' && "Configure portfolio parameters."}
                                        {view === 'create' && "Initialize a new trading account."}
                                    </p>
                                </div>
                            </motion.div>

                            {/* --- VIEW: PROFILE LIST --- */}
                            {view === 'list' && (
                                <motion.div variants={itemVariants} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {profiles.map((profile) => (
                                            <div
                                                key={profile.id}
                                                onClick={() => handleSwitchProfile(profile.id)}
                                                className={`relative p-5 rounded-xl border cursor-pointer transition-all group ${profile.id === activeProfileId
                                                        ? 'bg-[#2e7cf6]/5 border-[#2e7cf6] shadow-[0_0_20px_-12px_rgba(46,124,246,0.3)]'
                                                        : 'bg-[#0e1115] border-[#2d323b] hover:border-[#8ba1be]'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-2 rounded-lg ${profile.id === activeProfileId ? 'bg-[#2e7cf6] text-white' : 'bg-[#2d323b] text-[#8ba1be]'}`}>
                                                        <User size={18} />
                                                    </div>
                                                    {profile.id === activeProfileId && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2e7cf6]/10 text-[#2e7cf6] text-[10px] font-bold uppercase tracking-wider">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#2e7cf6] animate-pulse" />
                                                            Active
                                                        </div>
                                                    )}
                                                </div>

                                                <h3 className="text-[#e4e6ea] font-medium text-lg mb-1 truncate">{profile.username}</h3>
                                                <div className="text-2xl font-mono font-bold text-[#e4e6ea] mb-4">
                                                    ${profile.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-[#2d323b] mt-auto">
                                                    <div className="text-xs text-[#8ba1be]">
                                                        <span className={profile.totalPnL >= 0 ? "text-[#27aa80]" : "text-[#ef4444]"}>
                                                            {profile.totalPnL >= 0 ? '+' : ''}{profile.totalPnL.toFixed(2)} PnL
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setView('settings'); handleSwitchProfile(profile.id); }}
                                                        className="p-2 rounded hover:bg-[#2d323b] text-[#8ba1be] hover:text-[#e4e6ea] transition-colors"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Create New Card */}
                                        <button
                                            onClick={() => setView('create')}
                                            className="flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-[#2d323b] text-[#8ba1be] hover:text-[#e4e6ea] hover:border-[#8ba1be] hover:bg-[#2d323b]/30 transition-all min-h-[200px]"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-[#2d323b] flex items-center justify-center mb-3 group-hover:bg-[#3d444d] transition-colors">
                                                <Plus size={24} />
                                            </div>
                                            <span className="font-medium">New Portfolio</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- VIEW: CREATE PROFILE --- */}
                            {view === 'create' && (
                                <motion.div variants={itemVariants} className="max-w-md mx-auto space-y-8 py-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-[#8ba1be] mb-2">Portfolio Name</label>
                                            <input
                                                type="text"
                                                autoFocus
                                                value={newProfileName}
                                                onChange={(e) => setNewProfileName(e.target.value)}
                                                className="w-full bg-[#0e1115] border border-[#2d323b] rounded-lg p-3 text-base text-[#e4e6ea] focus:outline-none focus:border-[#2e7cf6] font-medium"
                                                placeholder="e.g. High Risk Bot"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#8ba1be] mb-2">Initial Funding</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-3 flex items-center text-lg text-[#27aa80]">$</span>
                                                <input
                                                    type="number"
                                                    value={newProfileBalance}
                                                    onChange={(e) => setNewProfileBalance(parseFloat(e.target.value))}
                                                    className="w-full bg-[#0e1115] border border-[#2d323b] rounded-lg py-3 pl-8 pr-3 text-lg font-bold text-[#e4e6ea] focus:outline-none focus:border-[#27aa80] font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setView('list')}
                                            className="px-6 py-3 rounded-lg font-medium text-sm text-[#8ba1be] hover:text-[#e4e6ea] hover:bg-[#2d323b]/50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateProfile}
                                            disabled={!newProfileName.trim()}
                                            className="flex-1 px-8 py-3 rounded-lg font-semibold text-sm bg-[#e4e6ea] text-[#0e1115] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Create Portfolio
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- VIEW: SETTINGS (Original Content) --- */}
                            {view === 'settings' && settings && (
                                <motion.div variants={itemVariants} className="space-y-6">
                                    {/* Navigation to go back */}
                                    <button
                                        onClick={() => setView('list')}
                                        className="flex items-center gap-2 text-sm text-[#8ba1be] hover:text-[#e4e6ea] transition-colors mb-2"
                                    >
                                        <ArrowRight size={14} className="rotate-180" />
                                        Back to Portfolios
                                    </button>

                                    {/* === SECTION: IDENTITY === */}
                                    <div className="space-y-6">
                                        <h2 className="text-sm font-semibold text-[#8ba1be] uppercase tracking-wider flex items-center gap-2">
                                            <Info size={14} />
                                            Active Account: <span className="text-[#e4e6ea]">{activeProfileId === activeProfileId ? walletName : 'Editing...'}</span>
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
                                                />
                                            </div>
                                            {/* Starting Balance */}
                                            <div>
                                                <label className="block text-xs font-medium text-[#8ba1be] mb-2">Reset Capital (USDC)</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-3 flex items-center text-xl text-[#27aa80]">$</span>
                                                    <input
                                                        type="number"
                                                        value={settings.initialBalance}
                                                        onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-[#0e1115] border border-[#2d323b] rounded-lg py-3 pl-8 pr-3 text-xl font-bold text-[#e4e6ea] focus:outline-none focus:border-[#27aa80] transition-all font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* === SECTION: RISK MANAGEMENT (Same as before) === */}
                                    <div className="space-y-6">
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
                                    </div>

                                    {/* Warning */}
                                    <div className="p-4 rounded-lg bg-[#eab308]/10 border border-[#eab308]/20 flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-[#eab308] flex-shrink-0 mt-0.5" />
                                        <div className="text-xs text-[#eab308]/90 leading-relaxed">
                                            <strong className="font-semibold text-[#eab308]">System Reset Required:</strong> Saving changes will archive current performance data for this profile and re-initialize it.
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex gap-4 pt-2 border-t border-[#2d323b]">
                                        <button
                                            onClick={() => setView('list')}
                                            className="px-6 py-3 rounded-lg font-medium text-sm text-[#8ba1be] hover:text-[#e4e6ea] hover:bg-[#2d323b]/50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={handleSaveSettings}
                                            className="flex-1 px-8 py-3 rounded-lg font-semibold text-sm bg-[#e4e6ea] text-[#0e1115] hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                                        >
                                            <Save size={18} />
                                            Update Configuration
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
