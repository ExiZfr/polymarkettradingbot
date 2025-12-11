"use client";

import { useState, useEffect } from "react";
import { Settings, Wallet } from "lucide-react";
import { paperStore } from "@/lib/paper-trading";
import AccountManagerModal from "./AccountManagerModal";

export default function AccountManagerWidget() {
    const [balance, setBalance] = useState(0);
    const [name, setName] = useState("Paper Account");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const updateStats = async () => {
        // First try to get data from Sniper (Source of Truth)
        try {
            const res = await fetch('/api/sniper/data');
            if (res.ok) {
                const data = await res.json();
                setBalance(data.capital_current_USDC);
                // Can also update name if we store it there, but keeping local for now
            } else {
                // Fallback to local store
                const profile = paperStore.getActiveProfile();
                setBalance(profile.currentBalance);
            }
        } catch (e) {
            const profile = paperStore.getActiveProfile();
            setBalance(profile.currentBalance);
        }

        const profile = paperStore.getActiveProfile(); // Still get name
        setName(profile.username || "Paper Account");
    };

    useEffect(() => {
        updateStats();
        // Poll for updates
        const interval = setInterval(updateStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="bg-card border border-border rounded-xl p-4 mb-4 cursor-pointer hover:border-primary/50 transition-colors group"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                            <span className="font-bold text-sm">{name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-foreground">
                                {name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Active Portfolio
                            </div>
                        </div>
                    </div>
                    <div className="p-2 text-muted-foreground group-hover:text-primary rounded-lg transition-colors">
                        <Settings size={16} />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50 group-hover:bg-muted transition-colors">
                    <span className="flex items-center gap-1.5">
                        <Wallet size={12} />
                        Balance
                    </span>
                    <span className="font-mono text-green-500 font-semibold text-sm">
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <AccountManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={updateStats}
            />
        </>
    );
}
