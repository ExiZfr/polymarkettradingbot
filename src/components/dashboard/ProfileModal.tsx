"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, DollarSign, Percent, TrendingDown, TrendingUp } from "lucide-react";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: { name: string; balance: number; settings: { riskPerTrade: number; autoStopLoss: number; autoTakeProfit: number } }) => void;
}

export default function ProfileModal({ isOpen, onClose, onSave }: ProfileModalProps) {
    const [name, setName] = useState("");
    const [balance, setBalance] = useState(1000);
    const [riskPerTrade, setRiskPerTrade] = useState(5);
    const [autoStopLoss, setAutoStopLoss] = useState(15);
    const [autoTakeProfit, setAutoTakeProfit] = useState(30);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name || "New Profile",
            balance,
            settings: { riskPerTrade, autoStopLoss, autoTakeProfit }
        });
        // Reset form
        setName("");
        setBalance(1000);
        setRiskPerTrade(5);
        setAutoStopLoss(15);
        setAutoTakeProfit(30);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0C0D12] border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Create Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Profile Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Trading Bot"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                            <DollarSign size={14} /> Initial Balance
                        </label>
                        <input
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(Number(e.target.value))}
                            min={100}
                            step={100}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                            <Percent size={14} /> Risk Per Trade: {riskPerTrade}%
                        </label>
                        <input
                            type="range"
                            value={riskPerTrade}
                            onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                            min={1}
                            max={25}
                            className="w-full accent-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                            <TrendingDown size={14} className="text-red-400" /> Auto Stop-Loss: {autoStopLoss}%
                        </label>
                        <input
                            type="range"
                            value={autoStopLoss}
                            onChange={(e) => setAutoStopLoss(Number(e.target.value))}
                            min={0}
                            max={50}
                            className="w-full accent-red-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                            <TrendingUp size={14} className="text-green-400" /> Auto Take-Profit: {autoTakeProfit}%
                        </label>
                        <input
                            type="range"
                            value={autoTakeProfit}
                            onChange={(e) => setAutoTakeProfit(Number(e.target.value))}
                            min={0}
                            max={100}
                            className="w-full accent-green-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Create Profile
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
