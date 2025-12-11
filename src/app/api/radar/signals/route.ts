/**
 * API Route: GET /api/radar/signals
 * Returns whale signals with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhaleSignals } from '@/lib/polyradar-db';

export const dynamic = 'force-dynamic';

// Generate mock signals when database is empty
function generateMockSignals(limit: number = 10) {
    const categories = ['SMART_MONEY', 'INSIDER', 'SMART_MONEY', 'UNKNOWN'];
    const signals = [];
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < limit; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        signals.push({
            id: i + 1,
            wallet_address: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}...`,
            market_id: String(100000 + Math.floor(Math.random() * 1000)),
            outcome: Math.random() > 0.5 ? 'YES' : 'NO',
            amount_usd: Math.floor(Math.random() * 50000) + 5000,
            price: Math.random() * 0.7 + 0.2,
            timestamp: now - i * 300 - Math.floor(Math.random() * 60),
            tx_hash: `0x${Math.random().toString(16).slice(2)}`,
            wallet_category: category,
            reputation_score: category === 'SMART_MONEY' ? 70 + Math.floor(Math.random() * 25) : 40 + Math.floor(Math.random() * 30),
            gas_price: Math.floor(Math.random() * 50) + 30, // Mock gas price
            was_copied: Math.random() > 0.6 ? 1 : 0,
            copy_position_size: Math.random() > 0.6 ? Math.floor(Math.random() * 500) + 100 : 0,
            created_at: new Date().toISOString(),
        });
    }

    return signals;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const limit = parseInt(searchParams.get('limit') || '100');
        const minAmount = parseFloat(searchParams.get('minAmount') || '0');
        const category = searchParams.get('category') || undefined;
        const wallet = searchParams.get('wallet') || undefined;

        let signals = getWhaleSignals({
            limit,
            minAmount,
            category,
            wallet,
        });

        // If no real signals, use mock data for demo
        if (signals.length === 0) {
            signals = generateMockSignals(15) as any;
            if (category) {
                signals = signals.filter((s: any) => s.wallet_category === category);
            }
        }

        return NextResponse.json({
            success: true,
            count: signals.length,
            signals,
        });
    } catch (error) {
        console.error('Error fetching whale signals:', error);
        // Return mock data on error
        return NextResponse.json({
            success: true,
            count: 10,
            signals: generateMockSignals(10),
        });
    }
}
