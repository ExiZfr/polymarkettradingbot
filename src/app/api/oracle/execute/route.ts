import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for Mean Reversion Bot to execute trades
 * 
 * POST /api/oracle/execute
 * Body: { 
 *   action: 'BUY' | 'SELL',
 *   signal: { symbol, direction, zScore, confidence, entryPrice, ... },
 *   size_usd: number,
 *   market_id: string,
 *   outcome: 'Yes' | 'No'
 * }
 * 
 * This will:
 * 1. Log the execution to the signals file
 * 2. Execute via paper trading system (if enabled)
 * 3. Return execution status
 */

const SIGNALS_FILE = path.join(process.cwd(), 'data', 'mean_reversion_signals.json');
const EXECUTIONS_FILE = path.join(process.cwd(), 'data', 'mean_reversion_executions.json');

interface ExecutedTrade {
    id: string;
    timestamp: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    outcome: 'Yes' | 'No';
    marketId: string;
    marketQuestion: string;
    entryPrice: number;
    sizeUsd: number;
    zScore: number;
    expectedValue: number;
    status: 'EXECUTED' | 'FAILED';
    paperId?: string;
    error?: string;
}

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readExecutions(): ExecutedTrade[] {
    try {
        if (fs.existsSync(EXECUTIONS_FILE)) {
            const data = fs.readFileSync(EXECUTIONS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading executions:', e);
    }
    return [];
}

function writeExecutions(executions: ExecutedTrade[]) {
    ensureDataDir();
    // Keep last 500 executions
    const recent = executions.slice(-500);
    fs.writeFileSync(EXECUTIONS_FILE, JSON.stringify(recent, null, 2));
}

function generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, signal, size_usd, market_id, outcome, market_question } = body;

        console.log('[Execute API] Received trade request:', {
            action,
            symbol: signal?.symbol,
            direction: signal?.direction,
            size: size_usd
        });

        // Validate required fields
        if (!signal || !size_usd || !market_id) {
            return NextResponse.json(
                { error: 'Missing required fields: signal, size_usd, market_id' },
                { status: 400 }
            );
        }

        // Create execution record
        const execution: ExecutedTrade = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            symbol: signal.symbol || 'UNKNOWN',
            direction: signal.direction || 'LONG',
            outcome: outcome || 'Yes',
            marketId: market_id,
            marketQuestion: market_question || signal.marketQuestion || '',
            entryPrice: signal.entryPrice || 0.5,
            sizeUsd: size_usd,
            zScore: signal.zScore || 0,
            expectedValue: signal.expectedValue || 0,
            status: 'EXECUTED'
        };

        // Save execution
        const executions = readExecutions();
        executions.push(execution);
        writeExecutions(executions);

        // Create pending paper order for frontend to process
        const paperOrderQueue = path.join(process.cwd(), 'data', 'paper_order_queue.json');
        const pendingOrder = {
            id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toISOString(),
            marketId: market_id,
            marketTitle: market_question || signal.marketQuestion || `${signal.symbol} Mean Reversion`,
            marketSlug: '',
            marketUrl: '',
            marketImage: signal.marketImage || '',
            type: 'BUY',
            outcome: outcome === 'Yes' ? 'YES' : 'NO',
            entryPrice: signal.entryPrice || 0.5,
            amount: size_usd,
            source: 'MEAN_REVERSION',
            notes: `Z-Score: ${signal.zScore?.toFixed(2) || 'N/A'} | Direction: ${signal.direction} | EV: ${(signal.expectedValue * 100)?.toFixed(1) || 0}%`,
            processed: false
        };

        // Add to queue
        let queue: any[] = [];
        try {
            if (fs.existsSync(paperOrderQueue)) {
                queue = JSON.parse(fs.readFileSync(paperOrderQueue, 'utf-8'));
            }
        } catch (e) {
            queue = [];
        }
        queue.push(pendingOrder);
        // Keep last 100 orders in queue
        queue = queue.slice(-100);
        fs.writeFileSync(paperOrderQueue, JSON.stringify(queue, null, 2));

        console.log('[Execute API] Paper order queued:', pendingOrder.id);

        // Update signals file to mark as executed
        try {
            if (fs.existsSync(SIGNALS_FILE)) {
                const signalsData = fs.readFileSync(SIGNALS_FILE, 'utf-8');
                const signals = JSON.parse(signalsData);

                // Find and update the signal status
                const signalIndex = signals.findIndex((s: any) =>
                    s.symbol === signal.symbol &&
                    s.status === 'PENDING'
                );

                if (signalIndex !== -1) {
                    signals[signalIndex].status = 'EXECUTED';
                    signals[signalIndex].executionId = execution.id;
                    fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2));
                }
            }
        } catch (e) {
            console.error('Error updating signals:', e);
        }

        console.log('[Execute API] Trade executed:', execution.id);

        return NextResponse.json({
            success: true,
            execution: {
                id: execution.id,
                status: execution.status,
                timestamp: execution.timestamp
            },
            paperOrder: {
                id: pendingOrder.id,
                queued: true
            },
            message: `Trade executed: ${execution.direction} ${execution.outcome} @ ${execution.entryPrice.toFixed(3)} ($${execution.sizeUsd.toFixed(2)})`
        });

    } catch (error) {
        console.error('[Execute API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to execute trade', details: String(error) },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve execution history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const executions = readExecutions();
        const recent = executions.slice(-limit).reverse();

        // Calculate stats
        const totalTrades = executions.length;
        const totalVolume = executions.reduce((sum, e) => sum + e.sizeUsd, 0);

        return NextResponse.json({
            executions: recent,
            stats: {
                totalTrades,
                totalVolume: totalVolume.toFixed(2),
                lastExecution: executions.length > 0 ? executions[executions.length - 1].timestamp : null
            }
        });

    } catch (error) {
        console.error('[Execute API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch executions' },
            { status: 500 }
        );
    }
}
