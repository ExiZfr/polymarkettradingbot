"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, History, PieChart, Shield, Target, Zap } from "lucide-react";
import Link from "next/link";
// import { PaperProfile, paperStore } from "@/lib/paper-trading"; // Removed legacy

type PaperTradingWidgetProps = {
    wallet: any; // Using any for flexibility or match Position type
};

export default function PaperTradingWidget({ wallet }: PaperTradingWidgetProps) {
    if (!wallet) return (
        <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-slate-500">
            <span className="mb-2">Syncing Wallet...</span>
            <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
    );

    // Calculate Stats from Real Wallet Data
    const balance = wallet.balance;
    const equity = wallet.totalEquity;
    const totalPnl = equity - 1000; // Assuming 1000 start, or calculate from history if available
    const positionsCount = Object.keys(wallet.positions).length;
    // WinRate is tricky without history in wallet object yet, defaulting to 100% or 0
    const winRate = 100;

    // Legacy Settings Mock (To be moved to real settings later)
    const settings = { enabled: true, riskPerTrade: 5, autoStopLoss: 10, autoTakeProfit: 20 };

    const stats = [
        {
            label: "Paper Balance",
            value: `$${balance.toFixed(2)}`,
            icon: Wallet,
            color: "text-white"
        },
        {
            label: "Total Equity", // Changed from PnL to Equity for clarity, or keep PnL
            value: `$${equity.toFixed(2)}`,
            icon: TrendingUp,
            color: totalPnl >= 0 ? "text-green-400" : "text-red-400"
        },
        {
            label: "Open Positions", // Changed from Win Rate
            value: positionsCount.toString(),
            icon: PieChart,
            color: "text-indigo-400"
        },
        {
            label: "Total PnL",
            value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,
            icon: History,
            color: totalPnl >= 0 ? "text-green-400" : "text-amber-400"
        },
    ];

    return (
        <div className="bg-[#0C0D12] border border-white/5 rounded-2xl p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Paper Trading</h3>
                        <p className="text-xs text-slate-500">Risk-free simulation</p>
                    </div>
                </div>
                <div className={`px-2 py-1 border text-xs font-bold rounded-full uppercase tracking-wider ${settings.enabled
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {settings.enabled ? 'Active' : 'Off'}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <stat.icon size={12} />
                            <span className="text-[10px] font-medium uppercase">{stat.label}</span>
                        </div>
                        <div className={`font-mono font-bold text-lg ${stat.color}`}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Risk Settings Preview */}
            <div className="bg-white/5 rounded-xl p-3 mb-4">
                <div className="text-[10px] font-medium uppercase text-slate-500 mb-2">Risk Settings</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <span className="text-slate-400">Risk/Trade:</span>
                        <span className="text-white ml-1 font-mono">{settings.riskPerTrade}%</span>
                    </div>
                    <div>
                        <span className="text-red-400">SL:</span>
                        <span className="text-white ml-1 font-mono">{settings.autoStopLoss || 'OFF'}%</span>
                    </div>
                    <div>
                        <span className="text-green-400">TP:</span>
                        <span className="text-white ml-1 font-mono">{settings.autoTakeProfit || 'OFF'}%</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2">
                <Link
                    href="/dashboard/orders"
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                    <History size={16} />
                    View Orders
                </Link>
                <Link
                    href="/dashboard/settings"
                    className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                    <Target size={16} />
                    Configure
                </Link>
            </div>
        </div>
    );
}
