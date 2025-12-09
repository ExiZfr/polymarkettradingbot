"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, DollarSign, Activity, Shield, Zap, Search, Settings } from "lucide-react";
import { PnLChart } from "@/components/dashboard/copy-trading/PnLChart";
import { WinRateChart } from "@/components/dashboard/copy-trading/WinRateChart";
import { ActiveWallets } from "@/components/dashboard/copy-trading/ActiveWallets";
import { CopyStats } from "@/components/dashboard/copy-trading/CopyStats";
import { motion } from "framer-motion";

export default function CopyTradingDashboard() {
    const [isPaperMode, setIsPaperMode] = useState(false);

    // Stats State
    const [stats, setStats] = useState({
        totalPnl: 0,
        winRate: 0,
        copiedWallets: 0,
        totalVolume: 0,
    });

    // Mock data for charts (would be dynamic based on mode in production)
    const pnlData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 1000 + Math.random() * 5000 + (i * 100),
    }));

    const winRateData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 0.5 + Math.random() * 0.4,
    }));

    // Effect to switch context/fetch data when mode changes
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const mode = isPaperMode ? 'paper' : 'real';
                const res = await fetch(`/api/copy-trading/stats?mode=${mode}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch Copy Trading stats", error);
            }
        };

        fetchStats();
    }, [isPaperMode]);

    return (
        <div className="p-6 space-y-8 min-h-screen bg-[#0a0a0a] text-gray-100">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Copy Trading
                        </h1>
                        <div className="flex bg-[#171717] p-1 rounded-lg border border-[#262626]">
                            <button
                                onClick={() => setIsPaperMode(false)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isPaperMode ? 'bg-[#262626] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                REAL
                            </button>
                            <button
                                onClick={() => setIsPaperMode(true)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${isPaperMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Shield size={10} />
                                PAPER
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">
                        {isPaperMode
                            ? "Simulate copy trading strategies without risk."
                            : "Automate your wins by copying the best traders on Polymarket."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/copy-trading/leaderboard?mode=${isPaperMode ? 'paper' : 'real'}`}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all font-medium"
                        >
                            <Users className="w-4 h-4" />
                            <span>Explorer & Leaderboard</span>
                        </motion.button>
                    </Link>

                    {/* Search Component */}
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find wallet..."
                            className="pl-9 pr-4 py-2 bg-[#171717] border border-[#262626] group-focus-within:border-blue-500/50 rounded-lg focus:outline-none text-sm w-48 transition-all"
                        />
                    </div>

                    <button className="p-2 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#262626] hover:text-white text-gray-400 transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mode Indicator Banner (if Paper) */}
            {isPaperMode && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-center gap-3"
                >
                    <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-400">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h3 className="text-indigo-200 text-sm font-bold">Paper Trading Active</h3>
                        <p className="text-indigo-300/60 text-xs">All copy actions performed in this mode will be simulated using your paper balance.</p>
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CopyStats
                    title={isPaperMode ? "Simulated Net Profit" : "Total Net Profit"}
                    value={`$${stats.totalPnl.toLocaleString()}`}
                    icon={<DollarSign className={`w-5 h-5 ${isPaperMode ? 'text-indigo-400' : 'text-green-500'}`} />}
                    trend="+12.5%"
                    trendUp={true}
                    description={isPaperMode ? "Profit if consistent" : undefined}
                />
                <CopyStats
                    title="Avg Win Rate"
                    value={`${(stats.winRate * 100).toFixed(1)}%`}
                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                    trend="+2.1%"
                    trendUp={true}
                />
                <CopyStats
                    title="Active Copies"
                    value={stats.copiedWallets}
                    icon={<Users className="w-5 h-5 text-purple-500" />}
                    subtext="Targeting 5"
                />
                <CopyStats
                    title="Total Volume"
                    value={`$${stats.totalVolume.toLocaleString()}`}
                    icon={<Activity className="w-5 h-5 text-blue-500" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-gray-200">
                            {isPaperMode ? "Simulated PnL Curve" : "PnL Performance"}
                        </h3>
                        <div className="flex gap-2">
                            {['1W', '1M', 'All'].map((period) => (
                                <button key={period} className="text-xs px-2 py-1 bg-[#262626] hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <PnLChart data={pnlData} />
                </div>

                <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-gray-200">Win Rate Consistency</h3>
                    </div>
                    <WinRateChart data={winRateData} />
                </div>
            </div>

            {/* Active Wallets List */}
            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-gray-200">Managed Wallets</h3>
                        <span className="px-2 py-0.5 rounded-full bg-[#262626] text-xs text-gray-400 border border-[#333]">
                            {stats.copiedWallets} Active
                        </span>
                    </div>
                    <Link href={`/dashboard/copy-trading/leaderboard?mode=${isPaperMode ? 'paper' : 'real'}`}>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                            <Users size={14} /> Add New
                        </button>
                    </Link>
                </div>

                <div className="p-4">
                    <ActiveWallets isPaperMode={isPaperMode} />
                </div>
            </div>
        </div>
    );
}

function Target(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}
