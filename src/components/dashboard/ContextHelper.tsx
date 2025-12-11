"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, Info, X, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HelperContent {
    title: string;
    definition: string;
    technical: string;
    lowScenario: {
        label: string;
        pros: string;
        cons: string;
    };
    highScenario: {
        label: string;
        pros: string;
        cons: string;
    };
}

export default function ContextHelper({ content }: { content: HelperContent }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block ml-2" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1 rounded-full transition-colors ${isOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
            >
                <HelpCircle size={16} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 w-[320px] md:w-[400px] bg-card border border-border shadow-2xl rounded-xl overflow-hidden right-0 mt-2"
                        style={{ top: '100%' }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-muted/30 border-b border-border">
                            <h4 className="font-bold text-foreground flex items-center gap-2">
                                <Info size={16} className="text-primary" />
                                {content.title}
                            </h4>
                            <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                                {content.definition}
                            </p>
                        </div>

                        {/* Technical Body */}
                        <div className="p-4 bg-background">
                            <div className="text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded border border-border mb-4">
                                <span className="font-bold text-primary">Technical: </span>
                                {content.technical}
                            </div>

                            {/* Trade-offs Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Low Value Scenario */}
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                                        {content.lowScenario.label}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <TrendingUp size={12} className="text-green-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                <span className="text-green-500 font-medium">Gain: </span>
                                                {content.lowScenario.pros}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Shield size={12} className="text-orange-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                <span className="text-orange-500 font-medium">Risk: </span>
                                                {content.lowScenario.cons}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* High Value Scenario */}
                                <div className="space-y-2 pl-3 border-l border-border">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                                        {content.highScenario.label}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <Shield size={12} className="text-green-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                <span className="text-green-500 font-medium">Gain: </span>
                                                {content.highScenario.pros}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <TrendingDown size={12} className="text-orange-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                <span className="text-orange-500 font-medium">Risk: </span>
                                                {content.highScenario.cons}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
