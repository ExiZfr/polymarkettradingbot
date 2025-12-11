"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Share2,
    X,
    Copy,
    Download
} from "lucide-react";
import { PaperOrder } from "@/lib/paper-trading";

interface TradeNotification {
    id: string;
    order: PaperOrder;
    type: 'OPENED' | 'CLOSED';
    timestamp: number;
}

// Global notification queue
let notificationQueue: TradeNotification[] = [];
let notificationListeners: ((notifications: TradeNotification[]) => void)[] = [];

// Utility to add a notification from anywhere
export function showTradeNotification(order: PaperOrder, type: 'OPENED' | 'CLOSED') {
    const notification: TradeNotification = {
        id: `notif_${Date.now()}`,
        order,
        type,
        timestamp: Date.now()
    };
    notificationQueue = [notification, ...notificationQueue].slice(0, 5); // Keep max 5
    notificationListeners.forEach(listener => listener([...notificationQueue]));
}

export default function TradeNotificationSystem() {
    const [notifications, setNotifications] = useState<TradeNotification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<TradeNotification | null>(null);

    useEffect(() => {
        // Subscribe to notification updates
        const listener = (newNotifications: TradeNotification[]) => {
            setNotifications(newNotifications);
        };
        notificationListeners.push(listener);

        return () => {
            notificationListeners = notificationListeners.filter(l => l !== listener);
        };
    }, []);

    const dismissNotification = (id: string) => {
        notificationQueue = notificationQueue.filter(n => n.id !== id);
        setNotifications([...notificationQueue]);
    };

    const formatDuration = (startTimestamp: number, endTimestamp?: number) => {
        const end = endTimestamp || Date.now();
        const durationMs = end - startTimestamp;
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    return (
        <>
            {/* Notification Stack (Top Right) */}
            <div className="fixed top-20 right-6 z-[200] space-y-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {notifications.map((notification, index) => {
                        const { order, type } = notification;
                        const isWin = type === 'CLOSED' && (order.pnl || 0) >= 0;
                        const isLoss = type === 'CLOSED' && (order.pnl || 0) < 0;
                        const pnl = order.pnl || 0;
                        const duration = formatDuration(order.timestamp, order.exitTimestamp);

                        return (
                            <motion.div
                                key={notification.id}
                                layout
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className={`
                                    pointer-events-auto w-[360px] p-4 rounded-2xl border shadow-2xl backdrop-blur-xl
                                    ${type === 'OPENED' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                                    ${isWin ? 'bg-green-500/10 border-green-500/30' : ''}
                                    ${isLoss ? 'bg-red-500/10 border-red-500/30' : ''}
                                `}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${type === 'OPENED' ? 'bg-blue-500/20' : isWin ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                            {type === 'OPENED' ? (
                                                <TrendingUp size={16} className="text-blue-500" />
                                            ) : isWin ? (
                                                <CheckCircle2 size={16} className="text-green-500" />
                                            ) : (
                                                <XCircle size={16} className="text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${type === 'OPENED' ? 'text-blue-500' : isWin ? 'text-green-500' : 'text-red-500'}`}>
                                                {type === 'OPENED' ? 'Position Opened' : isWin ? 'Trade Won! 🎉' : 'Trade Lost'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{order.source.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => dismissNotification(notification.id)}
                                        className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Trade Details */}
                                <div className="space-y-2">
                                    <p className="text-sm text-foreground font-medium truncate">
                                        {order.marketTitle}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className={`px-1.5 py-0.5 rounded font-bold ${order.outcome === 'YES' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {order.outcome}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <DollarSign size={10} />
                                            ${order.amount.toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Clock size={10} />
                                            {duration}
                                        </div>
                                    </div>

                                    {/* PnL (for closed trades) */}
                                    {type === 'CLOSED' && (
                                        <div className={`flex items-center justify-between p-2 rounded-lg ${isWin ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            <span className="text-xs text-muted-foreground">Profit/Loss</span>
                                            <span className={`text-lg font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                                                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                                    <button
                                        onClick={() => setSelectedNotification(notification)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <Share2 size={12} />
                                        Share Card
                                    </button>
                                    <button
                                        onClick={() => dismissNotification(notification.id)}
                                        className="py-1.5 px-3 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Share Card Modal */}
            <AnimatePresence>
                {selectedNotification && (
                    <ShareCardModal
                        notification={selectedNotification}
                        onClose={() => setSelectedNotification(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Share Card Modal Component
function ShareCardModal({ notification, onClose }: { notification: TradeNotification; onClose: () => void }) {
    const { order, type } = notification;
    const pnl = order.pnl || 0;
    const isWin = pnl >= 0;
    const roi = order.amount > 0 ? (pnl / order.amount) * 100 : 0;

    const formatDuration = (startTimestamp: number, endTimestamp?: number) => {
        const end = endTimestamp || Date.now();
        const durationMs = end - startTimestamp;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleCopyToClipboard = () => {
        const text = `🎯 PolyGraalX Trade\n\n${order.outcome} on ${order.marketTitle}\n💰 P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%)\n⏱️ Duration: ${formatDuration(order.timestamp, order.exitTimestamp)}\n\n#PolyGraalX #Polymarket`;
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250]"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[260] w-[400px]"
            >
                {/* The Card */}
                <div
                    id="share-card"
                    className={`
                        relative overflow-hidden rounded-3xl p-6
                        ${isWin ? 'bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-teal-900/90' : 'bg-gradient-to-br from-red-900/90 via-rose-900/80 to-pink-900/90'}
                    `}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>

                    {/* Header */}
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">P</span>
                            </div>
                            <span className="text-white/80 font-semibold">PolyGraalX</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isWin ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                            {isWin ? '✓ WIN' : '✗ LOSS'}
                        </div>
                    </div>

                    {/* Trade Info */}
                    <div className="relative mb-6">
                        <p className="text-white/60 text-sm mb-1">Market</p>
                        <p className="text-white font-medium text-lg leading-tight">
                            {order.marketTitle}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="relative grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                            <p className="text-white/50 text-xs uppercase mb-1">Position</p>
                            <p className={`text-xl font-bold ${order.outcome === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                                {order.outcome}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-white/50 text-xs uppercase mb-1">P&L</p>
                            <p className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-white/50 text-xs uppercase mb-1">ROI</p>
                            <p className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="relative flex items-center justify-between text-sm text-white/60 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(order.timestamp, order.exitTimestamp)}
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign size={12} />
                            ${order.amount.toFixed(2)} invested
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handleCopyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors"
                    >
                        <Copy size={16} />
                        Copy Text
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </>
    );
}
