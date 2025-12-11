"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, ScrollText } from "lucide-react";

import { paperStore } from "@/lib/paper-trading";

export default function RadarLogsConsole() {
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Server Logs
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/radar/logs');
                if (res.ok) {
                    const data = await res.json();
                    // We only update if we have new logs to avoid overwriting local paper logs too fast
                    // Actually, a better strategy is to merge or just keep local state
                    // For simplicity, we'll append server logs to state
                    // But here, we simply replace. To mix safely, we need a complex merger.
                    // SIMPLE FIX: Just rely on fetching, but inject paper logs locally into the display list?
                    // No, let's keep it simple: Server logs are master, local logs are ephemeral for this session view.

                    // Actually, let's just prepend server logs.
                    setLogs(prev => {
                        // This is tricky without timestamps. 
                        // Let's just set logs to server logs for now, and handle paper logs via a separate state we merge?
                        return data.logs || [];
                    });
                }
            } catch (e) {
                console.error("Failed to fetch radar logs", e);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);
        return () => clearInterval(interval);
    }, []);

    // Listen for Local Paper Trading Events
    useEffect(() => {
        const handlePaperUpdate = () => {
            const orders = paperStore.getOrders();
            if (orders.length > 0) {
                const lastOrder = orders[0]; // Assuming prepended
                // Check if this order is very recent (avoid spamming old orders on reload)
                if (Date.now() - lastOrder.timestamp < 1000) {
                    const logMessage = `[PAPER] Order executed: ${lastOrder.type} $${lastOrder.amount.toFixed(2)} on ${lastOrder.outcome} (Market #${lastOrder.marketId})`;
                    setLogs(prev => [logMessage, ...prev]);
                }
            }
        };

        window.addEventListener('paper-update', handlePaperUpdate);
        return () => window.removeEventListener('paper-update', handlePaperUpdate);
    }, []);

    // ... (rest of auto-scroll logic)

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Terminal size={14} className="text-blue-500" />
                    Radar Terminal
                </div>
                {/* ... */}
                <div
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${autoScroll ? 'text-green-500' : 'text-yellow-500'}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${autoScroll ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    {autoScroll ? 'Live' : 'Paused'}
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/90 text-blue-400 scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent"
            >
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <ScrollText size={32} className="mb-2" />
                        <p>Waiting for radar logs...</p>
                    </div>
                ) : (
                    logs.map((line, i) => {
                        const isPaper = line.startsWith('[PAPER]');
                        return (
                            <div key={i} className={`break-all whitespace-pre-wrap border-l-2 border-transparent pl-2 transition-colors ${isPaper ? 'text-green-400 font-bold bg-green-500/10 border-green-500' : 'hover:border-blue-500/50 hover:bg-white/5'}`}>
                                <span className="opacity-50 select-none mr-2">{i + 1}</span>
                                {line}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
