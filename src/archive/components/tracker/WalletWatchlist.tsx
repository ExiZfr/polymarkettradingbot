"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye,
    EyeOff,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    Search,
    RefreshCw,
    ExternalLink,
    Copy,
    Check,
    Activity,
    Wallet,
    Star,
    X,
} from "lucide-react";
import WalletTradesModal from "./WalletTradesModal";

interface TrackedWallet {
    id: string;
    address: string;
    label: string | null;
    trades: number;
    volume: number;
    createdAt: string;
    tag: string;
    winRate: number;
    totalPnl: number;
    totalTrades: number;
    lastSeen: string;
    recentTrades: Array<{
        market: string;
        outcome: string;
        amount: number;
        timestamp: string;
    }>;
}

export default function WalletWatchlist() {
    const [wallets, setWallets] = useState<TrackedWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchAddress, setSearchAddress] = useState("");
    const [adding, setAdding] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    const fetchWatchlist = useCallback(async () => {
        try {
            const response = await fetch('/api/tracker/watchlist');
            if (response.ok) {
                const data = await response.json();
                setWallets(data.wallets || []);
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    const handleAddWallet = async () => {
        if (!searchAddress.trim()) return;
        setAdding(true);
        try {
            const response = await fetch('/api/tracker/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: searchAddress.trim() }),
            });
            if (response.ok) {
                setSearchAddress("");
                fetchWatchlist();
            }
        } catch (error) {
            console.error('Error adding wallet:', error);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveWallet = async (address: string) => {
        try {
            await fetch(`/api/tracker/watchlist?address=${address}`, {
                method: 'DELETE',
            });
            setWallets(wallets.filter(w => w.address !== address));
        } catch (error) {
            console.error('Error removing wallet:', error);
        }
    };

    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000);
    };

    const getTagColor = (tag: string) => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('winner') || tagLower.includes('smart')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (tagLower.includes('loser') || tagLower.includes('dumb')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        if (tagLower.includes('insider')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    };

    const formatAddress = (address: string) =>
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(2);
    };

    return (
        <div className="bg-[#0c0c0e] rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                        <Star size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Wallet Watchlist</h3>
                        <p className="text-white/40 text-xs">{wallets.length} wallets tracked</p>
                    </div>
                </div>
                <button
                    onClick={fetchWatchlist}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Add Wallet Input */}
            <div className="p-4 border-b border-white/5">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            placeholder="Enter wallet address to track..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWallet()}
                        />
                    </div>
                    <button
                        onClick={handleAddWallet}
                        disabled={adding || !searchAddress.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition-all"
                    >
                        {adding ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                        Add
                    </button>
                </div>
            </div>

            {/* Wallet List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-white/40">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                        Loading watchlist...
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="p-8 text-center text-white/40">
                        <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No wallets tracked yet</p>
                        <p className="text-xs mt-1">Add a wallet address to start tracking</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {wallets.map((wallet) => (
                            <motion.div
                                key={wallet.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Address & Tag */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <button
                                                onClick={() => handleCopyAddress(wallet.address)}
                                                className="font-mono text-sm text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                                            >
                                                {formatAddress(wallet.address)}
                                                {copiedAddress === wallet.address ? (
                                                    <Check size={12} className="text-emerald-400" />
                                                ) : (
                                                    <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </button>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTagColor(wallet.tag)}`}>
                                                {wallet.tag}
                                            </span>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Activity size={12} className="text-white/30" />
                                                <span className="text-white/60">{wallet.totalTrades} trades</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-white/30">Vol:</span>
                                                <span className="text-white/80">${formatCurrency(wallet.volume)}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 ${wallet.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {wallet.totalPnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                <span>${formatCurrency(Math.abs(wallet.totalPnl))}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-white/30">WR:</span>
                                                <span className={wallet.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                                                    {wallet.winRate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setSelectedWallet(wallet.address)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/50 hover:text-cyan-400 transition-all"
                                            title="View Trades"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveWallet(wallet.address)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-all"
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Wallet Trades Modal */}
            <AnimatePresence>
                {selectedWallet && (
                    <WalletTradesModal
                        address={selectedWallet}
                        onClose={() => setSelectedWallet(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
