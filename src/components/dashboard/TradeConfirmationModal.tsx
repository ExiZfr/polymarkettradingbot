'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X, TrendingUp, TrendingDown, AlertTriangle, Zap,
    DollarSign, Percent, Activity, Clock, ArrowRight,
    Shield, CheckCircle, Info
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface TradeConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (adjustedOrder: AdjustedOrder) => void;
    signal: {
        marketId: string;
        question: string;
        outcome: string;
        entryPrice: number;
        size: number;
        side: string;
        traderAddress?: string;
        reliabilityScore?: number;
    };
    marketData?: {
        liquidity: number;
        volume24h: number;
        spread: number;
    };
}

interface AdjustedOrder {
    marketId: string;
    question: string;
    outcome: string;
    side: string;
    orderSize: number;
    entryPrice: number;
    executionPrice: number;
    slippage: number;
    slippageAmount: number;
    estimatedFees: number;
    totalCost: number;
    liquidityUsed: number;
    priceImpact: number;
}

function calculateSlippage(
    orderSize: number,
    liquidity: number,
    spread: number = 0.02
): { slippage: number; priceImpact: number } {
    // Base slippage from spread
    let baseSlippage = spread / 2;

    // Price impact based on order size vs liquidity
    // Larger orders relative to liquidity = more slippage
    const liquidityRatio = orderSize / Math.max(liquidity, 1000);

    // Quadratic impact for larger orders
    const priceImpact = Math.pow(liquidityRatio, 1.5) * 0.15;

    // Random market fluctuation (0-0.5%)
    const marketNoise = Math.random() * 0.005;

    // Total slippage
    const totalSlippage = baseSlippage + priceImpact + marketNoise;

    return {
        slippage: Math.min(totalSlippage, 0.15), // Cap at 15%
        priceImpact: priceImpact * 100
    };
}

function calculateFees(orderSize: number): number {
    // Polymarket-like fees: ~0.5% maker/taker
    return orderSize * 0.005;
}

export default function TradeConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    signal,
    marketData
}: TradeConfirmationProps) {
    const [orderSize, setOrderSize] = useState(signal.size);
    const [adjustedOrder, setAdjustedOrder] = useState<AdjustedOrder | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Default market data if not provided
    const liquidity = marketData?.liquidity || 50000;
    const volume24h = marketData?.volume24h || 25000;
    const spread = marketData?.spread || 0.02;

    useEffect(() => {
        if (isOpen) {
            setOrderSize(Math.min(signal.size, 500)); // Default max $500
            calculateOrder(Math.min(signal.size, 500));
        }
    }, [isOpen, signal]);

    const calculateOrder = (size: number) => {
        const { slippage, priceImpact } = calculateSlippage(size, liquidity, spread);

        // Calculate execution price with slippage
        const isBuy = signal.side === 'BUY';
        const slippageMultiplier = isBuy ? (1 + slippage) : (1 - slippage);
        const executionPrice = signal.entryPrice * slippageMultiplier;

        // Calculate costs
        const slippageAmount = Math.abs(executionPrice - signal.entryPrice) * size;
        const fees = calculateFees(size);
        const totalCost = size + slippageAmount + fees;

        // Liquidity used percentage
        const liquidityUsed = (size / liquidity) * 100;

        setAdjustedOrder({
            marketId: signal.marketId,
            question: signal.question,
            outcome: signal.outcome,
            side: signal.side,
            orderSize: size,
            entryPrice: signal.entryPrice,
            executionPrice,
            slippage: slippage * 100,
            slippageAmount,
            estimatedFees: fees,
            totalCost,
            liquidityUsed: Math.min(liquidityUsed, 100),
            priceImpact
        });
    };

    const handleSizeChange = (newSize: number) => {
        const clampedSize = Math.max(1, Math.min(newSize, 10000));
        setOrderSize(clampedSize);
        calculateOrder(clampedSize);
    };

    const handleConfirm = async () => {
        if (!adjustedOrder) return;
        setIsProcessing(true);

        // Simulate execution delay
        await new Promise(r => setTimeout(r, 800));

        onConfirm(adjustedOrder);
        setIsProcessing(false);
        onClose();
    };

    const getSlippageColor = (slippage: number) => {
        if (slippage < 0.5) return 'text-emerald-400';
        if (slippage < 1.5) return 'text-amber-400';
        return 'text-red-400';
    };

    const getPriceImpactColor = (impact: number) => {
        if (impact < 0.5) return 'text-emerald-400';
        if (impact < 2) return 'text-amber-400';
        return 'text-red-400';
    };

    if (!adjustedOrder) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-lg bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 px-6 py-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${signal.side === 'BUY'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {signal.side === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">Confirm Trade</h2>
                                        <p className="text-xs text-muted-foreground">Paper Trading</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Market Info */}
                        <div className="px-6 py-4 border-b border-white/5">
                            <p className="text-sm text-muted-foreground mb-1">Market</p>
                            <p className="font-medium line-clamp-2">{signal.question}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${signal.outcome === 'YES'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {signal.outcome}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${signal.side === 'BUY'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {signal.side}
                                </span>
                            </div>
                        </div>

                        {/* Order Size Input */}
                        <div className="px-6 py-4 border-b border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-muted-foreground">Order Size</label>
                                <div className="flex gap-1">
                                    {[25, 50, 100, 250, 500].map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => handleSizeChange(preset)}
                                            className={`px-2 py-1 text-xs rounded ${orderSize === preset
                                                    ? 'bg-purple-500/30 text-purple-400'
                                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                                }`}
                                        >
                                            ${preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="number"
                                    value={orderSize}
                                    onChange={e => handleSizeChange(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xl font-bold focus:outline-none focus:border-purple-500/50"
                                    min={1}
                                    max={10000}
                                />
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="px-6 py-4 space-y-3">
                            {/* Entry Price */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Market Price
                                </span>
                                <span className="font-mono font-medium">${adjustedOrder.entryPrice.toFixed(4)}</span>
                            </div>

                            {/* Execution Price */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4" />
                                    Execution Price
                                </span>
                                <span className="font-mono font-medium">${adjustedOrder.executionPrice.toFixed(4)}</span>
                            </div>

                            {/* Slippage */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Percent className="w-4 h-4" />
                                    Slippage
                                </span>
                                <span className={`font-mono font-medium ${getSlippageColor(adjustedOrder.slippage)}`}>
                                    {adjustedOrder.slippage.toFixed(2)}% (${adjustedOrder.slippageAmount.toFixed(2)})
                                </span>
                            </div>

                            {/* Fees */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Fees (~0.5%)
                                </span>
                                <span className="font-mono">${adjustedOrder.estimatedFees.toFixed(2)}</span>
                            </div>

                            <div className="border-t border-white/10 pt-3 mt-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Total Cost</span>
                                    <span className="text-xl font-bold text-purple-400">
                                        ${adjustedOrder.totalCost.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Stats (Collapsible) */}
                        <div className="px-6">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Advanced Details
                                </span>
                                <motion.span
                                    animate={{ rotate: showAdvanced ? 180 : 0 }}
                                >
                                    ▼
                                </motion.span>
                            </button>

                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-2 gap-3 pb-4">
                                            <div className="p-3 rounded-xl bg-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">Price Impact</p>
                                                <p className={`font-bold ${getPriceImpactColor(adjustedOrder.priceImpact)}`}>
                                                    {adjustedOrder.priceImpact.toFixed(3)}%
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">Liquidity Used</p>
                                                <p className="font-bold">{adjustedOrder.liquidityUsed.toFixed(1)}%</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">Market Liquidity</p>
                                                <p className="font-bold">${liquidity.toLocaleString()}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5">
                                                <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
                                                <p className="font-bold">${volume24h.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Warning for high slippage */}
                        {adjustedOrder.slippage > 2 && (
                            <div className="px-6 pb-4">
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-400">
                                        High slippage detected. Consider reducing order size for better execution.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${signal.side === 'BUY'
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white'
                                        : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                                    } disabled:opacity-50`}
                            >
                                {isProcessing ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        >
                                            <Zap className="w-5 h-5" />
                                        </motion.div>
                                        Executing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Confirm {signal.side}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
