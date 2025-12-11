"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, ScrollText } from "lucide-react";

export default function FileLogsConsole() {
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/sniper/logs');
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 2000); // 2 seconds poll
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Terminal size={14} className="text-primary" />
                    Live Terminal
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Monitoring
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/90 text-green-400">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <ScrollText size={32} className="mb-2" />
                        <p>Waiting for logs...</p>
                    </div>
                ) : (
                    logs.map((line, i) => (
                        <div key={i} className="break-all whitespace-pre-wrap border-l-2 border-transparent hover:border-green-500/50 hover:bg-white/5 pl-2 transition-colors">
                            <span className="opacity-50 select-none mr-2">{i + 1}</span>
                            {line}
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
