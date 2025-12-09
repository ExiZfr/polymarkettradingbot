"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    ExternalLink,
    DollarSign,
    BarChart3,
    Search,
    Filter,
    ArrowUpRight
} from "lucide-react";

type Signal = {
    id: string;
    marketId: string;
    question: string;
    slug: string;
    score: number;
    reason: string;
    volume: number;
    liquidity: number;
    newsCorrelation: boolean;
    timestamp: string;
    status: string;
};

export default function SignalsPage() {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, HIGH, NEWS

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const res = await fetch('/api/signals?limit=100');
                if (res.ok) {
                    const data = await res.json();
                    setSignals(data);
                }
            } catch (error) {
                console.error("Failed to fetch signals", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 10000); // Live update
        return () => clearInterval(interval);
    }, []);

    const filteredSignals = signals.filter(s => {
        if (filter === "HIGH") return s.score >= 90;
        if (filter === "NEWS") return s.newsCorrelation;
        return true;
    });

    if (loading) return <div className="p-8 text-center text-slate-500">Loading signals...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-indigo-400" />
                        Live Signals
                    </h1>
                    <p className="text-slate-400">Real-time market opportunities detected by Hyper-Listener</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("ALL")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "ALL" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("HIGH")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "HIGH" ? "bg-green-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                    >
                        High Score (90+)
                    </button>
                    <button
                        onClick={() => setFilter("NEWS")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "NEWS" ? "bg-amber-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                    >
                        News Correlated
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredSignals.map((signal) => (
                    <motion.div
                        key={signal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0C0D12] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-indigo-500/30 transition-colors"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            {/* Score Badge */}
                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${signal.score >= 90 ? 'bg-green-500/20 text-green-400' :
                                    signal.score >= 80 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                                }`}>
                                <span className="text-xl font-bold">{signal.score}</span>
                                <span className="text-[10px] uppercase opacity-70">Score</span>
                            </div>

                            {/* Info */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    {signal.question}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <DollarSign size={14} /> Vol: ${signal.volume.toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BarChart3 size={14} /> Liq: ${signal.liquidity.toLocaleString()}
                                    </span>
                                    {signal.newsCorrelation && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                                            🔥 News
                                        </span>
                                    )}
                                    <span className="text-slate-600">
                                        {new Date(signal.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex item-center gap-3">
                            <a
                                href={`https://polymarket.com/event/${signal.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 transition-colors"
                            >
                                Open on Polymarket <ExternalLink size={16} />
                            </a>
                        </div>
                    </motion.div>
                ))}

                {filteredSignals.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        No signals found matching criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
