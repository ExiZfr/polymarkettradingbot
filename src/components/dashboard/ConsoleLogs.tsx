"use client";

import { useRef, useEffect } from "react";
import { Terminal, Zap, ShoppingCart, Target, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type LogType = {
    id: number;
    timestamp: string;
    level: 'INFO' | 'EXEC' | 'WARN' | 'ERR' | 'MARKET' | 'ORDER' | 'SNIPE' | 'SIGNAL';
    message: string;
};

type FilterType = 'ALL' | 'ORDER' | 'SNIPE' | 'SIGNAL' | 'WARN';

type ConsoleProps = {
    logs: LogType[];
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
};

export default function ConsoleLogs({ logs, filter, setFilter }: ConsoleProps) {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        if (filter === 'ORDER' && log.level === 'ORDER') return true;
        if (filter === 'SNIPE' && (log.level === 'SNIPE' || log.level === 'EXEC')) return true;
        if (filter === 'SIGNAL' && (log.level === 'SIGNAL' || log.level === 'MARKET')) return true;
        if (filter === 'WARN' && (log.level === 'WARN' || log.level === 'ERR')) return true;
        return false;
    });

    const getLogColor = (level: string) => {
        switch (level) {
            case 'ORDER': return 'text-green-500 border-green-500/20 bg-green-500/10';
            case 'SNIPE': return 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10';
            case 'EXEC': return 'text-green-500 border-green-500/20 bg-green-500/10';
            case 'SIGNAL': return 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10';
            case 'WARN': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
            case 'ERR': return 'text-destructive border-destructive/20 bg-destructive/10';
            case 'MARKET': return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
            default: return 'text-muted-foreground border-border hover:bg-muted/50';
        }
    };

    const filterButtons: { key: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
        { key: 'ALL', label: 'All', icon: <Terminal size={12} />, color: 'text-muted-foreground' },
        { key: 'ORDER', label: 'Orders', icon: <ShoppingCart size={12} />, color: 'text-green-500' },
        { key: 'SNIPE', label: 'Snipe', icon: <Target size={12} />, color: 'text-indigo-500' },
        { key: 'SIGNAL', label: 'Signals', icon: <Zap size={12} />, color: 'text-cyan-500' },
        { key: 'WARN', label: 'Alerts', icon: <AlertTriangle size={12} />, color: 'text-amber-500' },
    ];

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[500px] shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-muted-foreground" />
                    <span className="font-mono text-sm font-bold text-foreground">System Console</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium">v2.5</span>
                </div>

                <div className="flex items-center gap-1">
                    <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
                        {filterButtons.map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => setFilter(btn.key)}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${filter === btn.key
                                    ? `bg-background shadow-sm ${btn.color}`
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {btn.icon}
                                <span className="hidden sm:inline">{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Terminal size={40} className="mb-4 opacity-50" />
                            <p>No system logs available</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-start gap-3 p-2 rounded border-l-2 ${getLogColor(log.level)} transition-colors`}
                            >
                                <span className="opacity-50 w-20 shrink-0 select-none text-muted-foreground">{log.timestamp}</span>
                                <span className={`font-bold w-12 shrink-0 ${log.level === 'EXEC' ? 'text-green-500' :
                                    log.level === 'WARN' ? 'text-amber-500' :
                                        log.level === 'ERR' ? 'text-destructive' : 'text-indigo-500'
                                    }`}>
                                    [{log.level}]
                                </span>
                                <span className="break-all text-foreground">{log.message}</span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
