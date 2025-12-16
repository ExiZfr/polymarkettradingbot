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

        // ====================================================================
        // PLACE ORDER DIRECTLY IN SERVER-SIDE STORAGE
        // This runs without needing a browser open!
        // ====================================================================
        const SERVER_ORDERS_FILE = path.join(process.cwd(), 'data', 'server_paper_orders.json');
        const SERVER_PROFILE_FILE = path.join(process.cwd(), 'data', 'server_paper_profile.json');

        // Read/initialize profile
        let profile = { balance: 10000, totalPnL: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0, lastUpdated: new Date().toISOString() };
        try {
            if (fs.existsSync(SERVER_PROFILE_FILE)) {
                profile = JSON.parse(fs.readFileSync(SERVER_PROFILE_FILE, 'utf-8'));
            }
        } catch (e) { /* use default */ }

        // Check balance
        if (size_usd > profile.balance) {
            console.log(`[Execute API] Insufficient balance: $${profile.balance.toFixed(2)}`);
            return NextResponse.json({
                success: false,
                error: 'Insufficient balance',
                balance: profile.balance
            }, { status: 400 });
        }

        // Create server paper order with TP/SL
        const entryPrice = signal.entryPrice || 0.5;
        const shares = size_usd / entryPrice;
        const serverOrder = {
            id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            marketId: market_id,
            marketTitle: market_question || signal.marketQuestion || `${signal.symbol} Mean Reversion`,
            marketSlug: '',
            marketUrl: '',
            marketImage: signal.marketImage || '',
            type: 'BUY',
            outcome: outcome === 'Yes' ? 'YES' : 'NO',
            entryPrice,
            amount: size_usd,
            originalAmount: size_usd,
            shares,
            originalShares: shares,
            status: 'OPEN',
            source: 'MEAN_REVERSION',
            notes: `Z-Score: ${signal.zScore?.toFixed(2) || 'N/A'} | Direction: ${signal.direction} | EV: ${(signal.expectedValue * 100)?.toFixed(1) || 0}%`,
            // TP/SL: TP1 at +30% closes 50%, TP2 at +100% closes rest
            tp1Percent: 30,
            tp1SizePercent: 50,
            tp1Hit: false,
            tp2Percent: 100,
            tp2Hit: false,
            stopLossPercent: -50,
            slHit: false
        };

        // Save order to server storage
        let orders: any[] = [];
        try {
            if (fs.existsSync(SERVER_ORDERS_FILE)) {
                orders = JSON.parse(fs.readFileSync(SERVER_ORDERS_FILE, 'utf-8'));
            }
        } catch (e) { orders = []; }
        orders.push(serverOrder);
        fs.writeFileSync(SERVER_ORDERS_FILE, JSON.stringify(orders, null, 2));

        // Update profile
        profile.balance -= size_usd;
        profile.totalTrades += 1;
        profile.lastUpdated = new Date().toISOString();
        fs.writeFileSync(SERVER_PROFILE_FILE, JSON.stringify(profile, null, 2));

        console.log(`[Execute API] ✅ SERVER ORDER PLACED: ${serverOrder.id} - ${serverOrder.outcome} @ $${entryPrice.toFixed(3)} ($${size_usd.toFixed(2)})`);


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
            serverOrder: {
                id: serverOrder.id,
                stored: true,
                balance: profile.balance
            },
            message: `✅ Order placed: ${serverOrder.outcome} @ $${entryPrice.toFixed(3)} ($${size_usd.toFixed(2)}) - Balance: $${profile.balance.toFixed(2)}`
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
