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
                    className={`
                        relative w-[600px] h-[340px] rounded-[40px] overflow-hidden
                        bg-[#08080a] border border-white/5
                        shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] ${glowShadow}
                        flex flex-col justify-between p-8
                    `}
                >
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                    {/* Header */}
                    <div className="flex justify-between items-start z-10">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 font-black text-white text-xl tracking-tighter">
                                <span className="text-blue-500">Poly</span>GraalX
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-purple-500 opacity-20 border border-white/10" />
                            <span className="text-white/40 font-mono text-sm">Whale Hunter</span>
                        </div>
                    </div>

                    {/* Middle Content */}
                    <div className="flex-1 flex items-center z-10 mt-4 relative">
                        <div className="flex-1 z-20">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-white font-bold text-lg">{order.outcome} PERP</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isWin ? 'bg-[#00df8f]/10 text-[#00df8f]' : 'bg-[#ff4d4d]/10 text-[#ff4d4d]'}`}>125X</span>
                            </div>
                            <h1 className={`text-[80px] leading-none font-black tracking-tighter ${mainColor} drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                            </h1>
                        </div>

                        {/* RIGHT: THE GREEK GOD MASCOT PLACEHOLDER */}
                        <div className="w-[240px] h-[280px] absolute right-0 bottom-[-40px] -mr-8 flex items-end justify-center pointer-events-none z-10">
                            {/* Stylized Vector Bust */}
                            <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="bustGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#e2e8f0" />
                                        <stop offset="100%" stopColor="#64748b" />
                                    </linearGradient>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                {/* Bust Shape */}
                                <path
                                    d="M100,40 C130,40 150,60 150,90 C150,115 135,135 110,140 L160,220 L40,220 L90,140 C65,135 50,115 50,90 C50,60 70,40 100,40 Z"
                                    fill="url(#bustGradient)"
                                    className="drop-shadow-lg"
                                />
                                {/* Cyber Visor */}
                                <rect x="65" y="80" width="70" height="12" rx="4" fill={isWin ? "#00df8f" : "#ff4d4d"} filter="url(#glow)" />
                                {/* Laurel Wreath */}
                                <path d="M50,90 Q30,60 50,30" stroke="#f59e0b" strokeWidth="4" fill="none" opacity="0.8" />
                                <path d="M150,90 Q170,60 150,30" stroke="#f59e0b" strokeWidth="4" fill="none" opacity="0.8" />
                            </svg>
                        </div>
                    </div>

                    {/* Footer Data */}
                    <div className="flex justify-between items-end z-10 w-full pr-[180px]"> {/* Padding right to avoid mascot overlap */}
                        <div className="flex gap-12">
                            <div>
                                <p className="text-[10px] text-white/30 uppercase font-bold mb-1">Entry Price</p>
                                <p className="text-white font-mono text-xl tracking-tight">{order.entryPrice.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30 uppercase font-bold mb-1">Mark Price</p>
                                <p className="text-white font-mono text-xl tracking-tight">{(order.exitPrice || order.currentPrice || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-1 rounded-lg">
                            <div className="w-12 h-12 bg-black border border-dashed border-white/20 flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-sm" />
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
