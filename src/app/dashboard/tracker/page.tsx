'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, Trophy, Terminal } from 'lucide-react';
import TransactionDetails from '@/components/tracker/TransactionDetails';
import TrackerStatsBar from '@/components/dashboard/tracker/TrackerStatsBar';
import TrackerToolbar from '@/components/dashboard/tracker/TrackerToolbar';
import TrackerTable from '@/components/dashboard/tracker/TrackerTable';
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
        <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
            {/* Top Stats Bar */}
            <div className="bg-background border-b border-border shrink-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-primary" />
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            Whale Terminal v2
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            LIVE
                        </div>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className={`p-1.5 rounded-lg border transition-all ${showLogs
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
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
                <div className="flex-1 flex flex-col min-w-0 border-r border-border">
                    <TrackerToolbar filter={filter} onChange={setFilter} />
                    <div className="flex-1 p-4 overflow-hidden bg-background/50">
                        <TrackerTable
                            transactions={filteredTransactions}
                            loading={loading}
                            onSelectTx={setSelectedTx}
                        />
                    </div>
                </div>

                {/* Right Panel: Sidebar (Collapsible/Fixed) */}
                <div className="w-80 flex flex-col bg-card border-l border-border shrink-0">
                    {/* Top Whales Leaderboard */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            Top Performers
                        </h3>
                        <div className="space-y-2">
                            {stats?.topWhales?.slice(0, 10).map((whale, idx) => {
                                const config = getTagConfig(whale.tag);
                                return (
                                    <div key={whale.address} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/20 hover:bg-secondary transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="text-xs font-bold text-muted-foreground w-3">#{idx + 1}</div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[10px] font-bold ${config.color}`}>{whale.tag}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono truncate w-20">
                                                    {whale.address}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-foreground font-mono">{formatAmount(whale.totalVolume)}</div>
                                            <div className="text-[10px] text-muted-foreground">{whale.tradeCount} trades</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Console / Logs Area */}
                    {showLogs && (
                        <div className="h-64 border-t border-border flex flex-col bg-muted/30">
                            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                                <span className="text-[10px] font-mono text-muted-foreground uppercase">System Logs</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-muted-foreground opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`${log.level === 'error' ? 'text-destructive' :
                                            log.level === 'warning' ? 'text-orange-400' :
                                                log.level === 'success' ? 'text-emerald-500' :
                                                    'text-muted-foreground'
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
