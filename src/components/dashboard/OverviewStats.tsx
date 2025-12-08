"use client";

import { motion } from "framer-motion";
import { Activity, Zap, Search, Trophy } from "lucide-react";

type StatsProps = {
    stats: {
        marketsScanned: number;
        snipableMarkets: number;
        avgScore: number;
        highestScore: number;
    };
};

export default function OverviewStats({ stats }: StatsProps) {
    const statItems = [
        {
            label: "Markets Scanned",
            value: stats.marketsScanned.toLocaleString(),
            icon: Search,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            label: "Snipable Opps",
            value: stats.snipableMarkets,
            icon: Zap,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
        {
            label: "Avg Score",
            value: stats.avgScore.toFixed(1),
            icon: Activity,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        },
        {
            label: "Highest Score",
            value: stats.highestScore.toFixed(1),
            icon: Trophy,
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#0C0D12] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors relative overflow-hidden group"
                >
                    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}>
                        <item.icon size={60} />
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${item.bg} ${item.color} ${item.border} border`}>
                            <item.icon size={18} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {item.label}
                        </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                        {item.value}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
