import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import WhaleLogItem from './WhaleLogItem';
import type { WhaleTransaction } from '@/types/tracker';

interface Props {
    transactions: WhaleTransaction[];
    loading?: boolean;
    onSelectTx: (tx: WhaleTransaction) => void;
}

export default function TrackerLogFeed({ transactions, loading, onSelectTx }: Props) {
    if (transactions.length === 0 && !loading) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center h-[400px] flex flex-col items-center justify-center">
                <div className="bg-white/5 p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-300">No activity detected</h3>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto">Waiting for new transactions that match your current filters...</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
                {transactions.map((tx) => (
                    <WhaleLogItem
                        key={tx.tx_hash}
                        tx={tx}
                        onClick={onSelectTx}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
