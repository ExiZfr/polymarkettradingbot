import { NextResponse } from 'next/server';
import { PaperWallet } from '@/lib/trading-engine/paper-wallet';

export async function GET() {
    const wallet = new PaperWallet();
    const portfolio = wallet.getPortfolio();

    // Convert Map to Object for serialization
    const portfolioJson = {
        ...portfolio,
        positions: Object.fromEntries(portfolio.positions)
    };

    return NextResponse.json(portfolioJson);
}
