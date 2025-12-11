"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Activity,
    Share2,
    X,
    Copy,
    Trophy,
    Zap,
    ArrowRight
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

// Utility to add a notification
export function showTradeNotification(order: PaperOrder, type: 'OPENED' | 'CLOSED') {
    const notification: TradeNotification = {
        id: `notif_${Date.now()}_${Math.random()}`,
        order,
        type,
        timestamp: Date.now()
    };
    notificationQueue = [notification, ...notificationQueue].slice(0, 3);
    notificationListeners.forEach(listener => listener([...notificationQueue]));

    setTimeout(() => {
        notificationQueue = notificationQueue.filter(n => n.id !== notification.id);
        notificationListeners.forEach(listener => listener([...notificationQueue]));
    }, 8000); // 8 seconds duration
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
            {/* Notification Stack - Top Right */}
            <div className="fixed top-24 right-8 z-[100] space-y-3 pointer-events-none flex flex-col items-end perspectives-1000">
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
            initial={{ opacity: 0, x: 100, scale: 0.9, rotateX: 20 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.02, x: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`
                pointer-events-auto w-[360px] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden relative group
                ${isOpened ? 'bg-indigo-950/80 border-indigo-500/30' : ''}
                ${isWin ? 'bg-emerald-950/80 border-emerald-500/30' : ''}
                ${isLoss ? 'bg-rose-950/80 border-rose-500/30' : ''}
            `}
        >
            {/* Glossy Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

            {/* Progress Bar (Timer) */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 w-full z-10 ${isOpened ? 'bg-indigo-400' : isWin ? 'bg-emerald-400' : 'bg-rose-400'}`}
            />

            <div className="p-4 relative z-20">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border shadow-lg ${isOpened ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' :
                            isWin ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                                'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            }`}>
                            {isOpened ? <Activity size={18} /> : isWin ? <Trophy size={18} /> : <XCircle size={18} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white leading-none mb-1 tracking-wide">
                                {isOpened ? 'POSITION OPENED' : isWin ? 'TAKE PROFIT' : 'STOP LOSS'}
                            </h4>
                            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                                {new Date().toLocaleTimeString()} • {order.source.split('_')[0]}
                            </p>
                        </div>
                    </div>
                    <button onClick={onDismiss} className="text-white/30 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-3 pl-[52px]">
                    <p className="text-xs text-white/90 font-medium leading-snug line-clamp-2">
                        {order.marketTitle}
                    </p>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${order.outcome === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                            {order.outcome}
                        </span>
                        <span className="text-white/40 text-[10px]">•</span>
                        <span className="text-xs font-mono text-white">
                            ${order.amount}
                        </span>
                        <span className="text-white/40 text-[10px]">•</span>
                        <span className={`text-xs font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                            {type === 'CLOSED' ? (pnl >= 0 ? '+' : '') + `$${pnl.toFixed(2)}` : 'Active'}
                        </span>
                    </div>

                    {/* Action Button - ALWAYS Visible now */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onShare}
                        className={`w-full py-2 mt-1 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all border border-white/5 ${isOpened
                                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200'
                                : isWin
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-200'
                            }`}
                    >
                        <Share2 size={12} />
                        {isOpened ? 'Visualize Position' : 'Generate PnL Card'}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function PnLCardModal({ notification, onClose }: { notification: TradeNotification, onClose: () => void }) {
    const { order, type } = notification;
    const pnl = order.pnl || 0;
    const isOpened = type === 'OPENED';
    const isWin = !isOpened && pnl >= 0;

    // For open positions, we show 0% or current theoretical (here 0 for simplicity/safety)
    const roi = isOpened ? 0 : (order.amount > 0 ? (pnl / order.amount) * 100 : 0);

    // Determines Styles based on state
    const theme = isOpened
        ? { main: 'text-indigo-400', bg: 'bg-indigo-500', glow: 'from-indigo-500/20 via-black/50 to-indigo-900/40', badge: 'LIVE POSITION' }
        : isWin
            ? { main: 'text-emerald-400', bg: 'bg-emerald-500', glow: 'from-emerald-500/20 via-black/50 to-emerald-900/40', badge: 'WINNER' }
            : { main: 'text-rose-400', bg: 'bg-rose-500', glow: 'from-rose-500/20 via-black/50 to-rose-900/40', badge: 'LIQUIDATED' };

    // Internal Feedback System State
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleCopy = () => {
        const text = `🚀 PolyGraalX Report\n\nMarket: ${order.marketTitle}\nSide: ${order.outcome}\nStatus: ${theme.badge}\nEntry: $${order.entryPrice.toFixed(4)}\n\nTrade with PolyGraalX.app`;
        navigator.clipboard.writeText(text);
        showFeedback('success', 'Stats Copied to Clipboard');
    };

    const handleSaveImage = async () => {
        const btn = document.querySelector('[data-save-btn]') as HTMLButtonElement;
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Processing...';

        try {
            const cardElement = document.getElementById('pnl-card');
            if (!cardElement) throw new Error("Card element not found");

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardElement, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            canvas.toBlob((blob) => {
                if (!blob) throw new Error("Blob generation failed");
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `PolyGraalX_Card_${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(url);
                showFeedback('success', 'Card Saved Successfully');
            }, 'image/png');

        } catch (error) {
            console.error('Save failed:', error);
            showFeedback('error', 'Install html2canvas on server to download');
        } finally {
            if (btn) btn.innerHTML = originalContent;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">

            {/* Elegant Feedback Toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className={`absolute bottom-12 z-[250] px-6 py-3 rounded-full border backdrop-blur-2xl shadow-2xl flex items-center gap-3 ${feedback.type === 'success'
                                ? 'bg-[#0A0A0B] border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]'
                                : 'bg-[#0A0A0B] border-rose-500/50 text-rose-400 shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]'
                            }`}
                    >
                        <div className={`p-1 rounded-full ${feedback.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>
                        <span className="font-bold text-sm tracking-wide text-white">{feedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative flex flex-col items-center"
            >
                <button
                    onClick={onClose}
                    className="absolute -right-12 top-0 w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center transition-all z-20"
                >
                    <X size={20} />
                </button>

                {/* --- THE CARD --- */}
                <div
                    id="pnl-card"
                    className="relative w-[700px] h-[400px] rounded-[32px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] group border border-white/10"
                    style={{
                        backgroundImage: 'url(/images/pnl-card-clean.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Dynamic Ambient Glow */}
                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${theme.glow} pointer-events-none mix-blend-overlay transition-colors duration-1000`} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />

                    <div className="relative z-10 h-full flex flex-col justify-between p-7">

                        {/* HEADER */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full pl-1.5 pr-6 py-1.5 border border-white/10 shadow-lg">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/20 flex -rotate-45 transform skew-x-12 translate-x-full animate-shimmer" />
                                    <span className="font-black text-white text-xs z-10">P</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-1.5 leading-none mb-1">
                                        <span className="text-white font-bold text-sm tracking-tight">PolyGraalX.app</span>
                                        <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24">
                                            <path d="M20.285 2l-11.285 11.561-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono font-medium uppercase tracking-wider leading-none">
                                        <span className="text-blue-200/80">@WhaleHunter</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
                                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-lg transition-colors duration-500 bg-black/40 border-white/10`}>
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.bg.replace('bg-', 'bg-')}`} />
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.main}`}>
                                    {theme.badge}
                                </span>
                            </div>
                        </div>

                        {/* BIG NUMBERS */}
                        <div className="flex-1 flex flex-col justify-center pl-4 relative">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md truncate max-w-[450px]">
                                    {order.outcome}
                                </h2>
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-white/5 text-white/40 border border-white/5 uppercase tracking-wider backdrop-blur-sm">
                                    PREDICTION
                                </span>
                            </div>

                            <div className="relative">
                                <h1
                                    className={`text-[96px] leading-[0.85] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white ${isOpened ? 'via-indigo-50 to-indigo-200' : isWin ? 'via-emerald-50 to-emerald-200' : 'via-rose-50 to-rose-200'}`}
                                    style={{
                                        filter: `drop-shadow(0 0 40px ${isOpened ? 'rgba(99,102,241,0.3)' : isWin ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'})`
                                    }}
                                >
                                    {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                </h1>
                                <div className="flex items-center gap-3 mt-2 ml-2">
                                    <p className={`font-mono text-3xl font-bold ${theme.main}`}>
                                        {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                                    </p>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border opacity-50 ${theme.main.replace('text-', 'border-')}`}>
                                        USDC
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER METRICS */}
                        <div className="grid grid-cols-4 gap-2">
                            <MetricCard label="Entry Price" value={order.entryPrice.toFixed(4)} />
                            <MetricCard label="Current Price" value={(order.currentPrice || order.entryPrice).toFixed(4)} />
                            <MetricCard label="Position Size" value={`$${order.amount}`} />

                            {/* Watermark */}
                            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 backdrop-blur-md border border-blue-500/20 rounded-xl p-2.5 flex flex-col justify-center items-center group-hover:bg-blue-600/20 transition-colors">
                                <div className="text-[8px] uppercase text-blue-300/60 font-bold tracking-wider">Powered by</div>
                                <div className="text-blue-300 font-bold text-xs leading-none mt-0.5">PolyGraalX</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* MODAL ACTIONS */}
                <div className="flex gap-4 mt-8 w-[700px]">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        data-copy-btn
                        className="flex-1 py-4 bg-white text-black rounded-xl font-bold font-mono tracking-tight flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                    >
                        <Copy size={18} /> COPY STATS
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveImage}
                        data-save-btn
                        className="flex-1 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold font-mono tracking-tight flex items-center justify-center gap-2 hover:bg-white/10 transition-colors backdrop-blur-md shadow-lg"
                    >
                        <Share2 size={18} /> SAVE CARD
                    </motion.button>
                </div>

            </motion.div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3 hover:bg-white/5 transition-colors">
            <div className="text-[9px] uppercase text-white/30 font-bold tracking-wider mb-0.5">{label}</div>
            <div className="text-white font-mono font-medium">{value}</div>
        </div>
    );
}
