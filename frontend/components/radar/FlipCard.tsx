"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MarketData {
    id: string;
    title: string;
    image?: string;
    source: string;
    urgency: "HIGH" | "MID" | "LOW";
    probDelta: number; // Probability change
    volume: string;
    snipScore: number; // 0-100
    isFavorite: boolean;
}

interface FlipCardProps {
    market: MarketData;
    onToggleFavorite: (id: string) => void;
}

export function FlipCard({ market, onToggleFavorite }: FlipCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
            className="relative w-full h-[280px] perspective-1000 cursor-pointer group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={isFlipped ? "back" : "front"}
                variants={variants}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* ================= FRONT SIDE ================= */}
                <div className="absolute inset-0 backface-hidden w-full h-full bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-primary/30 transition-all">

                    {/* Image / Header */}
                    <div className="h-32 bg-muted relative overflow-hidden">
                        {market.image ? (
                            <img src={market.image} alt={market.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <TrendingUp className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-2">
                            <Badge variant="secondary" className="backdrop-blur-md bg-background/50 text-xs font-mono">
                                {market.source}
                            </Badge>
                            <Badge className={cn("backdrop-blur-md border", urgencyColors[market.urgency])}>
                                {market.urgency}
                            </Badge>
                        </div>

                        {/* Favorite Button (Stop Propagation to prevent flip) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm text-white hover:text-pink-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(market.id);
                            }}
                        >
                            <Heart className={cn("w-5 h-5", market.isFavorite && "fill-pink-500 text-pink-500")} />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col justify-between h-[calc(100%-8rem)]">
                        <div>
                            <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                {market.title}
                            </h3>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Just now</span>
                            </div>
                            <div className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                                Click for details
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= BACK SIDE ================= */}
                <div
                    className="absolute inset-0 backface-hidden w-full h-full bg-card border border-primary/20 rounded-xl overflow-hidden shadow-lg p-5 flex flex-col rotate-y-180 bg-gradient-to-b from-card to-secondary/10"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Analysis</h4>
                        <Badge variant="outline" className="font-mono">{market.volume} Vol</Badge>
                    </div>

                    <div className="space-y-4 flex-1">

                        {/* Snip Score */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Snip Score</span>
                                <span className={cn("font-bold", market.snipScore > 80 ? "text-green-500" : "text-yellow-500")}>
                                    {market.snipScore}/100
                                </span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${market.snipScore}%` }}
                                    className={cn("h-full rounded-full", market.snipScore > 80 ? "bg-green-500" : "bg-yellow-500")}
                                />
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-secondary/30 p-2 rounded border border-border/50 text-center">
                                <div className="text-xs text-muted-foreground">Prob Delta</div>
                                <div className="text-lg font-mono font-bold text-blue-400">+{market.probDelta}%</div>
                            </div>
                            <div className="bg-secondary/30 p-2 rounded border border-border/50 text-center">
                                <div className="text-xs text-muted-foreground">Liquidity</div>
                                <div className="text-lg font-mono font-bold">High</div>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full mt-auto gap-2 group/btn">
                        Open Market
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
