'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Settings,
    Activity,
    Target
} from 'lucide-react';

interface DecisionLog {
    id: string;
    timestamp: number;
    whale_wallet: string;
    market_id: string;
    outcome: 'YES' | 'NO';
    score: number;
    decision: 'EXECUTED' | 'IGNORED' | 'REJECTED';
    reason: string;
    factors: {
        win_rate_score: number;
        pnl_score: number;
        timing_score: number;
        liquidity_score: number;
    };
}

export default function DecisionEnginePage() {
    const [threshold, setThreshold] = useState(75);
    const [decisions, setDecisions] = useState<DecisionLog[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        executed: 0,
        ignored: 0,
        rejected: 0,
        avg_score: 0
    });

    // Mock data for demonstration
    useEffect(() => {
        const mockDecisions: DecisionLog[] = [
            {
                id: '1',
                timestamp: Date.now() - 300000,
                whale_wallet: '0x742d35Cc663...',
                market_id: '100245',
                outcome: 'YES',
                score: 85,
                decision: 'EXECUTED',
                reason: 'High confidence - Smart Money detected',
                factors: {
                    win_rate_score: 30,
                    pnl_score: 20,
                    timing_score: 20,
                    liquidity_score: 15
                }
            },
            {
                id: '2',
                timestamp: Date.now() - 600000,
                whale_wallet: '0x1234567890a...',
                market_id: '100123',
                outcome: 'NO',
                score: 45,
                decision: 'IGNORED',
                reason: 'Score below threshold',
                factors: {
                    win_rate_score: 10,
                    pnl_score: 10,
                    timing_score: 15,
                    liquidity_score: 10
                }
            },
            {
                id: '3',
                timestamp: Date.now() - 900000,
                whale_wallet: '0xdeadbeef123...',
                market_id: '100089',
                outcome: 'YES',
                score: 0,
                decision: 'REJECTED',
                reason: 'Market Maker Activity',
                factors: {
                    win_rate_score: 0,
                    pnl_score: 0,
                    timing_score: 0,
                    liquidity_score: 0
                }
            }
        ];

        setDecisions(mockDecisions);

        const executed = mockDecisions.filter(d => d.decision === 'EXECUTED').length;
        const ignored = mockDecisions.filter(d => d.decision === 'IGNORED').length;
        const rejected = mockDecisions.filter(d => d.decision === 'REJECTED').length;
        const avgScore = mockDecisions.reduce((sum, d) => sum + d.score, 0) / mockDecisions.length;

        setStats({
            total: mockDecisions.length,
            executed,
            ignored,
            rejected,
            avg_score: Math.round(avgScore)
        });
    }, []);

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'EXECUTED':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'IGNORED':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'REJECTED':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getDecisionIcon = (decision: string) => {
        switch (decision) {
            case 'EXECUTED':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'IGNORED':
                return <XCircle className="w-4 h-4" />;
            case 'REJECTED':
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Brain className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Decision Engine</h1>
                        <p className="text-muted-foreground">Intelligence de Trading & Scoring</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-card rounded-xl border border-border"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <span className="text-xs text-muted-foreground">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 bg-card rounded-xl border border-border"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-xs text-muted-foreground">Exécutés</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.executed}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 bg-card rounded-xl border border-border"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">Ignorés</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.ignored}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 bg-card rounded-xl border border-border"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="text-xs text-muted-foreground">Rejetés</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-4 bg-card rounded-xl border border-border"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-5 h-5 text-purple-500" />
                            <span className="text-xs text-muted-foreground">Score Moyen</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.avg_score}/100</p>
                    </motion.div>
                </div>

                {/* Configuration */}
                <div className="p-6 bg-card rounded-xl border border-border mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">Configuration</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Threshold Slider */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Seuil de Score Minimum
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-2xl font-bold text-primary w-20 text-right">
                                    {threshold}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Les trades avec un score ≥ {threshold} seront exécutés automatiquement
                            </p>
                        </div>

                        {/* Score Breakdown */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Pondération des Facteurs
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Win Rate</span>
                                    <span className="font-semibold text-foreground">30 pts max</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">PnL Historique</span>
                                    <span className="font-semibold text-foreground">20 pts max</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Timing</span>
                                    <span className="font-semibold text-foreground">20 pts max</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Liquidité</span>
                                    <span className="font-semibold text-foreground">10 pts max</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decision Log */}
            <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Historique des Décisions</h2>

                {decisions.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucune décision enregistrée</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {decisions.map((decision, index) => (
                            <motion.div
                                key={decision.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-5 bg-gradient-to-br from-card to-card/50 rounded-xl border border-border hover:border-primary/50 transition"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 ${getDecisionColor(
                                                decision.decision
                                            )}`}
                                        >
                                            {getDecisionIcon(decision.decision)}
                                            {decision.decision}
                                        </span>
                                        <code className="text-sm font-mono text-muted-foreground">
                                            {decision.whale_wallet}
                                        </code>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimeAgo(decision.timestamp)}
                                    </span>
                                </div>

                                {/* Score & Reason */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="text-xs text-muted-foreground block mb-1">
                                            Score Final
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${decision.score >= threshold
                                                            ? 'bg-green-500'
                                                            : 'bg-yellow-500'
                                                        }`}
                                                    style={{ width: `${decision.score}%` }}
                                                />
                                            </div>
                                            <span className="text-lg font-bold text-foreground min-w-[50px] text-right">
                                                {decision.score}/100
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block mb-1">
                                            Raison
                                        </span>
                                        <span className="text-sm font-medium text-foreground">
                                            {decision.reason}
                                        </span>
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block mb-1">
                                                Win Rate
                                            </span>
                                            <span className="font-bold text-foreground">
                                                +{decision.factors.win_rate_score}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">PnL</span>
                                            <span className="font-bold text-foreground">
                                                +{decision.factors.pnl_score}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Timing</span>
                                            <span className="font-bold text-foreground">
                                                +{decision.factors.timing_score}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">
                                                Liquidité
                                            </span>
                                            <span className="font-bold text-foreground">
                                                +{decision.factors.liquidity_score}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Trade Info */}
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                    <span className="text-muted-foreground">
                                        Market: <span className="text-foreground">#{decision.market_id}</span>
                                    </span>
                                    <span
                                        className={`font-bold ${decision.outcome === 'YES' ? 'text-green-500' : 'text-red-500'
                                            }`}
                                    >
                                        {decision.outcome}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
