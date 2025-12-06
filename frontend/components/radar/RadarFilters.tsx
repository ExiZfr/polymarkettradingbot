"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Flame, Heart, Rss, Twitter, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

// Types for filters
type SourceType = "ALL" | "TWITTER" | "NEWS" | "RSS" | "ONCHAIN";
type UrgencyLevel = "ALL" | "HIGH" | "MID" | "LOW";

interface RadarFiltersProps {
    onFilterChange: (filters: RadarFilterState) => void;
}

export interface RadarFilterState {
    source: SourceType;
    urgency: UrgencyLevel;
    showFavoritesOnly: boolean;
}

export function RadarFilters({ onFilterChange }: RadarFiltersProps) {
    const [filters, setFilters] = useState<RadarFilterState>({
        source: "ALL",
        urgency: "ALL",
        showFavoritesOnly: false,
    });

    const handleFilterUpdate = (key: keyof RadarFilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-30 w-full backdrop-blur-md bg-background/80 border-b border-border/50 px-4 py-3 shadow-sm"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">

                {/* Left: Source Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <Filter className="w-4 h-4 text-muted-foreground mr-1 shrink-0" />

                    <FilterChip
                        active={filters.source === "ALL"}
                        onClick={() => handleFilterUpdate("source", "ALL")}
                        label="All"
                    />
                    <FilterChip
                        active={filters.source === "TWITTER"}
                        onClick={() => handleFilterUpdate("source", "TWITTER")}
                        icon={<Twitter className="w-3 h-3" />}
                        label="X / Twitter"
                    />
                    <FilterChip
                        active={filters.source === "NEWS"}
                        onClick={() => handleFilterUpdate("source", "NEWS")}
                        icon={<Newspaper className="w-3 h-3" />}
                        label="News"
                    />
                    <FilterChip
                        active={filters.source === "ONCHAIN"}
                        onClick={() => handleFilterUpdate("source", "ONCHAIN")}
                        icon={<Flame className="w-3 h-3" />}
                        label="On-Chain"
                    />
                </div>

                {/* Right: Urgency & Favorites */}
                <div className="flex items-center gap-4 shrink-0">

                    {/* Urgency Selector */}
                    <div className="flex items-center bg-secondary/50 rounded-full p-1 border border-border/50">
                        <UrgencyDot
                            level="HIGH"
                            active={filters.urgency === "HIGH"}
                            onClick={() => handleFilterUpdate("urgency", filters.urgency === "HIGH" ? "ALL" : "HIGH")}
                        />
                        <UrgencyDot
                            level="MID"
                            active={filters.urgency === "MID"}
                            onClick={() => handleFilterUpdate("urgency", filters.urgency === "MID" ? "ALL" : "MID")}
                        />
                        <UrgencyDot
                            level="LOW"
                            active={filters.urgency === "LOW"}
                            onClick={() => handleFilterUpdate("urgency", filters.urgency === "LOW" ? "ALL" : "LOW")}
                        />
                    </div>

                    {/* Favorites Toggle */}
                    <Button
                        variant={filters.showFavoritesOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterUpdate("showFavoritesOnly", !filters.showFavoritesOnly)}
                        className={cn(
                            "gap-2 transition-all",
                            filters.showFavoritesOnly && "bg-pink-600 hover:bg-pink-700 text-white border-pink-600"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", filters.showFavoritesOnly && "fill-current")} />
                        <span className="hidden sm:inline">Favorites</span>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// Sub-components for cleaner code

function FilterChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
    return (
        <Badge
            variant={active ? "default" : "outline"}
            className={cn(
                "cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5 gap-1.5 text-sm font-medium",
                !active && "hover:bg-secondary text-muted-foreground hover:text-foreground border-border/60"
            )}
            onClick={onClick}
        >
            {icon}
            {label}
        </Badge>
    );
}

function UrgencyDot({ level, active, onClick }: { level: "HIGH" | "MID" | "LOW"; active: boolean; onClick: () => void }) {
    const colors = {
        HIGH: "bg-red-500 shadow-red-500/50",
        MID: "bg-orange-500 shadow-orange-500/50",
        LOW: "bg-emerald-500 shadow-emerald-500/50",
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 mx-0.5",
                active ? "bg-secondary" : "hover:bg-secondary/80"
            )}
            title={`Filter by ${level} urgency`}
        >
            <div className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                colors[level],
                active ? "w-3.5 h-3.5 shadow-lg ring-2 ring-background" : "opacity-60"
            )} />
        </div>
    );
}
