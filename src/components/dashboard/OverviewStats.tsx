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
    if (!stats) return null; // Safety check

    const statItems = [
        {
            label: "Markets Scanned",
            value: stats.marketsScanned?.toLocaleString() || "0",
            icon: Search,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-100 dark:border-blue-900/30",
        },
        {
            label: "Snipable Opps",
            value: stats.snipableMarkets || 0,
            icon: Zap,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-100 dark:border-amber-900/30",
        },
        {
            label: "Avg Score",
            value: stats.avgScore?.toFixed(1) || "0.0",
            icon: Activity,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            border: "border-purple-100 dark:border-purple-900/30",
        },
        {
            label: "Highest Score",
            value: stats.highestScore?.toFixed(1) || "0.0",
            icon: Trophy,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-900/20",
            border: "border-green-100 dark:border-green-900/30",
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
                    className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors relative overflow-hidden group shadow-sm"
                >
                    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}>
                        <item.icon size={60} />
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${item.bg} ${item.color} ${item.border} border`}>
                            <item.icon size={18} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {item.label}
                        </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-mono">
                        {item.value}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
