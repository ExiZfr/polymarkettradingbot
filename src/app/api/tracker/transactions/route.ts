/**
 * Whale Tracker API - Transactions Endpoint
 * POST: Receive transactions from Python tracker and store in database
 * GET: Return transactions for frontend with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WhaleTransactionInput {
    wallet_address: string;
    wallet_tag: string;
    wallet_win_rate: number | null;
    wallet_pnl: number | null;
    market_id: string;
    market_question: string;
    market_slug: string;
    market_url: string | null;
    market_image: string | null;
    outcome: string;
    amount: number;
    price: number;
    timestamp: string;
    tx_hash: string;
    cluster_name?: string;
}

export async function POST(request: NextRequest) {
    try {
        const tx: WhaleTransactionInput = await request.json();

        // FIRST: Ensure whale profile exists (foreign key requirement)
        await updateWhaleProfile(tx.wallet_address, tx);

        // THEN: Create transaction in database
        const transaction = await prisma.whaleTransaction.create({
            data: {
                txHash: tx.tx_hash,
                blockNumber: 0, // Will be filled later from blockchain
                timestamp: new Date(tx.timestamp),
                gasPrice: 0,
                walletAddress: tx.wallet_address,
                walletTag: tx.wallet_tag,
                walletWinRate: tx.wallet_win_rate,
                walletTotalPnl: tx.wallet_pnl,
                marketId: tx.market_id,
                marketQuestion: tx.market_question,
                marketSlug: tx.market_slug,
                marketUrl: tx.market_url,
                marketImage: tx.market_image || null,
                outcome: tx.outcome,
                amount: tx.amount,
                price: tx.price,
                shares: tx.amount / tx.price,
                clusterName: tx.cluster_name || null
            }
        });

        return NextResponse.json({
            success: true,
            id: transaction.id
        });
    } catch (error) {
        console.error('[Tracker] Error saving transaction:', error);
        return NextResponse.json({
            error: 'Failed to save transaction'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
        const tag = searchParams.get('tag');
        const minAmount = parseFloat(searchParams.get('minAmount') || '0');
        const cluster = searchParams.get('cluster');

        // Build where clause
        const where: any = {};
        if (tag) {
            where.walletTag = { contains: tag, mode: 'insensitive' };
        }
        if (minAmount > 0) {
            where.amount = { gte: minAmount };
        }
        if (cluster) {
            where.clusterName = cluster;
        }

        // Fetch transactions with pagination
        const [transactions, total] = await Promise.all([
            prisma.whaleTransaction.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    whale: {
                        select: {
                            totalTrades: true,
                            winRate: true,
                            totalPnl: true
                        }
                    }
                }
            }),
            prisma.whaleTransaction.count({ where })
        ]);

        // Transform Prisma camelCase to snake_case for frontend compatibility
        const transformedTransactions = transactions.map(tx => ({
            wallet_address: tx.walletAddress,
            wallet_tag: tx.walletTag,
            wallet_win_rate: tx.walletWinRate,
            wallet_pnl: tx.walletTotalPnl,
            market_id: tx.marketId,
            market_question: tx.marketQuestion,
            market_slug: tx.marketSlug,
            outcome: tx.outcome,
            amount: tx.amount,
            price: tx.price,
            timestamp: tx.timestamp.toISOString(),
            tx_hash: tx.txHash
        }));

        return NextResponse.json({
            transactions: transformedTransactions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('[Tracker] Error fetching transactions:', error);
        return NextResponse.json({
            error: 'Failed to fetch transactions'
        }, { status: 500 });
    }
}

/**
 * Update or create whale profile
 */
async function updateWhaleProfile(address: string, tx: WhaleTransactionInput) {
    try {
        const existing = await prisma.whaleProfile.findUnique({
            where: { address }
        });

        if (existing) {
            // Update existing profile
            await prisma.whaleProfile.update({
                where: { address },
                data: {
                    currentTag: tx.wallet_tag,
                    totalTrades: { increment: 1 },
                    totalVolume: { increment: tx.amount },
                    totalPnl: tx.wallet_pnl || existing.totalPnl,
                    winRate: tx.wallet_win_rate || existing.winRate,
                    lastSeen: new Date()
                }
            });
        } else {
            // Create new profile
            await prisma.whaleProfile.create({
                data: {
                    address,
                    currentTag: tx.wallet_tag,
                    tagHistory: [],
                    totalTrades: 1,
                    totalVolume: tx.amount,
                    totalPnl: tx.wallet_pnl || 0,
                    winRate: tx.wallet_win_rate || 0,
                    avgPositionSize: tx.amount
                }
            });
        }
    } catch (error) {
        console.error('[Tracker] Error updating whale profile:', error);
    }
}
