"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, TrendingDown, Clock, AlertTriangle, X,
    BarChart3, Target, Percent, Activity, Timer,
    ArrowLeft, RefreshCw, Moon, Sun, ExternalLink
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface TraderMetrics {
    address: string;
    username: string;
    pnl: number;
    volume: number;
    trades: number;
    winRate: number;
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    avgHoldDuration: number;
    farmScore: number;
    isSuspectedFarm: boolean;
}

interface TraderDetail extends TraderMetrics {
    trades: any[];
    pnlHistory: { date: string; pnl: number }[];
}

type Period = '24h' | '7d' | '30d';
type Tab = 'top' | 'worst';

export default function LeaderboardPage() {
    const [period, setPeriod] = useState<Period>('7d');
    const [tab, setTab] = useState<Tab>('top');
    const [traders, setTraders] = useState<TraderMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrader, setSelectedTrader] = useState<TraderDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [period, tab]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    async function fetchLeaderboard() {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?period=${period}&type=${tab}`);
            const data = await res.json();
            setTraders(data.traders || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard', error);
        } finally {
            setLoading(false);
        }
    }

    async function openTraderDetail(address: string) {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/leaderboard/trader/${address}`);
            const data = await res.json();
            setSelectedTrader(data);
        } catch (error) {
            console.error('Failed to fetch trader detail', error);
        } finally {
            setDetailLoading(false);
        }
    }

    const bgColor = darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50';
    const cardBg = darkMode ? 'bg-[#171717]' : 'bg-white';
    const borderColor = darkMode ? 'border-[#262626]' : 'border-gray-200';
    const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
    const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

    return (
        <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300`}>
            {/* Header */}
            <div className={`sticky top-0 z-40 ${cardBg} border-b ${borderColor} backdrop-blur-xl bg-opacity-90`}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className={`${textSecondary} hover:${textPrimary} transition-colors`}>
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    Polymarket Leaderboard
                                </h1>
                                <p className={`text-sm ${textSecondary}`}>Top & Worst Performers Analysis</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Period Filter */}
                            <div className={`flex ${cardBg} border ${borderColor} rounded-lg p-1`}>
                                {(['24h', '7d', '30d'] as Period[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === p
                                                ? 'bg-blue-600 text-white'
                                                : `${textSecondary} hover:${textPrimary}`
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-lg ${cardBg} border ${borderColor} hover:bg-opacity-80 transition-colors`}
                            >
                                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
                <div className={`flex ${cardBg} border ${borderColor} rounded-xl p-1.5 w-fit`}>
                    <button
                        onClick={() => setTab('top')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${tab === 'top'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : textSecondary
                            }`}
                    >
                        <Trophy className="w-4 h-4" />
                        Top 25
                    </button>
                    <button
                        onClick={() => setTab('worst')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${tab === 'worst'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : textSecondary
                            }`}
                    >
                        <TrendingDown className="w-4 h-4" />
                        Worst 25
                    </button>
                </div>
            </div>

            {/* Leaderboard Grid */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {traders.map((trader, idx) => (
                            <motion.div
                                key={trader.address}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => openTraderDetail(trader.address)}
                                className={`${cardBg} border ${borderColor} rounded-xl p-4 cursor-pointer hover:border-blue-500/50 transition-all group`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Rank */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 && tab === 'top'
                                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black'
                                                : idx < 3 && tab === 'worst'
                                                    ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                                    : darkMode ? 'bg-[#262626] text-gray-400' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            #{idx + 1}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    {trader.username || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                                                </span>
                                                {trader.isSuspectedFarm && (
                                                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Farm Suspected
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-sm ${textSecondary}`}>
                                                {trader.trades} trades · ${(trader.volume / 1000).toFixed(1)}K vol
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${trader.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toLocaleString()}
                                            </div>
                                            <div className={`text-xs ${textSecondary}`}>P/L</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{(trader.winRate * 100).toFixed(1)}%</div>
                                            <div className={`text-xs ${textSecondary}`}>Win Rate</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-medium ${trader.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {trader.roi >= 0 ? '+' : ''}{trader.roi.toFixed(1)}%
                                            </div>
                                            <div className={`text-xs ${textSecondary}`}>ROI</div>
                                        </div>
                                        <ExternalLink className={`w-4 h-4 ${textSecondary} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedTrader && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setSelectedTrader(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${cardBg} border ${borderColor} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}
                        >
                            {/* Modal Header */}
                            <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                                        {selectedTrader.username?.[0]?.toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {selectedTrader.username || `${selectedTrader.address.slice(0, 8)}...`}
                                        </h2>
                                        <div className={`text-sm ${textSecondary} font-mono`}>
                                            {selectedTrader.address}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTrader(null)}
                                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${textSecondary}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MetricCard
                                        icon={<Percent className="w-5 h-5 text-blue-500" />}
                                        label="Win Rate"
                                        value={`${(selectedTrader.winRate * 100).toFixed(1)}%`}
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<Target className="w-5 h-5 text-green-500" />}
                                        label="ROI"
                                        value={`${selectedTrader.roi >= 0 ? '+' : ''}${selectedTrader.roi.toFixed(1)}%`}
                                        valueColor={selectedTrader.roi >= 0 ? 'text-green-500' : 'text-red-500'}
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<TrendingDown className="w-5 h-5 text-red-500" />}
                                        label="Max Drawdown"
                                        value={`-${selectedTrader.maxDrawdown.toFixed(1)}%`}
                                        valueColor="text-red-500"
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<Activity className="w-5 h-5 text-purple-500" />}
                                        label="Sharpe Ratio"
                                        value={selectedTrader.sharpeRatio.toFixed(2)}
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<BarChart3 className="w-5 h-5 text-orange-500" />}
                                        label="Total Trades"
                                        value={selectedTrader.trades.length.toString()}
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<Timer className="w-5 h-5 text-cyan-500" />}
                                        label="Avg Hold"
                                        value={`${selectedTrader.avgHoldDuration.toFixed(0)}h`}
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                        label="Farm Score"
                                        value={`${selectedTrader.farmScore}/100`}
                                        valueColor={selectedTrader.farmScore > 50 ? 'text-yellow-500' : ''}
                                        darkMode={darkMode}
                                    />
                                    <MetricCard
                                        icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                                        label="Total P/L"
                                        value={`$${selectedTrader.pnl.toLocaleString()}`}
                                        valueColor={selectedTrader.pnl >= 0 ? 'text-green-500' : 'text-red-500'}
                                        darkMode={darkMode}
                                    />
                                </div>

                                {/* PnL Chart */}
                                <div className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'} rounded-xl p-4`}>
                                    <h3 className="font-bold mb-4">P/L History</h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedTrader.pnlHistory}>
                                                <defs>
                                                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: darkMode ? '#888' : '#666', fontSize: 10 }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: darkMode ? '#888' : '#666', fontSize: 10 }}
                                                    tickFormatter={(v) => `$${v / 1000}K`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: darkMode ? '#1a1a1a' : '#fff',
                                                        border: darkMode ? '1px solid #333' : '1px solid #ddd',
                                                        borderRadius: 8
                                                    }}
                                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'P/L']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="pnl"
                                                    stroke="#22c55e"
                                                    strokeWidth={2}
                                                    fill="url(#pnlGradient)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Trade History */}
                                <div>
                                    <h3 className="font-bold mb-4">Recent Trades</h3>
                                    <div className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'} rounded-xl overflow-hidden`}>
                                        <table className="w-full text-sm">
                                            <thead className={`${darkMode ? 'bg-[#262626]' : 'bg-gray-100'} ${textSecondary}`}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Market</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3 text-right">P/L</th>
                                                    <th className="px-4 py-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${darkMode ? 'divide-[#262626]' : 'divide-gray-200'}`}>
                                                {selectedTrader.trades.slice(0, 10).map((trade: any) => (
                                                    <tr key={trade.id} className="hover:bg-white/5">
                                                        <td className="px-4 py-3 max-w-[200px] truncate">
                                                            {trade.marketTitle}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono">
                                                            ${trade.amount.toLocaleString()}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-mono ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                                                            }`}>
                                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${trade.status === 'WON'
                                                                    ? 'bg-green-500/20 text-green-500'
                                                                    : trade.status === 'LOST'
                                                                        ? 'bg-red-500/20 text-red-500'
                                                                        : 'bg-blue-500/20 text-blue-500'
                                                                }`}>
                                                                {trade.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MetricCard({ icon, label, value, valueColor = '', darkMode }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
    darkMode: boolean;
}) {
    return (
        <div className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#262626]' : 'bg-gray-200'}`}>
                {icon}
            </div>
            <div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{label}</div>
                <div className={`font-bold text-lg ${valueColor}`}>{value}</div>
            </div>
        </div>
    );
}
