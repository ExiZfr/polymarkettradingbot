"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    TrendingUp,
    Clock,
    DollarSign,
    Share2,
    X,
    Copy,
    Trophy,
    ArrowRight,
    Wallet
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
    notificationQueue = [notification, ...notificationQueue].slice(0, 3); // Max 3 at a time to avoid clutter
    notificationListeners.forEach(listener => listener([...notificationQueue]));

    // Auto dismiss after 7 seconds
    setTimeout(() => {
        notificationQueue = notificationQueue.filter(n => n.id !== notification.id);
        notificationListeners.forEach(listener => listener([...notificationQueue]));
    }, 7000);
}

export default function TradeNotificationSystem() {
    const [notifications, setNotifications] = useState<TradeNotification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<TradeNotification | null>(null);

    useEffect(() => {
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

    return (
        <>
            {/* Notification Stack */}
            <div className="fixed top-24 right-8 z-[100] space-y-4 pointer-events-none flex flex-col items-end">
                <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                        <NotificationToast
                            key={notification.id}
                            notification={notification}
                            onDismiss={() => dismissNotification(notification.id)}
                            onShare={() => setSelectedNotification(notification)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* PnL Card Generator Modal */}
            <AnimatePresence>
                {selectedNotification && (
                    <PnLCardModal
                        notification={selectedNotification}
                        onClose={() => setSelectedNotification(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// --- Components ---

function NotificationToast({ notification, onDismiss, onShare }: { notification: TradeNotification, onDismiss: () => void, onShare: () => void }) {
    const { order, type } = notification;
    const pnl = order.pnl || 0;
    const isWin = type === 'CLOSED' && pnl >= 0;
    const isLoss = type === 'CLOSED' && pnl < 0;
    const isOpened = type === 'OPENED';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
                pointer-events-auto w-[380px] rounded-2xl border backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden
                ${isOpened ? 'bg-slate-900/90 border-slate-700/50' : ''}
                ${isWin ? 'bg-green-950/90 border-green-500/30 shadow-green-500/10' : ''}
                ${isLoss ? 'bg-red-950/90 border-red-500/30 shadow-red-500/10' : ''}
            `}
        >
            {/* Progress Bar (Timer) */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 7, ease: "linear" }}
                className={`h-1 w-full ${isOpened ? 'bg-blue-500' : isWin ? 'bg-green-500' : 'bg-red-500'}`}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${isOpened ? 'bg-blue-500/20 border-blue-500/20 text-blue-400' :
                                isWin ? 'bg-green-500/20 border-green-500/20 text-green-400' :
                                    'bg-red-500/20 border-red-500/20 text-red-400'
                            }`}>
                            {isOpened ? <ActivityIcon /> : isWin ? <Trophy size={20} /> : <XCircle size={20} />}
                        </div>
                        <div>
                            <h4 className={`text-base font-bold leading-none mb-1 ${isOpened ? 'text-blue-100' : isWin ? 'text-green-100' : 'text-red-100'
                                }`}>
                                {isOpened ? 'New Position' : isWin ? 'Trade Take Profit' : 'Stop Loss Hit'}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                {order.source.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onDismiss} className="text-white/40 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <p className="text-sm text-slate-300 font-medium leading-snug line-clamp-2">
                        {order.marketTitle}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <p className="text-[10px] text-slate-400 uppercase">Side</p>
                            <p className={`text-sm font-bold ${order.outcome === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                                {order.outcome}
                            </p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <p className="text-[10px] text-slate-400 uppercase">{type === 'CLOSED' ? 'Result' : 'Amount'}</p>
                            <p className={`text-sm font-bold ${isOpened ? 'text-white' :
                                    isWin ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {type === 'CLOSED' ? (pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`) : `$${order.amount}`}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    {type === 'CLOSED' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onShare}
                            className={`w-full py-2.5 mt-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${isWin
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/40'
                                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/40'
                                }`}
                        >
                            <Share2 size={16} />
                            Create PnL Card
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function PnLCardModal({ notification, onClose }: { notification: TradeNotification, onClose: () => void }) {
    const { order } = notification;
    const pnl = order.pnl || 0;
    const isWin = pnl >= 0;
    const roi = order.amount > 0 ? (pnl / order.amount) * 100 : 0;
    const bgGradient = isWin
        ? 'from-emerald-900 via-green-900 to-slate-900'
        : 'from-red-900 via-rose-900 to-slate-900';

    const handleCopy = () => {
        const text = `🚀 PolyGraalX PnL Report\n\nMarket: ${order.marketTitle}\nSide: ${order.outcome}\nROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%\nPnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}\n\nStart Trading on PolyGraalX`;
        navigator.clipboard.writeText(text);
        // Could show a "Copied" toast here
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="relative max-w-sm w-full"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -right-4 -top-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold z-10 hover:scale-110 transition-transform"
                >
                    <X size={20} />
                </button>

                {/* THE CARD */}
                <div className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-gradient-to-br ${bgGradient}`}>
                    {/* Background Noise/Effect */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {/* Top Decor */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent" />

                    <div className="relative p-8 flex flex-col items-center text-center">
                        {/* Logo Area */}
                        <div className="mb-6 flex items-center gap-2 opacity-80">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-bold text-xl">P</div>
                            <span className="text-white font-bold tracking-widest text-sm">POLYGRAAL X</span>
                        </div>

                        {/* Result Badge */}
                        <div className={`mb-6 px-4 py-1.5 rounded-full border ${isWin ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-red-500/20 border-red-400/30 text-red-300'} text-xs font-bold uppercase tracking-widest`}>
                            {isWin ? 'Trade Won' : 'Trade Loss'}
                        </div>

                        {/* ROI BIG */}
                        <div className="mb-2">
                            <span className={`text-6xl font-black tracking-tighter ${isWin ? 'text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600' : 'text-transparent bg-clip-text bg-gradient-to-b from-red-300 to-red-600'}`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                            </span>
                        </div>
                        <div className="mb-8 text-white/60 font-mono text-lg">
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </div>

                        {/* Grid Info */}
                        <div className="w-full grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                <p className="text-[10px] text-white/40 uppercase mb-1">Entry</p>
                                <p className="text-white font-mono font-bold">${order.entryPrice.toFixed(3)}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                <p className="text-[10px] text-white/40 uppercase mb-1">Exit</p>
                                <p className="text-white font-mono font-bold">${order.exitPrice?.toFixed(3) || '0.00'}</p>
                            </div>
                            <div className="col-span-2 bg-white/5 border border-white/5 rounded-2xl p-3 text-left">
                                <p className="text-[10px] text-white/40 uppercase mb-1">Market</p>
                                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{order.marketTitle}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="w-full pt-6 border-t border-white/10 flex items-center justify-between text-white/40">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase">Verify on</span>
                                <span className="text-xs font-bold text-white">Polymarket</span>
                            </div>
                            <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center">
                                <ArrowRight size={14} className="-rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="mt-6 w-full py-4 bg-white text-black rounded-xl font-bold text-lg shadow-xl shadow-white/10 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                    <Copy size={20} />
                    Copy Details to Clipboard
                </motion.button>
            </motion.div>
        </div>
    );
}

// Simple Activity Icon
function ActivityIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
