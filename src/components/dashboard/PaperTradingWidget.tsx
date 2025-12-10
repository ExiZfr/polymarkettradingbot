"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, History, PieChart, Shield, Target, Zap } from "lucide-react";
import Link from "next/link";

type PaperTradingWidgetProps = {
    wallet: {
        balance: number;
        positions?: Record<string, any>; // Optional for now
        totalEquity?: number; // Optional for now
    };
};

export default function PaperTradingWidget({ wallet }: PaperTradingWidgetProps) {
    // Safe defaults
    const balance = wallet?.balance ?? 1000;
    const positions = wallet?.positions ?? {};
    const equity = wallet?.totalEquity ?? balance;
    const totalPnl = equity - 1000;
    const positionsCount = Object.keys(positions).length;

    // Simulation Settings (Read-only for now)
    const settings = { enabled: true, riskPerTrade: 5, autoStopLoss: 10, autoTakeProfit: 20 };

    const stats = [
        {
            label: "Paper Balance",
            value: `$${balance.toFixed(2)}`,
            icon: Wallet,
            color: "text-gray-900 dark:text-white"
        },
        {
            label: "Total Equity",
            value: `$${equity.toFixed(2)}`,
            icon: TrendingUp,
            color: totalPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        },
        {
            label: "Open Positions",
            value: positionsCount.toString(),
            icon: PieChart,
            color: "text-blue-600 dark:text-blue-400"
        },
        {
            label: "Total PnL",
            value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,
            icon: History,
            color: totalPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
        },
    ];

    return (
        <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Paper Trading</h3>
                        <p className="text-xs text-muted-foreground">Risk-free simulation</p>
                    </div>
                </div>
                <div className={`px-2 py-1 border text-xs font-bold rounded-full uppercase tracking-wider ${settings.enabled
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                    }`}>
                    {settings.enabled ? 'Active' : 'Off'}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-muted/30 p-3 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
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
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 mb-4">
                <div className="text-[10px] font-medium uppercase text-muted-foreground mb-2">Risk Settings</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <span className="text-muted-foreground">Risk/Trade:</span>
                        <span className="text-foreground ml-1 font-mono">{settings.riskPerTrade}%</span>
                    </div>
                    <div>
                        <span className="text-red-500">SL:</span>
                        <span className="text-foreground ml-1 font-mono">{settings.autoStopLoss || 'OFF'}%</span>
                    </div>
                    <div>
                        <span className="text-green-500">TP:</span>
                        <span className="text-foreground ml-1 font-mono">{settings.autoTakeProfit || 'OFF'}%</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2">
                <Link
                    href="/dashboard/settings"
                    className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                    <Target size={16} />
                    Configure
                </Link>
            </div>
        </div>
    );
}
