"use client";

import { useRef, useEffect } from "react";
import { Terminal, Filter, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type LogType = {
    id: number;
    timestamp: string;
    level: 'INFO' | 'EXEC' | 'WARN' | 'ERR' | 'MARKET';
    message: string;
};

type ConsoleProps = {
    logs: LogType[];
    filter: 'ALL' | 'EXEC' | 'SCAN' | 'INFO' | 'WARN';
    setFilter: (filter: 'ALL' | 'EXEC' | 'SCAN' | 'INFO' | 'WARN') => void;
};

export default function ConsoleLogs({ logs, filter, setFilter }: ConsoleProps) {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        if (filter === 'SCAN' && log.message.includes('[SCAN]')) return true;
        if (filter === 'EXEC' && log.level === 'EXEC') return true;
        if (filter === 'WARN' && log.level === 'WARN') return true;
        if (filter === 'INFO' && log.level === 'INFO') return true;
        return false;
    });

    const getLogColor = (level: string) => {
        switch (level) {
            case 'EXEC': return 'text-green-400 border-green-500/20 bg-green-500/5';
            case 'WARN': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
            case 'ERR': return 'text-red-400 border-red-500/20 bg-red-500/5';
            case 'MARKET': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
            default: return 'text-slate-300 border-white/5 hover:bg-white/[0.02]';
        }
    };

    return (
        <div className="bg-[#0C0D12] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-slate-400">
                    <Terminal size={18} className="text-indigo-400" />
                    <span className="font-mono text-sm font-bold">System Console</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-500">v2.3.0</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-black/20 rounded-lg p-1">
                        {['ALL', 'EXEC', 'WARN'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === f
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
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
                                <span className="opacity-50 w-20 shrink-0 select-none">{log.timestamp}</span>
                                <span className={`font-bold w-12 shrink-0 ${log.level === 'EXEC' ? 'text-green-400' :
                                        log.level === 'WARN' ? 'text-amber-400' :
                                            log.level === 'ERR' ? 'text-red-400' : 'text-indigo-400'
                                    }`}>
                                    [{log.level}]
                                </span>
                                <span className="break-all">{log.message}</span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
