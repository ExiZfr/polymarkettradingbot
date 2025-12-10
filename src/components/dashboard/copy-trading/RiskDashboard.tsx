"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Shield, Flame, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface CorrelationData {
    matrix: { [wallet: string]: { [wallet: string]: number } };
    highCorrelations: Array<{
        walletA: string;
        walletB: string;
        walletALabel: string;
        walletBLabel: string;
        correlation: number;
    }>;
}

interface RiskMetrics {
    totalExposure: number;
    dailyLossLimit: number;
    currentDailyLoss: number;
    stopLossActive: boolean;
    walletExposures: Array<{
        wallet: string;
        label: string;
        exposure: number; // %
        risk: 'low' | 'medium' | 'high';
    }>;
}

export default function RiskDashboard({ userId }: { userId: number }) {
    const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
    const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [userId]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load correlation data
            const corrRes = await fetch(`/api/copy-trading/correlation?userId=${userId}&threshold=0.6`);
            const corrData = await corrRes.json();
            setCorrelationData(corrData);

            // Mock risk metrics (real implementation would fetch from portfolio allocation)
            setRiskMetrics({
                totalExposure: 75,
                dailyLossLimit: 500,
                currentDailyLoss: 125,
                stopLossActive: true,
                walletExposures: [
                    { wallet: '0xAAA', label: 'Whale Trader', exposure: 30, risk: 'medium' },
                    { wallet: '0xBBB', label: 'Alpha Sniper', exposure: 25, risk: 'low' },
                    { wallet: '0xCCC', label: 'Risk Taker', exposure: 20, risk: 'high' }
                ]
            });
        } catch (error) {
            console.error('Failed to load risk dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCorrelationColor = (correlation: number) => {
        const abs = Math.abs(correlation);
        if (abs >= 0.8) return 'bg-red-500';
        if (abs >= 0.6) return 'bg-orange-500';
        if (abs >= 0.4) return 'bg-yellow-500';
        if (abs >= 0.2) return 'bg-blue-500';
        return 'bg-gray-600';
    };

    const getCorrelationTextColor = (correlation: number) => {
        const abs = Math.abs(correlation);
        if (abs >= 0.8) return 'text-red-400';
        if (abs >= 0.6) return 'text-orange-400';
        if (abs >= 0.4) return 'text-yellow-400';
        return 'text-slate-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const wallets = correlationData?.matrix ? Object.keys(correlationData.matrix) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Risk Dashboard</h2>
                <p className="text-sm text-slate-400">Portfolio risk analysis and correlation heatmap</p>
            </div>

            {/* Risk Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Exposure */}
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={16} className="text-indigo-400" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Total Exposure</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{riskMetrics?.totalExposure}%</p>
                    <div className="w-full bg-white/5 rounded-full h-2 mt-2">
                        <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${riskMetrics?.totalExposure}%` }}
                        />
                    </div>
                </div>

                {/* Daily Loss */}
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={16} className="text-red-400" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Daily Loss</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                        ${riskMetrics?.currentDailyLoss}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Limit: ${riskMetrics?.dailyLossLimit}
                    </p>
                </div>

                {/* Stop Loss Status */}
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-green-400" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Stop Loss</span>
                    </div>
                    <p className={`text-2xl font-bold ${riskMetrics?.stopLossActive ? 'text-green-400' : 'text-red-400'}`}>
                        {riskMetrics?.stopLossActive ? 'Active' : 'Inactive'}
                    </p>
                </div>

                {/* Correlation Warnings */}
                <div className="p-4 bg-[#0A0B0F] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-yellow-400" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Warnings</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">
                        {correlationData?.highCorrelations.length || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">High correlations</p>
                </div>
            </div>

            {/* Wallet Exposure Breakdown */}
            <div className="bg-[#0A0B0F] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Portfolio Allocation</h3>
                <div className="space-y-3">
                    {riskMetrics?.walletExposures.map((wallet, index) => (
                        <motion.div
                            key={wallet.wallet}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-white">{wallet.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{wallet.exposure}%</span>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${wallet.risk === 'low' ? 'bg-green-500/20 text-green-400' :
                                                wallet.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                            }`}>
                                            {wallet.risk.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2">
                                    <div
                                        className={`h-full rounded-full ${wallet.risk === 'low' ? 'bg-green-500' :
                                                wallet.risk === 'medium' ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ width: `${wallet.exposure}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Correlation Heatmap */}
            {wallets.length > 0 ? (
                <div className="bg-[#0A0B0F] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Correlation Matrix</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="p-2"></th>
                                    {wallets.map((wallet) => (
                                        <th key={wallet} className="p-2 text-xs text-slate-400 font-mono">
                                            {wallet.slice(0, 6)}...
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.map((walletA) => (
                                    <tr key={walletA}>
                                        <td className="p-2 text-xs text-slate-400 font-mono">
                                            {walletA.slice(0, 6)}...
                                        </td>
                                        {wallets.map((walletB) => {
                                            const correlation = correlationData?.matrix[walletA]?.[walletB] || 0;
                                            const isHigh = Math.abs(correlation) >= 0.6 && walletA !== walletB;

                                            return (
                                                <td key={walletB} className="p-1">
                                                    <div
                                                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${walletA === walletB
                                                                ? 'bg-white/5'
                                                                : getCorrelationColor(correlation)
                                                            } ${isHigh ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}
                                                        title={`${(correlation * 100).toFixed(0)}%`}
                                                    >
                                                        <span className={`text-xs font-bold ${walletA === walletB ? 'text-slate-600' : 'text-white'
                                                            }`}>
                                                            {walletA === walletB ? '—' : (correlation * 100).toFixed(0)}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs">
                        <span className="text-slate-500">Correlation:</span>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-slate-400">High (80%+)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                            <span className="text-slate-400">Medium (60-80%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                            <span className="text-slate-400">Low (40-60%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-600 rounded"></div>
                            <span className="text-slate-400">Minimal (&lt;40%)</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#0A0B0F] border border-white/10 rounded-2xl p-12 text-center">
                    <Activity size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-400">Need at least 2 wallets to calculate correlation</p>
                </div>
            )}

            {/* High Correlation Warnings */}
            {correlationData && correlationData.highCorrelations.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={24} className="text-yellow-400 shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-yellow-400 mb-2">High Correlation Detected</h3>
                            <p className="text-sm text-yellow-300/80 mb-4">
                                The following wallet pairs are highly correlated. Copying both creates concentration risk.
                            </p>
                            <div className="space-y-2">
                                {correlationData.highCorrelations.map((pair, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-black/20 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">{pair.walletALabel}</span>
                                            <span className="text-slate-500">↔</span>
                                            <span className="text-sm font-medium text-white">{pair.walletBLabel}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${getCorrelationTextColor(pair.correlation)}`}>
                                            {(pair.correlation * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-yellow-300/60 mt-4">
                                💡 Recommendation: Choose one wallet or diversify with uncorrelated traders.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
