/**
 * API Route: GET/POST /api/radar/queue
 * Manages pending trades from PolyRadar bot to be executed in paper trading
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUEUE_FILE = path.join(process.cwd(), 'scripts', 'radar_pending_trades.json');

interface PendingTrade {
    id: string;
    market_id: string;
    market_title: string;
    outcome: 'YES' | 'NO';
    price: number;
    amount: number;
    whale_wallet: string;
    wallet_category: string;
    confidence_score: number;
    timestamp: number;
}

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch pending trades and clear the queue
 */
export async function GET() {
    try {
        // Check if file exists
        if (!fs.existsSync(QUEUE_FILE)) {
            return NextResponse.json({ success: true, trades: [] });
        }

        // Read file
        const fileContent = fs.readFileSync(QUEUE_FILE, 'utf-8');
        const trades: PendingTrade[] = JSON.parse(fileContent);

        // Clear the file after reading (atomic operation)
        fs.writeFileSync(QUEUE_FILE, JSON.stringify([]));

        return NextResponse.json({ success: true, trades });
    } catch (error) {
        console.error('Error reading trade queue:', error);
        return NextResponse.json({ success: true, trades: [] });
    }
}

/**
 * POST - Add a trade to the queue (called by Python bot)
 */
export async function POST(request: NextRequest) {
    try {
        const trade: PendingTrade = await request.json();

        // Validate
        if (!trade.market_id || !trade.outcome || !trade.price || !trade.amount) {
            return NextResponse.json(
                { success: false, error: 'Invalid trade data' },
                { status: 400 }
            );
        }

        // Read existing queue
        let queue: PendingTrade[] = [];
        if (fs.existsSync(QUEUE_FILE)) {
            const content = fs.readFileSync(QUEUE_FILE, 'utf-8');
            queue = JSON.parse(content);
        }

        // Add new trade
        queue.push(trade);

        // Write back
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

        return NextResponse.json({ success: true, message: 'Trade queued' });
    } catch (error) {
        console.error('Error adding trade to queue:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to queue trade' },
            { status: 500 }
        );
    }
}
