"use client";

import { useState } from 'react';
import { Activity, BarChart3, Shield, Users } from 'lucide-react';
import { ActiveWallets } from '@/components/dashboard/copy-trading/ActiveWallets';
import WalletComparisonTool from '@/components/dashboard/copy-trading/WalletComparisonTool';
import RiskDashboard from '@/components/dashboard/copy-trading/RiskDashboard';
import CopyStats from '@/components/dashboard/copy-trading/CopyStats';

type TabType = 'active' | 'comparison' | 'risk' | 'stats';

export default function CopyTradingPage() {
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [isPaperMode, setIsPaperMode] = useState(true);

    // Mock user ID - replace with actual auth
    const userId = 1;

    // Mock wallets for comparison - these would come from active copied wallets
    const comparisonWallets = [
        '0x82a1b239e7e0ff25a2ac12a20b59fd6b5f90e03a',
        '0xb744f56635b537e859152d14b022af5afe485210',
        '0x5c9e9d9c5e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e'
    ];

    const tabs = [
        { id: 'active' as TabType, label: 'Active Wallets', icon: Users, badge: 3 },
        { id: 'comparison' as TabType, label: 'Compare', icon: BarChart3 },
        { id: 'risk' as TabType, label: 'Risk Dashboard', icon: Shield },
        { id: 'stats' as TabType, label: 'Performance', icon: Activity }
    ];

    return (
        <div className="min-h-screen bg-[#0A0B0F] p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Copy Trading</h1>
                        <p className="text-slate-400">
                            Advanced wallet tracking with smart scoring and risk management
                        </p>
                    </div>

                    {/* Paper Mode Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">Mode:</span>
                        <button
                            onClick={() => setIsPaperMode(!isPaperMode)}
                            className={`relative w-20 h-10 rounded-full transition-all ${isPaperMode ? 'bg-blue-500' : 'bg-green-500'
                                }`}
                        >
                            <div
                                className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg transition-transform ${isPaperMode ? 'left-1' : 'left-11'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-bold ${isPaperMode ? 'text-blue-400' : 'text-green-400'}`}>
                            {isPaperMode ? 'Paper' : 'Live'}
                        </span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-all relative ${isActive
                                        ? 'text-indigo-400 border-b-2 border-indigo-500'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {tab.badge !== undefined && (
                                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-fadeIn">
                {activeTab === 'active' && (
                    <div>
                        <ActiveWallets isPaperMode={isPaperMode} />
                    </div>
                )}

                {activeTab === 'comparison' && (
                    <div>
                        <WalletComparisonTool wallets={comparisonWallets} />
                    </div>
                )}

                {activeTab === 'risk' && (
                    <div>
                        <RiskDashboard userId={userId} />
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div>
                        <CopyStats mode={isPaperMode ? 'paper' : 'real'} />
                    </div>
                )}
            </div>
        </div>
    );
}
