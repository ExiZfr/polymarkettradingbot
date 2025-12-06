"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp, ExternalLink, Activity, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MarketData {
    id: string;
    title: string;
    image?: string;
    source: string;
    urgency: "HIGH" | "MID" | "LOW";
    probDelta: number;
    volume: string;
    spread: number; // New requirement
    snipScore: number;
    isFavorite: boolean;
}

interface FluxCardProps {
    market: MarketData;
    onToggleFavorite: (id: string) => void;
}

export function FluxCard({ market, onToggleFavorite }: FluxCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Animation variants
    const variants = {
        front: { rotateY: 0 },
        back: { rotateY: 180 },
    };

    const urgencyColors = {
        HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
        MID: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };

    return (
        <div
            className="relative w-full h-[300px] perspective-1000 cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={isFlipped ? "back" : "front"}
                variants={variants}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* ================= FRONT SIDE (Aperçu) ================= */}
                <div className="absolute inset-0 backface-hidden w-full h-full glass-card rounded-xl overflow-hidden flex flex-col">

                    {/* Image Area */}
                    <div className="h-36 bg-muted relative overflow-hidden">
                        {market.image ? (
                            <img src={market.image} alt={market.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <TrendingUp className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-2">
                            <Badge variant="secondary" className="backdrop-blur-md bg-black/40 text-xs font-mono border-white/10">
                                {market.source}
                            </Badge>
                            <Badge className={cn("backdrop-blur-md border", urgencyColors[market.urgency])}>
                                {market.urgency}
                            </Badge>
                        </div>

                        {/* Favorite Button (Stop Propagation) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white hover:text-pink-500 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(market.id);
                            }}
                        >
                            <Heart className={cn("w-5 h-5 transition-colors", market.isFavorite && "fill-pink-500 text-pink-500")} />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1 justify-between">
                        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {market.title}
                        </h3>

                        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3" />
                                <span>Score: {market.snipScore}</span>
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                                Click to Flip
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= BACK SIDE (Data) ================= */}
                <div
                    className="absolute inset-0 backface-hidden w-full h-full glass-card rounded-xl overflow-hidden p-5 flex flex-col rotate-y-180 bg-gradient-to-b from-secondary/50 to-background"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Market Data</h4>
                        <Badge variant="outline" className="font-mono border-primary/30 text-primary">Live</Badge>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Volume */}
                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BarChart2 className="w-4 h-4" />
                                <span className="text-sm">24h Volume</span>
                            </div>
                            <span className="font-mono font-bold text-foreground">{market.volume}</span>
                        </div>

                        {/* Spread */}
                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Activity className="w-4 h-4" />
                                <span className="text-sm">Spread</span>
                            </div>
                            <span className={cn("font-mono font-bold", market.spread < 1 ? "text-green-400" : "text-yellow-400")}>
                                {market.spread}%
                            </span>
                        </div>

                        {/* Prob Delta */}
                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm">Prob Delta</span>
                            </div>
                            <span className="font-mono font-bold text-blue-400">+{market.probDelta}%</span>
                        </div>
                    </div>

                    <Button className="w-full mt-auto gap-2 group/btn bg-primary hover:bg-primary/90">
                        Trade on Polymarket
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
