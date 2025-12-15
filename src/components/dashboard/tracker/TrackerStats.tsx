import { Activity, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { TrackerStats } from '@/types/tracker';

interface Props {
    stats: TrackerStats | null;
}

export default function TrackerStatsDisplay({ stats }: Props) {
    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tx Count</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalTransactions.toLocaleString() || 0}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Volume</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatAmount(stats?.totalVolume || 0)}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Whales</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.uniqueWhales || 0}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Size</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatAmount(stats?.avgTradeSize || 0)}</p>
            </div>
        </div>
    );
}
