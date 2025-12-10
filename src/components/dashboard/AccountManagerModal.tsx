"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Target, TrendingDown, TrendingUp, AlertTriangle, Save } from "lucide-react";
import { paperStore, PaperTradingSettings } from "@/lib/paper-trading";

type AccountManagerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
};

export default function AccountManagerModal({ isOpen, onClose, onUpdate }: AccountManagerModalProps) {
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSettings(paperStore.getSettings());
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!settings) return;

        if (confirm("This will reset your paper trading account with these new settings. Current history will be cleared. Continue?")) {
            paperStore.saveSettings(settings); // Verify saving settings first
            paperStore.resetProfile(settings.initialBalance); // Then reset profile with new balance
            onUpdate();
            onClose();
        }
    };

    if (!settings) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <Target className="text-primary" size={24} />
                                    Configure Paper Account
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-500">
                                    <AlertTriangle className="shrink-0" size={20} />
                                    <p className="text-sm">
                                        Saving these settings will <strong>reset your account balance</strong> and clear all trade history.
                                    </p>
                                </div>

                                {/* Initial Balance */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        <DollarSign className="inline-block mr-1" size={14} />
                                        Initial Balance
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.initialBalance}
                                        onChange={(e) => setSettings({ ...settings, initialBalance: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                {/* Risk Per Trade */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Risk Per Trade (% of Balance)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="25"
                                            value={settings.riskPerTrade}
                                            onChange={(e) => setSettings({ ...settings, riskPerTrade: parseInt(e.target.value) })}
                                            className="flex-1 accent-primary"
                                        />
                                        <span className="text-foreground font-mono w-12 text-right">{settings.riskPerTrade}%</span>
                                    </div>
                                </div>

                                {/* Auto Stop Loss */}
                                <div>
                                    <label className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <TrendingDown className="text-red-500" size={14} />
                                            Auto Stop Loss
                                        </span>
                                        <span className="text-xs text-muted-foreground">(0 = disabled)</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={settings.autoStopLoss}
                                            onChange={(e) => setSettings({ ...settings, autoStopLoss: parseInt(e.target.value) })}
                                            className="flex-1 accent-red-500"
                                        />
                                        <span className="text-red-500 font-mono w-12 text-right">
                                            {settings.autoStopLoss > 0 ? `-${settings.autoStopLoss}%` : 'OFF'}
                                        </span>
                                    </div>
                                </div>

                                {/* Auto Take Profit */}
                                <div>
                                    <label className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="text-green-500" size={14} />
                                            Auto Take Profit
                                        </span>
                                        <span className="text-xs text-muted-foreground">(0 = disabled)</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={settings.autoTakeProfit}
                                            onChange={(e) => setSettings({ ...settings, autoTakeProfit: parseInt(e.target.value) })}
                                            className="flex-1 accent-green-500"
                                        />
                                        <span className="text-green-500 font-mono w-12 text-right">
                                            {settings.autoTakeProfit > 0 ? `+${settings.autoTakeProfit}%` : 'OFF'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-border bg-secondary/50 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Reset & Start
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
