"use client";

import { useState, useEffect } from 'react';
import { useRadar } from '@/lib/radar-context';
import { BarChart3, Download, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

export default function IntelligencePanel() {
    const { markets, isLoading } = useRadar();
    const [sortBy, setSortBy] = useState<'score' | 'volume' | 'probability'>('score');

    const topMarkets = [...markets]
        .sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.analysis.score - a.analysis.score;
                case 'volume':
                    return parseFloat(b.market.volume.replace(/[^0-9.]/g, '')) - parseFloat(a.market.volume.replace(/[^0-9.]/g, ''));
                case 'probability':
                    return b.market.probability - a.market.probability;
                default:
                    return 0;
            }
        })
        .slice(0, 20);

    const handleExport = () => {
        const data = markets.map((m) => ({
            title: m.market.title,
            score: m.analysis.score,
            volume: m.market.volume,
            liquidity: m.market.liquidity,
            probability: m.market.probability,
            category: m.market.category,
            urgency: m.analysis.urgency,
        }));

        const csv = [
            ['Title', 'Score', 'Volume', 'Liquidity', 'Probability', 'Category', 'Urgency'],
            ...data.map((row) => [
                row.title,
                row.score,
                row.volume,
                row.liquidity,
                row.probability,
                row.category,
                row.urgency,
            ]),
        ]
            .map((row) => row.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `market-intelligence-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Market Intelligence</h2>
                    <p className="text-sm text-slate-400">Passive analysis and research tools</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="score">Sort by Score</option>
                        <option value="volume">Sort by Volume</option>
                        <option value="probability">Sort by Probability</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
                    <p className="text-xs text-slate-400 mb-1">Total Markets</p>
                    <p className="text-2xl font-bold text-white">{markets.length}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-xs text-slate-400 mb-1">High Score (&gt;80)</p>
                    <p className="text-2xl font-bold text-white">{markets.filter((m) => m.analysis.score > 80).length}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl">
                    <p className="text-xs text-slate-400 mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-white">
                        {markets.length > 0 ? Math.round(markets.reduce((sum, m) => sum + m.analysis.score, 0) / markets.length) : 0}
                    </p>
                </div>
            </div>

            {/* Top Markets Table */}
            <div className="border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Market
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Volume
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Probability
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Urgency
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {topMarkets.map((item, index) => (
                                <tr key={item.market.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-600 font-mono w-6">#{index + 1}</span>
                                            <p className="text-sm text-white font-medium line-clamp-1">{item.market.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-orange-400">{item.analysis.score}</span>
                                            {item.analysis.score > 80 && <ArrowUp size={14} className="text-green-400" />}
                                            {item.analysis.score < 50 && <ArrowDown size={14} className="text-red-400" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{item.market.volume}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-slate-300 font-mono">{item.market.probability}%</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 text-xs font-bold rounded-lg ${item.analysis.urgency === 'CRITICAL'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : item.analysis.urgency === 'HIGH'
                                                        ? 'bg-orange-500/20 text-orange-400'
                                                        : item.analysis.urgency === 'MEDIUM'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-slate-500/20 text-slate-400'
                                                }`}
                                        >
                                            {item.analysis.urgency}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
}
