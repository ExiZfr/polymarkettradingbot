"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, ScrollText } from "lucide-react";

export default function RadarLogsConsole() {
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/radar/logs');
                if (res.ok) {
                    const data = await res.json();
                    setLogs((data.logs || []).slice(-50)); // Limit to 50 entries
                }
            } catch (e) {
                console.error("Failed to fetch radar logs", e);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 15000); // 15 seconds (optimized)
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logic (Internal container ONLY)
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            const { scrollHeight, clientHeight } = scrollRef.current;
            scrollRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [logs, autoScroll]);

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Terminal size={14} className="text-blue-500" />
                    Radar Terminal
                </div>
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
                    logs.map((line, i) => (
                        <div key={i} className="break-all whitespace-pre-wrap border-l-2 border-transparent hover:border-blue-500/50 hover:bg-white/5 pl-2 transition-colors">
                            <span className="opacity-50 select-none mr-2">{i + 1}</span>
                            {line}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
