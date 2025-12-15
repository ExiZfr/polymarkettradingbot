import { Activity, Users, Zap, Trophy, Skull, TrendingUp, Anchor, Target } from 'lucide-react';

export const getTagConfig = (tag: string) => {
    const lowerTag = tag.toLowerCase();

    // Smart Tags
    if (lowerTag.includes('insider')) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Users };
    if (lowerTag.includes('smart')) return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Zap };
    if (lowerTag.includes('winner')) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Trophy };
    if (lowerTag.includes('dumb')) return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Skull };
    if (lowerTag.includes('loser')) return { color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: TrendingUp };

    // Standard Volume Tags
    if (lowerTag.includes('whale')) return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Anchor };
    if (lowerTag.includes('shark')) return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Activity };
    if (lowerTag.includes('dolphin')) return { color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: Target };

    return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Zap };
};

export const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
};

export const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
};
