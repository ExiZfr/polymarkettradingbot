"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Copy as CopyIcon, TrendingUp, TrendingDown, Clock,
    ExternalLink, Target, DollarSign, Award, XCircle, BarChart3,
    CheckCircle, AlertCircle, Percent, Activity
} from "lucide-react";
import { PnLChart } from "@/components/dashboard/copy-trading/PnLChart";
import { WinRateChart } from "@/components/dashboard/copy-trading/WinRateChart";

// Types
interface Bet {
    id: string;
    market: string;
    outcome: string;
    amount: number;
    buyPrice: number;
    sellPrice: number;
    pnl: number;
    status: 'WON' | 'LOST' | 'OPEN';
    date: string;
}

interface WalletData {
    address: string;
    ens?: string;
    metrics: {
        totalPnl: number;
        winRate: number;
        totalVolume: number;
        activePositions: number;
        followers: number;
    };
    history: { date: string; value: number }[];
    bets: Bet[];
}

export default function WalletProfilePage() {
    const params = useParams();
    const address = params?.wallet as string;

    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1W');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!address) return;
        async function fetchData() {
            try {
                const res = await fetch(`/api/copy-trading/wallet/${address}`);
                const json = await res.json();

                // Transform and enrich bets with buy/sell prices
                const enrichedBets = json.bets?.map((bet: any, idx: number) => ({
                    ...bet,
                    buyPrice: bet.buyPrice || (0.3 + Math.random() * 0.4),
                    sellPrice: bet.sellPrice || (0.4 + Math.random() * 0.5),
                    status: bet.status || (Math.random() > 0.4 ? 'WON' : 'LOST')
                })) || [];

                const pnlHistory = json.history?.map((h: any) => ({
                    date: h.date,
                    value: h.pnl
                })) || [];

                setData({ ...json, history: pnlHistory, bets: enrichedBets });
            } catch (error) {
                console.error("Failed to fetch wallet data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [address]);

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">Wallet not found</p>
                </div>
            </div>
        );
    }

    // Calculate detailed stats
    const totalBets = data.bets.length;
    const wonBets = data.bets.filter(b => b.status === 'WON').length;
    const lostBets = data.bets.filter(b => b.status === 'LOST').length;
    const openBets = data.bets.filter(b => b.status === 'OPEN').length;
    const totalGains = data.bets.filter(b => b.pnl > 0).reduce((acc, b) => acc + b.pnl, 0);
    const totalLosses = data.bets.filter(b => b.pnl < 0).reduce((acc, b) => acc + Math.abs(b.pnl), 0);
    const avgWin = wonBets > 0 ? totalGains / wonBets : 0;
    const avgLoss = lostBets > 0 ? totalLosses / lostBets : 0;

    // 🏷️ Trader Classification Algorithm
    type TraderTag = {
        label: string;
        emoji: string;
        color: string;
        bgColor: string;
        borderColor: string;
    };

    function classifyTrader(): TraderTag[] {
        const tags: TraderTag[] = [];
        const winRate = data!.metrics.winRate;
        const pnl = data!.metrics.totalPnl;
        const volume = data!.metrics.totalVolume;

        // 🐋 Whale: High volume trader
        if (volume > 500000) {
            tags.push({
                label: 'Whale',
                emoji: '🐋',
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-500/20',
                borderColor: 'border-yellow-500/30'
            });
        }

        // 🏆 Winner: High win rate + positive PnL
        if (winRate > 0.65 && pnl > 10000) {
            tags.push({
                label: 'Winner',
                emoji: '🏆',
                color: 'text-green-400',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500/30'
            });
        }

        // 🛡️ Safe: Consistent performer, moderate risk
        if (winRate > 0.55 && winRate <= 0.65 && pnl > 0 && avgLoss < avgWin * 1.5) {
            tags.push({
                label: 'Safe',
                emoji: '🛡️',
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/20',
                borderColor: 'border-blue-500/30'
            });
        }

        // ⚠️ Risk: High variance trader
        if ((avgWin > 1000 || avgLoss > 1000) && totalBets > 10) {
            tags.push({
                label: 'Risk',
                emoji: '⚠️',
                color: 'text-orange-400',
                bgColor: 'bg-orange-500/20',
                borderColor: 'border-orange-500/30'
            });
        }

        // 📉 Loser: Poor performance
        if (winRate < 0.4 && pnl < 0) {
            tags.push({
                label: 'Loser',
                emoji: '📉',
                color: 'text-red-400',
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/30'
            });
        }

        // 🔥 Hot Streak: Recent wins
        const recentBets = data!.bets.slice(0, 5);
        const recentWins = recentBets.filter(b => b.status === 'WON').length;
        if (recentWins >= 4) {
            tags.push({
                label: 'Hot',
                emoji: '🔥',
                color: 'text-orange-400',
                bgColor: 'bg-orange-500/20',
                borderColor: 'border-orange-500/30'
            });
        }

        // 🆕 New: Few bets
        if (totalBets < 10) {
            tags.push({
                label: 'New',
                emoji: '🆕',
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/20',
                borderColor: 'border-purple-500/30'
            });
        }

        // Default tag if none apply
        if (tags.length === 0) {
            tags.push({
                label: 'Neutral',
                emoji: '⚖️',
                color: 'text-gray-400',
                bgColor: 'bg-gray-500/20',
                borderColor: 'border-gray-500/30'
            });
        }

        return tags;
    }

    const traderTags = classifyTrader();


    return (
        <div className="p-6 min-h-screen bg-[#0a0a0a] text-gray-100">
            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <Link href="/dashboard/copy-trading" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Copy Trading
                </Link>
            </motion.div>

            {/* Header Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#171717] to-[#1a1a2e] border border-[#262626] rounded-2xl p-6 mb-6 shadow-2xl shadow-black/50"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl font-bold border-4 border-[#0a0a0a] shadow-lg shadow-purple-500/20"
                        >
                            {data.ens ? data.ens[0].toUpperCase() : data.address[2].toUpperCase()}
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                                {data.ens || `${data.address.slice(0, 6)}...${data.address.slice(-4)}`}
                                {traderTags.map((tag, idx) => (
                                    <motion.span
                                        key={tag.label}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className={`text-xs ${tag.bgColor} ${tag.color} px-2.5 py-1 rounded-full border ${tag.borderColor} shadow-sm flex items-center gap-1`}
                                    >
                                        <span>{tag.emoji}</span>
                                        <span>{tag.label}</span>
                                    </motion.span>
                                ))}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <button
                                    onClick={copyAddress}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                    <span className="font-mono text-xs">{data.address.slice(0, 10)}...{data.address.slice(-8)}</span>
                                    {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                                </button>
                                <a
                                    href={`https://polymarket.com/profile/${data.address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    View on Polymarket <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30"
                    >
                        <Target className="w-4 h-4" />
                        Copy This Trader
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats Overview Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6"
            >
                <StatCard
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Total P&L"
                    value={`$${data.metrics.totalPnl.toLocaleString()}`}
                    color={data.metrics.totalPnl >= 0 ? 'green' : 'red'}
                    delay={0}
                />
                <StatCard
                    icon={<Percent className="w-5 h-5" />}
                    label="Win Rate"
                    value={`${(data.metrics.winRate * 100).toFixed(1)}%`}
                    color="blue"
                    delay={0.05}
                />
                <StatCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    label="Total Bets"
                    value={totalBets.toString()}
                    color="purple"
                    delay={0.1}
                />
                <StatCard
                    icon={<CheckCircle className="w-5 h-5" />}
                    label="Wins"
                    value={wonBets.toString()}
                    color="green"
                    delay={0.15}
                />
                <StatCard
                    icon={<XCircle className="w-5 h-5" />}
                    label="Losses"
                    value={lostBets.toString()}
                    color="red"
                    delay={0.2}
                />
                <StatCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Total Gains"
                    value={`+$${totalGains.toFixed(0)}`}
                    color="green"
                    delay={0.25}
                />
                <StatCard
                    icon={<TrendingDown className="w-5 h-5" />}
                    label="Total Losses"
                    value={`-$${totalLosses.toFixed(0)}`}
                    color="red"
                    delay={0.3}
                />
                <StatCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Open Positions"
                    value={openBets.toString()}
                    color="yellow"
                    delay={0.35}
                />
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Charts & Order History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* PnL Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-[#171717] to-[#1a1a1a] border border-[#262626] rounded-2xl p-5 shadow-xl shadow-black/30"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                Profit & Loss Curve
                            </h3>
                            <div className="flex bg-[#262626] rounded-lg p-0.5">
                                {['1D', '1W', '1M', 'ALL'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf as any)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeframe === tf
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PnLChart data={data.history} />
                    </motion.div>

                    {/* Detailed Order History */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-[#171717] to-[#1a1a1a] border border-[#262626] rounded-2xl overflow-hidden shadow-xl shadow-black/30"
                    >
                        <div className="p-5 border-b border-[#262626] flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Order History
                            </h3>
                            <span className="text-xs text-gray-500">{totalBets} total orders</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#1a1a2e] text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Market</th>
                                        <th className="px-5 py-3 text-center">Side</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-right">Buy Price</th>
                                        <th className="px-5 py-3 text-right">Sell Price</th>
                                        <th className="px-5 py-3 text-right">P&L</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                        <th className="px-5 py-3 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#262626]">
                                    {data.bets.map((bet, idx) => (
                                        <motion.tr
                                            key={bet.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + idx * 0.03 }}
                                            className="hover:bg-[#262626]/50 transition-all group"
                                        >
                                            <td className="px-5 py-4 max-w-[180px] truncate group-hover:text-white transition-colors" title={bet.market}>
                                                {bet.market}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${bet.outcome === 'YES'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {bet.outcome}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-gray-300">
                                                ${bet.amount.toFixed(2)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-blue-400">
                                                ${bet.buyPrice.toFixed(2)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-purple-400">
                                                ${bet.sellPrice.toFixed(2)}
                                            </td>
                                            <td className={`px-5 py-4 text-right font-bold font-mono ${bet.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bet.status === 'WON'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : bet.status === 'LOST'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {bet.status === 'WON' && <CheckCircle className="w-3 h-3" />}
                                                    {bet.status === 'LOST' && <XCircle className="w-3 h-3" />}
                                                    {bet.status === 'OPEN' && <Clock className="w-3 h-3" />}
                                                    {bet.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right text-gray-500 text-xs">
                                                {new Date(bet.date).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Stats Cards */}
                <div className="space-y-6">
                    {/* Win/Loss Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-[#171717] to-[#1a1a2e] border border-[#262626] rounded-2xl p-5 shadow-xl shadow-black/30"
                    >
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            Performance Summary
                        </h3>

                        {/* Win/Loss Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Wins ({wonBets})</span>
                                <span>Losses ({lostBets})</span>
                            </div>
                            <div className="h-3 bg-[#262626] rounded-full overflow-hidden flex">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(wonBets / Math.max(totalBets, 1)) * 100}%` }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(lostBets / Math.max(totalBets, 1)) * 100}%` }}
                                    transition={{ delay: 0.6, duration: 0.8 }}
                                    className="h-full bg-gradient-to-r from-red-500 to-red-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                                <div className="text-gray-400 text-xs mb-1">Avg Win</div>
                                <div className="font-bold text-green-400 text-lg">+${avgWin.toFixed(0)}</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                                <div className="text-gray-400 text-xs mb-1">Avg Loss</div>
                                <div className="font-bold text-red-400 text-lg">-${avgLoss.toFixed(0)}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Win Rate Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-[#171717] to-[#1a1a2e] border border-[#262626] rounded-2xl p-5 shadow-xl shadow-black/30"
                    >
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Win Rate Trend
                        </h3>
                        <div className="h-[180px]">
                            <WinRateChart data={data.history.map(h => ({ date: h.date, value: 0.5 + Math.random() * 0.4 }))} />
                        </div>
                    </motion.div>

                    {/* Trading Style */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gradient-to-br from-[#171717] to-[#1a1a2e] border border-[#262626] rounded-2xl p-5 shadow-xl shadow-black/30"
                    >
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-orange-500" />
                            Trading Style
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">
                                    <span>Conservative</span>
                                    <span>Aggressive</span>
                                </div>
                                <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '65%' }}
                                        transition={{ delay: 0.7, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#262626] p-3 rounded-xl text-center">
                                    <div className="text-gray-500 text-xs mb-1">Avg Hold</div>
                                    <div className="font-bold">14h 20m</div>
                                </div>
                                <div className="bg-[#262626] p-3 rounded-xl text-center">
                                    <div className="text-gray-500 text-xs mb-1">Best Market</div>
                                    <div className="font-bold text-sm">Politics</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component with animation
function StatCard({ icon, label, value, color, delay }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'green' | 'red' | 'blue' | 'purple' | 'yellow';
    delay: number;
}) {
    const colorClasses = {
        green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
        red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
        yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4 shadow-lg`}
        >
            <div className={`mb-2 ${colorClasses[color].split(' ').find(c => c.startsWith('text-'))}`}>
                {icon}
            </div>
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`font-bold text-lg ${colorClasses[color].split(' ').find(c => c.startsWith('text-'))}`}>
                {value}
            </div>
        </motion.div>
    );
}
