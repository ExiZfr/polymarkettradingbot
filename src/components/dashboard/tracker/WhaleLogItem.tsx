import { motion } from 'framer-motion';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { getTagConfig, formatAmount, formatTimeAgo } from '@/lib/tracker-utils';
import type { WhaleTransaction } from '@/types/tracker';
import { useState } from 'react';

interface Props {
    tx: WhaleTransaction;
    onClick: (tx: WhaleTransaction) => void;
}

export default function WhaleLogItem({ tx, onClick }: Props) {
    const [copied, setCopied] = useState<string | null>(null);
    const tagConfig = getTagConfig(tx.wallet_tag);
    const TagIcon = tagConfig.icon;
    const outcomeColor = tx.outcome === 'YES' ? 'text-green-400' : tx.outcome === 'NO' ? 'text-red-400' : 'text-blue-400';
    const outcomeBg = tx.outcome === 'YES' ? 'bg-green-500/10' : tx.outcome === 'NO' ? 'bg-red-500/10' : 'bg-blue-500/10';

    const copyAddress = (e: React.MouseEvent, address: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(address);
        setCopied(address);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <motion.div
            layoutId={tx.tx_hash}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={() => onClick(tx)}
            className="group cursor-pointer bg-[#0d121d] border border-white/5 hover:border-blue-500/30 hover:bg-[#131b29] hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] rounded-xl p-4 transition-all duration-300 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/0 group-hover:via-blue-500/5 group-hover:to-blue-500/0 transition-all duration-500" />

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative z-10">
                {/* Left: Wallet & Tag */}
                <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[200px]">
                    <div className={`p-2.5 rounded-lg ${tagConfig.bg} ${tagConfig.border} border shrink-0 group-hover:scale-105 transition-transform`}>
                        <TagIcon className={`w-5 h-5 ${tagConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={`text-sm font-bold ${tagConfig.color} truncate shadow-sm`}>{tx.wallet_tag}</span>
                            {tx.wallet_win_rate && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tx.wallet_win_rate > 0.6 ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    {(tx.wallet_win_rate * 100).toFixed(0)}% WR
                                </span>
                            )}
                        </div>
                        <button
                            onClick={(e) => copyAddress(e, tx.wallet_address)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 font-mono hover:text-blue-400 transition-colors w-full group/copy"
                        >
                            <span className="truncate">{tx.wallet_address.slice(0, 6)}...{tx.wallet_address.slice(-4)}</span>
                            <span className="opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                {copied === tx.wallet_address ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Middle: Market Info */}
                <div className="flex-1 w-full md:w-auto min-w-0 md:px-4">
                    <h3 className="text-sm font-medium text-gray-300 line-clamp-1 mb-2 group-hover:text-white transition-colors">
                        {tx.market_question || "Unknown Market"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset ${outcomeBg} ${outcomeColor} ring-white/5`}>
                            {tx.outcome}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">@</span>
                            <span className="font-mono font-medium text-gray-300">{(tx.price * 100).toFixed(1)}¢</span>
                            <span className="w-1 h-1 rounded-full bg-gray-700 mx-1" />
                            <span className="font-mono font-bold text-blue-400 shadow-blue-500/10 drop-shadow-sm">
                                {formatAmount(tx.amount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Time & Chevron */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-2 md:pt-0 border-t border-white/5 md:border-0">
                    <div className="text-right">
                        <span className="text-xs text-gray-600 font-mono block group-hover:text-gray-500 transition-colors">
                            {formatTimeAgo(tx.timestamp)}
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all group-hover:translate-x-1">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
