"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Plus, Search, TrendingUp, TrendingDown, Users, DollarSign, Activity } from "lucide-react";
import { PnLChart } from "@/components/dashboard/copy-trading/PnLChart";
import { WinRateChart } from "@/components/dashboard/copy-trading/WinRateChart";

export default function CopyTradingDashboard() {
    const [stats, setStats] = useState({
        totalPnl: 12450.50,
        winRate: 0.68,
        copiedWallets: 3,
        totalVolume: 45000,
    });

    const [activeWallets, setActiveWallets] = useState([
        { id: '1', address: '0x1234...5678', name: 'Whale 1', pnl: 4500, status: 'Active' },
        { id: '2', address: '0x8765...4321', name: 'Alpha Sniper', pnl: 2100, status: 'Active' },
        { id: '3', address: '0xabcd...ef01', name: 'Degen King', pnl: -150, status: 'Paused' },
    ]);

    // Mock data for charts
    const pnlData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 1000 + Math.random() * 5000 + (i * 100),
    }));

    const winRateData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 0.5 + Math.random() * 0.4,
    }));

    return (
        <div className="p-6 space-y-8 min-h-screen bg-[#0a0a0a] text-gray-100">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Copy Trading
                    </h1>
                    <p className="text-gray-500 mt-1">Automate your wins by copying the best.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/copy-trading/leaderboard">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#262626] hover:bg-[#333] border border-[#404040] rounded-lg transition-colors">
                            <Users className="w-4 h-4" />
                            <span>Leaderboard</span>
                        </button>
                    </Link>
                    {/* Search/Profile Lookup */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search wallet..."
                            className="pl-9 pr-4 py-2 bg-[#262626] border border-[#404040] rounded-lg focus:outline-none focus:border-blue-500 text-sm w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Net Profit"
                    value={`$${stats.totalPnl.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5 text-green-500" />}
                    trend="+12.5%"
                    trendUp={true}
                />
                <StatsCard
                    title="Avg Win Rate"
                    value={`${(stats.winRate * 100).toFixed(1)}%`}
                    icon={<Target className="w-5 h-5 text-blue-500" />}
                    trend="+2.1%"
                    trendUp={true}
                />
                <StatsCard
                    title="Active Wallets"
                    value={stats.copiedWallets}
                    icon={<Users className="w-5 h-5 text-purple-500" />}
                    subtext="3/5 Slots Used"
                />
                <StatsCard
                    title="Total Volume"
                    value={`$${stats.totalVolume.toLocaleString()}`}
                    icon={<Activity className="w-5 h-5 text-orange-500" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg">PnL Performance</h3>
                        <div className="flex gap-2">
                            <button className="text-xs px-2 py-1 bg-[#262626] rounded hover:bg-[#333]">1W</button>
                            <button className="text-xs px-2 py-1 bg-[#333] text-white rounded">1M</button>
                            <button className="text-xs px-2 py-1 bg-[#262626] rounded hover:bg-[#333]">All</button>
                        </div>
                    </div>
                    <PnLChart data={pnlData} />
                </div>

                <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg">Win Rate Trend</h3>
                    </div>
                    <WinRateChart data={winRateData} />
                </div>
            </div>

            {/* Active Wallets List */}
            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#262626] flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Active Copied Wallets</h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300">Manage All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#262626] text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Wallet</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Total PnL</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262626]">
                            {activeWallets.map((wallet) => (
                                <tr key={wallet.id} className="hover:bg-[#262626]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                                                {wallet.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{wallet.name}</div>
                                                <div className="text-xs text-gray-500">{wallet.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${wallet.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {wallet.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-medium ${wallet.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {wallet.pnl >= 0 ? '+' : ''}${wallet.pnl}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/copy-trading/${wallet.address}`}>
                                            <button className="text-gray-400 hover:text-white transition-colors">
                                                View Profile
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, trend, trendUp, subtext }: any) {
    return (
        <div className="bg-[#171717] border border-[#262626] p-5 rounded-xl hover:border-[#404040] transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-medium">{title}</span>
                <div className="p-2 bg-[#262626] rounded-lg group-hover:bg-[#333] transition-colors">
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    )
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
