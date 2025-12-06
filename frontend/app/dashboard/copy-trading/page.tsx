"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CopyConfigModal } from "@/components/copy-trading/CopyConfigModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, PowerOff, RefreshCw, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Strategy {
    id: string;
    target_wallet: string;
    fixed_amount: number;
    max_slippage: number;
    is_inverse: boolean;
    is_active: boolean;
}

export default function CopyTradingPage() {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStrategies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/copy-trading/strategies');
            if (res.ok) {
                const data = await res.json();
                setStrategies(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategies();
    }, []);

    const handleCreateStrategy = async (config: any) => {
        try {
            const res = await fetch('/api/copy-trading/strategies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                fetchStrategies();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEmergencyShutdown = async () => {
        if (!confirm("ARE YOU SURE? This will stop ALL copy trading immediately.")) return;

        try {
            await fetch('/api/copy-trading/shutdown', { method: 'POST' });
            fetchStrategies(); // Refresh to show inactive status
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">

                {/* Header & Emergency Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Smart Copy Trading</h1>
                        <p className="text-muted-foreground">Mirror top traders with automated risk management.</p>
                    </div>

                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleEmergencyShutdown}
                        className="shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600 animate-pulse hover:animate-none font-bold tracking-wider"
                    >
                        <PowerOff className="w-5 h-5 mr-2" />
                        EMERGENCY SHUTDOWN
                    </Button>
                </div>

                {/* Stats / Overview (Mock) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-secondary/20 border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Active Strategies</div>
                            <div className="text-2xl font-bold">{strategies.filter(s => s.is_active).length}</div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-secondary/20 border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Copied Vol</div>
                            <div className="text-2xl font-bold">$12,450</div>
                        </div>
                    </Card>
                </div>

                {/* Strategy List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Your Strategies</h2>
                        <CopyConfigModal onSave={handleCreateStrategy} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {strategies.map((strategy) => (
                                <motion.div
                                    key={strategy.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className={cn(
                                        "p-5 border transition-all duration-300",
                                        strategy.is_active
                                            ? "bg-secondary/30 border-white/10 hover:border-primary/30"
                                            : "bg-background/50 border-border opacity-60 grayscale"
                                    )}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", strategy.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                                                <span className="font-mono text-sm truncate max-w-[120px]" title={strategy.target_wallet}>
                                                    {strategy.target_wallet.substring(0, 6)}...{strategy.target_wallet.substring(38)}
                                                </span>
                                            </div>
                                            {strategy.is_inverse && (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-5">INVERSE</Badge>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Amount</span>
                                                <span className="font-mono font-bold">${strategy.fixed_amount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Max Slippage</span>
                                                <span className="font-mono text-orange-400">{strategy.max_slippage}%</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                                            <Button variant="outline" size="sm" className="w-full text-xs" disabled={!strategy.is_active}>
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="w-full text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10">
                                                Stop
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {strategies.length === 0 && !isLoading && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-secondary/5">
                                <Wallet className="w-10 h-10 mb-3 opacity-20" />
                                <p>No active strategies.</p>
                                <CopyConfigModal
                                    onSave={handleCreateStrategy}
                                    trigger={<Button variant="link" className="text-primary">Create your first one</Button>}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
