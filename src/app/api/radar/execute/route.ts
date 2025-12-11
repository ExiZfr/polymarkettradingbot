/**
 * API Route: POST /api/radar/execute
 * Allows PolyRadar bot to execute trades in paper trading account
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ExecuteTradeRequest {
    market_id: string;
    market_title: string;
    outcome: 'YES' | 'NO';
    price: number;
    amount_planned: number;
    whale_wallet: string;
    confidence_score: number;
    api_key?: string; // Optional auth
}

export async function POST(request: NextRequest) {
    try {
        const body: ExecuteTradeRequest = await request.json();

        // Validate required fields
        if (!body.market_id || !body.outcome || !body.price || !body.amount_planned) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Server-side execution would require:
        // 1. Server-side state management (Redis/DB)
        // 2. OR return data to be executed client-side
        // For now, we'll return the trade data for client to execute

        const tradeData = {
            marketId: body.market_id,
            marketTitle: body.market_title,
            outcome: body.outcome,
            entryPrice: body.price,
            amount: body.amount_planned,
            source: 'COPY_TRADING' as const,
            notes: `Whale: ${body.whale_wallet.slice(0, 10)}... | Conf: ${body.confidence_score}/100`,
        };

        return NextResponse.json({
            success: true,
            message: 'Trade signal received',
            trade: tradeData,
            instructions: 'Execute via paperStore.placeOrder() on client',
        });
    } catch (error) {
        console.error('Error processing trade execution:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process trade' },
            { status: 500 }
        );
    }
}
