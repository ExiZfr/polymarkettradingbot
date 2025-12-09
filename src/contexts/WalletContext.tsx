"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Position = {
    marketId: string;
    outcome: 'YES' | 'NO';
    shares: number;
    avgPrice: number;
    investedParams: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
};

type WalletData = {
    balance: number;
    locked: number;
    totalEquity: number;
    positions: Record<string, Position>; // Map converted to record for JSON
};

type WalletContextType = {
    wallet: WalletData | null;
    isLoading: boolean;
    refreshWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshWallet = async () => {
        try {
            const res = await fetch('/api/trading/wallet');
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshWallet();
        // Poll every 5 seconds to keep sync
        const interval = setInterval(refreshWallet, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <WalletContext.Provider value={{ wallet, isLoading, refreshWallet }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
