"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    icon?: React.ReactNode;
    delay?: number;
}

export function MetricCard({ title, value, change, isPositive, icon, delay = 0 }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="glass-card rounded-xl p-5 relative overflow-hidden group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-background/50 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                    {icon || <MoreHorizontal className="w-5 h-5" />}
                </div>
                {change && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border",
                        isPositive
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {change}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-sm text-muted-foreground font-medium">{title}</h3>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
            </div>

            {/* Decorative gradient blob */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
        </motion.div>
    );
}
