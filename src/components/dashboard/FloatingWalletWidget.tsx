"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Activity, Settings } from "lucide-react";
import { paperStore, PaperProfile, PaperOrder } from "@/lib/paper-trading";
import AccountManagerModal from "./AccountManagerModal";

export default function FloatingWalletWidget() {
    const [profile, setProfile] = useState<PaperProfile | null>(null);
    const [openOrders, setOpenOrders] = useState<PaperOrder[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previousBalance, setPreviousBalance] = useState<number>(0);
    const [balanceFlash, setBalanceFlash] = useState<'up' | 'down' | null>(null);

    const loadData = () => {
        const activeProfile = paperStore.getActiveProfile();
        const orders = paperStore.getOpenOrders();

        // Detect balance change for flash animation
        if (profile && activeProfile.currentBalance !== profile.currentBalance) {
            setBalanceFlash(activeProfile.currentBalance > profile.currentBalance ? 'up' : 'down');
            setTimeout(() => setBalanceFlash(null), 1500);
        }

        setPreviousBalance(profile?.currentBalance || activeProfile.currentBalance);
        setProfile(activeProfile);
        setOpenOrders(orders);
    };

    // Calculate unrealized PnL for open orders
    const unrealizedPnL = openOrders.reduce((sum, order) => {
        const currentPrice = order.currentPrice || order.entryPrice;
        const currentValue = order.shares * currentPrice;
        return sum + (currentValue - order.amount);
    }, 0);

    // Total balance including unrealized
    const totalBalance = profile ? profile.currentBalance + unrealizedPnL : 0;
    const initialBalance = profile?.initialBalance || 1000;
    const totalPnL = totalBalance - initialBalance;
    const roi = initialBalance > 0 ? ((totalBalance - initialBalance) / initialBalance) * 100 : 0;

    useEffect(() => {
        loadData();

        // Listen for updates
        const handleUpdate = () => loadData();
        window.addEventListener('paper-update', handleUpdate);

        // Poll every 10 seconds for price updates (optimized)
        const interval = setInterval(loadData, 10000);

        return () => {
            window.removeEventListener('paper-update', handleUpdate);
            clearInterval(interval);
        };
    }, []);

    if (!profile) return null;

    const isPositive = totalPnL >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: -50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            className="fixed bottom-6 left-6 z-50"
        >
            <motion.div
                layout
                className={`
                    bg-card/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden
                    ${balanceFlash === 'up' ? 'border-green-500 shadow-green-500/30' : ''}
                    ${balanceFlash === 'down' ? 'border-red-500 shadow-red-500/30' : ''}
                    ${!balanceFlash ? 'border-border' : ''}
                    transition-all duration-300
                `}
            >
                {/* Main Widget (Always Visible) */}
                <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        {/* Icon with pulse */}
                        <div className={`relative p-2.5 rounded-xl ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <Wallet className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                            {openOrders.length > 0 && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                                />
                            )}
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Paper Wallet</p>
                            <motion.p
                                key={totalBalance.toFixed(2)}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                className={`text-xl font-bold ${balanceFlash === 'up' ? 'text-green-500' : balanceFlash === 'down' ? 'text-red-500' : 'text-foreground'}`}
                            >
                                ${totalBalance.toFixed(2)}
                            </motion.p>
                        </div>

                        {/* PnL Badge */}
                        <div className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {isPositive ? '+' : ''}{roi.toFixed(1)}%
                        </div>

                        {/* Expand Arrow */}
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            className="text-muted-foreground"
                        >
                            <ChevronUp size={16} />
                        </motion.div>
                    </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border"
                        >
                            <div className="p-4 space-y-3">
                                {/* Balance Breakdown */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Available</p>
                                        <p className="font-semibold text-foreground">${profile.currentBalance.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                                        <p className={`font-semibold ${unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Realized P&L</p>
                                        <p className={`font-semibold ${profile.realizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {profile.realizedPnL >= 0 ? '+' : ''}${profile.realizedPnL.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Open Positions</p>
                                        <p className="font-semibold text-foreground">{openOrders.length}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsModalOpen(true);
                                    }}
                                    className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors"
                                >
                                    <Settings size={12} />
                                    Manage Portfolios
                                </button>

                                {/* Open Positions Preview */}
                                {openOrders.length > 0 && (
                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                            <Activity size={10} /> Active Positions
                                        </p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {openOrders.slice(0, 3).map(order => {
                                                const currentPrice = order.currentPrice || order.entryPrice;
                                                const pnl = (order.shares * currentPrice) - order.amount;
                                                return (
                                                    <div key={order.id} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${order.outcome === 'YES' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                            <span className="text-foreground truncate max-w-[100px]">
                                                                {order.marketTitle.slice(0, 15)}...
                                                            </span>
                                                        </div>
                                                        <span className={`font-semibold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {openOrders.length > 3 && (
                                                <p className="text-xs text-muted-foreground text-center">+{openOrders.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AccountManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={loadData}
            />
        </motion.div>
    );
}
