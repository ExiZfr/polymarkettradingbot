import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/radar/transactions
 * 
 * Receives whale transactions from Python tracker script and stores in database
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const required = [
            'tx_hash', 'block_number', 'timestamp', 'wallet_address',
            'wallet_tag', 'market_id', 'market_question', 'market_slug',
            'outcome', 'amount', 'price', 'shares'
        ];

        for (const field of required) {
            if (!(field in body)) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Check if transaction already exists (prevent duplicates)
        const existing = await prisma.whaleTransaction.findUnique({
            where: { txHash: body.tx_hash }
        });

        if (existing) {
            return NextResponse.json(
                { message: 'Transaction already exists', id: existing.id },
                { status: 200 }
            );
        }

        // Create whale profile if not exists
        let whale = await prisma.whaleProfile.findUnique({
            where: { address: body.wallet_address }
        });

        if (!whale) {
            whale = await prisma.whaleProfile.create({
                data: {
                    address: body.wallet_address,
                    currentTag: body.wallet_tag,
                    tagHistory: [{ tag: body.wallet_tag, timestamp: new Date().toISOString() }],
                    winRate: body.wallet_win_rate || 0,
                    totalPnl: body.wallet_total_pnl || 0,
                    totalTrades: 1,
                    totalVolume: body.amount,
                    avgPositionSize: body.amount,
                    firstSeen: new Date(body.timestamp),
                    lastSeen: new Date(body.timestamp),
                }
            });
        } else {
            // Update whale profile
            const needsTagUpdate = whale.currentTag !== body.wallet_tag;
            const newTagHistory = needsTagUpdate
                ? [...(whale.tagHistory as any[]), { tag: body.wallet_tag, timestamp: new Date().toISOString() }]
                : whale.tagHistory;

            await prisma.whaleProfile.update({
                where: { address: body.wallet_address },
                data: {
                    currentTag: body.wallet_tag,
                    tagHistory: newTagHistory,
                    winRate: body.wallet_win_rate || whale.winRate,
                    totalPnl: body.wallet_total_pnl || whale.totalPnl,
                    totalTrades: whale.totalTrades + 1,
                    totalVolume: whale.totalVolume + body.amount,
                    avgPositionSize: (whale.totalVolume + body.amount) / (whale.totalTrades + 1),
                    lastSeen: new Date(body.timestamp),
                }
            });
        }

        // Create transaction record
        const transaction = await prisma.whaleTransaction.create({
            data: {
                txHash: body.tx_hash,
                blockNumber: body.block_number,
                timestamp: new Date(body.timestamp),
                gasPrice: body.gas_price,
                walletAddress: body.wallet_address,
                walletTag: body.wallet_tag,
                walletWinRate: body.wallet_win_rate,
                walletTotalPnl: body.wallet_total_pnl,
                marketId: body.market_id,
                marketQuestion: body.market_question,
                marketSlug: body.market_slug,
                outcome: body.outcome,
                amount: body.amount,
                price: body.price,
                shares: body.shares,
            }
        });

        return NextResponse.json(
            { success: true, id: transaction.id },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error saving whale transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/radar/transactions
 * 
 * Retrieves whale transactions for frontend display
 * Query params: limit, offset, tag, minAmount
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const tag = searchParams.get('tag') || undefined;
        const minAmount = parseFloat(searchParams.get('minAmount') || '0');

        const where: any = {
            amount: { gte: minAmount }
        };

        if (tag && tag !== 'ALL') {
            where.walletTag = tag;
        }

        const transactions = await prisma.whaleTransaction.findMany({
            where,
            include: {
                whale: {
                    select: {
                        address: true,
                        currentTag: true,
                        winRate: true,
                        totalPnl: true,
                        totalTrades: true,
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: offset,
        });

        const total = await prisma.whaleTransaction.count({ where });

        return NextResponse.json({
            transactions,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
