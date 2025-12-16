'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, RefreshCcw, Zap, DollarSign, Target, Clock,
    AlertTriangle, CheckCircle2, Play, Pause, ExternalLink,
    BarChart3, Activity, Shield, Percent
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { PolymarketLink } from '@/components/PolymarketLink';

interface ArbOpportunity {
    id: string;
    market_id: string;
    market_question: string;
    market_slug: string;
    market_image: string;
    yes_price: number;
    no_price: number;
    total_price: number;
    arb_percent: number;
    arb_type: 'CLASSIC' | 'REVERSE';
    guaranteed_profit: number;
    liquidity: number;
    volume_24h: number;
    detected_at: string;
    expires_at: string;
}

interface ScanStats {
    markets_scanned: number;
    opportunities_found: number;
    best_arb_percent: number;
    total_arb_value: number;
    last_scan: string;
    scan_duration_ms: number;
}

export default function ArbitragePage() {
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
    const [stats, setStats] = useState<ScanStats | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [minArbFilter, setMinArbFilter] = useState(0.5);

    const { showSuccessToast, showErrorToast } = useToast();

    // Fetch arbitrage data
    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`/api/arbitrage?minArb=${minArbFilter}&limit=50`);
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setOpportunities(data.opportunities);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch arbitrage:', error);
        } finally {
            setLoading(false);
        }
    }, [minArbFilter]);

    // Initial fetch and polling
    useEffect(() => {
        fetchData();

        if (autoRefresh) {
            const interval = setInterval(fetchData, 10000); // 10s refresh
            return () => clearInterval(interval);
        }
    }, [fetchData, autoRefresh]);

    // Execute arbitrage (paper simulation)
    const handleExecute = async (opp: ArbOpportunity) => {
        try {
            const response = await fetch('/api/arbitrage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opportunityId: opp.id, amount: 100 })
            });

            if (response.ok) {
                const data = await response.json();
                showSuccessToast('Arbitrage Simulated!', data.message);
            } else {
                showErrorToast('Failed', 'Could not execute arbitrage');
            }
        } catch (error) {
            showErrorToast('Error', 'Execution failed');
        }
    };

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const formatPrice = (val: number) => `${(val * 100).toFixed(1)}¢`;
    const formatTimeAgo = (iso: string) => {
        if (!iso) return 'N/A';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    return (
        <div className="min-h-screen bg-background text-foreground space-y-6 p-6">

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                        {/* Title */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                {autoRefresh && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-background"></span>
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-yellow-400">
                                    Pure Arbitrage Scanner
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${stats?.opportunities_found
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-muted text-muted-foreground border-border'
                                        }`}>
                                        <Target className="w-3 h-3" />
                                        {stats?.opportunities_found || 0} Opportunities
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-medium">
                                        YES + NO ≠ $1.00
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            {/* Min Arb Filter */}
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Min Arb %</div>
                                <select
                                    value={minArbFilter}
                                    onChange={(e) => setMinArbFilter(parseFloat(e.target.value))}
                                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-medium"
                                >
                                    <option value={0}>All</option>
                                    <option value={0.5}>≥ 0.5%</option>
                                    <option value={1}>≥ 1%</option>
                                    <option value={2}>≥ 2%</option>
                                    <option value={5}>≥ 5%</option>
                                </select>
                            </div>

                            {/* Auto-refresh toggle */}
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${autoRefresh
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-muted text-muted-foreground border border-border'
                                    }`}
                            >
                                {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                            </button>

                            {/* Manual refresh */}
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors border border-border"
                            >
                                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Markets Scanned */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Markets Scanned</span>
                    </div>
                    <div className="text-3xl font-bold">{stats?.markets_scanned || 0}</div>
                </div>

                {/* Opportunities */}
                <div className="p-5 rounded-2xl bg-card border border-emerald-500/30 hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Active Arbs</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{stats?.opportunities_found || 0}</div>
                </div>

                {/* Best Arb */}
                <div className="p-5 rounded-2xl bg-card border border-yellow-500/30 hover:border-yellow-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Best Opportunity</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">
                        +{(stats?.best_arb_percent || 0).toFixed(2)}%
                    </div>
                </div>

                {/* Last Scan */}
                <div className="p-5 rounded-2xl bg-card border border-border hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Last Scan</span>
                    </div>
                    <div className="text-xl font-bold">
                        {stats?.last_scan ? formatTimeAgo(stats.last_scan) : 'Never'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {stats?.scan_duration_ms ? `${stats.scan_duration_ms}ms` : ''}
                    </div>
                </div>
            </div>

            {/* Opportunities Table */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        Arbitrage Opportunities
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {lastRefresh ? `Updated ${formatTimeAgo(lastRefresh.toISOString())}` : ''}
                    </span>
                </div>

                {loading && opportunities.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <RefreshCcw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p>Scanning for arbitrage opportunities...</p>
                    </div>
                ) : opportunities.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No arbitrage opportunities found</p>
                        <p className="text-sm mt-2">The markets are efficiently priced right now. Check back later!</p>
                        <p className="text-xs mt-4 text-yellow-500">
                            Make sure the scanner is running: <code className="bg-muted px-2 py-1 rounded">python scripts/arbitrage_scanner.py</code>
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Market</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">YES</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">NO</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Total</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Arb %</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Profit/$100</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Liquidity</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {opportunities.map((opp, index) => (
                                        <motion.tr
                                            key={opp.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            {/* Market */}
                                            <td className="py-4 px-4 max-w-[300px]">
                                                <div className="flex items-center gap-3">
                                                    {opp.market_image && (
                                                        <img src={opp.market_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium line-clamp-2">{opp.market_question}</p>
                                                        <PolymarketLink marketId={opp.market_id} marketSlug={opp.market_slug} className="text-xs" />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* YES Price */}
                                            <td className="py-4 px-4 text-center">
                                                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-mono text-sm">
                                                    {formatPrice(opp.yes_price)}
                                                </span>
                                            </td>

                                            {/* NO Price */}
                                            <td className="py-4 px-4 text-center">
                                                <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono text-sm">
                                                    {formatPrice(opp.no_price)}
                                                </span>
                                            </td>

                                            {/* Total */}
                                            <td className="py-4 px-4 text-center">
                                                <span className={`px-2 py-1 rounded font-mono text-sm ${opp.total_price < 1
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {formatPrice(opp.total_price)}
                                                </span>
                                            </td>

                                            {/* Arb % */}
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-lg font-bold text-emerald-400">
                                                    +{opp.arb_percent.toFixed(2)}%
                                                </span>
                                            </td>

                                            {/* Profit per $100 */}
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-lg font-bold text-yellow-400">
                                                    ${opp.guaranteed_profit.toFixed(2)}
                                                </span>
                                            </td>

                                            {/* Liquidity */}
                                            <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                                                {formatCurrency(opp.liquidity)}
                                            </td>

                                            {/* Action */}
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => handleExecute(opp)}
                                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-sm font-bold transition-all flex items-center gap-2 ml-auto"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                    Execute
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
