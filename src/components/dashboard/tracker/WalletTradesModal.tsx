"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    X,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    Clock,
    Target,
    Award,
    Copy,
    Check,
    ChevronRight,
    Wallet,
} from "lucide-react";

interface WalletProfile {
    tag: string;
    winRate: number;
    totalPnl: number;
    totalTrades: number;
    totalVolume: number;
    avgPositionSize: number;
    currentStreak: number;
    maxWinStreak: number;
    maxLossStreak: number;
    firstSeen: string;
    lastSeen: string;
}

interface Transaction {
    id: string;
    txHash: string;
    timestamp: string;
    marketId: string;
    marketQuestion: string;
    marketSlug: string;
    marketUrl: string | null;
    marketImage: string | null;
    outcome: string;
    amount: number;
    price: number;
    shares: number;
    clusterName: string | null;
}

interface WalletData {
    address: string;
    isWatched: boolean;
    label: string;
    profile: WalletProfile | null;
    transactions: Transaction[];
    totalTransactions: number;
}

interface WalletTradesModalProps {
    address: string;
    onClose: () => void;
}

export default function WalletTradesModal({ address, onClose }: WalletTradesModalProps) {
    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                const response = await fetch(`/api/tracker/wallet/${address}`);
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Error fetching wallet data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWalletData();
    }, [address]);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatAddress = (addr: string) =>
        `${addr.slice(0, 8)}...${addr.slice(-6)}`;

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(2)}`;
    };

    const getTagColor = (tag: string) => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('winner') || tagLower.includes('smart')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (tagLower.includes('loser') || tagLower.includes('dumb')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        if (tagLower.includes('insider')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    };

    const profile = data?.profile;
    const isProfit = profile ? profile.totalPnl >= 0 : true;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                            <Wallet size={28} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <button
                                    onClick={handleCopyAddress}
                                    className="font-mono text-lg text-white hover:text-cyan-400 transition-colors flex items-center gap-2"
                                >
                                    {formatAddress(address)}
                                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="opacity-50" />}
                                </button>
                                {data?.label && (
                                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getTagColor(data.label)}`}>
                                        {data.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-white/40 text-sm">
                                {data?.totalTransactions || 0} transactions tracked
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-white/40">Loading wallet data...</div>
                    </div>
                ) : (
                    <>
                        {/* Profile Stats */}
                        {profile && (
                            <div className="grid grid-cols-4 gap-3 p-6 border-b border-white/5">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Win Rate</p>
                                    <p className={`text-xl font-bold ${profile.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {profile.winRate.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total P&L</p>
                                    <p className={`text-xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {isProfit ? '+' : ''}{formatCurrency(profile.totalPnl)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Volume</p>
                                    <p className="text-xl font-bold text-white">{formatCurrency(profile.totalVolume)}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Avg Trade</p>
                                    <p className="text-xl font-bold text-white">{formatCurrency(profile.avgPositionSize)}</p>
                                </div>
                            </div>
                        )}

                        {/* Transactions Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-[#09090b] z-10">
                                    <tr className="text-left text-xs text-white/40 uppercase tracking-wider border-b border-white/5">
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Market</th>
                                        <th className="p-4">Side</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Price</th>
                                        <th className="p-4 text-right">Shares</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data?.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 text-sm text-white/60">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 max-w-[250px]">
                                                    {tx.marketImage && (
                                                        <img
                                                            src={tx.marketImage}
                                                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                                        />
                                                    )}
                                                    <span className="text-sm text-white truncate">{tx.marketQuestion}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${tx.outcome === 'YES'
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {tx.outcome}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-mono text-sm text-white">
                                                ${tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-right font-mono text-sm text-white/80">
                                                ${tx.price.toFixed(3)}
                                            </td>
                                            <td className="p-4 text-right font-mono text-sm text-white/60">
                                                {tx.shares.toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                {tx.marketUrl && (
                                                    <a
                                                        href={tx.marketUrl}
                                                        target="_blank"
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all inline-flex"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {data?.transactions.length === 0 && (
                                <div className="p-12 text-center text-white/40">
                                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No transactions found for this wallet</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
