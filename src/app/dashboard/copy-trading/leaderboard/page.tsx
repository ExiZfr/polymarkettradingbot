"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp,
    Shield, Zap, ExternalLink, DollarSign, Percent, BarChart3,
    Target, Clock, Award, AlertTriangle, Activity, CheckCircle, XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Trader {
    rank: number;
    address: string;
    username: string;
    pnl: number;
    volume: number;
    tradesCount: number;
    winRate: number;
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    avgHoldDuration: number;
    farmScore: number;
    isSuspectedFarm: boolean;
    recentBets?: { market: string; outcome: string; pnl: number }[];
}

function LeaderboardContent() {
    const router = useRouter();
    const [topTraders, setTopTraders] = useState<Trader[]>([]);
    const [worstTraders, setWorstTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'top' | 'worst'>('top');
    const [expandedTrader, setExpandedTrader] = useState<string | null>(null);
    const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

    // Copy Modal State
    const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyAmount, setCopyAmount] = useState(10);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/leaderboard?period=${period}`);
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
    }, [period]);

    const traders = activeTab === 'top' ? topTraders : worstTraders;

    const toggleExpand = (address: string) => {
        setExpandedTrader(expandedTrader === address ? null : address);
    };

    const startCopy = (trader: Trader, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTrader(trader);
        setShowCopyModal(true);
    };

    const confirmCopy = async () => {
        if (!selectedTrader) return;

        try {
            const res = await fetch('/api/paper/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: selectedTrader.address,
                    label: selectedTrader.username || selectedTrader.address.slice(0, 8),
                    copyMode: 'fixed',
                    fixedAmount: copyAmount,
                    enabled: true
                })
            });

            if (res.ok) {
                alert(`✅ Started copying ${selectedTrader.username}!`);
                setShowCopyModal(false);
                router.push('/dashboard/copy-trading');
            }
        } catch (err) {
            alert('Failed to start copy trading');
        }
    };

    const viewProfile = (address: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/dashboard/copy-trading/${address}`);
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-[#0a0a0a] text-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link href="/dashboard/copy-trading" className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Copy Trading
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Real Polymarket Leaderboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Live data from top Polymarket traders</p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2 bg-[#171717] rounded-lg p-1">
                    {(['24h', '7d', '30d'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === p
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => { setActiveTab('top'); setExpandedTrader(null); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'top'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-[#171717] text-gray-400 border border-[#262626] hover:border-gray-600'
                        }`}
                >
                    <TrendingUp className="w-5 h-5" />
                    Top 25 Traders
                </button>
                <button
                    onClick={() => { setActiveTab('worst'); setExpandedTrader(null); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'worst'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-[#171717] text-gray-400 border border-[#262626] hover:border-gray-600'
                        }`}
                >
                    <TrendingDown className="w-5 h-5" />
                    Worst 25 Traders
                </button>
            </div>

            {/* Trader List */}
            <div className="space-y-3">
                {traders.map((trader, idx) => (
                    <motion.div
                        key={trader.address}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-gradient-to-r from-[#171717] to-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                    >
                        {/* Main Row - Clickable */}
                        <div
                            onClick={() => toggleExpand(trader.address)}
                            className="p-4 cursor-pointer hover:bg-[#262626]/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Rank Badge */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${activeTab === 'top'
                                            ? trader.rank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#262626] text-gray-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        #{trader.rank}
                                    </div>

                                    {/* Avatar & Name */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl font-bold">
                                            {trader.username?.[0]?.toUpperCase() || trader.address[2].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white flex items-center gap-2">
                                                {trader.username || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                                                {trader.isSuspectedFarm && (
                                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                                        ⚠️ Farm
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 font-mono">
                                                {trader.address.slice(0, 10)}...{trader.address.slice(-6)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">P&L</div>
                                        <div className={`font-bold text-lg ${trader.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Win Rate</div>
                                        <div className="font-bold text-blue-400">
                                            {(trader.winRate * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Volume</div>
                                        <div className="font-bold text-purple-400">
                                            ${(trader.volume / 1000).toFixed(0)}K
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Trades</div>
                                        <div className="font-bold text-gray-300">
                                            {trader.tradesCount}
                                        </div>
                                    </div>

                                    {/* Expand Icon */}
                                    <motion.div
                                        animate={{ rotate: expandedTrader === trader.address ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                            {expandedTrader === trader.address && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-[#262626] bg-[#0f0f0f]"
                                >
                                    <div className="p-5">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-5">
                                            <StatMini icon={<DollarSign className="w-4 h-4" />} label="P&L" value={`$${trader.pnl.toLocaleString()}`} color={trader.pnl >= 0 ? 'green' : 'red'} />
                                            <StatMini icon={<Percent className="w-4 h-4" />} label="Win Rate" value={`${(trader.winRate * 100).toFixed(1)}%`} color="blue" />
                                            <StatMini icon={<BarChart3 className="w-4 h-4" />} label="ROI" value={`${trader.roi.toFixed(1)}%`} color={trader.roi >= 0 ? 'green' : 'red'} />
                                            <StatMini icon={<Activity className="w-4 h-4" />} label="Volume" value={`$${(trader.volume / 1000).toFixed(0)}K`} color="purple" />
                                            <StatMini icon={<Target className="w-4 h-4" />} label="Trades" value={trader.tradesCount.toString()} color="blue" />
                                            <StatMini icon={<TrendingDown className="w-4 h-4" />} label="Max DD" value={`${trader.maxDrawdown.toFixed(1)}%`} color="orange" />
                                            <StatMini icon={<Award className="w-4 h-4" />} label="Sharpe" value={trader.sharpeRatio.toFixed(2)} color="yellow" />
                                            <StatMini icon={<Clock className="w-4 h-4" />} label="Avg Hold" value={`${trader.avgHoldDuration.toFixed(0)}h`} color="gray" />
                                        </div>

                                        {/* Recent Bets */}
                                        {trader.recentBets && trader.recentBets.length > 0 && (
                                            <div className="mb-5">
                                                <h4 className="text-sm font-bold text-gray-400 mb-2">Recent Bets</h4>
                                                <div className="space-y-2">
                                                    {trader.recentBets.slice(0, 3).map((bet, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-[#171717] p-3 rounded-lg">
                                                            <span className="text-sm text-gray-300 truncate max-w-[300px]">{bet.market}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${bet.outcome === 'YES' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {bet.outcome}
                                                                </span>
                                                                <span className={`font-bold ${bet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {bet.pnl >= 0 ? '+' : ''}${bet.pnl.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={(e) => viewProfile(trader.address, e)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#262626] hover:bg-[#333] text-white rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View Full Profile
                                            </button>
                                            <button
                                                onClick={(e) => startCopy(trader, e)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
                                            >
                                                <Zap className="w-4 h-4" />
                                                Start Copy Trading
                                            </button>
                                            <a
                                                href={`https://polymarket.com/profile/${trader.address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-4 py-2.5 bg-[#262626] hover:bg-[#333] text-gray-400 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Copy Modal */}
            <AnimatePresence>
                {showCopyModal && selectedTrader && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCopyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#171717] border border-[#262626] rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-500" />
                                Copy {selectedTrader.username || selectedTrader.address.slice(0, 8)}
                            </h2>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-2">Copy Amount (USD per trade)</label>
                                <input
                                    type="number"
                                    value={copyAmount}
                                    onChange={(e) => setCopyAmount(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-[#262626] border border-[#333] rounded-lg focus:outline-none focus:border-blue-500"
                                    placeholder="10"
                                />
                            </div>

                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4">
                                <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                    <Shield className="w-4 h-4" />
                                    Paper Trading Mode - No real funds at risk
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCopyModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-[#262626] text-gray-400 rounded-lg hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCopy}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold transition-colors"
                                >
                                    Start Copying
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Mini Stat Component
function StatMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const colorMap: { [key: string]: string } = {
        green: 'text-green-400',
        red: 'text-red-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        yellow: 'text-yellow-400',
        orange: 'text-orange-400',
        gray: 'text-gray-400'
    };

    return (
        <div className="bg-[#171717] p-3 rounded-lg text-center">
            <div className={`mb-1 ${colorMap[color]} flex justify-center`}>{icon}</div>
            <div className="text-[10px] text-gray-500 uppercase">{label}</div>
            <div className={`font-bold text-sm ${colorMap[color]}`}>{value}</div>
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <Suspense fallback={<div className="p-6 min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-500">Loading...</div>}>
            <LeaderboardContent />
        </Suspense>
    );
}
