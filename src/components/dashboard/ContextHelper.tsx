import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ArrowDown, ArrowUp, Info, Check, AlertTriangle } from "lucide-react";

interface HelpScenario {
    label: string;
    pros: string;
    cons: string;
}

interface HelpContent {
    title: string;
    definition: string;
    technical: string; // Used for "How it works" simplified explanation
    lowScenario: HelpScenario;
    highScenario: HelpScenario;
}

export default function ContextHelper({ content }: { content: HelpContent }) {
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
        <div className="relative inline-flex items-center ml-2" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded-full transition-all duration-200 ${isOpen ? 'text-primary bg-primary/10 scale-110' : 'text-muted-foreground hover:text-primary hover:bg-muted hover:scale-110'}`}
                title="Click for help"
            >
                <HelpCircle size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute z-[100] w-[340px] md:w-[500px] bg-card border border-border shadow-2xl rounded-2xl overflow-hidden left-0 mt-3"
                        style={{ top: '100%' }}
                    >
                        {/* Header Simplifié */}
                        <div className="p-5 bg-muted/30 border-b border-border">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                {content.title}
                            </h3>
                            <p className="text-base text-foreground/80 mt-2 leading-relaxed font-medium">
                                {content.definition}
                            </p>
                        </div>

                        <div className="p-5 space-y-6 bg-card">
                            {/* Le concept en bref (Ex-Technical vulgarisé) */}
                            <div className="text-sm text-foreground bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 flex gap-3">
                                <div className="shrink-0 mt-0.5 text-lg">💡</div>
                                <div className="leading-relaxed">
                                    <span className="font-bold text-blue-500 block mb-1">En bref :</span>
                                    {content.technical}
                                </div>
                            </div>

                            {/* Comparatif Visuel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cas BAS */}
                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-500/10">
                                        <ArrowDown className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <span className="font-bold text-sm text-foreground block">Si tu règles BAS</span>
                                            <span className="text-xs text-muted-foreground">{content.lowScenario.label}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-2 text-sm leading-snug">
                                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-foreground/90 font-medium">{content.lowScenario.pros}</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm leading-snug">
                                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{content.lowScenario.cons}</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Cas HAUT */}
                                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 hover:border-green-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/10">
                                        <ArrowUp className="w-5 h-5 text-green-500" />
                                        <div>
                                            <span className="font-bold text-sm text-foreground block">Si tu règles HAUT</span>
                                            <span className="text-xs text-muted-foreground">{content.highScenario.label}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-2 text-sm leading-snug">
                                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-foreground/90 font-medium">{content.highScenario.pros}</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm leading-snug">
                                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{content.highScenario.cons}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
