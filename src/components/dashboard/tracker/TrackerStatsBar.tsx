import { Activity, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { TrackerStats } from '@/types/tracker';

interface Props {
    stats: TrackerStats | null;
}

export default function TrackerStatsBar({ stats }: Props) {
    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    return (
        <div className="flex items-center gap-6 px-4 py-2 bg-white/5 border-y border-white/10 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-500 uppercase">Tx</span>
                <span className="text-sm font-bold text-white font-mono">{stats?.totalTransactions.toLocaleString() || 0}</span>
            </div>
            <div className="w-px h-4 bg-white/10 shrink-0" />

            <div className="flex items-center gap-2 shrink-0">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-500 uppercase">Vol</span>
                <span className="text-sm font-bold text-white font-mono">{formatAmount(stats?.totalVolume || 0)}</span>
            </div>
            <div className="w-px h-4 bg-white/10 shrink-0" />

            <div className="flex items-center gap-2 shrink-0">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-500 uppercase">Whales</span>
                <span className="text-sm font-bold text-white font-mono">{stats?.uniqueWhales || 0}</span>
            </div>
            <div className="w-px h-4 bg-white/10 shrink-0" />

            <div className="flex items-center gap-2 shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-500 uppercase">Avg</span>
                <span className="text-sm font-bold text-white font-mono">{formatAmount(stats?.avgTradeSize || 0)}</span>
            </div>
        </div>
    );
}
