"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Shield, Zap, Settings, RefreshCw, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Trader {
    rank: number;
    address: string;
    ens?: string;
    pnl: number;
    winRate: number;
    volume: number;
    trades: number;
}

function LeaderboardContent() {
    // Force Paper Mode
    const isPaperMode = true;
    const router = useRouter();

    const [topTraders, setTopTraders] = useState<Trader[]>([]);
    const [worstTraders, setWorstTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'top' | 'worst'>('top');

    // Modal state
    const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Copy Form State
    const [copyConfig, setCopyConfig] = useState({
        copyMode: 'fixed', // fixed, percentage, smart_mirror
        fixedAmount: 10,
        percentageAmount: 5,
        maxCap: 50,
        stopLoss: 20,
        inverse: false
    });

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
        // Reset config
        setCopyConfig({
            copyMode: 'fixed',
            fixedAmount: 10,
            percentageAmount: 5,
            maxCap: 50,
            stopLoss: 20,
            inverse: false
        });
        setShowModal(true);
    };

    const confirmCopy = async () => {
        if (!selectedTrader) return;

        try {
            if (isPaperMode) {
                const payload = {
                    walletAddress: selectedTrader.address,
                    label: selectedTrader.ens || `Trader ${selectedTrader.address.slice(0, 6)}`,
                    ...copyConfig,
                    enabled: true
                };

                const res = await fetch('/api/paper/copy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Failed to save paper copy setting');

                alert(`Started PAPER copying ${selectedTrader.ens || selectedTrader.address} successfully!`);
            } else {
                // Real mode implementation stub
                alert(`Started copying ${selectedTrader.ens || selectedTrader.address} (Real Mode via Contract)`);
            }
            setShowModal(false);
            router.push('/dashboard/copy-trading');
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const displayedTraders = activeTab === 'top' ? topTraders : worstTraders;

    return (
        <div className="p-6 min-h-screen bg-[#0a0a0a] text-gray-100">
            {/* Nav & Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard/copy-trading" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                {isPaperMode && (
                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-2">
                        <Shield size={12} /> PAPER MODE ACTIVE
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        Trader Leaderboard
                        {activeTab === 'worst' && <span className="text-red-500 text-sm font-normal px-2 py-0.5 bg-red-500/10 rounded uppercase">Rekt Zone</span>}
                    </h1>
                    <p className="text-gray-500">Discover the best (and worst) performers on Polymarket.</p>
                </div>

                {/* Tabs */}
                <div className="bg-[#171717] p-1 rounded-lg flex items-center shadow-lg shadow-black/20 border border-[#262626]">
                    <button
                        onClick={() => setActiveTab('top')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'top' ? 'bg-[#262626] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Top Traders
                    </button>
                    <button
                        onClick={() => setActiveTab('worst')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'worst' ? 'bg-[#262626] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Worst Traders
                    </button>
                </div>
            </div>

            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-20 text-center text-gray-500 flex flex-col items-center">
                        <RefreshCw className="animate-spin mb-2" />
                        Loading decentralized leaderboard...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#1a1a1a] text-gray-400 text-xs uppercase tracking-wider border-b border-[#262626]">
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
                                    <tr key={idx} className="hover:bg-[#262626]/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-gray-500 group-hover:text-white transition-colors">
                                            #{trader.rank}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/copy-trading/${trader.address}`} className="group/link">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg ${idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' : 'bg-[#262626] text-gray-400'}`}>
                                                        {idx < 3 ? idx + 1 : (trader.ens || trader.address)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-200 group-hover/link:text-blue-400 transition-colors">
                                                            {trader.ens || `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`}
                                                        </div>
                                                        <div className="text-xs text-gray-600 font-mono">
                                                            {trader.trades} bets
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium font-mono ${trader.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                                                    <div className={`h-full ${trader.winRate > 0.6 ? 'bg-green-500' : trader.winRate > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${trader.winRate * 100}%` }}></div>
                                                </div>
                                                <span className="text-xs font-mono text-gray-400">{(trader.winRate * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-400 font-mono">
                                            ${(trader.volume / 1000).toFixed(1)}k
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopy(trader)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-lg ${isPaperMode
                                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                                                    : 'bg-white text-black hover:bg-gray-200 shadow-white/10'}`}
                                            >
                                                {isPaperMode ? <Shield size={12} /> : <Zap size={12} />}
                                                {isPaperMode ? 'Paper Copy' : 'Copy'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Advanced Copy Modal */}
            <AnimatePresence>
                {showModal && selectedTrader && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#171717] border border-[#262626] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-[#262626] flex items-center gap-4 bg-[#1a1a1a]">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${isPaperMode ? 'bg-indigo-500/20' : 'bg-blue-500/20'}`}>
                                    {isPaperMode ? <Shield className="w-6 h-6 text-indigo-400" /> : <Zap className="w-6 h-6 text-blue-400" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {isPaperMode ? 'Paper Copy Configuration' : 'Copy Trading Setup'}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Configuring for <span className="text-white font-medium">{selectedTrader.ens || selectedTrader.address.slice(0, 8)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Mode & Strategy */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Strategy Mode</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['fixed', 'percentage', 'smart_mirror'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setCopyConfig(prev => ({ ...prev, copyMode: mode }))}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${copyConfig.copyMode === mode
                                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-sm'
                                                        : 'bg-[#262626] border-transparent text-gray-400 hover:text-gray-300'}`}
                                                >
                                                    {mode === 'fixed' ? 'Fixed Amount' : mode === 'percentage' ? '% of Balance' : 'Smart Mirror'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Amount Config */}
                                    <div className="bg-[#262626]/50 rounded-xl p-4 border border-[#333]">
                                        {copyConfig.copyMode === 'fixed' && (
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1 block">Fixed Amount per Trade ($)</label>
                                                <input
                                                    type="number"
                                                    value={copyConfig.fixedAmount}
                                                    onChange={e => setCopyConfig(prev => ({ ...prev, fixedAmount: Number(e.target.value) }))}
                                                    className="w-full bg-[#171717] border border-[#404040] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        )}
                                        {copyConfig.copyMode === 'percentage' && (
                                            <div>
                                                <label className="text-sm text-gray-300 mb-1 block">Percentage of Portfolio (%)</label>
                                                <input
                                                    type="number"
                                                    value={copyConfig.percentageAmount}
                                                    onChange={e => setCopyConfig(prev => ({ ...prev, percentageAmount: Number(e.target.value) }))}
                                                    className="w-full bg-[#171717] border border-[#404040] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        )}
                                        {copyConfig.copyMode === 'smart_mirror' && (
                                            <div className="text-sm text-gray-400">
                                                <p className="flex items-center gap-2 mb-2"><BarChart size={14} /> Smart Mirror copies the exact risk ratio of the whale.</p>
                                                <p className="text-xs text-gray-500">Warning: Requires accurate wallet balance data from the target.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Advanced Safety */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Risk & Safety</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Max Cap / Trade ($)</label>
                                            <input
                                                type="number"
                                                value={copyConfig.maxCap}
                                                onChange={e => setCopyConfig(prev => ({ ...prev, maxCap: Number(e.target.value) }))}
                                                className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Stop Loss (%)</label>
                                            <input
                                                type="number"
                                                value={copyConfig.stopLoss}
                                                onChange={e => setCopyConfig(prev => ({ ...prev, stopLoss: Number(e.target.value) }))}
                                                className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Inverse Mode Toggle */}
                                <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${copyConfig.inverse ? 'bg-red-500/10 border-red-500/30' : 'bg-[#262626] border-[#333]'}`}
                                    onClick={() => setCopyConfig(prev => ({ ...prev, inverse: !prev.inverse }))}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${copyConfig.inverse ? 'bg-red-500 text-white' : 'bg-[#333] text-gray-500'}`}>
                                            <RefreshCw size={16} />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold ${copyConfig.inverse ? 'text-red-400' : 'text-gray-300'}`}>Inverse Copying</h4>
                                            <p className="text-xs text-gray-500">Bet AGAINST this trader (Inverse Cramer Mode)</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${copyConfig.inverse ? 'bg-red-500' : 'bg-gray-600'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${copyConfig.inverse ? 'translate-x-4' : ''}`} />
                                    </div>
                                </div>

                                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                                    <p className="text-xs text-yellow-200/80 leading-relaxed">
                                        Past performance is not indicative of future results. Slippage may occur.
                                        {isPaperMode && " Note: In Paper Mode, slippage is simulated based on market volatility."}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#262626] bg-[#1a1a1a] flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-[#262626] hover:bg-[#333] rounded-xl font-medium text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCopy}
                                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${isPaperMode
                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/20'
                                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-900/20'}`}
                                >
                                    {isPaperMode ? 'Start Paper Copying' : 'Activate Copy Trading'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading...</div>}>
            <LeaderboardContent />
        </Suspense>
    );
}
