import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * TP/SL Auto-Trigger API
 * 
 * POST /api/paper-orders/check-tpsl
 * 
 * This endpoint checks all open orders against current prices
 * and automatically triggers TP1, TP2, or SL when conditions are met.
 * 
 * TP1: Close 50% at +30% profit
 * TP2: Close remaining at +100% profit
 * SL: Close all at -50% loss
 */

const ORDERS_FILE = path.join(process.cwd(), 'data', 'server_paper_orders.json');
const PROFILE_FILE = path.join(process.cwd(), 'data', 'server_paper_profile.json');

interface ServerPaperOrder {
    id: string;
    createdAt: string;
    updatedAt: string;
    marketId: string;
    marketTitle: string;
    outcome: 'YES' | 'NO';
    entryPrice: number;
    exitPrice?: number;
    amount: number;
    originalAmount: number;
    shares: number;
    originalShares: number;
    status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'CANCELLED';
    source: string;
    notes?: string;
    pnl?: number;
    tp1Percent: number;
    tp1SizePercent: number;
    tp1Hit: boolean;
    tp1HitAt?: string;
    tp1PnL?: number;
    tp2Percent: number;
    tp2Hit: boolean;
    stopLossPercent?: number;
    slHit: boolean;
    [key: string]: unknown;
}

interface Profile {
    balance: number;
    totalPnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    lastUpdated: string;
}

function readOrders(): ServerPaperOrder[] {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
        }
    } catch (e) { console.error('Error reading orders:', e); }
    return [];
}

function writeOrders(orders: ServerPaperOrder[]) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function readProfile(): Profile {
    try {
        if (fs.existsSync(PROFILE_FILE)) {
            return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
        }
    } catch (e) { console.error('Error reading profile:', e); }
    return { balance: 10000, totalPnL: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0, lastUpdated: new Date().toISOString() };
}

function writeProfile(profile: Profile) {
    profile.lastUpdated = new Date().toISOString();
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prices } = body; // { marketId: { yes: number, no: number } }

        if (!prices || typeof prices !== 'object') {
            return NextResponse.json({ error: 'prices object required' }, { status: 400 });
        }

        const orders = readOrders();
        const profile = readProfile();
        const triggers: Array<{ orderId: string; type: 'TP1' | 'TP2' | 'SL'; pnl: number }> = [];

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];

            // Skip non-open orders
            if (order.status !== 'OPEN' && order.status !== 'PARTIAL') continue;

            // Skip if no price data
            const priceData = prices[order.marketId];
            if (!priceData) continue;

            const currentPrice = order.outcome === 'YES' ? priceData.yes : priceData.no;
            const priceChange = ((currentPrice - order.entryPrice) / order.entryPrice) * 100;

            console.log(`[TPSL] Order ${order.id}: Entry=$${order.entryPrice.toFixed(3)}, Current=$${currentPrice.toFixed(3)}, Change=${priceChange.toFixed(1)}%`);

            // Check Stop Loss first (highest priority)
            if (order.stopLossPercent && priceChange <= order.stopLossPercent && !order.slHit) {
                // STOP LOSS triggered - close everything
                const pnl = (currentPrice - order.entryPrice) * order.shares;

                order.status = 'CLOSED';
                order.exitPrice = currentPrice;
                order.pnl = (order.pnl || 0) + pnl;
                order.slHit = true;
                order.updatedAt = new Date().toISOString();

                profile.balance += order.amount + pnl;
                profile.totalPnL += pnl;
                profile.losingTrades += 1;

                triggers.push({ orderId: order.id, type: 'SL', pnl });
                console.log(`[TPSL] 🛑 SL HIT: ${order.id} - Closed at ${priceChange.toFixed(1)}% - PnL: $${pnl.toFixed(2)}`);
                continue;
            }

            // Check TP2 (full profit target)
            if (priceChange >= order.tp2Percent && !order.tp2Hit) {
                // TP2 triggered - close remaining
                const pnl = (currentPrice - order.entryPrice) * order.shares;

                order.status = 'CLOSED';
                order.exitPrice = currentPrice;
                order.pnl = (order.pnl || 0) + pnl;
                order.tp2Hit = true;
                order.updatedAt = new Date().toISOString();

                profile.balance += order.amount + pnl;
                profile.totalPnL += pnl;
                profile.winningTrades += 1;

                triggers.push({ orderId: order.id, type: 'TP2', pnl });
                console.log(`[TPSL] 🎯 TP2 HIT: ${order.id} - Closed at +${priceChange.toFixed(1)}% - PnL: $${pnl.toFixed(2)}`);
                continue;
            }

            // Check TP1 (partial close)
            if (priceChange >= order.tp1Percent && !order.tp1Hit) {
                // TP1 triggered - close 50%
                const closePercent = order.tp1SizePercent / 100;
                const sharesToClose = order.shares * closePercent;
                const amountToClose = order.amount * closePercent;
                const pnl = (currentPrice - order.entryPrice) * sharesToClose;

                // Update order (partial close)
                order.status = 'PARTIAL';
                order.shares = order.shares - sharesToClose;
                order.amount = order.amount - amountToClose;
                order.tp1Hit = true;
                order.tp1HitAt = new Date().toISOString();
                order.tp1PnL = pnl;
                order.pnl = pnl;
                order.updatedAt = new Date().toISOString();

                // Return partial amount + profit
                profile.balance += amountToClose + pnl;
                profile.totalPnL += pnl;

                triggers.push({ orderId: order.id, type: 'TP1', pnl });
                console.log(`[TPSL] ✅ TP1 HIT: ${order.id} - Closed ${closePercent * 100}% at +${priceChange.toFixed(1)}% - PnL: $${pnl.toFixed(2)}`);
            }

            orders[i] = order;
        }

        // Save changes
        writeOrders(orders);
        writeProfile(profile);

        return NextResponse.json({
            success: true,
            triggers,
            triggeredCount: triggers.length,
            balance: profile.balance,
            message: triggers.length > 0
                ? `${triggers.length} TP/SL triggered`
                : 'No TP/SL conditions met'
        });

    } catch (error) {
        console.error('[TPSL] Error:', error);
        return NextResponse.json({ error: 'Failed to check TP/SL' }, { status: 500 });
    }
}

// GET - Get current TP/SL status for all open orders
export async function GET() {
    try {
        const orders = readOrders();
        const openOrders = orders.filter(o => o.status === 'OPEN' || o.status === 'PARTIAL');

        const tpslStatus = openOrders.map(o => ({
            id: o.id,
            marketTitle: o.marketTitle,
            entryPrice: o.entryPrice,
            status: o.status,
            tp1Percent: o.tp1Percent,
            tp1Hit: o.tp1Hit,
            tp1PnL: o.tp1PnL,
            tp2Percent: o.tp2Percent,
            tp2Hit: o.tp2Hit,
            stopLossPercent: o.stopLossPercent,
            slHit: o.slHit,
            remainingShares: o.shares,
            originalShares: o.originalShares
        }));

        return NextResponse.json({
            orders: tpslStatus,
            count: tpslStatus.length
        });

    } catch (error) {
        console.error('[TPSL] GET Error:', error);
        return NextResponse.json({ error: 'Failed to get TP/SL status' }, { status: 500 });
    }
}
