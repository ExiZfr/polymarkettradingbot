"use client";

import { useState, useEffect } from "react";
import OverviewStats from "@/components/dashboard/OverviewStats";
import ActiveModules, { ModuleType } from "@/components/dashboard/ActiveModules";
import ConsoleLogs, { LogType } from "@/components/dashboard/ConsoleLogs";
import PaperTradingWidget from "@/components/dashboard/PaperTradingWidget";
import { Radar, Zap, Users } from "lucide-react";

import { fetchPolymarketMarkets } from "@/lib/polymarket";
import { calculateSnipability } from "@/lib/snipability-algo";
import { ToastNotification, useToast } from "@/components/ToastNotification";
import { useWallet } from "@/contexts/WalletContext";

const MODULES_CONFIG: ModuleType[] = [
    {
        id: 1,
        name: "Sniper Engine",
        description: "Real-time opportunity detection",
        icon: Zap,
        active: true,
        color: "text-amber-500",
        stats: [
            { label: "Latency", value: "Loading..." },
            { label: "Markets", value: "—" }
        ]
    },
    {
        id: 2,
        name: "PolyRadar",
        description: "Live market scanner",
        icon: Radar,
        active: true,
        color: "text-blue-500",
        stats: [
            { label: "Scanned", value: "—" },
            { label: "Snipable", value: "—" }
        ]
    },
    {
        id: 3,
        name: "Whale Copy",
        description: "Smart money tracker",
        icon: Users,
        active: false,
        color: "text-purple-500",
        stats: [
            { label: "Tracked", value: "8" },
            { label: "Vol", value: "$45k" }
        ]
    }
];

export default function Dashboard() {
    const [modules, setModules] = useState<ModuleType[]>(MODULES_CONFIG);
    const [logs, setLogs] = useState<LogType[]>([]);
    const [stats, setStats] = useState({
        marketsScanned: 0,
        snipableMarkets: 0,
        avgScore: 0,
        highestScore: 0
    });
    const [consoleFilter, setConsoleFilter] = useState<'ALL' | 'ORDER' | 'SNIPE' | 'SIGNAL' | 'WARN'>('ALL');

    const { wallet } = useWallet();
    const { toasts, addToast, removeToast } = useToast();

    // Map log levels
    const mapLogLevel = (type: string): LogType['level'] => {
        switch (type) {
            case 'snipe': return 'SNIPE';
            case 'alert': return 'SNIPE'; // High-score market detected
            case 'signal': return 'SIGNAL'; // Signal detected
            case 'order': return 'ORDER';
            case 'error': return 'ERR';
            case 'warning': return 'WARN';
            case 'new_market': return 'MARKET';
            default: return 'INFO';
        }
    }

    // Fetch Logs Logic
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/listener/logs');
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data)) {
                    const formattedLogs: LogType[] = data.map((l: any) => ({
                        id: l.id,
                        timestamp: l.timestamp,
                        level: mapLogLevel(l.type),
                        message: l.message
                    }));
                    setLogs(formattedLogs.slice(0, 100));
                }
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    }

    // Load Metrics Logic
    async function loadRealMetrics() {
        try {
            const rawMarkets = await fetchPolymarketMarkets();

            const scored = rawMarkets.map(market => ({
                market,
                sniping: calculateSnipability(market)
            }));

            const snipable = scored.filter(m => m.sniping.score > 50);
            const totalScore = scored.reduce((sum, item) => sum + item.sniping.score, 0);
            const highest = Math.max(...scored.map(m => m.sniping.score), 0);

            setStats({
                marketsScanned: scored.length,
                snipableMarkets: snipable.length,
                avgScore: scored.length > 0 ? totalScore / scored.length : 0,
                highestScore: highest
            });

            setModules(prev => prev.map(m => {
                if (m.name === "Sniper Engine") {
                    return { ...m, stats: [{ label: "Latency", value: "45ms" }, { label: "Markets", value: scored.length.toString() }] };
                }
                if (m.name === "PolyRadar") {
                    return { ...m, stats: [{ label: "Scanned", value: scored.length.toString() }, { label: "Snipable", value: snipable.length.toString() }] };
                }
                return m;
            }));

        } catch (error) {
            console.error("Failed to load metrics", error);
        }
    }

    // Effects
    useEffect(() => {
        loadRealMetrics();
        fetchLogs();

        const interval = setInterval(() => {
            loadRealMetrics();
            fetchLogs();
        }, 5000);

        return () => {
            clearInterval(interval);
        };
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

            <ToastNotification toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
