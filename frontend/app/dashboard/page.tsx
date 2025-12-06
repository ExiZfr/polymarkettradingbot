"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    DollarSign,
    Trophy,
    BarChart3,
    Power,
    Zap
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ConsoleLog } from "@/components/dashboard/ConsoleLog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const [modules, setModules] = useState({
        radar: true,
        copy: true,
        oracle: false,
    });

    const toggleModule = (key: keyof typeof modules) => {
        setModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, Commander. Systems nominal.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary">
                        <Zap className="w-4 h-4" />
                        Quick Action
                    </Button>
                    <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Power className="w-4 h-4" />
                        System Status: ONLINE
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    title="Total PnL"
                    value="$12,450.00"
                    change="+12.5%"
                    isPositive={true}
                    icon={<DollarSign className="w-5 h-5" />}
                    delay={0.1}
                />
                <MetricCard
                    title="Win Rate"
                    value="68.4%"
                    change="+2.1%"
                    isPositive={true}
                    icon={<Trophy className="w-5 h-5" />}
                    delay={0.2}
                />
                <MetricCard
                    title="Active Positions"
                    value="8"
                    change="-2"
                    isPositive={false}
                    icon={<Activity className="w-5 h-5" />}
                    delay={0.3}
                />
                <MetricCard
                    title="24h Volume"
                    value="$45,200"
                    change="+5.4%"
                    isPositive={true}
                    icon={<BarChart3 className="w-5 h-5" />}
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Console & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Live System Logs</h2>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Real-time
                            </div>
                        </div>
                        <ConsoleLog />
                    </motion.div>
                </div>

                {/* Right Column: Module Control */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass-card rounded-xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-1">Module Control</h2>
                        <p className="text-sm text-muted-foreground mb-6">Manage active trading subsystems.</p>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Radar Scanner</Label>
                                    <p className="text-xs text-muted-foreground">Market opportunity detection</p>
                                </div>
                                <Switch checked={modules.radar} onCheckedChange={() => toggleModule('radar')} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Copy Trading</Label>
                                    <p className="text-xs text-muted-foreground">Mirror wallet activity</p>
                                </div>
                                <Switch checked={modules.copy} onCheckedChange={() => toggleModule('copy')} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Oracle AI</Label>
                                    <p className="text-xs text-muted-foreground">Predictive analysis engine</p>
                                </div>
                                <Switch checked={modules.oracle} onCheckedChange={() => toggleModule('oracle')} />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                                <div className="text-xs font-bold text-primary mb-1">SYSTEM LOAD</div>
                                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[45%]" />
                                </div>
                                <div className="text-right text-xs text-muted-foreground mt-1">45% CPU</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
