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

    // Aesthetic variables
    const mainColor = isWin ? 'text-[#00df8f]' : 'text-[#ff4d4d]';
    const glowShadow = isWin ? 'shadow-[#00df8f]/20' : 'shadow-[#ff4d4d]/20';

    const handleCopy = () => {
        const text = `🚀 PolyGraalX PnL Report\n\nMarket: ${order.marketTitle}\nSide: ${order.outcome}\nROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%\nPnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}\n\nStart Trading on PolyGraalX`;
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative flex flex-col items-center"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -right-12 top-0 w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center transition-all z-20"
                >
                    <X size={20} />
                </button>

                {/* --- THE CARD ITSELF --- */}
                <div
                    id="pnl-card"
                    className="relative w-[640px] h-[380px] rounded-[32px] overflow-hidden shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9)]"
                    style={{
                        backgroundImage: 'url(/images/pnl-card-template.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />

                    {/* Content Layer */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-8">

                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                    <span className="text-xl font-black text-white">P</span>
                                </div>
                                <div>
                                    <div className="text-white font-black text-lg tracking-tight">
                                        <span className="text-blue-400">Poly</span>GraalX
                                    </div>
                                    <div className="text-white/40 text-xs font-mono">Whale Hunter</div>
                                </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full border backdrop-blur-sm ${isWin ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-red-500/20 border-red-400/30 text-red-300'} text-xs font-bold uppercase tracking-widest`}>
                                {isWin ? '✓ PROFIT' : '✗ LOSS'}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col justify-center pr-[200px]"> {/* Right padding for bust image */}
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-white/80 font-bold text-xl">{order.outcome}</span>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white/60 border border-white/10">PERP</span>
                            </div>

                            {/* Giant ROI Number with Neon Effect */}
                            <h1
                                className={`text-[90px] leading-none font-black tracking-tighter ${mainColor}`}
                                style={{
                                    textShadow: isWin
                                        ? '0 0 40px rgba(0,223,143,0.5), 0 0 80px rgba(0,223,143,0.3)'
                                        : '0 0 40px rgba(255,77,77,0.5), 0 0 80px rgba(255,77,77,0.3)'
                                }}
                            >
                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                            </h1>

                            <p className="text-white/50 font-mono text-lg mt-1">
                                {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)} USDC
                            </p>
                        </div>

                        {/* Footer Data */}
                        <div className="flex justify-between items-end pr-[160px]">
                            <div className="flex gap-10">
                                <div>
                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Entry Price</p>
                                    <p className="text-white font-mono text-xl">{order.entryPrice.toFixed(4)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Mark Price</p>
                                    <p className="text-white font-mono text-xl">{(order.exitPrice || order.currentPrice || 0).toFixed(4)}</p>
                                </div>
                            </div>

                            {/* Referral/Timestamp */}
                            <div className="text-right">
                                <p className="text-[9px] text-white/20 uppercase tracking-widest">Sharing Time:</p>
                                <p className="text-white/40 text-xs font-mono">{new Date().toLocaleString()}</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6 w-[600px]">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        className="flex-1 py-3 bg-white text-black rounded-xl font-bold font-mono tracking-tight flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <Copy size={16} /> COPY DATA
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold font-mono tracking-tight flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                        <Share2 size={16} /> SAVE IMAGE
                    </motion.button>
                </div>

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
