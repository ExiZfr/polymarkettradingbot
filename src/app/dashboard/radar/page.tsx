'use client';

import RadarLogsConsole from '@/components/dashboard/RadarLogsConsole';
import { Terminal, Zap, Activity } from 'lucide-react';

/**
 * Radar Page - 24/7 Whale Tracking Console
 * 
 * Affiche en temps réel toutes les transactions whale détectées sur Polygon
 * avec tagging intelligent (WINNER, INSIDER, SMART_MONEY, etc.)
 */
export default function RadarPage() {
    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Terminal className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                                🐋 Whale Radar
                                <span className="text-sm font-normal text-muted-foreground">v2.0</span>
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Real-time whale transaction tracking with intelligent tagging
                            </p>
                        </div>
                    </div>

                    {/* Live Indicator */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-bold text-green-500">LIVE 24/7</span>
                        </div>
                        <div className="w-px h-4 bg-border" />
                        <Activity className="w-4 h-4 text-muted-foreground animate-pulse" />
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-foreground font-medium mb-1">
                                Enhanced Multi-Metric Tagging Algorithm
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Analyzing 11+ metrics including win rate, PnL, trading velocity, position sizing consistency,
                                and streaks to identify WINNER, INSIDER, SMART_MONEY, LOOSER, and DUMB_MONEY whales.
                                Click any transaction for details and Polymarket link.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Console - Full Height */}
            <div className="h-[calc(100vh-280px)] min-h-[500px]">
                <RadarLogsConsole />
            </div>

            {/* Footer Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">WINNER</div>
                    <div className="text-xs text-muted-foreground mt-1">
            Win Rate ≥65% + PnL >$30k
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-400">INSIDER</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        New wallet + Large positions (6-factor scoring)
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">SMART_MONEY</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Win Rate 55-70% + 100+ trades
                    </div>
                </div>
            </div>
        </div>
    );
}
