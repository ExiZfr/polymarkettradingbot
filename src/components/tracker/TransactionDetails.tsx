import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, ExternalLink, Activity, DollarSign, TrendingUp, Wallet, Clock, Trophy, Target, Copy, RefreshCcw } from 'lucide-react';
import type { WhaleTransaction } from '@/types/tracker';
import { getTagConfig, formatAmount, formatTimeAgo } from '@/lib/tracker-utils';
import CopyTradeModal from './CopyTradeModal';

interface TransactionDetailsProps {
    transaction: WhaleTransaction;
    onClose: () => void;
}

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [tradeMode, setTradeMode] = useState<'copy' | 'inverse'>('copy');

    if (!transaction) return null;

    const isBuy = transaction.outcome?.toUpperCase() === 'YES';
    const outcomeColor = isBuy ? 'text-green-400' : 'text-red-400';
    const outcomeBg = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';
    const tagConfig = getTagConfig(transaction.wallet_tag);

    // Open trade modal with mode
    const handleCopyTrade = () => {
        setTradeMode('copy');
        setTradeModalOpen(true);
    };

    const handleInverseTrade = () => {
        setTradeMode('inverse');
        setTradeModalOpen(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="relative w-full max-w-2xl bg-[#0a0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Banner with "Fade" Effect */}
                <div className="relative bg-gradient-to-b from-blue-900/20 via-[#0a0f16]/80 to-[#0a0f16] pt-12 pb-8 px-8 shrink-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />

                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {/* Market Icon */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                                    {transaction.market_image ? (
                                        <img
                                            src={transaction.market_image}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span className="text-2xl">📊</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-wider uppercase">
                                        <Target className="w-4 h-4" />
                                        Market Detection
                                    </div>
                                    <h2 className="text-2xl font-bold text-white leading-tight max-w-lg">
                                        {transaction.market_question}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-3xl font-mono font-bold text-white tracking-tight">
                                    {(transaction.price * 100).toFixed(1)}¢
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${outcomeBg} ${outcomeColor} border border-white/5`}>
                                    {transaction.outcome} Position
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 custom-scrollbar">

                    {/* Primary Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
                                    <DollarSign className="w-4 h-4 text-blue-400" />
                                    Total Value
                                </div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    ${transaction.amount.toLocaleString()}
                                </div>
                            </div>
                            <div className="absolute -right-4 -bottom-4 bg-blue-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    Time
                                </div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(transaction.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Whale Profile Card */}
                    <div className="rounded-xl border border-white/10 overflow-hidden bg-gradient-to-r from-white/5 to-transparent">
                        <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-gray-400" />
                                Whale Profile
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 ${tagConfig.bg} ${tagConfig.color}`}>
                                {transaction.wallet_tag}
                            </span>
                        </div>
                        <div className="p-5 flex items-center gap-6">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 flex items-center justify-center shadow-xl">
                                <span className="text-2xl flex items-center justify-center text-white">
                                    {/* Render icon based on type (string for emoji, component for Lucide) */}
                                    {typeof tagConfig.icon === 'string' ? (
                                        tagConfig.icon
                                    ) : (
                                        <tagConfig.icon className="w-6 h-6 text-white" />
                                    )}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white truncate">{transaction.wallet_tag}</h3>
                                </div>
                                <div className="text-xs font-mono text-gray-500 truncate bg-black/30 px-2 py-1 rounded w-fit">
                                    {transaction.wallet_address}
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-xs text-gray-500">Win Rate</div>
                                <div className="text-sm font-bold text-green-400 flex items-center justify-end gap-1">
                                    <Trophy className="w-3 h-3" />
                                    {transaction.wallet_win_rate ? `${(transaction.wallet_win_rate * 100).toFixed(0)}%` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <a
                            href={transaction.market_url || `https://polymarket.com/search?q=${encodeURIComponent(transaction.market_question)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                        >
                            View on Polymarket
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        <a
                            href={`https://polygonscan.com/address/${transaction.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors border border-white/5 hover:border-white/20"
                        >
                            <Activity className="w-4 h-4" />
                            View on Polygonscan
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                        <a
                            href={`https://polymarket.com/profile/${transaction.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors border border-white/5 hover:border-white/20"
                        >
                            <Wallet className="w-4 h-4" />
                            Polymarket Profile
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>

                        {/* Copy/Inverse Trade Buttons */}
                        <button
                            onClick={handleCopyTrade}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20 hover:border-green-500/40"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Trade
                        </button>
                        <button
                            onClick={handleInverseTrade}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/40"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Inverse Trade
                        </button>
                    </div>

                </div>
            </motion.div>

            {/* Copy Trade Modal */}
            <CopyTradeModal
                isOpen={tradeModalOpen}
                onClose={() => setTradeModalOpen(false)}
                transaction={transaction}
                mode={tradeMode}
            />
        </div>
    );
}
