"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HelpCircle,
    X,
    Radar,
    TrendingUp,
    Users,
    ShieldAlert,
    BrainCircuit,
    Search,
    Fish,
    Crown,
    Activity
} from "lucide-react";

export default function RadarGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("concept");

    const tabs = [
        { id: "concept", label: "C'est quoi ?", icon: Radar },
        { id: "whales", label: "Les Whales", icon: Fish },
        { id: "risks", label: "Copy Trading", icon: TrendingUp },
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[500px] h-[80vh] md:h-[600px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Radar className="text-primary" />
                                        Guide du Radar
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Détecteur de Whales & Smart Money</p>
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
                                                <h3 className="text-lg font-bold text-foreground">Le Radar à Whales 🐋</h3>
                                                <p>
                                                    Le Radar scanne la blockchain Polygon en temps réel pour repérer les transactions massives sur Polymarket.
                                                    C'est comme un sonar qui bipe dès qu'un gros poisson bouge.
                                                </p>

                                                <div className="my-4 p-4 bg-primary/10 rounded-xl border border-primary/20 flex gap-4 items-center">
                                                    <Search size={32} className="text-primary shrink-0" />
                                                    <div className="text-sm">
                                                        <strong>La Mission :</strong> Suivre l'argent intelligent.
                                                        <br />
                                                        Quand quelqu'un parie $50,000 d'un coup, il sait probablement quelque chose que tu ignores.
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-bold text-foreground mt-6">Comment ça marche ? 🔍</h3>
                                                <ul className="space-y-3 list-none pl-0">
                                                    <li className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                                        <span>Le bot écoute toutes les transactions &gt; $1,000.</span>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                                        <span>Il analyse le portefeuille : Est-ce un pro ? Un insider ? Un market maker ?</span>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                                        <span>Si le score est bon, il l'affiche ici et peut même copier le trade automatiquement.</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "whales" && (
                                        <motion.div
                                            key="whales"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-4">
                                                <MetricCard
                                                    title="Smart Money 🧠"
                                                    desc="Des traders avec un historique de gains impressionnant. Ils gagnent souvent, et ils gagnent gros. C'est la catégorie reine à copier."
                                                    icon={Crown}
                                                    color="text-green-500"
                                                />
                                                <MetricCard
                                                    title="Insiders 🕵️"
                                                    desc="Des portefeuilles frais, créés récemment, financés depuis un exchange, qui font un gros pari unique. Suspect et potentiellement très rentable."
                                                    icon={ShieldAlert}
                                                    color="text-orange-500"
                                                />
                                                <MetricCard
                                                    title="Market Makers 🏦"
                                                    desc="Fournissent de la liquidité des deux côtés (YES et NO). On les ignore généralement car ils ne prennent pas de directionnel."
                                                    icon={Activity}
                                                    color="text-gray-500"
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
                                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                                <h3 className="font-bold text-blue-500 flex items-center gap-2">
                                                    <BrainCircuit size={20} />
                                                    Le Decision Engine
                                                </h3>
                                                <p className="text-sm mt-2 text-foreground/80">
                                                    Copier aveuglément est dangereux. C'est pourquoi le "Brain" filtre les signaux.
                                                    Il vérifie le Win Rate du wallet, la liquidité du marché, et si le prix n'a pas déjà trop monté (FOMO).
                                                </p>
                                            </div>

                                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                                <h3 className="font-bold text-yellow-500 flex items-center gap-2">
                                                    <TrendingUp size={20} />
                                                    Copy Trading
                                                </h3>
                                                <p className="text-sm mt-2 text-foreground/80">
                                                    Quand le système copie, il n'investit pas la même somme que la Whale (heureusement !).
                                                    Il investit une somme fixe définie dans tes paramètres (ex: $100 par trade).
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
