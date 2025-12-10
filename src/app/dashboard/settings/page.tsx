"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Settings as SettingsIcon,
    Wallet,
    Shield,
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
    Lock
} from "lucide-react";
import { paperStore, PaperTradingSettings, PaperProfile } from "@/lib/paper-trading";

export default function SettingsPage() {
    const [settings, setSettings] = useState<PaperTradingSettings | null>(null);
    const [profile, setProfile] = useState<PaperProfile | null>(null);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'account'>('account');
    const [realTradingMode, setRealTradingMode] = useState(false);

    useEffect(() => {
        setSettings(paperStore.getSettings());
        setProfile(paperStore.getProfile());
    }, []);

    const handleSettingsChange = (key: keyof PaperTradingSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        setSaved(false);
    };

    const saveAllSettings = async () => {
        if (settings) {
            paperStore.saveSettings(settings);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (!settings || !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <SettingsIcon className="text-primary" />
                        Settings
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Configure your account and preferences</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-secondary p-1 rounded-xl w-fit flex-wrap">
                {[
                    { id: 'account', label: 'Account', icon: Shield }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>



            {/* Account Settings */}
            {activeTab === 'account' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trading Mode Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Lock className="text-amber-500" size={20} />
                                Trading Mode
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-sm text-amber-500 font-medium mb-2">⚠️ Real Trading Mode</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Real trading mode will be implemented at the end of development. For now, all trading is simulated with paper money.
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-secondary rounded-xl border border-secondary opacity-50 cursor-not-allowed">
                                <div>
                                    <div className="text-sm font-medium text-foreground">Enable Real Trading</div>
                                    <div className="text-xs text-muted-foreground mt-1">Use real funds (Coming soon)</div>
                                </div>
                                <button
                                    disabled
                                    className="p-2 rounded-lg transition-colors bg-muted text-muted-foreground cursor-not-allowed"
                                >
                                    <ToggleLeft size={28} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <div>
                                    <div className="text-sm font-medium text-foreground">Paper Trading Mode</div>
                                    <div className="text-xs text-green-500 mt-1">Currently active</div>
                                </div>
                                <button
                                    className="p-2 rounded-lg transition-colors bg-green-500/20 text-green-500"
                                >
                                    <ToggleRight size={28} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* User Info Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Shield className="text-primary" size={20} />
                            Account Information
                        </h3>

                        <div className="space-y-3">
                            <div className="p-3 bg-secondary rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Profile Name</div>
                                <div className="text-sm text-foreground font-medium">{profile.username}</div>
                            </div>
                            <div className="p-3 bg-secondary rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Account Created</div>
                                <div className="text-sm text-foreground font-medium">
                                    {new Date(profile.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="p-3 bg-secondary rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Last Trade</div>
                                <div className="text-sm text-foreground font-medium">
                                    {profile.lastTradeAt ? new Date(profile.lastTradeAt).toLocaleDateString() : 'Never'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
