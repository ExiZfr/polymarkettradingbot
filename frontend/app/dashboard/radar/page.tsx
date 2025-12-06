"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RadarFilters, RadarFilterState } from "@/components/radar/RadarFilters";
import { FluxCard, MarketData } from "@/components/radar/FluxCard";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data
const MOCK_MARKETS: MarketData[] = [
    {
        id: "1",
        title: "Will Trump win the 2024 Election?",
        source: "TWITTER",
        urgency: "HIGH",
        probDelta: 5.2,
        volume: "$45.2M",
        spread: 0.5,
        snipScore: 92,
        isFavorite: true,
    },
    {
        id: "2",
        title: "Bitcoin to hit $100k by Q4?",
        source: "NEWS",
        urgency: "MID",
        probDelta: 2.1,
        volume: "$12.8M",
        spread: 1.2,
        snipScore: 78,
        isFavorite: false,
    },
    {
        id: "3",
        title: "Fed Interest Rate Cut in December?",
        source: "ONCHAIN",
        urgency: "LOW",
        probDelta: 0.8,
        volume: "$5.4M",
        spread: 0.8,
        snipScore: 45,
        isFavorite: false,
    },
    {
        id: "4",
        title: "SpaceX Starship Launch Success?",
        source: "TWITTER",
        urgency: "HIGH",
        probDelta: 8.5,
        volume: "$2.1M",
        spread: 2.5,
        snipScore: 88,
        isFavorite: true,
    },
    {
        id: "5",
        title: "Ethereum ETF Approval Date?",
        source: "NEWS",
        urgency: "MID",
        probDelta: 3.4,
        volume: "$8.9M",
        spread: 1.0,
        snipScore: 65,
        isFavorite: false,
    },
];

export default function RadarPage() {
    const [markets, setMarkets] = useState<MarketData[]>(MOCK_MARKETS);
    const [filters, setFilters] = useState<RadarFilterState>({
        source: "ALL",
        urgency: "ALL",
        showFavoritesOnly: false,
    });

    const handleToggleFavorite = (id: string) => {
        setMarkets(prev => prev.map(m =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
        ));
    };

    const filteredMarkets = useMemo(() => {
        return markets.filter(market => {
            // Filter by Source
            if (filters.source !== "ALL" && market.source !== filters.source) return false;

            // Filter by Urgency
            if (filters.urgency !== "ALL" && market.urgency !== filters.urgency) return false;

            // Filter by Favorites
            if (filters.showFavoritesOnly && !market.isFavorite) return false;

            return true;
        });
    }, [markets, filters]);

    return (
        <AppLayout>
            <div className="relative min-h-screen">
                {/* Sticky Header */}
                <div className="mb-6 sticky top-0 z-40 -mx-4 md:-mx-8 px-4 md:px-8 pt-4 pb-2 bg-background/80 backdrop-blur-xl border-b border-white/5">
                    <div className="flex flex-col gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Market Radar</h1>
                            <p className="text-sm text-muted-foreground">Real-time opportunity scanner.</p>
                        </div>
                        <RadarFilters onFilterChange={setFilters} />
                    </div>
                </div>

                {/* Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredMarkets.map((market) => (
                            <motion.div
                                key={market.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <FluxCard
                                    market={market}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredMarkets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <p>No markets match your filters.</p>
                        <Button
                            variant="link"
                            onClick={() => setFilters({ source: "ALL", urgency: "ALL", showFavoritesOnly: false })}
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
