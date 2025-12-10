"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Shield, Zap, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface WalletMetrics {
    address: string;
    label: string;
    smartScore: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdown: number;
    profitFactor: number;
    kellyPercentage: number;
    riskOfRuin: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    pnl: number;
    volume: number;
}

export default function WalletComparisonTool({ wallets }: { wallets: string[] }) {
    const [walletsData, setWalletsData] = useState<WalletMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState<'smartScore' | 'sharpe' | 'profitFactor'>('smartScore');

    useEffect(() => {
        loadWalletsData();
    }, [wallets]);

    const loadWalletsData = async () => {
        setLoading(true);
        try {
            const promises = wallets.map(async (wallet) => {
                const res = await fetch(`/api/copy-trading/performance?wallet=${wallet}`);
                const data = await res.json();
                return { ...data, address: wallet };
            });

            const results = await Promise.all(promises);
            setWalletsData(results);
        } catch (error) {
            console.error('Failed to load wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (walletsData.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p>No wallets to compare</p>
            </div>
        );
    }

    const getBestValue = (metric: keyof WalletMetrics, higher: boolean = true) => {
        const values = walletsData.map(w => Number(w[metric]));
        return higher ? Math.max(...values) : Math.min(...values);
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const getRiskColor = (risk: number): string => {
        if (risk < 0.05) return 'text-green-400';
        if (risk < 0.15) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Wallet Comparison</h2>
                    <p className="text-sm text-slate-400">Side-by-side analysis of {walletsData.length} wallets</p>
                </div>

                {/* Metric Selector */}
                <div className="flex gap-2">
                    {[
                        { key: 'smartScore', label: 'Score', icon: Zap },
                        { key: 'sharpe', label: 'Sharpe', icon: TrendingUp },
                        { key: 'profitFactor', label: 'Profit Factor', icon: Target }
                    ].map((metric) => (
                        <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric.key as any)}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${selectedMetric === metric.key
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <metric.icon size={16} />
                            {metric.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {walletsData.map((wallet, index) => {
                    const isbestScore = wallet.smartScore === getBestValue('smartScore');
                    const isbestSharpe = wallet.sharpeRatio === getBestValue('sharpeRatio');
                    const isbestPF = wallet.profitFactor === getBestValue('profitFactor');

                    return (
                        <motion.div
                            key={wallet.address}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-5 bg-[#0A0B0F] border rounded-2xl overflow-hidden ${isbestScore && selectedMetric === 'smartScore' ||
                                    isbestSharpe && selectedMetric === 'sharpe' ||
                                    isbestPF && selectedMetric === 'profitFactor'
                                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                                    : 'border-white/10'
                                }`}
                        >
                            {/* Best Badge */}
                            {((isbestScore && selectedMetric === 'smartScore') ||
                                (isbestSharpe && selectedMetric === 'sharpe') ||
                                (isbestPF && selectedMetric === 'profitFactor')) && (
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                            👑 BEST
                                        </span>
                                    </div>
                                )}

                            {/* Wallet Header */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white line-clamp-1">
                                    {wallet.label || 'Unknown'}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono line-clamp-1">{wallet.address}</p>
                            </div>

                            {/* Smart Score */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400">Smart Score</span>
                                    <span className={`text-2xl font-bold ${getScoreColor(wallet.smartScore)}`}>
                                        {wallet.smartScore}/100
                                    </span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2">
                                    <div
                                        className={`h-full rounded-full transition-all ${wallet.smartScore >= 80 ? 'bg-green-500' :
                                                wallet.smartScore >= 60 ? 'bg-yellow-500' :
                                                    wallet.smartScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${wallet.smartScore}%` }}
                                    />
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="space-y-3">
                                {/* Sharpe Ratio */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <TrendingUp size={12} />
                                        Sharpe Ratio
                                    </span>
                                    <span className={`text-sm font-bold ${wallet.sharpeRatio >= 2 ? 'text-green-400' :
                                            wallet.sharpeRatio >= 1 ? 'text-yellow-400' : 'text-slate-400'
                                        }`}>
                                        {wallet.sharpeRatio.toFixed(2)}
                                    </span>
                                </div>

                                {/* Profit Factor */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Target size={12} />
                                        Profit Factor
                                    </span>
                                    <span className={`text-sm font-bold ${wallet.profitFactor >= 2 ? 'text-green-400' :
                                            wallet.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {wallet.profitFactor.toFixed(2)}
                                    </span>
                                </div>

                                {/* Max Drawdown */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <TrendingDown size={12} />
                                        Max Drawdown
                                    </span>
                                    <span className={`text-sm font-bold ${wallet.maxDrawdown < 10 ? 'text-green-400' :
                                            wallet.maxDrawdown < 20 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        -{wallet.maxDrawdown.toFixed(1)}%
                                    </span>
                                </div>

                                {/* Risk of Ruin */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        Risk of Ruin
                                    </span>
                                    <span className={`text-sm font-bold ${getRiskColor(wallet.riskOfRuin)}`}>
                                        {(wallet.riskOfRuin * 100).toFixed(1)}%
                                    </span>
                                </div>

                                {/* Kelly % */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Shield size={12} />
                                        Kelly %
                                    </span>
                                    <span className="text-sm font-bold text-indigo-400">
                                        {(wallet.kellyPercentage * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Performance Summary */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">PnL</span>
                                    <span className={`font-bold ${wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {wallet.pnl >= 0 ? '+' : ''}${wallet.pnl.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-1">
                                    <span className="text-slate-500">Win Rate</span>
                                    <span className="text-slate-300 font-medium">
                                        {(wallet.winRate * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Avg Smart Score</p>
                    <p className="text-2xl font-bold text-white">
                        {Math.round(walletsData.reduce((sum, w) => sum + w.smartScore, 0) / walletsData.length)}
                    </p>
                </div>
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Avg Sharpe</p>
                    <p className="text-2xl font-bold text-white">
                        {(walletsData.reduce((sum, w) => sum + w.sharpeRatio, 0) / walletsData.length).toFixed(2)}
                    </p>
                </div>
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Best PF</p>
                    <p className="text-2xl font-bold text-green-400">
                        {getBestValue('profitFactor').toFixed(2)}
                    </p>
                </div>
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Lowest Risk</p>
                    <p className="text-2xl font-bold text-green-400">
                        {(getBestValue('riskOfRuin', false) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
}
