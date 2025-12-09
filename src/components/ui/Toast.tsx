"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect } from "react";

export interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'info' | 'trade';
    title: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
    tradeData?: {
        market: string;
        side: string;
        amount: number;
        inverse?: boolean;
    };
}

export function Toast({ id, type, title, message, duration = 5000, onClose, tradeData }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'trade':
                return tradeData?.inverse
                    ? <TrendingDown className="w-5 h-5 text-orange-400" />
                    : <TrendingUp className="w-5 h-5 text-blue-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30';
            case 'error':
                return 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30';
            case 'trade':
                return tradeData?.inverse
                    ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/30'
                    : 'bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/30';
            default:
                return 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/30';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 40,
                mass: 0.5
            }}
            className={`${getBgColor()} border backdrop-blur-xl rounded-xl p-4 shadow-2xl max-w-md w-full`}
        >
            <div className="flex items-start gap-3">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    {getIcon()}
                </motion.div>

                <div className="flex-1 min-w-0">
                    <motion.h4
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-bold text-white text-sm mb-1"
                    >
                        {title}
                    </motion.h4>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-gray-300 text-xs leading-relaxed"
                    >
                        {message}
                    </motion.p>

                    {tradeData && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-2 flex items-center gap-2 text-xs"
                        >
                            <span className={`px-2 py-0.5 rounded-full font-bold ${tradeData.side === 'YES'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                {tradeData.side}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-purple-400 font-mono font-bold">
                                ${tradeData.amount.toFixed(2)}
                            </span>
                            {tradeData.inverse && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-orange-400 font-bold text-[10px] uppercase">
                                        🔄 Inverse
                                    </span>
                                </>
                            )}
                        </motion.div>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClose(id)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Progress bar */}
            <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-b-xl"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
            />
        </motion.div>
    );
}

export function ToastContainer({ toasts, onClose }: {
    toasts: ToastProps[];
    onClose: (id: string) => void;
}) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast {...toast} onClose={onClose} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}
