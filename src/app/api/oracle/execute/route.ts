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
        const SERVER_PROFILES_FILE = path.join(process.cwd(), 'data', 'server_paper_profiles.json');

        // Read profiles and find active one
        interface ServerProfile {
            id: string;
            name: string;
            balance: number;
            initialBalance: number;
            totalPnL: number;
            totalTrades: number;
            winningTrades: number;
            losingTrades: number;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
            settings: any;
        }

        let profiles: ServerProfile[] = [];
        try {
            if (fs.existsSync(SERVER_PROFILES_FILE)) {
                profiles = JSON.parse(fs.readFileSync(SERVER_PROFILES_FILE, 'utf-8'));
            }
        } catch (e) {
            console.error('[Execute API] Error reading profiles:', e);
        }

        // Find active profile (or create default)
        let activeProfile = profiles.find(p => p.isActive);
        if (!activeProfile) {
            // Create default profile if none exists
            activeProfile = {
                id: 'default',
                name: 'Paper Trading',
                balance: 10000,
                initialBalance: 10000,
                totalPnL: 0,
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                settings: { riskPerTrade: 5, autoStopLoss: 20, autoTakeProfit: 50, maxOpenPositions: 10, allowShorts: true }
            };
            profiles.push(activeProfile);
            fs.writeFileSync(SERVER_PROFILES_FILE, JSON.stringify(profiles, null, 2));
        }

        // Check balance
        if (size_usd > activeProfile.balance) {
            console.log(`[Execute API] Insufficient balance: $${activeProfile.balance.toFixed(2)}`);
            return NextResponse.json({
                success: false,
                error: 'Insufficient balance',
                balance: activeProfile.balance
            }, { status: 400 });
        }

        // Create server paper order with simplified TP/SL
        const entryPrice = signal.entryPrice || 0.5;
        const shares = size_usd / entryPrice;

        // TP = Oracle's Expected Value (close 100% when hit)
        // SL = Fixed at -30%
        const expectedValuePercent = Math.abs((signal.expectedValue || 0.15) * 100);
        const takeProfit = Math.max(5, Math.round(expectedValuePercent)); // TP based on EV, min 5%
        const stopLoss = -30; // Fixed SL at -30%

        console.log(`[Execute API] TP/SL: TP=${takeProfit}% (100% close), SL=${stopLoss}% (EV=${expectedValuePercent.toFixed(1)}%)`);

        const serverOrder = {
            id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            marketId: market_id,
            marketTitle: market_question || signal.marketQuestion || `${signal.symbol} Mean Reversion`,
            marketSlug: signal.marketSlug || '',
            marketUrl: signal.marketUrl || `https://polymarket.com/event/${signal.marketSlug || market_id}`,
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
            notes: `Z-Score: ${signal.zScore?.toFixed(2) || 'N/A'} | Direction: ${signal.direction} | EV: ${expectedValuePercent.toFixed(1)}% | TP: +${takeProfit}% | SL: ${stopLoss}%`,
            // Simplified TP/SL: Single TP at EV (100% close), SL at -30%
            tp1Percent: takeProfit,       // TP at EV%
            tp1SizePercent: 100,          // Close 100% at TP
            tp1Hit: false,
            tp2Percent: 0,                // No TP2
            tp2Hit: false,
            stopLossPercent: stopLoss,    // Fixed SL at -30%
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

        // Update active profile
        activeProfile.balance -= size_usd;
        activeProfile.totalTrades += 1;
        activeProfile.updatedAt = new Date().toISOString();

        // Save profiles back to file
        const profileIndex = profiles.findIndex(p => p.id === activeProfile!.id);
        if (profileIndex !== -1) {
            profiles[profileIndex] = activeProfile;
        }
        fs.writeFileSync(SERVER_PROFILES_FILE, JSON.stringify(profiles, null, 2));

        console.log(`[Execute API] ✅ SERVER ORDER PLACED: ${serverOrder.id} - ${serverOrder.outcome} @ $${entryPrice.toFixed(3)} ($${size_usd.toFixed(2)})`);

        // Add notification for auto-trade
        const NOTIFS_FILE = path.join(process.cwd(), 'data', 'notifications.json');
        try {
            let notifs: any[] = [];
            if (fs.existsSync(NOTIFS_FILE)) {
                notifs = JSON.parse(fs.readFileSync(NOTIFS_FILE, 'utf-8'));
            }
            notifs.push({
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                type: 'ORACLE_TRADE',
                title: '🤖 Oracle Trade Executed',
                message: `${serverOrder.outcome} @ $${entryPrice.toFixed(3)} ($${size_usd.toFixed(2)}) | TP1: +${dynamicTP1}% | TP2: +${dynamicTP2}% | SL: ${dynamicSL}%`,
                timestamp: new Date().toISOString(),
                read: false,
                data: {
                    orderId: serverOrder.id,
                    symbol: signal.symbol,
                    entryPrice,
                    tp1: dynamicTP1,
                    tp2: dynamicTP2,
                    sl: dynamicSL
                }
            });
            fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifs.slice(-100), null, 2));
            console.log(`[Execute API] 🔔 Notification added for order ${serverOrder.id}`);
        } catch (e) {
            console.error('Error adding notification:', e);
        }



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
                balance: activeProfile.balance
            },
            message: `✅ Order placed: ${serverOrder.outcome} @ $${entryPrice.toFixed(3)} ($${size_usd.toFixed(2)}) - Balance: $${activeProfile.balance.toFixed(2)}`
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
