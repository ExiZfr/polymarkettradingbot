"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, TrendingDown, TrendingUp, AlertTriangle,
    Save, Wallet, Zap, ArrowRight, Info, Plus, Check, Settings, User, ChevronDown, Shield, Target, Trash2
} from "lucide-react";
import { paperStore, PaperTradingSettings, PaperProfile, DEFAULT_SETTINGS, RISK_PRESETS } from "@/lib/paper-trading";

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
        transition: { type: "spring" as const, damping: 25, stiffness: 350, mass: 0.8 }
    },
    exit: { opacity: 0, scale: 0.99, y: 5, transition: { duration: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function AccountManagerModal({ isOpen, onClose, onUpdate }: AccountManagerModalProps) {
    const [view, setView] = useState<'list' | 'settings' | 'create' | 'delete_confirm'>('list');
    const [profiles, setProfiles] = useState<PaperProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>("");

    // Settings State (for the active/selected profile editing)
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [walletName, setWalletName] = useState("");

    // New Profile State
    const [newProfileName, setNewProfileName] = useState("");
    const [newProfileBalance, setNewProfileBalance] = useState(1000);
    // Expandable advanced settings for creation
    const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
    const [newProfileSettings, setNewProfileSettings] = useState<PaperTradingSettings>(DEFAULT_SETTINGS);

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
            setNewProfileSettings(DEFAULT_SETTINGS); // Reset create defaults
            setShowAdvancedCreate(false);
        }
    }, [isOpen]);

    const handleSwitchProfile = (id: string) => {
        paperStore.switchProfile(id);
        reloadData();
        onUpdate(); // Update parent widget
    };

    const handleCreateProfile = () => {
        if (!newProfileName.trim()) return;
        // Merge base balance into settings
        const finalSettings = {
            ...newProfileSettings,
            initialBalance: newProfileBalance
        };

        const newProfile = paperStore.createProfile(newProfileName, newProfileBalance, finalSettings);
        paperStore.switchProfile(newProfile.id); // Auto-switch to new
        reloadData();
        onUpdate();
        setView('list');
        // Reset form
        setNewProfileName("");
        setNewProfileBalance(1000);
        setNewProfileSettings(DEFAULT_SETTINGS);
    };

    const handleSaveSettings = () => {
        if (!settings) return;
        paperStore.saveSettings(settings);
        paperStore.resetProfile(settings.initialBalance);
        paperStore.saveProfile({ username: walletName });

        reloadData();
        onUpdate();
        setView('list');
    };

    if (!mounted) return null;

    // Helper to render risk settings form (reusable for both Create and Edit)
    const renderRiskSettings = (
        currentSettings: PaperTradingSettings,
        updateSettings: (s: PaperTradingSettings) => void
    ) => (
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
                    <div className="text-2xl font-mono font-bold text-[#e4e6ea]">{currentSettings.riskPerTrade}<span className="text-sm text-[#2e7cf6]">%</span></div>
                </div>
                <div className="relative h-2 bg-[#2d323b] rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-[#2e7cf6] transition-all duration-300"
                        style={{ width: `${(currentSettings.riskPerTrade / 25) * 100}%` }}
                    />
                </div>
                <input
                    type="range" min="1" max="25" step="1"
                    value={currentSettings.riskPerTrade}
                    onChange={(e) => updateSettings({ ...currentSettings, riskPerTrade: parseInt(e.target.value) })}
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
                        <span className="text-2xl font-mono font-bold text-[#e4e6ea]">-{currentSettings.autoStopLoss}</span>
                        <span className="text-xs text-[#8ba1be]">%</span>
                    </div>
                    <input
                        type="range" min="0" max="50"
                        value={currentSettings.autoStopLoss}
                        onChange={(e) => updateSettings({ ...currentSettings, autoStopLoss: parseInt(e.target.value) })}
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
                        <span className="text-2xl font-mono font-bold text-[#e4e6ea]">+{currentSettings.autoTakeProfit}</span>
                        <span className="text-xs text-[#8ba1be]">%</span>
                    </div>
                    <input
                        type="range" min="0" max="100"
                        value={currentSettings.autoTakeProfit}
                        onChange={(e) => updateSettings({ ...currentSettings, autoTakeProfit: parseInt(e.target.value) })}
                        className="w-full h-1 bg-[#2d323b] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#22c55e]"
                    />
                </div>
            </div>

            {/* Advanced Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-[#8ba1be] mb-2">Concurrency Limit</label>
                    <select
                        value={currentSettings.maxOpenPositions}
                        onChange={(e) => updateSettings({ ...currentSettings, maxOpenPositions: parseInt(e.target.value) })}
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
                        onClick={() => updateSettings({ ...currentSettings, allowShorts: !currentSettings.allowShorts })}
                        className={`w-full px-4 py-2.5 rounded-lg border flex items-center justify-between transition-all ${currentSettings.allowShorts ? 'bg-[#2e7cf6]/10 border-[#2e7cf6] text-[#e4e6ea]' : 'bg-[#0e1115] border-[#2d323b] text-[#8ba1be] hover:border-[#8ba1be]'}`}
                    >
                        <span className="text-sm font-medium">Allow Shorting</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${currentSettings.allowShorts ? 'bg-[#2e7cf6]' : 'bg-[#2d323b]'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${currentSettings.allowShorts ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

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

                        <div className="relative z-10 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">

                            {/* --- HEADER --- */}
                            <motion.div variants={itemVariants} className="flex items-center gap-3 sm:gap-4 border-b border-[#2d323b] pb-4 md:pb-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#2e7cf6] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-semibold text-[#e4e6ea] tracking-tight">Paper Trading</h1>
                                    <p className="text-xs sm:text-sm text-[#8ba1be]">
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
                                <motion.div variants={itemVariants} className="max-w-2xl mx-auto space-y-6 md:space-y-8 py-2 md:py-4">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                        {/* Advanced Configuration Toggle */}
                                        <button
                                            onClick={() => setShowAdvancedCreate(!showAdvancedCreate)}
                                            className="flex items-center gap-2 text-sm text-[#2e7cf6] font-medium hover:text-[#4a9eff] transition-colors"
                                        >
                                            {showAdvancedCreate ? "Quick Setup" : "Configure Strategy Parameters"}
                                            <ChevronDown size={14} className={`transition-transform ${showAdvancedCreate ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Advanced Settings Form */}
                                        <AnimatePresence>
                                            {showAdvancedCreate && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-4 pb-2 space-y-6">
                                                        {/* Presets Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <button
                                                                onClick={() => setNewProfileSettings({ ...newProfileSettings, ...RISK_PRESETS.CONSERVATIVE })}
                                                                className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2d323b] bg-[#0e1115] hover:border-[#27aa80] hover:bg-[#27aa80]/10 transition-all group"
                                                            >
                                                                <div className="text-[#27aa80] mb-1"><Shield size={20} /></div>
                                                                <div className="text-xs font-semibold text-[#e4e6ea]">Low Risk</div>
                                                                <div className="text-[10px] text-[#8ba1be]">Safe & Steady</div>
                                                            </button>
                                                            <button
                                                                onClick={() => setNewProfileSettings({ ...newProfileSettings, ...RISK_PRESETS.BALANCED })}
                                                                className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2d323b] bg-[#0e1115] hover:border-[#2e7cf6] hover:bg-[#2e7cf6]/10 transition-all group"
                                                            >
                                                                <div className="text-[#2e7cf6] mb-1"><Target size={20} /></div>
                                                                <div className="text-xs font-semibold text-[#e4e6ea]">Normal</div>
                                                                <div className="text-[10px] text-[#8ba1be]">Balanced Growth</div>
                                                            </button>
                                                            <button
                                                                onClick={() => setNewProfileSettings({ ...newProfileSettings, ...RISK_PRESETS.DEGEN })}
                                                                className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2d323b] bg-[#0e1115] hover:border-[#ef4444] hover:bg-[#ef4444]/10 transition-all group"
                                                            >
                                                                <div className="text-[#ef4444] mb-1"><Zap size={20} /></div>
                                                                <div className="text-xs font-semibold text-[#e4e6ea]">Degen</div>
                                                                <div className="text-[10px] text-[#8ba1be]">High Risk/Reward</div>
                                                            </button>
                                                        </div>

                                                        {renderRiskSettings(newProfileSettings, setNewProfileSettings)}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex gap-4 border-t border-[#2d323b] pt-6">
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
                                            Initialize Portfolio
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- VIEW: SETTINGS (Edit Active) --- */}
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

                                    {/* Identity (Edit) */}
                                    <div className="space-y-6">
                                        <h2 className="text-sm font-semibold text-[#8ba1be] uppercase tracking-wider flex items-center gap-2">
                                            <Info size={14} />
                                            Active Account: <span className="text-[#e4e6ea]">{activeProfileId === activeProfileId ? walletName : 'Editing...'}</span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-medium text-[#8ba1be] mb-2">Wallet Alias</label>
                                                <input
                                                    type="text"
                                                    value={walletName}
                                                    onChange={(e) => setWalletName(e.target.value)}
                                                    className="w-full bg-[#0e1115] border border-[#2d323b] rounded-lg p-3 text-base text-[#e4e6ea] placeholder:text-[#2d323b] focus:outline-none focus:border-[#2e7cf6] transition-all font-medium"
                                                />
                                            </div>
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

                                    {/* Risk Management (Edit) - Reuse Config */}
                                    {renderRiskSettings(settings, setSettings)}

                                    {/* Warning */}
                                    <div className="p-4 rounded-lg bg-[#eab308]/10 border border-[#eab308]/20 flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-[#eab308] flex-shrink-0 mt-0.5" />
                                        <div className="text-xs text-[#eab308]/90 leading-relaxed">
                                            <strong className="font-semibold text-[#eab308]">System Reset Required:</strong> Saving changes will archive current performance data for this profile and re-initialize it.
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-6 border-t border-[#2d323b] space-y-4">
                                        <h3 className="text-sm font-semibold text-[#ef4444] uppercase tracking-wider">Danger Zone</h3>
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5">
                                            <div>
                                                <div className="text-[#e4e6ea] font-medium text-sm">Delete Portfolio</div>
                                                <div className="text-xs text-[#ef4444]/80">Permanently remove this profile and all its trade history.</div>
                                            </div>
                                            <button
                                                onClick={() => setView('delete_confirm')}
                                                className="px-4 py-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors text-xs font-bold border border-[#ef4444]/20 flex items-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex gap-4 pt-2">
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
                            ```
                            {/* --- VIEW: DELETE CONFIRMATION --- */}
                            {view === 'delete_confirm' && (
                                <motion.div
                                    variants={itemVariants}
                                    className="flex flex-col items-center justify-center text-center py-6 md:py-8 space-y-4 md:space-y-6"
                                >
                                    <div className="w-20 h-20 rounded-full bg-[#ef4444]/10 flex items-center justify-center border border-[#ef4444]/20 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]">
                                        <AlertTriangle size={40} className="text-[#ef4444]" />
                                    </div>

                                    <div className="space-y-2 max-w-md px-4 sm:px-0">
                                        <h2 className="text-xl sm:text-2xl font-bold text-[#e4e6ea]">Delete Portfolio?</h2>
                                        <p className="text-[#8ba1be] text-xs sm:text-sm leading-relaxed">
                                            Are you sure you want to delete <span className="text-[#e4e6ea] font-semibold">{walletName}</span>?
                                            This action is <span className="text-[#ef4444]">irreversible</span> and ensures all trading data associated with this portfolio will be wiped.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-sm pt-6 flex flex-col sm:flex-row gap-3 px-4 sm:px-0">
                                        <button
                                            onClick={() => setView('settings')}
                                            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm text-[#e4e6ea] bg-[#2d323b] hover:bg-[#3d444d] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                const success = paperStore.deleteProfile(activeProfileId);
                                                if (success) {
                                                    reloadData();
                                                    onUpdate();
                                                    setView('list');
                                                } else {
                                                    alert("Cannot delete the last remaining profile."); // Fallback for edge case
                                                    setView('settings');
                                                }
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg font-bold text-sm bg-[#ef4444] text-white hover:bg-[#dc2626] transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.6)]"
                                        >
                                            Confirm Deletion
                                        </button>
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
