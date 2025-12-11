"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HelpCircle,
    X,
    Target,
    Zap,
    TrendingUp,
    PieChart,
    ShieldAlert,
    ChevronRight,
    BrainCircuit,
    Ghost
} from "lucide-react";

export default function SniperGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("concept");

    const tabs = [
        { id: "concept", label: "C'est quoi ?", icon: Ghost },
        { id: "metrics", label: "Les Chiffres", icon: PieChart },
        { id: "risks", label: "Risques & Frais", icon: ShieldAlert },
    ];

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-primary/25 transition-all font-bold group"
            >
                <HelpCircle size={20} className="group-hover:rotate-12 transition-transform" />
                <span>Comment ça marche ?</span>
            </motion.button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-20 md:right-6 md:w-[500px] h-[80vh] md:h-[600px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <BrainCircuit className="text-primary" />
                                        Guide du Sniper
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Comprendre la machine à cash (virtuelle)</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <div className="flex p-2 gap-2 bg-muted/30 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                                ? "bg-primary text-primary-foreground shadow-md"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                <AnimatePresence mode="wait">
                                    {activeTab === "concept" && (
                                        <motion.div
                                            key="concept"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="prose prose-sm dark:prose-invert">
                                                <h3 className="text-lg font-bold text-foreground">Le Radar à Nouveautés 📡</h3>
                                                <p>
                                                    Imagine un guetteur qui regarde Polymarket 24h/24 sans jamais cligner des yeux.
                                                    Dès qu'un <strong>nouveau marché</strong> apparaît, le Sniper le voit instantanément, avant les humains.
                                                </p>

                                                <div className="my-4 p-4 bg-primary/10 rounded-xl border border-primary/20 flex gap-4 items-center">
                                                    <Target size={32} className="text-primary shrink-0" />
                                                    <div className="text-sm">
                                                        <strong>La Cible :</strong> Les prix mal ajustés.
                                                        <br />
                                                        Si un marché sort à <strong>$0.42</strong> (42%) alors qu'il devrait être à <strong>$0.50</strong> (50/50), le bot tire !
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-bold text-foreground mt-6">La Stratégie "In & Out" ⚡</h3>
                                                <ul className="space-y-3 list-none pl-0">
                                                    <li className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                                        <span>On achète bas (ex: 42¢).</span>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                                        <span>On attend que les autres arrivent et fassent monter le prix.</span>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                                        <span>On revend dès qu'on a fait <strong>+10¢</strong> de profit (Take Profit).</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "metrics" && (
                                        <motion.div
                                            key="metrics"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-4">
                                                <MetricCard
                                                    title="Win Rate (Taux de Victoire)"
                                                    desc="C'est simple : Si tu joues 10 fois et que tu gagnes 6 fois, t'as 60%. En dessous de 50%, le bot est bourré."
                                                    icon={Target}
                                                    color="text-blue-500"
                                                />
                                                <MetricCard
                                                    title="Profit Factor"
                                                    desc="Le ratio Gains / Pertes. Si t'as gagné 100€ mais perdu 50€, ton facteur est de 2.0. S'il est en dessous de 1.0, tu perds de l'argent."
                                                    icon={TrendingUp}
                                                    color="text-green-500"
                                                />
                                                <MetricCard
                                                    title="Max Drawdown"
                                                    desc="La pire chute de ton capital. Si tu passes de 1000€ à 800€, t'as un drawdown de 20%. C'est la douleur max que tu as subie."
                                                    icon={Zap}
                                                    color="text-red-500"
                                                />
                                                <MetricCard
                                                    title="Capital Current"
                                                    desc="Ton argent de poche actuel. Ça commence à $10,000 (faux argent hélas)."
                                                    icon={PieChart}
                                                    color="text-yellow-500"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "risks" && (
                                        <motion.div
                                            key="risks"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <h3 className="font-bold text-red-500 flex items-center gap-2">
                                                    <ShieldAlert size={20} />
                                                    Attention au Slippage !
                                                </h3>
                                                <p className="text-sm mt-2 text-foreground/80">
                                                    Quand tu achètes pour $500 d'un coup, le prix monte <strong>pendant</strong> que tu achètes.
                                                    <br /><br />
                                                    C'est comme courir dans la boue : tu dépenses de l'énergie mais tu avances moins vite.
                                                    Le bot simule ça pour être réaliste. Tu vois un prix à 0.42, mais tu seras peut-être exécuté à 0.44.
                                                </p>
                                            </div>

                                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                                <h3 className="font-bold text-yellow-500 flex items-center gap-2">
                                                    <DollarSignIcon />
                                                    Les Frais (Fees)
                                                </h3>
                                                <p className="text-sm mt-2 text-foreground/80">
                                                    Polymarket (et la blockchain) prennent leur part.
                                                    Le bot simule <strong>2% de frais</strong> sur tes gains.
                                                    Si tu gagnes $100, on t'en retire $2. C'est la taxe du seigneur.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function MetricCard({ title, desc, icon: Icon, color }: any) {
    return (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-background ${color}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
            </div>
        </div>
    );
}

function DollarSignIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    )
}
