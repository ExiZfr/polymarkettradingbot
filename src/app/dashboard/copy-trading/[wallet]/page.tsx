"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy as CopyIcon, TrendingUp, TrendingDown, Clock, Search, ExternalLink, Calendar, Target, DollarSign } from "lucide-react";
import { PnLChart } from "@/components/dashboard/copy-trading/PnLChart";
import { WinRateChart } from "@/components/dashboard/copy-trading/WinRateChart";

// Types
interface Bet {
    id: string;
    market: string;
    outcome: string;
    amount: number;
    pnl: number;
    status: string;
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
    history: { date: string; value: number }[]; // For PnL Chart (mapped)
    bets: Bet[];
}

export default function WalletProfilePage() {
    const params = useParams();
    const address = params?.wallet as string;

    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1W');

    useEffect(() => {
        if (!address) return;
        async function fetchData() {
            try {
                const res = await fetch(`/api/copy-trading/wallet/${address}`);
                const json = await res.json();

                // Transform history for charts
                const pnlHistory = json.history.map((h: any) => ({
                    date: h.date,
                    value: h.pnl
                }));

                setData({ ...json, history: pnlHistory });
            } catch (error) {
                console.error("Failed to fetch wallet data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [address]);

    if (loading) {
        return <div className="p-6 min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-500">Loading wallet profile...</div>;
    }

    if (!data) {
        return <div className="p-6 min-h-screen bg-[#0a0a0a] flex items-center justify-center text-red-500">Wallet not found</div>;
    }

    return (
        <div className="p-6 min-h-screen bg-[#0a0a0a] text-gray-100">
            <Link href="/dashboard/copy-trading/leaderboard" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leaderboard
            </Link>

            {/* Header Profile */}
            <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl font-bold border-4 border-[#0a0a0a]">
                            {data.ens ? data.ens[0].toUpperCase() : data.address[2].toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {data.ens || `${data.address.slice(0, 6)}...${data.address.slice(-4)}`}
                                {data.metrics.totalPnl > 100000 && (
                                    <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20">Whale</span>
                                )}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                    {data.address}
                                    <CopyIcon className="w-3 h-3 cursor-pointer hover:text-white" />
                                </span>
                                <span className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer">
                                    View on Polymarket <ExternalLink className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
                            <Target className="w-4 h-4" />
                            Copy This Trader
                        </button>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8 pt-6 border-t border-[#262626]">
                    <MetricItem label="Total PnL" value={data.metrics.totalPnl} isCurrency colored />
                    <MetricItem label="Win Rate" value={data.metrics.winRate} isPercent />
                    <MetricItem label="Total Volume" value={data.metrics.totalVolume} isCurrency />
                    <MetricItem label="Active Positions" value={data.metrics.activePositions} />
                    <MetricItem label="Followers" value={data.metrics.followers} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* PnL Chart */}
                    <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                Profit & Loss Curve
                            </h3>
                            <div className="flex bg-[#262626] rounded-lg p-0.5">
                                {['1D', '1W', '1M', 'ALL'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf as any)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeframe === tf ? 'bg-[#404040] text-white shadow' : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PnLChart data={data.history} />
                    </div>

                    {/* Bet History */}
                    <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-[#262626]">
                            <h3 className="font-bold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#262626] text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Market</th>
                                        <th className="px-5 py-3">Outcome</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-right">PnL</th>
                                        <th className="px-5 py-3 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#262626]">
                                    {data.bets.map((bet) => (
                                        <tr key={bet.id} className="hover:bg-[#262626]/50 transition-colors">
                                            <td className="px-5 py-3 max-w-[200px] truncate" title={bet.market}>
                                                {bet.market}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${bet.outcome === 'YES' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {bet.outcome}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-300">
                                                ${bet.amount.toFixed(2)}
                                            </td>
                                            <td className={`px-5 py-3 text-right font-medium ${bet.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-500 text-xs">
                                                {new Date(bet.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Analysis */}
                <div className="space-y-6">
                    <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            Trading Style
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>High Risk</span>
                                    <span>Low Risk</span>
                                </div>
                                <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 to-green-500 w-[70%]" title="Risk Level" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-[#262626] p-3 rounded-lg text-center">
                                    <div className="text-gray-500 text-xs mb-1">Avg Hold Time</div>
                                    <div className="font-bold">14h 20m</div>
                                </div>
                                <div className="bg-[#262626] p-3 rounded-lg text-center">
                                    <div className="text-gray-500 text-xs mb-1">Markets</div>
                                    <div className="font-bold">Crypto, US</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Win Rate Chart Small */}
                    <div className="bg-[#171717] border border-[#262626] rounded-xl p-5">
                        <h3 className="font-bold mb-4">Win Rate Trend</h3>
                        <div className="h-[200px]">
                            {/* Reuse smaller version of chart */}
                            <WinRateChart data={data.history.map(h => ({ date: h.date, value: Math.random() }))} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricItem({ label, value, isCurrency, isPercent, colored }: any) {
    let formatted = value;
    let colorClass = "text-white";

    if (isCurrency) {
        formatted = `$${value?.toLocaleString()}`;
        if (colored) colorClass = value >= 0 ? "text-green-500" : "text-red-500";
    }
    if (isPercent) {
        formatted = `${(value * 100)?.toFixed(1)}%`;
    }

    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-gray-500 text-xs uppercase font-semibold mb-1">{label}</span>
            <span className={`text-xl font-bold ${colorClass}`}>{formatted}</span>
        </div>
    )
}
