import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';
import { SimulatedExecutionManager } from '@/lib/trading-engine/execution-manager';

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

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
