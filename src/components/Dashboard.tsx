"use client";

import { useState, useEffect } from "react";
import OverviewStats from "@/components/dashboard/OverviewStats";
import ActiveModules, { ModuleType } from "@/components/dashboard/ActiveModules";
import ConsoleLogs, { LogType } from "@/components/dashboard/ConsoleLogs";
import PaperTradingWidget from "@/components/dashboard/PaperTradingWidget";
import { Wallet, Settings as SettingsIcon } from "lucide-react";

const MODULES_CONFIG: ModuleType[] = [
    {
        id: 1,
        name: "Paper Trading",
        description: "Trade simulation mode",
        icon: Wallet,
        active: true,
        color: "text-green-500",
        stats: [
            { label: "Active", value: "Yes" },
            { label: "Trades", value: "—" }
        ]
    },
    {
        id: 2,
        name: "Settings",
        description: "Bot configuration",
        icon: SettingsIcon,
        active: true,
        color: "text-indigo-500",
        stats: [
            { label: "Mode", value: "Paper" },
            { label: "Status", value: "Ready" }
        ]
    }
];

export default function Dashboard() {
    const [modules, setModules] = useState<ModuleType[]>(MODULES_CONFIG);
    const [logs, setLogs] = useState<LogType[]>([
        {
            id: 1,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Dashboard loaded successfully'
        },
        {
            id: 2,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Paper trading mode active'
        }
    ]);
    const [stats, setStats] = useState({
        marketsScanned: 0,
        snipableMarkets: 0,
        avgScore: 0,
        highestScore: 0
    });
    const [consoleFilter, setConsoleFilter] = useState<'ALL' | 'ORDER' | 'SNIPE' | 'SIGNAL' | 'WARN'>('ALL');
    const [wallet, setWallet] = useState({ balance: 1000 });

    // Load wallet balance from paper trading
    useEffect(() => {
        const loadWallet = async () => {
            try {
                const res = await fetch('/api/paper/profiles');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.profiles) {
                        const activeProfile = Object.values(data.profiles).find((p: any) =>
                            p.id === data.activeProfileId
                        ) as any;
                        if (activeProfile) {
                            setWallet({ balance: activeProfile.balance });

                            // Update module stats
                            setModules(prev => prev.map(m => {
                                if (m.name === "Paper Trading") {
                                    return {
                                        ...m,
                                        stats: [
                                            { label: "Balance", value: `$${activeProfile.balance.toFixed(0)}` },
                                            { label: "Trades", value: "0" }
                                        ]
                                    };
                                }
                                return m;
                            }));
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load wallet", e);
            }
        };

        loadWallet();
    }, []);

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
                    <PaperTradingWidget wallet={wallet} />
                </div>
            </div>
        </div>
    );
}
