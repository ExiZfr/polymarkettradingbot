"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Zap,
    DollarSign,
    BarChart3,
    Newspaper,
    Target,
    ExternalLink,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import Link from "next/link";

type SignalData = {
    id: string;
    marketId: string;
    question: string;
    score: number;
    timestamp: string;
    volume: string;
    liquidity: string;
    newsCorrelation: boolean;
    slug?: string;
    scoringFactors?: {
        volumeScore: number;
        liquidityScore: number;
        newsBoost: string;
    };
};

export default function SignalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const signalId = params.id as string;

    const [signal, setSignal] = useState<SignalData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSignal = async () => {
            try {
                const res = await fetch('/api/signals/history');
                if (res.ok) {
                    const signals = await res.json();
                    const found = signals.find((s: SignalData) => s.id === signalId || s.marketId === signalId);
                    setSignal(found || null);
                }
            } catch (e) {
                console.error('Failed to fetch signal:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchSignal();
    }, [signalId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!signal) {
        return (
            <div className="p-6 text-center">
                <AlertTriangle className="mx-auto text-amber-400 mb-4" size={48} />
                <h2 className="text-xl font-bold text-white mb-2">Signal Not Found</h2>
                <p className="text-slate-400 mb-4">This signal may have expired or been cleaned up.</p>
                <Link href="/dashboard" className="text-indigo-400 hover:underline">← Back to Dashboard</Link>
            </div>
        );
    }

    // Calculate position recommendation based on analysis
    const volume = parseFloat(signal.volume || '0');
    const liquidity = parseFloat(signal.liquidity || '0');
    const score = signal.score;

    const getPositionRecommendation = () => {
        if (score >= 85 && signal.newsCorrelation) {
            return { side: 'YES', confidence: 'HIGH', reason: 'Strong signal with news validation' };
        } else if (score >= 75) {
            return { side: 'YES', confidence: 'MEDIUM', reason: 'Good opportunity based on volume/liquidity' };
        } else if (score >= 70) {
            return { side: 'YES', confidence: 'LOW', reason: 'Moderate signal - consider small position' };
        }
        return { side: 'WAIT', confidence: 'LOW', reason: 'Signal below threshold - monitor only' };
    };

    const recommendation = getPositionRecommendation();

    const getSuggestedAmount = () => {
        if (recommendation.confidence === 'HIGH') return '$50-100';
        if (recommendation.confidence === 'MEDIUM') return '$25-50';
        return '$10-25';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Signal Analysis</h1>
                    <p className="text-slate-400 text-sm">ID: {signal.id}</p>
                </div>
            </div>

            {/* Market Question */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6"
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/20">
                        <Target className="text-indigo-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-2">{signal.question}</h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-400">
                                Detected: {new Date(signal.timestamp).toLocaleString()}
                            </span>
                            {signal.newsCorrelation && (
                                <span className="flex items-center gap-1 text-amber-400">
                                    <Newspaper size={14} /> News Validated
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-400">{score}</div>
                        <div className="text-xs text-slate-500">SCORE</div>
                    </div>
                </div>
            </motion.div>

            {/* Position Recommendation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl p-6 mb-6 border ${recommendation.side === 'YES'
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className={recommendation.side === 'YES' ? 'text-green-400' : 'text-amber-400'} />
                    Position Recommendation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/20 rounded-xl p-4">
                        <div className="text-xs text-slate-500 mb-1">RECOMMENDED SIDE</div>
                        <div className={`text-2xl font-bold ${recommendation.side === 'YES' ? 'text-green-400' : 'text-amber-400'}`}>
                            {recommendation.side === 'YES' ? (
                                <span className="flex items-center gap-2"><TrendingUp size={24} /> BUY YES</span>
                            ) : (
                                <span className="flex items-center gap-2"><TrendingDown size={24} /> WAIT</span>
                            )}
                        </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                        <div className="text-xs text-slate-500 mb-1">CONFIDENCE</div>
                        <div className={`text-2xl font-bold ${recommendation.confidence === 'HIGH' ? 'text-green-400' :
                                recommendation.confidence === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                            {recommendation.confidence}
                        </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                        <div className="text-xs text-slate-500 mb-1">SUGGESTED AMOUNT</div>
                        <div className="text-2xl font-bold text-white">{getSuggestedAmount()}</div>
                    </div>
                </div>
                <p className="mt-4 text-slate-300 text-sm">{recommendation.reason}</p>
            </motion.div>

            {/* Why This Signal? */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 mb-6"
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-amber-400" />
                    Why This Signal?
                </h3>
                <div className="space-y-4">
                    {/* Volume Score */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSign className="text-green-400" size={20} />
                            <span className="text-slate-300">Trading Volume</span>
                        </div>
                        <div className="text-right">
                            <span className="text-white font-mono">${volume.toLocaleString()}</span>
                            <span className="text-slate-500 ml-2">(+{signal.scoringFactors?.volumeScore?.toFixed(0) || '?'} pts)</span>
                        </div>
                    </div>

                    {/* Liquidity Score */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="text-blue-400" size={20} />
                            <span className="text-slate-300">Market Liquidity</span>
                        </div>
                        <div className="text-right">
                            <span className="text-white font-mono">${liquidity.toLocaleString()}</span>
                            <span className="text-slate-500 ml-2">(+{signal.scoringFactors?.liquidityScore?.toFixed(0) || '?'} pts)</span>
                        </div>
                    </div>

                    {/* News Correlation */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Newspaper className={signal.newsCorrelation ? 'text-amber-400' : 'text-slate-600'} size={20} />
                            <span className="text-slate-300">News/RSS Correlation</span>
                        </div>
                        <div className="text-right">
                            <span className={`font-bold ${signal.newsCorrelation ? 'text-amber-400' : 'text-slate-500'}`}>
                                {signal.newsCorrelation ? '🔥 DETECTED' : 'None'}
                            </span>
                            {signal.newsCorrelation && <span className="text-slate-500 ml-2">(+30 pts)</span>}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4"
            >
                <a
                    href={`https://polymarket.com/event/${signal.slug || signal.marketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-center transition-colors flex items-center justify-center gap-2"
                >
                    <ExternalLink size={20} />
                    Open on Polymarket
                </a>
                <Link
                    href="/dashboard/radar"
                    className="py-4 px-6 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                >
                    View in Radar
                </Link>
            </motion.div>
        </div>
    );
}
