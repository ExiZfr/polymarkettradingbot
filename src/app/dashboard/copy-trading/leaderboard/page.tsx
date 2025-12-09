"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy as CopyIcon, TrendingUp, TrendingDown, AlertCircle, Shield, Zap } from "lucide-react";

interface Trader {
    rank: number;
    address: string;
    ens?: string;
    pnl: number;
    winRate: number;
    volume: number;
    trades: number;
}

export default function LeaderboardPage() {
    const [topTraders, setTopTraders] = useState<Trader[]>([]);
    const [worstTraders, setWorstTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'top' | 'worst'>('top');

    // Modal state
    const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/copy-trading/leaderboard');
                const data = await res.json();
                setTopTraders(data.top || []);
                setWorstTraders(data.worst || []);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleCopy = (trader: Trader) => {
        setSelectedTrader(trader);
        setShowModal(true);
    };

    const confirmCopy = async () => {
        // Call API to save settings
        // Mock success
        alert(`Started copying ${selectedTrader?.ens || selectedTrader?.address}`);
        setShowModal(false);
    };

    const displayedTraders = activeTab === 'top' ? topTraders : worstTraders;

    return (
        <div className="p-6 min-h-screen bg-[#0a0a0a] text-gray-100">
            <Link href="/dashboard/copy-trading" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Trader Leaderboard</h1>
                    <p className="text-gray-500">Discover the best (and worst) performers on Polymarket.</p>
                </div>

                {/* Tabs */}
                <div className="bg-[#171717] p-1 rounded-lg flex items-center mt-4 md:mt-0">
                    <button
                        onClick={() => setActiveTab('top')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'top' ? 'bg-[#262626] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Top Traders
                    </button>
                    <button
                        onClick={() => setActiveTab('worst')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'worst' ? 'bg-[#262626] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Worst Traders
                    </button>
                </div>
            </div>

            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading leaderboard...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#262626] text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Trader</th>
                                    <th className="px-6 py-4 text-right">Total PnL</th>
                                    <th className="px-6 py-4 text-right">Win Rate</th>
                                    <th className="px-6 py-4 text-right">Total Volume</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#262626]">
                                {displayedTraders.map((trader, idx) => (
                                    <tr key={idx} className="hover:bg-[#262626]/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-400">
                                            #{trader.rank}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/copy-trading/${trader.address}`} className="group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs">
                                                        {(trader.ens || trader.address)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm group-hover:text-blue-400 transition-colors">
                                                            {trader.ens || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {trader.trades} bets placed
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${trader.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${trader.winRate * 100}%` }}></div>
                                                </div>
                                                <span className="text-xs">{(trader.winRate * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-400">
                                            ${(trader.volume / 1000).toFixed(1)}k
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopy(trader)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                                            >
                                                <Zap className="w-3 h-3" />
                                                Copy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Copy Settings Modal */}
            {showModal && selectedTrader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#171717] border border-[#262626] rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Copy Trader</h3>
                                <p className="text-gray-400 text-sm">Configure settings for {selectedTrader.ens || selectedTrader.address.slice(0, 8)}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Copy Mode</label>
                                <select className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                    <option>Fixed Amount per Bet</option>
                                    <option>Percentage of Balance</option>
                                    <option>Mirror Size (Risky)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
                                    <input type="number" defaultValue="10" className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Bet ($)</label>
                                    <input type="number" defaultValue="50" className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                                <p className="text-xs text-yellow-200">
                                    Copy trading carries risk. Past performance is not indicative of future results. Ensure you set a stop loss.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333] rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCopy}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
                            >
                                Start Copying
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
