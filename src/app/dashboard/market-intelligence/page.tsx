"use client";

import { MarketIntelligenceProvider } from '@/lib/market-intelligence-context';
import { RadarProvider } from '@/lib/radar-context';
import MarketIntelligence from '@/components/dashboard/intelligence/MarketIntelligence';
import { useEffect, useState } from 'react';

export default function MarketIntelligencePage() {
    // TODO: Get actual userId from auth context
    // For now, using a placeholder
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        // Mock user ID - in production, get from session/auth
        setUserId(123456789); // Placeholder Telegram ID
    }, []);

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <RadarProvider>
            <MarketIntelligenceProvider userId={userId}>
                <MarketIntelligence userId={userId} />
            </MarketIntelligenceProvider>
        </RadarProvider>
    );
}
