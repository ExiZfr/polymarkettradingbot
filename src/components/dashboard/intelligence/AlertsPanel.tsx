"use client";

import { useState } from 'react';
import { useMarketIntelligence } from '@/lib/market-intelligence-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Plus, Trash2, Settings, Zap, TrendingUp, DollarSign, Hash, User, ChevronDown } from 'lucide-react';

type AlertType = 'SCORE_TRIGGER' | 'PRICE_THRESHOLD' | 'VOLUME_SPIKE' | 'KEYWORD' | 'WALLET_ACTIVITY';

const AlertTypeIcons: Record<AlertType, any> = {
    SCORE_TRIGGER: Zap,
    PRICE_THRESHOLD: DollarSign,
    VOLUME_SPIKE: TrendingUp,
    KEYWORD: Hash,
    WALLET_ACTIVITY: User,
};

const AlertTypeColors: Record<AlertType, string> = {
    SCORE_TRIGGER: 'orange',
    PRICE_THRESHOLD: 'emerald',
    VOLUME_SPIKE: 'blue',
    KEYWORD: 'purple',
    WALLET_ACTIVITY: 'pink',
};

export default function AlertsPanel({ userId }: { userId: number }) {
    const { alerts, createAlert, updateAlert, deleteAlert, toggleAlertActive, isLoading } = useMarketIntelligence();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAlert, setNewAlert] = useState({
        name: '',
        type: 'SCORE_TRIGGER' as AlertType,
        conditions: {},
        telegramEnabled: false,
        webEnabled: true,
    });

    const handleCreate = async () => {
        try {
            await createAlert({ ...newAlert, userId, isActive: true, emailEnabled: false });
            setShowCreateModal(false);
            setNewAlert({ name: '', type: 'SCORE_TRIGGER', conditions: {}, telegramEnabled: false, webEnabled: true });
        } catch (error) {
            console.error('Failed to create alert:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Smart Alerts</h2>
                    <p className="text-sm text-slate-400">Configure custom triggers and notifications</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                >
                    <Plus size={18} />
                    New Alert
                </button>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {alerts.map((alert) => {
                        const Icon = AlertTypeIcons[alert.type as AlertType];
                        const color = AlertTypeColors[alert.type as AlertType];

                        return (
                            <motion.div
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className={`p-4 rounded-2xl border transition-all ${alert.isActive
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-white/[0.02] border-white/5 opacity-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                                            <Icon size={20} className={`text-${color}-400`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold">{alert.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {alert.type.replace(/_/g, ' ')} • {alert.triggeredCount} triggers
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {alert.telegramEnabled && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                                                        Telegram
                                                    </span>
                                                )}
                                                {alert.webEnabled && (
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
                                                        Web
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAlertActive(alert.id)}
                                            className={`p-2 rounded-lg transition-colors ${alert.isActive
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                                }`}
                                        >
                                            {alert.isActive ? <Bell size={16} /> : <BellOff size={16} />}
                                        </button>
                                        <button
                                            onClick={() => deleteAlert(alert.id)}
                                            className="p-2 rounded-lg bg-white/5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {alerts.length === 0 && !isLoading && (
                    <div className="py-12 text-center">
                        <Bell size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-400 font-medium">No alerts configured</p>
                        <p className="text-sm text-slate-600 mt-1">Create your first alert to get started</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0C0D12] border border-white/10 rounded-3xl p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Create New Alert</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Alert Name</label>
                                <input
                                    type="text"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g., Bitcoin hit $100k"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Alert Type</label>
                                <select
                                    value={newAlert.type}
                                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as AlertType, conditions: {} })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="SCORE_TRIGGER">Score Trigger</option>
                                    <option value="PRICE_THRESHOLD">Price Threshold</option>
                                    <option value="VOLUME_SPIKE">Volume Spike</option>
                                    <option value="KEYWORD">Keyword Match</option>
                                    <option value="WALLET_ACTIVITY">Wallet Activity</option>
                                </select>
                            </div>

                            {/* Dynamic conditions based on type */}
                            {newAlert.type === 'SCORE_TRIGGER' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Minimum Score</label>
                                    <input
                                        type="number"
                                        value={newAlert.conditions.minScore || ''}
                                        onChange={(e) =>
                                            setNewAlert({ ...newAlert, conditions: { minScore: parseInt(e.target.value) || 0 } })
                                        }
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="e.g., 80"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            )}

                            {newAlert.type === 'KEYWORD' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Keywords (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={newAlert.conditions.keywords?.join(', ') || ''}
                                        onChange={(e) =>
                                            setNewAlert({
                                                ...newAlert,
                                                conditions: { keywords: e.target.value.split(',').map((k) => k.trim()) },
                                            })
                                        }
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="e.g., Trump, Bitcoin, Election"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newAlert.telegramEnabled}
                                        onChange={(e) => setNewAlert({ ...newAlert, telegramEnabled: e.target.checked })}
                                        className="w-4 h-4 rounded bg-white/5 border-white/10"
                                    />
                                    <span className="text-sm text-slate-400">Telegram</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newAlert.webEnabled}
                                        onChange={(e) => setNewAlert({ ...newAlert, webEnabled: e.target.checked })}
                                        className="w-4 h-4 rounded bg-white/5 border-white/10"
                                    />
                                    <span className="text-sm text-slate-400">Web</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newAlert.name}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
