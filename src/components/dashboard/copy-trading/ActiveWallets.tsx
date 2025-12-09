"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Trash2, Edit2, Shield, Zap, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CopySetting {
    walletAddress: string;
    label?: string;
    enabled: boolean;
    copyMode: string;
    fixedAmount?: number;
    percentageAmount?: number;
    inverse?: boolean;
    pnl?: number; // Mocked or calculated
}

interface CopiedTrade {
    id: string;
    market: string;
    side: string; // YES or NO
    buyPrice: number;
    shares: number;
    amount: number;
    timestamp: string;
    status: 'open' | 'closed';
    currentPrice?: number;
    pnl?: number;
}

interface ActiveWalletsProps {
    isPaperMode: boolean;
}

export function ActiveWallets({ isPaperMode }: ActiveWalletsProps) {
    const [wallets, setWallets] = useState<CopySetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
    const [tradeHistory, setTradeHistory] = useState<Record<string, CopiedTrade[]>>({});

    const fetchWallets = async () => {
        setLoading(true);
        try {
            if (isPaperMode) {
                const res = await fetch('/api/paper/copy');
                const data = await res.json();
                const settings = Object.values(data.copySettings || {}) as CopySetting[];
                // Mock PnL for paper mode for now, or fetch from snapshots if available
                const settingsWithMockPnl = settings.map(s => ({ ...s, pnl: (Math.random() * 200) - 50 }));
                setWallets(settingsWithMockPnl);
            } else {
                // Real mode mock
                setWallets([
                    { walletAddress: '0x1234...5678', label: 'Whale 1', enabled: true, copyMode: 'fixed', fixedAmount: 50, pnl: 4500 },
                    { walletAddress: '0x8765...4321', label: 'Alpha Sniper', enabled: true, copyMode: 'percentage', percentageAmount: 5, pnl: 2100 },
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch copy settings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, [isPaperMode]);

    const handleDelete = async (address: string) => {
        if (!confirm('Stop copying this wallet?')) return;

        if (isPaperMode) {
            await fetch(`/api/paper/copy?address=${address}`, { method: 'DELETE' });
            fetchWallets();
        } else {
            alert('Real mode deletion not implemented yet');
        }
    };

    const handleToggleInverse = async (wallet: CopySetting) => {
        if (isPaperMode) {
            try {
                // Update the wallet with inverse flag toggled
                const res = await fetch('/api/paper/copy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...wallet,
                        inverse: !wallet.inverse
                    })
                });

                if (res.ok) {
                    fetchWallets();
                }
            } catch (error) {
                console.error("Failed to toggle inverse mode", error);
            }
        } else {
            alert('Real mode not implemented yet');
        }
    };

    const handleExpand = async (walletAddress: string) => {
        if (expandedWallet === walletAddress) {
            setExpandedWallet(null);
        } else {
            setExpandedWallet(walletAddress);

            // Fetch trade history if not already loaded
            if (!tradeHistory[walletAddress] && isPaperMode) {
                try {
                    // Mock trade data for now - in real implementation, fetch from API
                    const mockTrades: CopiedTrade[] = [
                        {
                            id: '1',
                            market: 'Will Bitcoin reach $100k by EOY?',
                            side: 'YES',
                            buyPrice: 0.65,
                            shares: 100,
                            amount: 65,
                            timestamp: new Date(Date.now() - 3600000).toISOString(),
                            status: 'open',
                            currentPrice: 0.72,
                            pnl: 7
                        },
                        {
                            id: '2',
                            market: 'Trump wins 2024 election?',
                            side: 'NO',
                            buyPrice: 0.45,
                            shares: 50,
                            amount: 22.5,
                            timestamp: new Date(Date.now() - 7200000).toISOString(),
                            status: 'open',
                            currentPrice: 0.38,
                            pnl: 3.5
                        }
                    ];

                    setTradeHistory(prev => ({
                        ...prev,
                        [walletAddress]: mockTrades
                    }));
                } catch (error) {
                    console.error("Failed to fetch trade history", error);
                }
            }
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500 animate-pulse">Loading active wallets...</div>;
    }

    if (wallets.length === 0) {
        return (
            <div className="p-10 text-center flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-xl bg-[#171717]/50">
                <div className="w-12 h-12 bg-[#262626] rounded-full flex items-center justify-center mb-4">
                    <Copy className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">No Active Copies</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-xs">
                    Start copying top traders from the leaderboard to automate your positions.
                </p>
                <Link href="/dashboard/copy-trading/leaderboard">
                    <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Go to Leaderboard
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
                {wallets.map((wallet) => (
                    <motion.div
                        key={wallet.walletAddress}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#171717] border border-[#262626] rounded-xl p-5 hover:border-[#404040] transition-colors group relative overflow-hidden"
                    >
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${wallet.enabled ? 'bg-green-500' : 'bg-gray-600'}`} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20">
                                    {wallet.label?.[0] || wallet.walletAddress[2]}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white">{wallet.label || 'Unknown Trader'}</h3>
                                        {wallet.inverse && (
                                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/30">
                                                Inverse
                                            </span>
                                        )}
                                        {isPaperMode && (
                                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/30 flex items-center gap-1">
                                                <Shield size={8} /> Paper
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                        {wallet.walletAddress}
                                        <button className="hover:text-white" onClick={() => navigator.clipboard.writeText(wallet.walletAddress)}>
                                            <Copy size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                {/* Configuration Stats */}
                                <div className="hidden md:block">
                                    <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">Configuration</div>
                                    <div className="text-sm font-medium text-slate-300">
                                        {wallet.copyMode === 'fixed' ? `$${wallet.fixedAmount} / trade` : `${wallet.percentageAmount}% portfolio`}
                                    </div>
                                </div>

                                {/* Performance */}
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">Net PnL</div>
                                    <div className={`text-sm font-bold font-mono ${(wallet.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {(wallet.pnl || 0) >= 0 ? '+' : ''}${(wallet.pnl || 0).toFixed(2)}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleExpand(wallet.walletAddress)}
                                        title="View Trade History"
                                        className="p-2 bg-[#262626] hover:bg-[#333] rounded-lg text-slate-400 hover:text-white transition-colors"
                                    >
                                        {expandedWallet === wallet.walletAddress ? (
                                            <ChevronUp size={16} />
                                        ) : (
                                            <ChevronDown size={16} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleToggleInverse(wallet)}
                                        title={wallet.inverse ? "Switch to Normal Copy" : "Switch to Inverse Copy"}
                                        className={`p-2 rounded-lg transition-colors ${wallet.inverse
                                            ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                            : 'bg-[#262626] text-slate-400 hover:bg-orange-500/20 hover:text-orange-400'
                                            }`}
                                    >
                                        <TrendingUp size={16} className={wallet.inverse ? 'rotate-180' : ''} />
                                    </button>
                                    <button className="p-2 bg-[#262626] hover:bg-[#333] rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(wallet.walletAddress)}
                                        className="p-2 bg-[#262626] hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Trade History */}
                        <AnimatePresence>
                            {expandedWallet === wallet.walletAddress && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 pt-4 border-t border-[#262626]">
                                        <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                            <Activity size={14} />
                                            Copied Trades ({tradeHistory[wallet.walletAddress]?.length || 0})
                                        </h4>

                                        {tradeHistory[wallet.walletAddress]?.length > 0 ? (
                                            <div className="space-y-2">
                                                {tradeHistory[wallet.walletAddress].map((trade) => (
                                                    <div
                                                        key={trade.id}
                                                        className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3 hover:border-[#444] transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${trade.side === 'YES'
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                        {trade.side}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        {new Date(trade.timestamp).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-white font-medium line-clamp-1">
                                                                    {trade.market}
                                                                </p>
                                                            </div>
                                                            <div className="text-right ml-3">
                                                                <div className={`text-sm font-bold font-mono ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                                                    }`}>
                                                                    {(trade.pnl || 0) >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {trade.status === 'open' ? '🟢 Open' : '⚪ Closed'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Trade Metrics Grid */}
                                                        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#262626]">
                                                            <div>
                                                                <div className="text-[10px] text-slate-600 uppercase mb-0.5">Buy Price</div>
                                                                <div className="text-xs text-slate-300 font-mono">
                                                                    ${trade.buyPrice.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-600 uppercase mb-0.5">Current</div>
                                                                <div className="text-xs text-slate-300 font-mono">
                                                                    ${trade.currentPrice?.toFixed(2) || '-'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-600 uppercase mb-0.5">Shares</div>
                                                                <div className="text-xs text-slate-300 font-mono">
                                                                    {trade.shares}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-600 uppercase mb-0.5">Amount</div>
                                                                <div className="text-xs text-slate-300 font-mono">
                                                                    ${trade.amount.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-sm text-slate-500">
                                                No trades copied yet
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
