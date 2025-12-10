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
            case 'ORDER': return 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10';
            case 'SNIPE': return 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/10';
            case 'EXEC': return 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10';
            case 'SIGNAL': return 'text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30 bg-cyan-50 dark:bg-cyan-900/10';
            case 'WARN': return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10';
            case 'ERR': return 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10';
            case 'MARKET': return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10';
            default: return 'text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50';
        }
    };

    const filterButtons: { key: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
        { key: 'ALL', label: 'All', icon: <Terminal size={12} />, color: 'text-gray-500 dark:text-gray-400' },
        { key: 'ORDER', label: 'Orders', icon: <ShoppingCart size={12} />, color: 'text-green-600 dark:text-green-400' },
        { key: 'SNIPE', label: 'Snipe', icon: <Target size={12} />, color: 'text-indigo-600 dark:text-indigo-400' },
        { key: 'SIGNAL', label: 'Signals', icon: <Zap size={12} />, color: 'text-cyan-600 dark:text-cyan-400' },
        { key: 'WARN', label: 'Alerts', icon: <AlertTriangle size={12} />, color: 'text-amber-600 dark:text-amber-400' },
    ];

    return (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[500px] shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-gray-400 dark:text-gray-500" />
                    <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">System Console</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">v2.5</span>
                </div>

                <div className="flex items-center gap-1">
                    <div className="flex bg-gray-100 dark:bg-black/20 rounded-lg p-1 gap-1">
                        {filterButtons.map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => setFilter(btn.key)}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${filter === btn.key
                                    ? `bg-white dark:bg-gray-800 shadow-sm ${btn.color}`
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
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
                                <span className="opacity-50 w-20 shrink-0 select-none text-gray-400 dark:text-gray-500">{log.timestamp}</span>
                                <span className={`font-bold w-12 shrink-0 ${log.level === 'EXEC' ? 'text-green-600 dark:text-green-400' :
                                    log.level === 'WARN' ? 'text-amber-600 dark:text-amber-400' :
                                        log.level === 'ERR' ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'
                                    }`}>
                                    [{log.level}]
                                </span>
                                <span className="break-all text-gray-700 dark:text-gray-300">{log.message}</span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
