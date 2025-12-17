'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
    X, TrendingUp, TrendingDown, DollarSign, Percent,
    Shield, Target, Zap, Settings, ArrowRight, Copy,
    RefreshCcw, AlertTriangle, CheckCircle
} from 'lucide-react';
import { paperStore } from '@/lib/paper-trading';
import type { WhaleTransaction } from '@/types/tracker';

interface CopyTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: WhaleTransaction;
    mode: 'copy' | 'inverse';
}

export default function CopyTradeModal({ isOpen, onClose, transaction, mode }: CopyTradeModalProps) {
    const [amount, setAmount] = useState(50);
    const [stopLoss, setStopLoss] = useState(15); // % below entry
    const [takeProfit, setTakeProfit] = useState(30); // % above entry
    const [useAutoRisk, setUseAutoRisk] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState(paperStore.getActiveProfile());

    // Calculate prices
    const entryPrice = mode === 'inverse' ? (1 - transaction.price) : transaction.price;
    const outcome = mode === 'inverse'
        ? (transaction.outcome === 'YES' ? 'NO' : 'YES')
        : (transaction.outcome as 'YES' | 'NO');

    // Calculate SL/TP prices
    const slPrice = Math.max(0.01, entryPrice * (1 - stopLoss / 100));
    const tpPrice = Math.min(0.99, entryPrice * (1 + takeProfit / 100));

    // Potential P&L
    const potentialLoss = amount * (stopLoss / 100);
    const potentialProfit = amount * (takeProfit / 100);

    // Quick amount buttons
    const quickAmounts = [25, 50, 100, 250, 500];
    const quickPercentages = [5, 10, 25, 50];

    useEffect(() => {
        setProfile(paperStore.getActiveProfile());
    }, [isOpen]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);

        try {
            // SL/TP info stored in notes
            const slTpInfo = useAutoRisk
                ? ` | SL: ${stopLoss}% @ $${slPrice.toFixed(3)} | TP: ${takeProfit}% @ $${tpPrice.toFixed(3)}`
                : '';

            // Use server API instead of localStorage
            const response = await fetch('/api/paper-orders/server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marketId: transaction.market_id,
                    marketTitle: transaction.market_question,
                    marketSlug: transaction.market_slug,
                    marketUrl: transaction.market_url || undefined,
                    marketImage: transaction.market_image || undefined,
                    type: 'BUY',
                    outcome: outcome,
                    entryPrice: entryPrice,
                    amount: amount,
                    source: 'COPY_TRADING',
                    notes: `${mode === 'inverse' ? 'Inversed' : 'Copied'} from whale ${transaction.wallet_address.slice(0, 8)}...${slTpInfo}`,
                    // TP/SL for price updater
                    tp1Percent: useAutoRisk ? takeProfit : 0,
                    tp1SizePercent: 100,
                    stopLossPercent: useAutoRisk ? -stopLoss : 0
                })
            });

            if (response.ok) {
                onClose();
            } else {
                const error = await response.json();
                console.error('[CopyTrade] Failed:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [transaction, mode, outcome, entryPrice, amount, stopLoss, takeProfit, slPrice, tpPrice, useAutoRisk, onClose]);

    if (!isOpen) return null;

    const isBuy = outcome === 'YES';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className={`p-4 border-b border-border ${mode === 'inverse' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {mode === 'inverse' ? (
                                    <RefreshCcw className="w-5 h-5 text-red-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-green-400" />
                                )}
                                <div>
                                    <h2 className="text-lg font-bold">
                                        {mode === 'inverse' ? 'Inverse Trade' : 'Copy Trade'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                        {transaction.market_question}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Trade Info */}
                    <div className="p-4 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {transaction.market_image && (
                                    <img
                                        src={transaction.market_image}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                )}
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {outcome}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Entry: ${entryPrice.toFixed(3)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Whale Size</p>
                                <p className="text-sm font-mono font-bold">${transaction.amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amount Section */}
                    <div className="p-4 border-b border-border">
                        <label className="flex items-center gap-2 text-sm font-medium mb-3">
                            <DollarSign className="w-4 h-4 text-cyan-400" />
                            Trade Amount
                        </label>

                        <div className="relative mb-3">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.max(1, Math.min(profile.currentBalance, Number(e.target.value))))}
                                className="w-full pl-7 pr-4 py-3 bg-muted border border-border rounded-xl text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Quick Amounts */}
                        <div className="flex gap-2 flex-wrap mb-3">
                            {quickAmounts.map(qa => (
                                <button
                                    key={qa}
                                    onClick={() => setAmount(Math.min(qa, profile.currentBalance))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${amount === qa
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                        }`}
                                >
                                    ${qa}
                                </button>
                            ))}
                        </div>

                        {/* Percentage of Balance */}
                        <div className="flex gap-2">
                            {quickPercentages.map(pct => (
                                <button
                                    key={pct}
                                    onClick={() => setAmount(Math.round(profile.currentBalance * pct / 100))}
                                    className="flex-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            Balance: <span className="text-foreground font-mono">${profile.currentBalance.toFixed(2)}</span>
                        </p>
                    </div>

                    {/* Risk Management */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="w-4 h-4 text-purple-400" />
                                Risk Management
                            </label>
                            <button
                                onClick={() => setUseAutoRisk(!useAutoRisk)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${useAutoRisk
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                <Zap className="w-3 h-3" />
                                {useAutoRisk ? 'Auto Enabled' : 'Manual'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Stop Loss */}
                            <div>
                                <label className="flex items-center gap-1 text-xs text-red-400 mb-2">
                                    <TrendingDown className="w-3 h-3" />
                                    Stop Loss
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        value={stopLoss}
                                        onChange={(e) => setStopLoss(Number(e.target.value))}
                                        className="flex-1 accent-red-500"
                                    />
                                    <span className="text-sm font-mono font-bold text-red-400 w-12 text-right">
                                        {stopLoss}%
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Trigger @ ${slPrice.toFixed(3)} (-${potentialLoss.toFixed(2)})
                                </p>
                            </div>

                            {/* Take Profit */}
                            <div>
                                <label className="flex items-center gap-1 text-xs text-green-400 mb-2">
                                    <TrendingUp className="w-3 h-3" />
                                    Take Profit
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={takeProfit}
                                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                                        className="flex-1 accent-green-500"
                                    />
                                    <span className="text-sm font-mono font-bold text-green-400 w-12 text-right">
                                        {takeProfit}%
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Trigger @ ${tpPrice.toFixed(3)} (+${potentialProfit.toFixed(2)})
                                </p>
                            </div>
                        </div>

                        {/* Risk Ratio */}
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Risk/Reward Ratio</span>
                                <span className={`font-bold ${takeProfit / stopLoss >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    1:{(takeProfit / stopLoss).toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Cost</p>
                                <p className="text-xl font-bold font-mono">${amount.toFixed(2)}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Potential Profit</p>
                                <p className="text-xl font-bold font-mono text-green-400">+${potentialProfit.toFixed(2)}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || amount <= 0 || amount > profile.currentBalance}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${mode === 'inverse'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Settings className="w-5 h-5" />
                                    </motion.div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    {mode === 'inverse' ? 'Execute Inverse Trade' : 'Execute Copy Trade'}
                                </>
                            )}
                        </button>

                        {amount > profile.currentBalance && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1 justify-center">
                                <AlertTriangle className="w-3 h-3" />
                                Insufficient balance
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
