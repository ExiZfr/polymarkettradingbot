import { motion } from 'framer-motion';
import { X, ExternalLink, Activity, DollarSign, TrendingUp, Wallet, Clock, Trophy, Target, Share2 } from 'lucide-react';

interface TransactionDetailsProps {
    transaction: any;
    onClose: () => void;
}

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
    if (!transaction) return null;

    const isBuy = transaction.outcome?.toUpperCase() === 'YES'; // Approximate logic
    const color = isBuy ? 'text-green-400' : 'text-red-400';
    const bg = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';
    const border = isBuy ? 'border-green-500/20' : 'border-red-500/20';

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Slide-over Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-[#0a0f16] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#0a0f16]/90 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Transaction Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Market Title Section */}
                    <div>
                        <div className="text-xs text-blue-400 font-bold tracking-wider uppercase mb-2">Market</div>
                        <h1 className="text-2xl font-bold text-white leading-tight mb-4">
                            {transaction.market_question || "Unknown Market Request"}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${border} ${bg} ${color}`}>
                                {transaction.outcome}
                            </span>
                            <span className="text-gray-400">at</span>
                            <span className="text-xl font-bold text-white">{(transaction.price * 100).toFixed(1)}¢</span>
                        </div>
                    </div>

                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-medium">Total Value</span>
                            </div>
                            <div className="text-xl font-bold text-white">
                                ${(transaction.amount).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">Time</span>
                            </div>
                            <div className="text-xl font-bold text-white">
                                {new Date(transaction.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(transaction.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Whale Profile */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet className="w-24 h-24 text-white" />
                        </div>

                        <div className="relative z-10">
                            <div className="text-xs text-purple-300 font-bold tracking-wider uppercase mb-4">Whale Profile</div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                                    {transaction.wallet_tag[0] || '?'}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{transaction.wallet_tag}</div>
                                    <div className="text-sm text-gray-400 font-mono">{transaction.wallet_address}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                                    <div className="text-lg font-bold text-green-400 flex items-center gap-1">
                                        <Trophy className="w-3 h-3" />
                                        {transaction.wallet_win_rate ? `${(transaction.wallet_win_rate * 100).toFixed(0)}%` : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Performance</div>
                                    <div className="text-lg font-bold text-blue-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        High
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        <a
                            href={`https://polymarket.com/${transaction.market_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                        >
                            Execute on Polymarket
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors border border-white/5">
                                <Wallet className="w-4 h-4" />
                                Check Wallet
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors border border-white/5">
                                <Share2 className="w-4 h-4" />
                                Share Trade
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
