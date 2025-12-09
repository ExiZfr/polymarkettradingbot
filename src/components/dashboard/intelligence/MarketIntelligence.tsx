"use client";

import { useState } from 'react';
import { useMarketIntelligence } from '@/lib/market-intelligence-context';
import { TrendingUp, Activity, Bell, Zap } from 'lucide-react';
import AlertsPanel from './AlertsPanel';
import IntelligencePanel from './IntelligencePanel';
import NotificationsFeed from './NotificationsFeed';

type TabType = 'alerts' | 'intelligence' | 'notifications';

export default function MarketIntelligence({ userId }: { userId: number }) {
    const { stats, isLoading } = useMarketIntelligence();
    const [activeTab, setActiveTab] = useState<TabType>('alerts');

    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header with Stats */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30">
                        <Activity className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Market Intelligence</h1>
                        <p className="text-slate-400 text-sm">Smart alerts & passive analysis</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Alerts', value: stats.activeAlerts, icon: Bell, color: 'indigo' },
                        { label: 'Markets Tracked', value: stats.marketsTracked, icon: TrendingUp, color: 'emerald' },
                        { label: 'Signals Today', value: stats.signalsToday, icon: Zap, color: 'orange' },
                        { label: 'Alerts Triggered', value: stats.alertsTriggeredToday, icon: Activity, color: 'pink' },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="p-4 bg-[#0C0D12] border border-white/10 rounded-2xl hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                        {stat.label}
                                    </span>
                                    <div className={`p-1.5 bg-${stat.color}-500/20 rounded-lg`}>
                                        <Icon size={14} className={`text-${stat.color}-400`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 p-1 bg-[#0C0D12] border border-white/10 rounded-2xl w-fit">
                {[
                    { id: 'alerts', label: '🎯 Alerts', Icon: Bell },
                    { id: 'intelligence', label: '📊 Intelligence', Icon: TrendingUp },
                    { id: 'notifications', label: '🔔 Notifications', Icon: Activity },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-[#0A0B0F] border border-white/10 rounded-3xl p-6">
                {activeTab === 'alerts' && <AlertsPanel userId={userId} />}
                {activeTab === 'intelligence' && <IntelligencePanel />}
                {activeTab === 'notifications' && <NotificationsFeed userId={userId} />}
            </div>
        </div>
    );
}
