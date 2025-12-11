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

    const handleCopy = () => {
        const text = `🚀 PolyGraalX PnL Report\n\nMarket: ${order.marketTitle}\nSide: ${order.outcome}\nROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%\nPnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}\n\nStart Trading on PolyGraalX.app`;
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

                {/* --- THE ULTIMATE PNL CARD --- */}
                <div
                    id="pnl-card"
                    className="relative w-[700px] h-[400px] rounded-[32px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] group border border-white/10"
                    style={{
                        backgroundImage: 'url(/images/pnl-card-clean.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Dynamic Ambient Glow based on Outcome */}
                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${isWin ? 'from-emerald-500/20 via-black/50 to-emerald-900/40' : 'from-rose-500/20 via-black/50 to-rose-900/40'} pointer-events-none mix-blend-overlay`} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />

                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-6">

                        {/* --- HEADER: Identity & Time --- */}
                        <div className="flex justify-between items-center bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="font-black text-white text-lg">P</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-white font-bold tracking-tight">PolyGraalX.app</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono uppercase tracking-wider">
                                        <span>@WhaleHunter</span>
                                        <span className="text-white/20">•</span>
                                        <span>{new Date().toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 py-1.5 rounded-lg border ${isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} flex items-center gap-2 backdrop-blur-sm`}>
                                <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-400 shadow-[0_0_10px_#fb7185]'} animate-pulse`} />
                                <span className="text-xs font-black uppercase tracking-widest">{isWin ? 'PROFIT' : 'LOSS'}</span>
                            </div>
                        </div>

                        {/* --- MIDDLE: The Big Numbers --- */}
                        <div className="flex-1 flex flex-col justify-center pl-4 relative">
                            {/* Market Ticker */}
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md truncate max-w-[400px]">
                                    {order.outcome}
                                </h2>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 border border-white/10 backdrop-blur-sm">
                                    PERP
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-300 border border-rose-500/20'}`}>
                                    125X
                                </span>
                            </div>

                            {/* ROI Display */}
                            <div className="relative">
                                <h1
                                    className={`text-[96px] leading-[0.85] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white ${isWin ? 'via-emerald-100 to-emerald-200' : 'via-rose-100 to-rose-200'}`}
                                    style={{
                                        filter: `drop-shadow(0 0 40px ${isWin ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'})`
                                    }}
                                >
                                    {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                </h1>
                                <p className={`font-mono text-2xl font-bold mt-2 ml-2 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* --- FOOTER: Detailed Metrics Grid --- */}
                        <div className="grid grid-cols-4 gap-2">
                            {/* Card 1: Entry */}
                            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-2.5 hover:bg-white/5 transition-colors">
                                <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">Entry Price</div>
                                <div className="text-white font-mono font-medium">{order.entryPrice.toFixed(4)}</div>
                            </div>

                            {/* Card 2: Mark */}
                            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-2.5 hover:bg-white/5 transition-colors">
                                <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">Mark Price</div>
                                <div className="text-white font-mono font-medium">{(order.exitPrice || order.currentPrice || 0).toFixed(4)}</div>
                            </div>

                            {/* Card 3: Vol (Simulated) */}
                            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-2.5 hover:bg-white/5 transition-colors">
                                <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">24h Vol</div>
                                <div className="text-white/60 font-mono font-medium">$1.2M</div>
                            </div>

                            {/* Card 4: Watermark */}
                            <div className="bg-blue-600/10 backdrop-blur-md border border-blue-500/20 rounded-xl p-2.5 flex flex-col justify-center items-center group-hover:bg-blue-600/20 transition-colors">
                                <div className="text-[8px] uppercase text-blue-300/60 font-bold tracking-wider">Powered by</div>
                                <div className="text-blue-300 font-bold text-xs">PolyGraalX</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6 w-[700px]">
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
