"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, History, PieChart, Shield, Target, Zap } from "lucide-react";
import { paperStore, PaperProfile, PaperTradingSettings } from "@/lib/paper-trading";
import AccountManagerModal from "./AccountManagerModal";

export default function PaperTradingWidget() {
    const [profile, setProfile] = useState<PaperProfile | null>(null);
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const updateStats = () => {
        setProfile(paperStore.getProfile());
        setSettings(paperStore.getSettings());
    };

    useEffect(() => {
        updateStats();
        // Simple polling for now
        const interval = setInterval(updateStats, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!profile || !settings) return (
        <div className="bg-card border border-border rounded-2xl p-6 h-full flex items-center justify-center animate-pulse">
            <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
    );

    const stats = [
        {
            label: "Paper Balance",
            value: `$${profile.currentBalance.toFixed(2)}`,
            icon: Wallet,
            color: "text-foreground"
        },
        {
            label: "Total Equity",
            value: `$${(profile.currentBalance + profile.unrealizedPnL).toFixed(2)}`,
            icon: TrendingUp,
            color: profile.totalPnL >= 0 ? "text-green-500" : "text-red-500"
        },
        {
            label: "Win Rate",
            value: `${profile.winRate.toFixed(1)}%`,
            icon: PieChart,
            color: "text-primary"
        },
        {
            label: "Total PnL",
            value: `${profile.totalPnL >= 0 ? '+' : ''}$${profile.totalPnL.toFixed(2)}`,
            icon: History,
            color: profile.totalPnL >= 0 ? "text-green-500" : "text-amber-500"
        },
    ];

    return (
        <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col shadow-sm relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-lg tracking-tight">Paper Trading</h3>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active Simulation
                        </p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 border text-xs font-bold rounded-full uppercase tracking-wider ${settings.enabled
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                    }`}>
                    {settings.enabled ? 'Live' : 'Off'}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 relative">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-secondary/40 p-4 rounded-xl border border-white/5 hover:border-primary/20 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <stat.icon size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{stat.label}</span>
                        </div>
                        <div className={`font-mono font-bold text-xl ${stat.color}`}>
                            {stat.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Risk Settings Preview */}
            <div className="bg-secondary/20 border border-white/5 rounded-xl p-4 mb-6 relative">
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-yellow-500" />
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Active Risk Configuration</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase">Risk/Trade</span>
                        <span className="text-foreground font-mono font-bold mt-0.5">{settings.riskPerTrade}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase">Stop Loss</span>
                        <span className="text-red-400 font-mono font-bold mt-0.5">{settings.autoStopLoss || 'OFF'}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase">Take Profit</span>
                        <span className="text-green-400 font-mono font-bold mt-0.5">{settings.autoTakeProfit || 'OFF'}%</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto relative">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                >
                    <Target size={18} className="group-hover:scale-110 transition-transform" />
                    Adjust Configuration
                </button>
            </div>

            <AccountManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={updateStats}
            />
        </div>
    );
}
