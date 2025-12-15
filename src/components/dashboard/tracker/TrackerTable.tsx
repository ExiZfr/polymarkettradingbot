import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Copy, Check, ExternalLink } from 'lucide-react';
import { getTagConfig, formatAmount, formatTimeAgo } from '@/lib/tracker-utils';
import type { WhaleTransaction } from '@/types/tracker';
import { useState } from 'react';

interface Props {
    transactions: WhaleTransaction[];
    loading?: boolean;
    onSelectTx: (tx: WhaleTransaction) => void;
}

export default function TrackerTable({ transactions, loading, onSelectTx }: Props) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyAddress = (e: React.MouseEvent, address: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(address);
        setCopied(address);
        setTimeout(() => setCopied(null), 2000);
    };

    if (transactions.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>No transactions found</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden flex flex-col h-full bg-[#0d121d] rounded-xl border border-white/5">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="col-span-2">Time</div>
                <div className="col-span-3">Whale</div>
                <div className="col-span-4">Market</div>
                <div className="col-span-1 text-center">Side</div>
                <div className="col-span-1 text-right">Size</div>
                <div className="col-span-1 text-right">Price</div>
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                <AnimatePresence initial={false}>
                    {transactions.map((tx) => {
                        const tagConfig = getTagConfig(tx.wallet_tag);
                        const isBuy = tx.outcome === 'YES'; // Simplified assumption or based on logic

                        return (
                            <motion.div
                                key={tx.tx_hash}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                onClick={() => onSelectTx(tx)}
                                className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/5 hover:bg-white/5 cursor-pointer items-center transition-colors text-sm group"
                            >
                                {/* Time */}
                                <div className="col-span-2 text-gray-500 font-mono text-xs">
                                    {formatTimeAgo(tx.timestamp)}
                                </div>

                                {/* Whale */}
                                <div className="col-span-3 flex items-center gap-2 min-w-0">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tagConfig.bg.replace('/10', '')} ${tagConfig.color}`} />
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-bold text-xs truncate ${tagConfig.color}`}>{tx.wallet_tag}</span>
                                        </div>
                                        <button
                                            onClick={(e) => copyAddress(e, tx.wallet_address)}
                                            className="text-[10px] text-gray-600 font-mono hover:text-gray-400 flex items-center gap-1"
                                        >
                                            {tx.wallet_address.slice(0, 4)}...{tx.wallet_address.slice(-4)}
                                            {copied === tx.wallet_address ? <Check className="w-2 h-2 text-green-500" /> : <Copy className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Market */}
                                <div className="col-span-4 min-w-0">
                                    <p className="truncate text-gray-300 group-hover:text-blue-300 transition-colors" title={tx.market_question}>
                                        {tx.market_question}
                                    </p>
                                </div>

                                {/* Side */}
                                <div className="col-span-1 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.outcome === 'YES' ? 'bg-green-500/10 text-green-400' :
                                            tx.outcome === 'NO' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {tx.outcome}
                                    </span>
                                </div>

                                {/* Size */}
                                <div className="col-span-1 text-right font-mono font-medium text-blue-400">
                                    {formatAmount(tx.amount)}
                                </div>

                                {/* Price */}
                                <div className="col-span-1 text-right font-mono text-gray-400">
                                    {(tx.price * 100).toFixed(1)}¢
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
