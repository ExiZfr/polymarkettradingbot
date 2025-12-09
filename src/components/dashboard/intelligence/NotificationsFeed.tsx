"use client";

import { useEffect, useState } from 'react';
import { useRadar } from '@/lib/radar-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, AlertTriangle, Info } from 'lucide-react';

export default function NotificationsFeed({ userId }: { userId: number }) {
    const { logs } = useRadar();
    const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    const filteredLogs = logs.filter((log) => {
        if (filter === 'all') return true;
        return log.priority === filter;
    });

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return Flame;
            case 'medium':
                return TrendingUp;
            case 'low':
                return Info;
            default:
                return AlertTriangle;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'red';
            case 'medium':
                return 'orange';
            case 'low':
                return 'slate';
            default:
                return 'blue';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Notifications</h2>
                    <p className="text-sm text-slate-400">Real-time alerts and system updates</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'high', 'medium', 'low'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === f
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                <AnimatePresence>
                    {filteredLogs.slice(0, 100).map((log) => {
                        const Icon = getPriorityIcon(log.priority);
                        const color = getPriorityColor(log.priority);

                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center shrink-0`}>
                                        <Icon size={16} className={`text-${color}-400`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium line-clamp-2 group-hover:line-clamp-none transition-all">
                                            {log.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className={`px-2 py-0.5 bg-${color}-500/20 text-${color}-400 text-xs rounded-full font-medium`}>
                                                {log.type}
                                            </span>
                                            {log.source && (
                                                <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded-full font-medium">
                                                    {log.source}
                                                </span>
                                            )}
                                        </div>

                                        {/* Related Market Preview */}
                                        {log.relatedMarket && (
                                            <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                                <p className="text-xs text-slate-300 line-clamp-1">{log.relatedMarket.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-orange-400 font-bold">Score: {log.relatedMarket.score}</span>
                                                    <span className="text-xs text-slate-500">•</span>
                                                    <span className="text-xs text-green-400 font-mono">{log.relatedMarket.volume}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredLogs.length === 0 && (
                    <div className="py-12 text-center">
                        <AlertTriangle size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-400 font-medium">No notifications</p>
                        <p className="text-sm text-slate-600 mt-1">Alerts will appear here when triggered</p>
                    </div>
                )}
            </div>
        </div>
    );
}
