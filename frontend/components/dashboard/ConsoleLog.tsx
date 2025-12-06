"use client";

import React, { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, Activity, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: string;
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
    source: "LISTENER" | "SNIPER" | "ORACLE" | "SYSTEM";
    message: string;
}

export function ConsoleLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mock data simulation
    useEffect(() => {
        const interval = setInterval(() => {
            const sources: LogEntry["source"][] = ["LISTENER", "SNIPER", "ORACLE", "SYSTEM"];
            const levels: LogEntry["level"][] = ["INFO", "SUCCESS", "WARN"];

            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                level: levels[Math.floor(Math.random() * levels.length)],
                source: sources[Math.floor(Math.random() * sources.length)],
                message: `Event detected: Market movement on ${Math.floor(Math.random() * 100)}% probability change.`,
            };

            setLogs((prev) => [...prev.slice(-50), newLog]); // Keep last 50 logs
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const getLevelColor = (level: LogEntry["level"]) => {
        switch (level) {
            case "INFO": return "text-blue-400";
            case "WARN": return "text-yellow-400";
            case "ERROR": return "text-red-500";
            case "SUCCESS": return "text-green-400";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div className="w-full h-[300px] bg-black/90 border border-border/50 rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Terminal className="w-4 h-4" />
                    <span className="font-semibold">SYSTEM CONSOLE</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                        <span className="text-green-500">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-blue-500" />
                        <span className="text-muted-foreground">9ms</span>
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-1.5">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 p-0.5 rounded transition-colors">
                            <span className="text-muted-foreground/50 shrink-0">[{log.timestamp}]</span>
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-border/40 shrink-0">
                                {log.source}
                            </Badge>
                            <span className={cn("font-bold shrink-0", getLevelColor(log.level))}>
                                {log.level}
                            </span>
                            <span className="text-muted-foreground break-all">
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
        </div>
    );
}
