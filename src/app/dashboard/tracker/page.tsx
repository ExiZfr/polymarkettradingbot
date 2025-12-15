'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, Trophy, Terminal } from 'lucide-react';
import TransactionDetails from '@/components/tracker/TransactionDetails';
import TrackerStatsBar from '@/components/dashboard/tracker/TrackerStatsBar';
import TrackerToolbar from '@/components/dashboard/tracker/TrackerToolbar';
import TrackerTable from '@/components/dashboard/tracker/TrackerTable';
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
        <div className="h-screen bg-[#0a0f16] text-white font-sans flex flex-col overflow-hidden">
            {/* Top Stats Bar */}
            <div className="bg-[#0a0f16] border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            Whale Terminal v2
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            LIVE
                        </div>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className={`p-1.5 rounded-lg border transition-all ${showLogs
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                }`}
                            title="Toggle Console"
                        >
                            <Terminal className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <TrackerStatsBar stats={stats} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center Panel: Table */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                    <TrackerToolbar filter={filter} onChange={setFilter} />
                    <div className="flex-1 p-4 overflow-hidden">
                        <TrackerTable
                            transactions={filteredTransactions}
                            loading={loading}
                            onSelectTx={setSelectedTx}
                        />
                    </div>
                </div>

                {/* Right Panel: Sidebar (Collapsible/Fixed) */}
                <div className="w-80 flex flex-col bg-[#0d121d] border-l border-white/5 shrink-0">
                    {/* Top Whales Leaderboard */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            Top Performers
                        </h3>
                        <div className="space-y-2">
                            {stats?.topWhales?.slice(0, 10).map((whale, idx) => {
                                const config = getTagConfig(whale.tag);
                                return (
                                    <div key={whale.address} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="text-xs font-bold text-gray-600 w-3">#{idx + 1}</div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[10px] font-bold ${config.color}`}>{whale.tag}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono truncate w-20">
                                                    {whale.address}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-white font-mono">{formatAmount(whale.totalVolume)}</div>
                                            <div className="text-[10px] text-gray-500">{whale.tradeCount} trades</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Console / Logs Area */}
                    {showLogs && (
                        <div className="h-64 border-t border-white/10 flex flex-col bg-black/20">
                            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-mono text-gray-500 uppercase">System Logs</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-gray-600 opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`${log.level === 'error' ? 'text-red-400' :
                                            log.level === 'warning' ? 'text-yellow-400' :
                                                log.level === 'success' ? 'text-green-400' :
                                                    'text-gray-400'
                                            } truncate`}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
