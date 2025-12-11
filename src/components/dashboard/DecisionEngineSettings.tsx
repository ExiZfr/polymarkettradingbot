"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Brain,
    Sliders,
    TrendingUp,
    DollarSign,
    Clock,
    BarChart3,
    AlertTriangle,
    Save,
    RotateCcw,
    Info
} from "lucide-react";
import ContextHelper from "./ContextHelper";

// Help Content Definitions
const HELP_CONTENT = {
    scoreThreshold: {
        title: "Score de Confiance",
        definition: "C'est la note minimale (sur 100) qu'un trade doit avoir pour que le bot le copie.",
        technical: "Le bot analyse l'historique de la Whale, son taux de réussite et le timing. Plus la note est haute, plus le trade est 'sûr'.",
        lowScenario: {
            label: "Bas (ex: 40/100)",
            pros: "Tu feras beaucoup de trades ! On ne rate rien.",
            cons: "Tu risques de copier des trades moyens ou perdants."
        },
        highScenario: {
            label: "Haut (ex: 85/100)",
            pros: "Sécurité avant tout. On ne copie que la crème de la crème.",
            cons: "Tu peux passer des jours sans aucun trade (c'est normal)."
        }
    },
    minTimeToExpiry: {
        title: "Temps Restant (Expiration)",
        definition: "Le bot refuse de parier sur un événement qui se termine trop tôt.",
        technical: "Les dernières heures d'un pari sont souvent chaotiques et manipulées. On évite cette zone de turbulence.",
        lowScenario: {
            label: "Court (ex: 1h)",
            pros: "Tu peux jouer sur la volatilité de dernière minute.",
            cons: "C'est le Far West : les prix bougent trop vite, gros risque."
        },
        highScenario: {
            label: "Long (ex: 24h)",
            pros: "On parie sur des tendances stables et réfléchies.",
            cons: "Ton argent est bloqué plus longtemps jusqu'au résultat."
        }
    },
    slippageProtection: {
        title: "Protection de Prix (Slippage)",
        definition: "La différence de prix maximale que tu acceptes entre le moment du signal et ton achat.",
        technical: "Si la Whale achète à 0.50$ et que le prix saute à 0.60$ instantanément, acheter serait une erreur. Cette option te protège.",
        lowScenario: {
            label: "Stricte (0.5%)",
            pros: "Tu achètes au VRAI prix de la Whale (ou pas du tout).",
            cons: "Beaucoup de tes ordres seront annulés si ça bouge vite."
        },
        highScenario: {
            label: "Large (5% +)",
            pros: "Tes ordres passeront presque à coup sûr.",
            cons: "Tu risques d'acheter un peu plus cher, ce qui réduit tes gains."
        }
    }
};

// Default Decision Engine configuration
const DEFAULT_CONFIG = {
    // Main threshold
    scoreThreshold: 75,

    // Hard filters (eliminatory)
    rejectMarketMakers: true,
    minTimeToExpiry: 86400, // 24h in seconds

    // Wallet Analysis Weights
    winRateHighThreshold: 65, // > this = +30 pts
    winRateMedThreshold: 55,  // > this = +10 pts
    winRateHighScore: 30,
    winRateMedScore: 10,

    pnlHighThreshold: 100000, // > this = +20 pts (Smart Money)
    pnlLowThreshold: -10000,  // < this = -50 pts (Dumb Money)
    pnlHighScore: 20,
    pnlLowScore: -50,

    // Timing Analysis
    priceDriftLowThreshold: 2, // < 2% = +20 pts
    priceDriftHighThreshold: 5, // > 5% = -30 pts (FOMO)
    priceDriftLowScore: 20,
    priceDriftHighScore: -30,

    // Liquidity Analysis
    liquidityRatioThreshold: 10, // > 10% = +10 pts
    liquidityScore: 10,

    // Risk Management
    slippageProtection: 2, // 2% max slippage

    // Feature toggles
    enableWalletAnalysis: true,
    enableTimingAnalysis: true,
    enableLiquidityAnalysis: true,
};

export type DecisionEngineConfig = typeof DEFAULT_CONFIG;

interface DecisionEngineSettingsProps {
    onConfigChange?: (config: DecisionEngineConfig) => void;
}

export default function DecisionEngineSettings({ onConfigChange }: DecisionEngineSettingsProps) {
    const [config, setConfig] = useState<DecisionEngineConfig>(DEFAULT_CONFIG);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('decisionEngineConfig');
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse decision engine config');
            }
        }
    }, []);

    const handleChange = (key: keyof DecisionEngineConfig, value: number | boolean) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        setHasChanges(true);
        onConfigChange?.(newConfig);
    };

    const saveConfig = () => {
        localStorage.setItem('decisionEngineConfig', JSON.stringify(config));
        setHasChanges(false);
    };

    const resetToDefaults = () => {
        setConfig(DEFAULT_CONFIG);
        setHasChanges(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Brain className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Decision Engine</h3>
                        <p className="text-xs text-muted-foreground">Configure AI trading decisions</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button
                        onClick={saveConfig}
                        disabled={!hasChanges}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${hasChanges
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                    >
                        <Save size={14} />
                        Save
                    </button>
                </div>
            </div>

            {/* Main Threshold */}
            <div className="p-4 bg-linear-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-foreground">Score Threshold</span>
                        <ContextHelper content={HELP_CONTENT.scoreThreshold} />
                    </div>
                    <span className="text-2xl font-bold text-purple-500">{config.scoreThreshold}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.scoreThreshold}
                    onChange={(e) => handleChange('scoreThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Trades with score ≥ {config.scoreThreshold} will be auto-executed
                </p>
            </div>

            {/* Hard Filters */}
            <div className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-foreground">Hard Filters (Eliminatory)</span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-foreground">Reject Market Makers</span>
                            <p className="text-xs text-muted-foreground">Ignore wallets with simultaneous YES/NO orders</p>
                        </div>
                        <button
                            onClick={() => handleChange('rejectMarketMakers', !config.rejectMarketMakers)}
                            className={`w-10 h-6 rounded-full transition ${config.rejectMarketMakers ? 'bg-green-500' : 'bg-muted'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.rejectMarketMakers ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="p-3 bg-secondary rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div>
                                    <span className="text-sm font-medium text-foreground">Min Time to Expiry</span>
                                    <p className="text-xs text-muted-foreground">Reject markets expiring soon</p>
                                </div>
                                <ContextHelper content={HELP_CONTENT.minTimeToExpiry} />
                            </div>
                            <span className="text-sm font-bold text-foreground">{Math.floor(config.minTimeToExpiry / 3600)}h</span>
                        </div>
                        <input
                            type="range"
                            min="3600"
                            max="604800"
                            step="3600"
                            value={config.minTimeToExpiry}
                            onChange={(e) => handleChange('minTimeToExpiry', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Wallet Analysis */}
            <div className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-foreground">Wallet Analysis</span>
                    </div>
                    <button
                        onClick={() => handleChange('enableWalletAnalysis', !config.enableWalletAnalysis)}
                        className={`w-10 h-6 rounded-full transition ${config.enableWalletAnalysis ? 'bg-green-500' : 'bg-muted'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.enableWalletAnalysis ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                </div>

                {config.enableWalletAnalysis && (
                    <div className="space-y-4">
                        {/* Win Rate */}
                        <div className="p-3 bg-secondary rounded-lg">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Win Rate Scoring</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">High threshold (%)</label>
                                    <input
                                        type="number"
                                        value={config.winRateHighThreshold}
                                        onChange={(e) => handleChange('winRateHighThreshold', parseInt(e.target.value))}
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Points if above</label>
                                    <input
                                        type="number"
                                        value={config.winRateHighScore}
                                        onChange={(e) => handleChange('winRateHighScore', parseInt(e.target.value))}
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PnL */}
                        <div className="p-3 bg-secondary rounded-lg">
                            <div className="text-xs font-medium text-muted-foreground mb-2">PnL Scoring (Smart Money Detection)</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">High PnL ($)</label>
                                    <input
                                        type="number"
                                        value={config.pnlHighThreshold}
                                        onChange={(e) => handleChange('pnlHighThreshold', parseInt(e.target.value))}
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Points if above</label>
                                    <input
                                        type="number"
                                        value={config.pnlHighScore}
                                        onChange={(e) => handleChange('pnlHighScore', parseInt(e.target.value))}
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                    <label className="text-xs text-red-400">Low PnL (Dumb Money)</label>
                                    <input
                                        type="number"
                                        value={config.pnlLowThreshold}
                                        onChange={(e) => handleChange('pnlLowThreshold', parseInt(e.target.value))}
                                        className="w-full mt-1 p-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-red-400">Penalty points</label>
                                    <input
                                        type="number"
                                        value={config.pnlLowScore}
                                        onChange={(e) => handleChange('pnlLowScore', parseInt(e.target.value))}
                                        className="w-full mt-1 p-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Timing Analysis */}
            <div className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-foreground">Timing Analysis (FOMO Protection)</span>
                    </div>
                    <button
                        onClick={() => handleChange('enableTimingAnalysis', !config.enableTimingAnalysis)}
                        className={`w-10 h-6 rounded-full transition ${config.enableTimingAnalysis ? 'bg-green-500' : 'bg-muted'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.enableTimingAnalysis ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                </div>

                {config.enableTimingAnalysis && (
                    <div className="p-3 bg-secondary rounded-lg">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Price Drift Since Whale Entry</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-green-400">Good entry (&lt; X%)</label>
                                <input
                                    type="number"
                                    value={config.priceDriftLowThreshold}
                                    onChange={(e) => handleChange('priceDriftLowThreshold', parseInt(e.target.value))}
                                    className="w-full mt-1 p-2 bg-background border border-green-500/30 rounded-lg text-sm text-foreground"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-green-400">Bonus points</label>
                                <input
                                    type="number"
                                    value={config.priceDriftLowScore}
                                    onChange={(e) => handleChange('priceDriftLowScore', parseInt(e.target.value))}
                                    className="w-full mt-1 p-2 bg-background border border-green-500/30 rounded-lg text-sm text-foreground"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div>
                                <label className="text-xs text-red-400">FOMO (&gt; X%)</label>
                                <input
                                    type="number"
                                    value={config.priceDriftHighThreshold}
                                    onChange={(e) => handleChange('priceDriftHighThreshold', parseInt(e.target.value))}
                                    className="w-full mt-1 p-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-red-400">Penalty</label>
                                <input
                                    type="number"
                                    value={config.priceDriftHighScore}
                                    onChange={(e) => handleChange('priceDriftHighScore', parseInt(e.target.value))}
                                    className="w-full mt-1 p-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Liquidity Analysis */}
            <div className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-foreground">Liquidity Analysis</span>
                    </div>
                    <button
                        onClick={() => handleChange('enableLiquidityAnalysis', !config.enableLiquidityAnalysis)}
                        className={`w-10 h-6 rounded-full transition ${config.enableLiquidityAnalysis ? 'bg-green-500' : 'bg-muted'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.enableLiquidityAnalysis ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                </div>

                {config.enableLiquidityAnalysis && (
                    <div className="p-3 bg-secondary rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Liquidity ratio threshold (%)</label>
                                <input
                                    type="number"
                                    value={config.liquidityRatioThreshold}
                                    onChange={(e) => handleChange('liquidityRatioThreshold', parseInt(e.target.value))}
                                    className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Bonus points</label>
                                <input
                                    type="number"
                                    value={config.liquidityScore}
                                    onChange={(e) => handleChange('liquidityScore', parseInt(e.target.value))}
                                    className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Whale moving &gt;{config.liquidityRatioThreshold}% of daily volume = strong conviction signal
                        </p>
                    </div>
                )}
            </div>

            {/* Risk Management */}
            <div className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-foreground">Risk Management</span>
                </div>

                <div className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div>
                                <span className="text-sm font-medium text-foreground">Max Slippage Protection</span>
                                <p className="text-xs text-muted-foreground">Reject trade if price moves more than this</p>
                            </div>
                            <ContextHelper content={HELP_CONTENT.slippageProtection} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{config.slippageProtection}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={config.slippageProtection}
                        onChange={(e) => handleChange('slippageProtection', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                        <p className="font-medium text-blue-500 mb-1">How it works</p>
                        <p>The Decision Engine analyzes each whale signal and calculates a score (0-100) based on the above criteria. Signals scoring at or above the threshold are automatically executed in your paper trading account.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
