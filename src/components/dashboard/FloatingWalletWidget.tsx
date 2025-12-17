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

    const loadData = async () => {
        try {
            // First, fetch active profile from profiles API
            const profilesRes = await fetch('/api/paper-orders/profiles');
            let activeProfileData: any = null;
            if (profilesRes.ok) {
                const profilesData = await profilesRes.json();
                activeProfileData = profilesData.profiles?.find((p: any) => p.isActive);
            }

            // Then fetch orders
            const ordersRes = await fetch('/api/paper-orders/server?status=ALL&limit=100');
            if (!ordersRes.ok) throw new Error('Failed to load orders');
            const ordersData = await ordersRes.json();

            // Create profile from active profile data (or fallback to orders data)
            const balance = activeProfileData?.balance ?? ordersData.profile?.balance ?? 10000;
            const profileName = activeProfileData?.name ?? 'Paper Trading';

            const serverProfile: PaperProfile = {
                id: activeProfileData?.id || 'server',
                username: profileName,
                initialBalance: activeProfileData?.initialBalance || 10000,
                currentBalance: balance,
                totalPnL: activeProfileData?.totalPnL ?? ordersData.profile?.totalPnL ?? 0,
                realizedPnL: activeProfileData?.totalPnL ?? ordersData.profile?.totalPnL ?? 0,
                unrealizedPnL: 0,
                winRate: activeProfileData ? (activeProfileData.totalTrades > 0 ? (activeProfileData.winningTrades / activeProfileData.totalTrades) * 100 : 0) : parseFloat(ordersData.stats?.winRate || '0'),
                tradesCount: activeProfileData?.totalTrades ?? ordersData.profile?.totalTrades ?? 0,
                winCount: activeProfileData?.winningTrades ?? ordersData.profile?.winningTrades ?? 0,
                lossCount: activeProfileData?.losingTrades ?? ordersData.profile?.losingTrades ?? 0,
                bestTrade: 0,
                worstTrade: 0,
                avgTradeSize: 0,
                active: true,
                autoFollow: false,
                createdAt: Date.now()
            };

            // Detect balance change for flash animation
            if (profile && serverProfile.currentBalance !== profile.currentBalance) {
                setBalanceFlash(serverProfile.currentBalance > profile.currentBalance ? 'up' : 'down');
                setTimeout(() => setBalanceFlash(null), 1500);
            }

            setPreviousBalance(profile?.currentBalance || serverProfile.currentBalance);
            setProfile(serverProfile);

            // Map server orders to PaperOrder format
            const serverOrders: PaperOrder[] = (ordersData.orders || []).filter((o: any) => o.status === 'OPEN').map((o: any) => ({
                id: o.id,
                marketId: o.marketId,
                profileId: 'server',
                marketTitle: o.marketTitle,
                marketImage: o.marketImage,
                type: o.type || 'BUY',
                outcome: o.outcome,
                amount: o.amount,
                entryPrice: o.entryPrice,
                currentPrice: o.currentPrice,
                shares: o.shares,
                timestamp: new Date(o.createdAt).getTime(),
                status: o.status,
                source: o.source || 'MANUAL'
            }));
            setOpenOrders(serverOrders);
        } catch (error) {
            console.error('[Wallet Widget] Error loading data:', error);
            // Fallback to localStorage
            const activeProfile = paperStore.getActiveProfile();
            const orders = paperStore.getOpenOrders();
            setProfile(activeProfile);
            setOpenOrders(orders);
        }
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
