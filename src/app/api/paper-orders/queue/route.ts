import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to manage paper order queue for Oracle auto-trading
 * 
 * GET - Fetch unprocessed orders from the queue
 * POST - Mark orders as processed
 * 
 * The Oracle/Mean Reversion bot adds orders to this queue,
 * and the frontend periodically fetches and processes them into paperStore.
 */

const QUEUE_FILE = path.join(process.cwd(), 'data', 'paper_order_queue.json');

interface QueuedOrder {
    id: string;
    timestamp: string;
    marketId: string;
    marketTitle: string;
    marketSlug?: string;
    marketUrl?: string;
    marketImage?: string;
    type: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    entryPrice: number;
    amount: number;
    source: string;
    notes?: string;
    processed: boolean;
}

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readQueue(): QueuedOrder[] {
    try {
        if (fs.existsSync(QUEUE_FILE)) {
            return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('[Queue API] Error reading queue:', e);
    }
    return [];
}

function writeQueue(queue: QueuedOrder[]) {
    ensureDataDir();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// GET - Fetch unprocessed orders
export async function GET() {
    try {
        const queue = readQueue();
        const unprocessed = queue.filter(order => !order.processed);

        return NextResponse.json({
            orders: unprocessed,
            count: unprocessed.length,
            totalInQueue: queue.length
        });
    } catch (error) {
        console.error('[Queue API] GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch queue' },
            { status: 500 }
        );
    }
}

// POST - Mark orders as processed
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderIds } = body;

        if (!orderIds || !Array.isArray(orderIds)) {
            return NextResponse.json(
                { error: 'orderIds array required' },
                { status: 400 }
            );
        }

        const queue = readQueue();
        let processed = 0;

        for (const id of orderIds) {
            const orderIndex = queue.findIndex(o => o.id === id);
            if (orderIndex !== -1 && !queue[orderIndex].processed) {
                queue[orderIndex].processed = true;
                processed++;
            }
        }

        writeQueue(queue);

        console.log(`[Queue API] Marked ${processed} orders as processed`);

        return NextResponse.json({
            success: true,
            processed,
            message: `${processed} orders marked as processed`
        });

    } catch (error) {
        console.error('[Queue API] POST Error:', error);
        return NextResponse.json(
            { error: 'Failed to update queue' },
            { status: 500 }
        );
    }
}
