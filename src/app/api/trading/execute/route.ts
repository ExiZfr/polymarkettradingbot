import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';
import { SimulatedExecutionManager } from '@/lib/trading-engine/execution-manager';
import fs from 'fs';
import path from 'path';

// Helper to append to listener logs
function logToFile(type: string, message: string, priority: 'low' | 'medium' | 'high' = 'low', metadata = {}) {
    try {
        const LOGS_PATH = path.join(process.cwd(), 'data', 'listener-logs.json');
        let logs: any[] = [];
        if (fs.existsSync(LOGS_PATH)) {
            const content = fs.readFileSync(LOGS_PATH, 'utf8');
            logs = content ? JSON.parse(content) : [];
        }

        const newLog = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            timestamp: new Date().toISOString(),
            source: 'executor',
            type,
            message,
            priority,
            ...metadata
        };

        logs.unshift(newLog);
        logs = logs.slice(0, 100);

        fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error('Failed to write log:', e);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketId, side, outcome, amount, currentPrice } = body;

        if (!marketId || !side || !outcome || !amount || !currentPrice) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const wallet = new PaperWallet(); // Loads state from file
        const executor = new SimulatedExecutionManager(wallet);

        const order = await executor.executeOrder(
            marketId,
            side,
            outcome,
            parseFloat(amount),
            parseFloat(currentPrice)
        );

        // Log the successful order
        if (order.status === 'FILLED') {
            logToFile('order', `Executed ${side} ${outcome} on Market ${marketId.slice(0, 6)}... - $${amount} @ ${currentPrice}`, 'high', {
                relatedMarketId: marketId,
                amount,
                price: currentPrice
            });
        }

        return NextResponse.json(order);
    } catch (error: any) {
        logToFile('error', `Trade Failed: ${error.message}`, 'high');
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
