import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'arbitrage_opportunities.json');

interface ArbOpportunity {
    id: string;
    market_id: string;
    market_question: string;
    market_slug: string;
    market_image: string;
    yes_price: number;
    no_price: number;
    total_price: number;
    arb_percent: number;
    arb_type: 'CLASSIC' | 'REVERSE';
    guaranteed_profit: number;
    liquidity: number;
    volume_24h: number;
    detected_at: string;
    expires_at: string;
}

interface ScanStats {
    markets_scanned: number;
    opportunities_found: number;
    best_arb_percent: number;
    total_arb_value: number;
    last_scan: string;
    scan_duration_ms: number;
}

interface ArbData {
    stats: ScanStats;
    opportunities: ArbOpportunity[];
}

function readArbData(): ArbData | null {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[Arbitrage API] Error reading data:', error);
    }
    return null;
}

/**
 * GET /api/arbitrage
 * Returns current arbitrage opportunities
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const minArbPercent = parseFloat(searchParams.get('minArb') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    const data = readArbData();

    if (!data) {
        return NextResponse.json({
            stats: {
                markets_scanned: 0,
                opportunities_found: 0,
                best_arb_percent: 0,
                total_arb_value: 0,
                last_scan: null,
                scan_duration_ms: 0
            },
            opportunities: [],
            message: 'No arbitrage data available. Start the scanner first.'
        });
    }

    // Filter by minimum arb percentage
    let opportunities = data.opportunities;
    if (minArbPercent > 0) {
        opportunities = opportunities.filter(o => o.arb_percent >= minArbPercent);
    }

    // Limit results
    opportunities = opportunities.slice(0, limit);

    return NextResponse.json({
        stats: data.stats,
        opportunities,
        filteredCount: opportunities.length,
        timestamp: new Date().toISOString()
    });
}

/**
 * POST /api/arbitrage
 * Execute an arbitrage (paper trading)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { opportunityId, amount } = body;

        if (!opportunityId || !amount) {
            return NextResponse.json({ error: 'Missing opportunityId or amount' }, { status: 400 });
        }

        const data = readArbData();
        if (!data) {
            return NextResponse.json({ error: 'No arbitrage data available' }, { status: 404 });
        }

        const opportunity = data.opportunities.find(o => o.id === opportunityId);
        if (!opportunity) {
            return NextResponse.json({ error: 'Opportunity not found or expired' }, { status: 404 });
        }

        // Calculate execution
        const yesAmount = amount * (opportunity.yes_price / opportunity.total_price);
        const noAmount = amount * (opportunity.no_price / opportunity.total_price);
        const totalCost = yesAmount + noAmount;
        const guaranteedPayout = amount; // Normalized to $1 per unit
        const guaranteedProfit = guaranteedPayout - totalCost;

        return NextResponse.json({
            success: true,
            execution: {
                opportunityId,
                market: opportunity.market_question,
                yesPrice: opportunity.yes_price,
                noPrice: opportunity.no_price,
                yesAmount: yesAmount.toFixed(4),
                noAmount: noAmount.toFixed(4),
                totalCost: totalCost.toFixed(4),
                guaranteedPayout: guaranteedPayout.toFixed(4),
                guaranteedProfit: guaranteedProfit.toFixed(4),
                profitPercent: ((guaranteedProfit / totalCost) * 100).toFixed(2) + '%'
            },
            message: `Arbitrage would yield $${guaranteedProfit.toFixed(2)} guaranteed profit on $${amount} wagered`
        });

    } catch (error) {
        console.error('[Arbitrage API] POST error:', error);
        return NextResponse.json({ error: 'Failed to process arbitrage' }, { status: 500 });
    }
}
