import { Terminal, RefreshCw } from 'lucide-react';
import type { LogEntry } from '@/types/tracker';

interface Props {
    logs: LogEntry[];
    showLogs: boolean;
    onToggle: () => void;
    onRefresh: () => void;
    loading: boolean;
}

export default function TrackerConsole({ logs, showLogs, onToggle, onRefresh, loading }: Props) {
    return (
        <>
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggle}
                    className={`p-3 rounded-xl border transition-all ${showLogs
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                        }`}
                    title="Toggle Full Logs"
                >
                    <Terminal className="w-5 h-5" />
                </button>
                <button
                    onClick={onRefresh}
                    className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {showLogs && (
                <div className="mt-8 bg-[#0d121d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
                    <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">System Logs</span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">Real-time</span>
                    </div>
                    <div className="p-4 h-48 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={`${log.level === 'error' ? 'text-red-400' :
                                    log.level === 'warning' ? 'text-yellow-400' :
                                        log.level === 'success' ? 'text-green-400' :
                                            'text-gray-300'
                                    }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-gray-600 text-center italic mt-16">Waiting for system logs...</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
