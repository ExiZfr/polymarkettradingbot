"use client";

import { useState, useEffect } from "react";
import OverviewStats from "@/components/dashboard/OverviewStats";
import ActiveModules, { ModuleType } from "@/components/dashboard/ActiveModules";
import ConsoleLogs, { LogType } from "@/components/dashboard/ConsoleLogs";
import PaperTradingWidget from "@/components/dashboard/PaperTradingWidget";
import { Wallet, Settings as SettingsIcon } from "lucide-react";

// Mock Data for Clean Slate
const INITIAL_BALANCE = 1000;

const MODULES_CONFIG: ModuleType[] = [
    {
        id: 1,
        name: "Paper Trading",
        description: "Trade simulation mode",
        icon: Wallet,
        active: true,
        color: "text-blue-500", // Changed to match Primary Blue
        stats: [
            { label: "Active", value: "Yes" },
            { label: "Balance", value: `$${INITIAL_BALANCE}` }
        ]
    },
    {
        id: 2,
        name: "Settings",
        description: "Bot configuration",
        icon: SettingsIcon,
        active: true,
        color: "text-gray-500",
        stats: [
            { label: "Mode", value: "Paper" },
            { label: "Status", value: "Ready" }
        ]
    }
];

export default function Dashboard() {
    // State management without backend API calls for now
    const [modules, setModules] = useState<ModuleType[]>(MODULES_CONFIG);
    const [logs, setLogs] = useState<LogType[]>([
        {
            id: 1,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'System initialized in Paper Trading Mode'
        },
        {
            id: 2,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Waiting for market data...'
        }
    ]);

    // Stats for the "Overview" cards
    const [stats, setStats] = useState({
        marketsScanned: 0,
        snipableMarkets: 0,
        avgScore: 0,
        highestScore: 0
    });

    const [consoleFilter, setConsoleFilter] = useState<'ALL' | 'ORDER' | 'SNIPE' | 'SIGNAL' | 'WARN'>('ALL');

    return (
        <div className="space-y-6">
            <OverviewStats stats={stats} />
            <ActiveModules modules={modules} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ConsoleLogs
                        logs={logs}
                        filter={consoleFilter}
                        setFilter={setConsoleFilter}
                    />
                </div>
                <div className="lg:col-span-1 h-full">
                    <PaperTradingWidget />
                </div>
            </div>
        </div>
    );
}
