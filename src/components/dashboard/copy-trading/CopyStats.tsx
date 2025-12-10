"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface CopyStatsProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    subtext?: string;
    description?: string;
}

export function CopyStats({ title, value, icon, trend, trendUp, subtext, description }: CopyStatsProps) {
    return (
        <div className="bg-[#171717] border border-[#262626] p-5 rounded-xl hover:border-[#404040] transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20 group relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-gray-400 text-sm font-medium">{title}</span>
                <div className="p-2 bg-[#262626] rounded-lg group-hover:bg-[#333] transition-colors text-gray-300 group-hover:text-white shadow-inner">
                    {icon}
                </div>
            </div>

            <div className="flex items-end justify-between relative z-10">
                <div>
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {value}
                    </div>
                    {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
                    {description && <div className="text-[10px] text-gray-600 mt-1 max-w-[120px] leading-tight">{description}</div>}
                </div>
                {trend && (
                    <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${trendUp ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CopyStats;
