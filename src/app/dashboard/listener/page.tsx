"use client";

import { useState, useEffect, useRef } from "react";
import { listener, ListenerLog } from "@/lib/listener";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Radio, ShieldCheck, Activity, Search } from "lucide-react";

export default function ListenerPage() {
    const [logs, setLogs] = useState<ListenerLog[]>([]);
    const [status, setStatus] = useState<any>({ active: false, marketsTracked: 0, signalsDetected: 0 });
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Init
        listener.start();

        // Subscription function
        const handleLog = (newLog: ListenerLog) => {
            setLogs(prev => {
                const updated = [...prev, newLog];
                if (updated.length > 100) updated.shift(); // Keep last 100 logs
                return updated;
            });
        };

        // Update status periodically
        const interval = setInterval(() => {
            setStatus(listener.getStatus());
        }, 1000);

        // Subscribe
        listener.on('log', handleLog);

        return () => {
            listener.off('log', handleLog);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 font-mono">

            {/* Header Stats */}
            <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg animate-pulse">
                        <Radio className="text-green-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Status</p>
                        <p className="text-lg font-bold text-green-400">ONLINE</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Search className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Targets Tracked</p>
                        <p className="text-lg font-bold text-white">{status.marketsTracked}</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                        <Activity className="text-orange-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Signals Found</p>
                        <p className="text-lg font-bold text-white">{status.signalsDetected}</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                        <ShieldCheck className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Protection</p>
                        <p className="text-lg font-bold text-white">ACTIVE</p>
                    </div>
                </div>
            </div>

            {/* Main Console Window */}
            <div className="max-w-7xl mx-auto backdrop-blur-md bg-black/80 border border-white/20 rounded-xl shadow-2xl overflow-hidden h-[75vh] flex flex-col">
                {/* Console Bar */}
                <div className="bg-white/5 p-3 flex items-center gap-2 border-b border-white/10">
                    <Terminal size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400">root@polymarket_bot:~/listener_nodes</span>
                    <div className="flex-1" />
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                </div>

                {/* Logs Output */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {logs.length === 0 && (
                        <div className="text-slate-500 italic">Initializing daemon processes...</div>
                    )}

                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-3 text-sm font-mono border-b border-white/5 pb-1">
                            <span className="text-slate-500 min-w-[80px]">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className={`min-w-[80px] font-bold ${log.type === 'SUCCESS' ? 'text-green-400' :
                                    log.type === 'WARNING' ? 'text-yellow-400' :
                                        log.type === 'SCAN' ? 'text-blue-400' : 'text-slate-300'
                                }`}>
                                [{log.type}]
                            </span>
                            <span className="text-purple-400/80 min-w-[120px]">
                                &lt;{log.source}&gt;
                            </span>
                            <span className={log.type === 'SCAN' ? 'text-slate-500' : 'text-slate-200'}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
}
