"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, DollarSign, Activity, Shield, Zap, Search, Settings, Check, UserPlus, ArrowRight } from "lucide-react";
import { PnLChart } from "@/components/dashboard/copy-trading/PnLChart";
import { WinRateChart } from "@/components/dashboard/copy-trading/WinRateChart";
import { ActiveWallets } from "@/components/dashboard/copy-trading/ActiveWallets";
import { CopyStats } from "@/components/dashboard/copy-trading/CopyStats";
import { motion, AnimatePresence } from "framer-motion";

// Wallet Search Component
function WalletSearch() {
    const [address, setAddress] = useState('');
    const router = useRouter();

    const handleSearch = () => {
        if (address.trim()) {
            // Navigate to the trader detail page
            router.push(`/dashboard/copy-trading/${address.trim()}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="0x... wallet address"
                    className="pl-9 pr-4 py-2 bg-[#171717] border border-[#262626] group-focus-within:border-blue-500/50 rounded-lg focus:outline-none text-sm w-56 transition-all"
                />
            </div>
            <button
                onClick={handleSearch}
                disabled={!address.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="View Trader Profile"
            >
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}


export default function CopyTradingDashboard() {
    // Mode is now always Paper for this version
    const isPaperMode = true;

    // Settings Modal State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [activeProfileId, setActiveProfileId] = useState('default');

    // Stats State
    const [stats, setStats] = useState({
        totalPnl: 0,
        winRate: 0,
        copiedWallets: 0,
        totalVolume: 0,
    });

    // Mock data for charts
    const pnlData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 1000 + Math.random() * 5000 + (i * 100),
    }));

    const winRateData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 0.5 + Math.random() * 0.4,
    }));

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/copy-trading/stats?mode=paper`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch Copy Trading stats", error);
        }
    };

    const fetchProfiles = async () => {
        try {
            const res = await fetch('/api/paper/profiles');
            const data = await res.json();
            if (data.profiles) {
                setProfiles(Object.values(data.profiles));
                setActiveProfileId(data.activeProfileId);
            }
        } catch (error) {
            console.error("Failed to fetch profiles", error);
        }
    };

    const switchProfile = async (profileId: string) => {
        try {
            const res = await fetch('/api/paper/profiles/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId })
            });
            if (res.ok) {
                setActiveProfileId(profileId);
                // Refresh data
                fetchStats();
                // Close modal
                setShowSettingsModal(false);
            }
        } catch (error) {
            alert("Failed to switch profile");
        }
    };

    useEffect(() => {
        fetchStats();
        fetchProfiles();
    }, []);

    return (
        <div className="p-6 space-y-8 min-h-screen bg-[#0a0a0a] text-gray-100">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Copy Trading
                        </h1>
                        <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                            <Shield size={10} />
                            PAPER ONLY
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Simulate copy trading strategies risk-free. Real trading coming soon.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/copy-trading/leaderboard?mode=paper`}>
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
                    <WalletSearch />

                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 bg-[#171717] border border-[#262626] rounded-lg hover:bg-[#262626] hover:text-white text-gray-400 transition-colors relative"
                    >
                        <Settings className="w-4 h-4" />
                        {/* Dot indicator if active profile is not default maybe? */}
                    </button>
                </div>
            </div>

            {/* Mode Indicator Banner */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-center justify-between gap-3"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-400">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h3 className="text-indigo-200 text-sm font-bold">Paper Trading Active</h3>
                        <p className="text-indigo-300/60 text-xs">
                            Active Profile: <span className="text-white font-mono bg-indigo-500/20 px-1 rounded">{profiles.find(p => p.id === activeProfileId)?.name || 'Loading...'}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSettingsModal(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                >
                    Switch Account
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CopyStats
                    title="Simulated Net Profit"
                    value={`$${stats.totalPnl.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
                    trend="+12.5%"
                    trendUp={true}
                    description="Profit if consistent"
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
                            Simulated PnL Curve
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
                    <Link href={`/dashboard/copy-trading/leaderboard?mode=paper`}>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                            <Users size={14} /> Add New
                        </button>
                    </Link>
                </div>

                <div className="p-4">
                    <ActiveWallets isPaperMode={true} />
                </div>
            </div>

            {/* Settings / Profile Switcher Modal */}
            <AnimatePresence>
                {showSettingsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowSettingsModal(false);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#171717] border border-[#262626] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 border-b border-[#262626] flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-400" />
                                    Select Paper Account
                                </h3>
                                <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white">
                                    ✕
                                </button>
                            </div>

                            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                                <p className="text-sm text-gray-400 mb-4">
                                    Choose which paper trading profile to use for copy trading actions.
                                </p>

                                {profiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => switchProfile(profile.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${activeProfileId === profile.id
                                            ? 'bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/10 shadow-lg'
                                            : 'bg-[#262626] border-transparent hover:border-[#404040]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${activeProfileId === profile.id ? 'bg-indigo-500 text-white' : 'bg-[#333] text-gray-400'
                                                }`}>
                                                {profile.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={`font-medium ${activeProfileId === profile.id ? 'text-indigo-200' : 'text-gray-300'}`}>
                                                    {profile.name}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    ${profile.balance.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        {activeProfileId === profile.id && (
                                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg transform scale-110">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}

                                <button className="w-full py-3 border border-dashed border-[#333] hover:border-[#555] rounded-xl text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm">
                                    <UserPlus size={16} />
                                    Create New Profile
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
