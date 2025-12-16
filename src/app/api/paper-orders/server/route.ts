import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Server-Side Paper Trading Orders API
 * 
 * This stores orders in a JSON file on the server, NOT in localStorage.
 * This allows the Oracle bot to place orders even when no browser is open.
 * 
 * GET - Fetch all orders (with optional filters)
 * POST - Place a new order
 * PATCH - Update order (close, update price, etc.)
 * DELETE - Delete an order
 */

const ORDERS_FILE = path.join(process.cwd(), 'data', 'server_paper_orders.json');
const PROFILE_FILE = path.join(process.cwd(), 'data', 'server_paper_profile.json');

// Types
interface ServerPaperOrder {
    id: string;
    createdAt: string;
    updatedAt: string;
    marketId: string;
    marketTitle: string;
    marketSlug?: string;
    marketUrl?: string;
    marketImage?: string;
    type: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    entryPrice: number;
    exitPrice?: number;
    amount: number;
    originalAmount: number; // Track original for partial closes
    shares: number;
    originalShares: number; // Track original for partial closes
    status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'CANCELLED';
    source: string;
    notes?: string;
    pnl?: number;
    closedAt?: string;
    // Take Profit / Stop Loss
    tp1Percent: number;      // First TP target (e.g., 30%)
    tp1SizePercent: number;  // How much to close at TP1 (e.g., 50%)
    tp1Hit: boolean;         // Has TP1 been triggered?
    tp1HitAt?: string;
    tp1PnL?: number;
    tp2Percent: number;      // Second TP target (e.g., 100%)
    tp2Hit: boolean;         // Has TP2 been triggered (full close)?
    stopLossPercent?: number; // Optional SL (e.g., -20%)
    slHit: boolean;
}

interface ServerPaperProfile {
    balance: number;
    totalPnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    lastUpdated: string;
}

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readOrders(): ServerPaperOrder[] {
    try {
        ensureDataDir();
        if (fs.existsSync(ORDERS_FILE)) {
            return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('[ServerOrders] Error reading orders:', e);
    }
    return [];
}

function writeOrders(orders: ServerPaperOrder[]) {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function readProfile(): ServerPaperProfile {
    try {
        ensureDataDir();
        if (fs.existsSync(PROFILE_FILE)) {
            return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('[ServerOrders] Error reading profile:', e);
    }
    // Default profile
    return {
        balance: 10000,
        totalPnL: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        lastUpdated: new Date().toISOString()
    };
}

function writeProfile(profile: ServerPaperProfile) {
    ensureDataDir();
    profile.lastUpdated = new Date().toISOString();
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}

function generateId(): string {
    return `srv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// GET - Fetch orders
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // OPEN, CLOSED, ALL
        const source = searchParams.get('source'); // MEAN_REVERSION, etc.
        const limit = parseInt(searchParams.get('limit') || '100');

        let orders = readOrders();
        const profile = readProfile();

        // Filter by status
        if (status && status !== 'ALL') {
            orders = orders.filter(o => o.status === status);
        }

        // Filter by source
        if (source) {
            orders = orders.filter(o => o.source === source);
        }

        // Sort by date (newest first) and limit
        orders = orders.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, limit);

        // Calculate stats
        const openOrders = readOrders().filter(o => o.status === 'OPEN');
        const closedOrders = readOrders().filter(o => o.status === 'CLOSED');
        const totalPnL = closedOrders.reduce((sum, o) => sum + (o.pnl || 0), 0);

        return NextResponse.json({
            orders,
            profile,
            stats: {
                openCount: openOrders.length,
                closedCount: closedOrders.length,
                totalPnL: totalPnL.toFixed(2),
                winRate: closedOrders.length > 0
                    ? ((closedOrders.filter(o => (o.pnl || 0) > 0).length / closedOrders.length) * 100).toFixed(1)
                    : '0'
            }
        });

    } catch (error) {
        console.error('[ServerOrders] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST - Place new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            marketId,
            marketTitle,
            marketSlug,
            marketUrl,
            marketImage,
            type = 'BUY',
            outcome,
            entryPrice,
            amount,
            source = 'MANUAL',
            notes
        } = body;

        // Validate required fields
        if (!marketId || !outcome || !entryPrice || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: marketId, outcome, entryPrice, amount' },
                { status: 400 }
            );
        }

        const profile = readProfile();

        // Check balance
        if (amount > profile.balance) {
            return NextResponse.json(
                { error: `Insufficient balance. Available: $${profile.balance.toFixed(2)}` },
                { status: 400 }
            );
        }

        // Calculate shares
        const shares = amount / entryPrice;

        // Create order with TP/SL settings
        // Default: TP1 at +30% closes 50%, TP2 at +100% closes remaining
        const order: ServerPaperOrder = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            marketId,
            marketTitle: marketTitle || 'Unknown Market',
            marketSlug,
            marketUrl,
            marketImage,
            type,
            outcome,
            entryPrice,
            amount,
            originalAmount: amount,
            shares,
            originalShares: shares,
            status: 'OPEN',
            source,
            notes,
            // TP/SL defaults for Oracle trades
            tp1Percent: 30,       // Take profit at +30%
            tp1SizePercent: 50,   // Close 50% at TP1
            tp1Hit: false,
            tp2Percent: 100,      // Take profit at +100%
            tp2Hit: false,
            stopLossPercent: -50, // Stop loss at -50%
            slHit: false
        };

        // Update profile balance
        profile.balance -= amount;
        profile.totalTrades += 1;
        writeProfile(profile);

        // Save order
        const orders = readOrders();
        orders.push(order);
        writeOrders(orders);

        console.log(`[ServerOrders] Order placed: ${order.id} - ${marketTitle} - ${outcome} @ $${entryPrice}`);

        return NextResponse.json({
            success: true,
            order,
            balance: profile.balance,
            message: `Order placed: ${outcome} @ $${entryPrice.toFixed(3)} ($${amount.toFixed(2)})`
        });

    } catch (error) {
        console.error('[ServerOrders] POST Error:', error);
        return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
    }
}

// PATCH - Update/Close order
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, action, exitPrice } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'orderId required' }, { status: 400 });
        }

        const orders = readOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orders[orderIndex];

        if (action === 'CLOSE') {
            if (!exitPrice) {
                return NextResponse.json({ error: 'exitPrice required for CLOSE' }, { status: 400 });
            }

            // Calculate PnL
            const pnl = (exitPrice - order.entryPrice) * order.shares;

            // Update order
            order.status = 'CLOSED';
            order.exitPrice = exitPrice;
            order.pnl = pnl;
            order.closedAt = new Date().toISOString();
            order.updatedAt = new Date().toISOString();

            // Update profile
            const profile = readProfile();
            profile.balance += order.amount + pnl; // Return investment + profit/loss
            profile.totalPnL += pnl;
            if (pnl > 0) {
                profile.winningTrades += 1;
            } else {
                profile.losingTrades += 1;
            }
            writeProfile(profile);

            orders[orderIndex] = order;
            writeOrders(orders);

            console.log(`[ServerOrders] Order closed: ${order.id} - PnL: $${pnl.toFixed(2)}`);

            return NextResponse.json({
                success: true,
                order,
                pnl,
                message: `Order closed with ${pnl >= 0 ? 'profit' : 'loss'}: $${pnl.toFixed(2)}`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('[ServerOrders] PATCH Error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// DELETE - Delete/Cancel order
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'orderId required' }, { status: 400 });
        }

        const orders = readOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orders[orderIndex];

        // If order is OPEN, refund the amount
        if (order.status === 'OPEN') {
            const profile = readProfile();
            profile.balance += order.amount;
            writeProfile(profile);
        }

        // Remove order
        orders.splice(orderIndex, 1);
        writeOrders(orders);

        console.log(`[ServerOrders] Order deleted: ${orderId}`);

        return NextResponse.json({
            success: true,
            message: 'Order deleted'
        });

    } catch (error) {
        console.error('[ServerOrders] DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
}
