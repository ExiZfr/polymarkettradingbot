'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, Trophy } from 'lucide-react';
import TransactionDetails from '@/components/tracker/TransactionDetails';
import TrackerStatsDisplay from '@/components/dashboard/tracker/TrackerStats';
import TrackerFilters from '@/components/dashboard/tracker/TrackerFilters';
import TrackerLogFeed from '@/components/dashboard/tracker/TrackerLogFeed';
import TrackerConsole from '@/components/dashboard/tracker/TrackerConsole';
import { getTagConfig, formatAmount } from '@/lib/tracker-utils';
import type { WhaleTransaction, TrackerStats, LogEntry, FilterState } from '@/types/tracker';

export default function TrackerPage() {
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [stats, setStats] = useState<TrackerStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const [filter, setFilter] = useState<FilterState>({ tag: '', minAmount: 0 });
    const [selectedTx, setSelectedTx] = useState<WhaleTransaction | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [txRes, statsRes, logsRes] = await Promise.all([
                fetch('/api/tracker/transactions?limit=200'),
                fetch('/api/tracker/stats'),
                fetch('/api/tracker/logs?limit=50')
            ]);

            const txData = await txRes.json();
            if (txRes.ok) setTransactions(txData.transactions || []);
            if (statsRes.ok) setStats(await statsRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const filteredTransactions = transactions.filter(tx => {
        if (filter.tag && !tx.wallet_tag.toLowerCase().includes(filter.tag.toLowerCase())) return false;
        if (filter.minAmount && tx.amount < filter.minAmount) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#0a0f16] p-6 text-white font-sans selection:bg-purple-500/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-400" />
                        Whale Tracker
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm md:text-base">Real-time detection of high-value Polymarket transactions</p>
                </div>

                <TrackerConsole
                    logs={logs}
                    showLogs={showLogs}
                    onToggle={() => setShowLogs(!showLogs)}
                    onRefresh={fetchData}
                    loading={loading}
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* Left Column: Stats & Filters & Leaderboard (1 Col) */}
                <div className="xl:col-span-1 space-y-6">
                    <TrackerStatsDisplay stats={stats} />

                    <TrackerFilters filter={filter} onChange={setFilter} />

                    {/* Top Whales Leaderboard (Leaving inline for now as it's small but could be extracted) */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            Top Whales (24h)
                        </h3>
                        <div className="space-y-3">
                            {stats?.topWhales?.slice(0, 5).map((whale, idx) => {
                                const config = getTagConfig(whale.tag);
                                return (
                                    <div key={whale.address} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="text-xs font-bold text-gray-500 w-4">#{idx + 1}</div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-xs font-medium ${config.color}`}>{whale.tag}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono">
                                                    {whale.address.slice(0, 4)}...{whale.address.slice(-4)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{formatAmount(whale.totalVolume)}</div>
                                            <div className="text-xs text-gray-500">{whale.tradeCount} trades</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!stats?.topWhales?.length && (
                                <div className="text-center text-gray-500 py-4 text-sm">No data yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center/Right Column: Live Feed (3 Cols) */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Live Feed Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                            Live Feed
                        </h2>
                        <span className="text-sm text-gray-400 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            {filteredTransactions.length} events
                        </span>
                    </div>

                    {/* Feed Container */}
                    <TrackerLogFeed
                        transactions={filteredTransactions}
                        loading={loading}
                        onSelectTx={setSelectedTx}
                    />
                </div>
            </div>

            {/* Transaction Details Overlay */}
            <AnimatePresence>
                {selectedTx && (
                    <TransactionDetails
                        transaction={selectedTx}
                        onClose={() => setSelectedTx(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
