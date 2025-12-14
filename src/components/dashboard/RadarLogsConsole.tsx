"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, ScrollText, Search, Filter, ExternalLink } from "lucide-react";

interface WhaleTransaction {
    id: string;
    txHash: string;
    timestamp: string;
    walletAddress: string;
    walletTag: string;
    marketQuestion: string;
    marketSlug: string;
    outcome: string;
    amount: number;
    price: number;
    walletWinRate?: number;
    walletTotalPnl?: number;
}

export default function RadarLogsConsole() {
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<WhaleTransaction[]>([]);
    const [selectedTx, setSelectedTx] = useState<WhaleTransaction | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterTag, setFilterTag] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch transactions from API
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await fetch('/api/radar/transactions?limit=100');
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data.transactions || []);
                }
            } catch (e) {
                console.error("Failed to fetch transactions", e);
            }
        };

        fetchTransactions();
        const interval = setInterval(fetchTransactions, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Filter transactions
    useEffect(() => {
        let filtered = transactions;

        if (filterTag !== "ALL") {
            filtered = filtered.filter(tx => tx.walletTag === filterTag);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(tx =>
                tx.marketQuestion.toLowerCase().includes(query) ||
                tx.walletAddress.toLowerCase().includes(query)
            );
        }

        setFilteredTransactions(filtered);
    }, [transactions, filterTag, searchQuery]);

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            const { scrollHeight, clientHeight } = scrollRef.current;
            scrollRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [filteredTransactions, autoScroll]);

    // Tag color mapping
    const getTagColor = (tag: string): string => {
        const colors: Record<string, string> = {
            WINNER: "from-green-500/20 to-green-600/10 border-green-500/30",
            LOOSER: "from-red-500/20 to-red-600/10 border-red-500/30",
            INSIDER: "from-orange-500/20 to-orange-600/10 border-orange-500/30 animate-pulse",
            SMART_MONEY: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
            DUMB_MONEY: "from-gray-500/20 to-gray-600/10 border-gray-500/30",
            UNKNOWN: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
        };
        return colors[tag] || colors.UNKNOWN;
    };

    const getTagTextColor = (tag: string): string => {
        const colors: Record<string, string> = {
            WINNER: "text-green-400",
            LOOSER: "text-red-400",
            INSIDER: "text-orange-400",
            SMART_MONEY: "text-blue-400",
            DUMB_MONEY: "text-gray-400",
            UNKNOWN: "text-purple-400",
        };
        return colors[tag] || colors.UNKNOWN;
    };

    const tags = ["ALL", "WINNER", "LOOSER", "INSIDER", "SMART_MONEY", "DUMB_MONEY", "UNKNOWN"];

    return (
        <>
            <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full min-h-[400px]">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Terminal size={14} className="text-blue-500" />
                        Whale Radar - Live Transactions
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Tag Filter */}
                        <div className="flex items-center gap-1">
                            <Filter size={12} className="text-muted-foreground" />
                            <select
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                            >
                                {tags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>

                        {/* Live Status */}
                        <div
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${autoScroll ? 'text-green-500' : 'text-yellow-500'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${autoScroll ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                            {autoScroll ? 'Live' : 'Paused'}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-3 py-2 border-b border-border bg-muted/10">
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by market or wallet..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Transactions List */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 bg-black/90 scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent"
                >
                    {filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                            <ScrollText size={32} className="mb-2" />
                            <p>Waiting for whale transactions...</p>
                            <p className="text-[10px] mt-1">Tracker should be running to see live data</p>
                        </div>
                    ) : (
                        filteredTransactions.map((tx) => {
                            const time = new Date(tx.timestamp).toLocaleTimeString('en-US', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });

                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => setSelectedTx(tx)}
                                    className={`
                    p-3 rounded-lg border-2 bg-gradient-to-r cursor-pointer
                    transition-all hover:scale-[1.02] hover:shadow-lg
                    ${getTagColor(tx.walletTag)}
                  `}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-muted-foreground text-[10px]">[{time}]</span>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${getTagTextColor(tx.walletTag)}`}>
                                            {tx.walletTag}
                                        </span>
                                    </div>

                                    <div className="text-white font-semibold">
                                        🐋 ${(tx.amount ?? 0).toLocaleString()} {tx.outcome ?? 'N/A'} @ {(tx.price ?? 0).toFixed(2)}
                                    </div>

                                    <div className="text-blue-300 text-[11px] mt-1 truncate">
                                        "{tx.marketQuestion}"
                                    </div>

                                    <div className="text-muted-foreground text-[10px] mt-1">
                                        {tx.walletAddress.substring(0, 10)}...
                                        {tx.walletWinRate !== undefined && tx.walletWinRate !== null && (
                                            <span className="ml-2">| WR: {(tx.walletWinRate * 100).toFixed(0)}%</span>
                                        )}
                                        {tx.walletTotalPnl !== undefined && tx.walletTotalPnl !== null && (
                                            <span className="ml-2">| PnL: ${tx.walletTotalPnl.toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Stats Footer */}
                <div className="px-3 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>{filteredTransactions.length} transactions</span>
                        <span className="text-[10px]">Click any transaction for details</span>
                    </div>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedTx(null)}
                >
                    <div
                        className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`p-4 border-b border-border bg-gradient-to-r ${getTagColor(selectedTx.walletTag)}`}>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    🐋 Whale Transaction
                                    <span className={`text-sm ${getTagTextColor(selectedTx.walletTag)}`}>
                                        {selectedTx.walletTag}
                                    </span>
                                </h2>
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="text-white/70 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Transaction Details */}
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-3">Transaction Details</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-muted-foreground text-xs">Amount</div>
                                        <div className="font-bold text-green-400">${(selectedTx.amount ?? 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs">Outcome</div>
                                        <div className="font-bold">{selectedTx.outcome ?? 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs">Price</div>
                                        <div className="font-bold">{(selectedTx.price ?? 0).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs">Timestamp</div>
                                        <div className="text-xs">{selectedTx.timestamp ? new Date(selectedTx.timestamp).toLocaleString() : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Market Info */}
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-2">Market</h3>
                                <div className="text-blue-300 text-sm mb-2">"{selectedTx.marketQuestion}"</div>
                                <a
                                    href={`https://polymarket.com/event/${selectedTx.marketSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    View on Polymarket
                                </a>
                            </div>

                            {/* Whale Profile */}
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-3">Whale Profile</h3>
                                <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Address</span>
                                        <span className="font-mono text-xs">{selectedTx.walletAddress}</span>
                                    </div>
                                    {selectedTx.walletWinRate != null && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Win Rate</span>
                                            <span className="font-bold text-green-400">
                                                {((selectedTx.walletWinRate ?? 0) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                    {selectedTx.walletTotalPnl != null && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total PnL</span>
                                            <span className={`font-bold ${(selectedTx.walletTotalPnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${(selectedTx.walletTotalPnl ?? 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transaction Hash */}
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-2">Blockchain</h3>
                                <div className="bg-black/50 rounded p-2 font-mono text-xs text-blue-400 break-all">
                                    {selectedTx.txHash}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
