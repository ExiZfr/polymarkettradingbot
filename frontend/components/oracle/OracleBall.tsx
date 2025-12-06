"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, Zap, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OracleResult {
    found: boolean;
    marketTitle?: string;
    currentOdds?: number;
    predictedReversal?: string;
    confidenceScore?: number;
    reasoning?: string;
    message?: string;
}

export function OracleBall() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<OracleResult | null>(null);

    const handlePredict = async () => {
        setIsAnalyzing(true);
        setResult(null);

        try {
            const response = await fetch('/api/oracle/scan', { method: 'POST' });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Oracle Error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">

            {/* THE SPHERE CONTAINER */}
            <div className="relative w-full h-[400px] flex items-center justify-center mb-8">

                {/* Ambient Glow */}
                <div className={cn(
                    "absolute inset-0 bg-purple-600/20 blur-[100px] rounded-full transition-all duration-1000",
                    isAnalyzing ? "scale-125 opacity-80" : "scale-100 opacity-40"
                )} />

                {/* The Sphere */}
                <div className="relative z-10">
                    <motion.div
                        animate={{
                            scale: isAnalyzing ? [1, 1.2, 0.9, 1.1, 1] : [1, 1.05, 1],
                            rotate: isAnalyzing ? 360 : 0,
                        }}
                        transition={{
                            scale: { duration: isAnalyzing ? 2 : 4, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 1, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }
                        }}
                        className={cn(
                            "w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-900 shadow-[0_0_60px_rgba(139,92,246,0.6)] flex items-center justify-center backdrop-blur-xl border border-white/20 relative overflow-hidden cursor-pointer",
                            isAnalyzing && "shadow-[0_0_100px_rgba(139,92,246,0.9)] border-white/40"
                        )}
                        onClick={!isAnalyzing ? handlePredict : undefined}
                    >
                        {/* Inner Texture */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                        <BrainCircuit className={cn(
                            "w-20 h-20 text-white/90 transition-all duration-500",
                            isAnalyzing ? "opacity-50 blur-sm scale-90" : "opacity-100 scale-100"
                        )} />
                    </motion.div>

                    {/* Orbiting Rings (Searching State) */}
                    <AnimatePresence>
                        {isAnalyzing && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1.5, rotate: 360 }}
                                    exit={{ opacity: 0, scale: 2 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-purple-300/40 border-dashed pointer-events-none"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1.8, rotate: -360 }}
                                    exit={{ opacity: 0, scale: 2 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-indigo-300/30 border-dotted pointer-events-none"
                                />
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CONTROLS & RESULT */}
            <div className="z-20 w-full flex flex-col items-center space-y-6">

                {/* Button */}
                {!result && (
                    <Button
                        size="lg"
                        onClick={handlePredict}
                        disabled={isAnalyzing}
                        className={cn(
                            "h-14 px-8 rounded-full text-lg font-medium transition-all duration-500",
                            isAnalyzing
                                ? "bg-transparent border border-purple-500/50 text-purple-300"
                                : "bg-white text-black hover:bg-purple-50 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        )}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4 animate-spin" /> Scanning Market Anomalies...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" /> Consult The Oracle
                            </span>
                        )}
                    </Button>
                )}

                {/* Result Card */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="w-full"
                        >
                            <Card className="glass border-purple-500/30 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

                                <div className="p-6 md:p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-sm font-mono text-purple-400 mb-1 uppercase tracking-widest">Oracle Prediction</h3>
                                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{result.marketTitle}</h2>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-muted-foreground">Confidence</div>
                                            <div className="text-2xl font-bold text-green-400">{result.confidenceScore}%</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-secondary/40 rounded-lg p-4 border border-white/5">
                                            <div className="text-xs text-muted-foreground mb-1">Current Odds</div>
                                            <div className="text-xl font-mono">{result.currentOdds}¢</div>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                                            <div className="text-xs text-purple-300 mb-1">Target Reversal</div>
                                            <div className="text-xl font-mono text-purple-200">{result.predictedReversal}¢</div>
                                        </div>
                                        <div className="bg-secondary/40 rounded-lg p-4 border border-white/5 flex items-center justify-center">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Potential ROI: <span className="text-green-400 font-bold">3.5x</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded-lg p-4 border border-white/5 mb-6">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                <span className="text-foreground font-semibold">Analysis: </span>
                                                {result.reasoning}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => window.open('https://polymarket.com', '_blank')}>
                                            Execute Trade <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                        <Button variant="outline" onClick={() => setResult(null)}>
                                            Scan Again
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
