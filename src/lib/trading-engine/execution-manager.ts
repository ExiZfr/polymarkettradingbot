import { IExecutionStrategy, IWallet, Order, OrderSide, PositionSide } from './interfaces';

export class SimulatedExecutionManager implements IExecutionStrategy {
    private wallet: IWallet;
    private feeRate: number; // e.g. 0.001 for 0.1%

    constructor(wallet: IWallet, feeRate: number = 0.001) {
        this.wallet = wallet;
        this.feeRate = feeRate;
    }

    async executeOrder(
        marketId: string,
        side: OrderSide,
        outcome: PositionSide,
        amount: number, // USD Amount
        currentPrice: number
    ): Promise<Order> {
        // 1. Simulate Network Latency (100-300ms)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // 2. Validate Funds
        if (side === 'BUY') {
            if (!this.wallet.reserveFunds(amount)) {
                return this.createRejectedOrder(marketId, side, outcome, amount, currentPrice, "Insufficient Funds");
            }
        } else if (side === 'SELL') {
            // Validate shares ownership (logic inside wallet or here)
            // For simpler API, we assume 'amount' here converts to shares for selling or we pass shares
            // Let's assume amount is USD value target. 
            // Better: For sell, we usually specify SHARES.
            // But to keep interface simple, let's treat amount as "Exposure to reduce" or implement specifics.
            // To stick to request: "Simulate Realistic".
            // Let's calculate shares based on price.
        }

        // 3. Apply Fees
        const fee = amount * this.feeRate;
        const netAmount = amount - fee;

        // 4. Calculate Execution Price (Slippage Simulation)
        // Buy pushes price up, Sell pushes price down
        // Simple linear slippage model: 0.01% per $1000
        const slippagePct = (amount / 1000) * 0.0001;
        const executionPrice = side === 'BUY'
            ? currentPrice * (1 + slippagePct)
            : currentPrice * (1 - slippagePct);

        const shares = netAmount / executionPrice;

        // 5. Update Wallet
        if (side === 'BUY') {
            this.wallet.addPosition(marketId, outcome, shares, executionPrice);
        } else {
            // For SELL, we need to know how many shares 'amount' USD represents at current price?
            // Or if amount is shares?
            // Let's assume input 'amount' is always USD for this high level method
            // Real exchange API often uses 'quantity' (shares).
            // Let's adapt:
            // If SELL, we execute sale of shares = amount / price (approx)
            // Ideally interface should take quantity.
            // For this simulation "amount" = USD size. 
            const sharesToSell = amount / executionPrice;
            try {
                const realizedPnl = this.wallet.closePosition(marketId, outcome, sharesToSell, executionPrice);
                console.log(`[SIMULATION] Realized PnL: $${realizedPnl.toFixed(2)}`);
            } catch (e: any) {
                return this.createRejectedOrder(marketId, side, outcome, amount, currentPrice, e.message);
            }
        }

        // 6. Return Filled Order
        const order: Order = {
            id: `ord_${Math.random().toString(36).substr(2, 9)}`,
            marketId,
            side,
            outcome,
            amount: amount,
            price: executionPrice,
            timestamp: new Date(),
            status: 'FILLED',
            fee
        };

        // Persist to history
        this.wallet.addOrderToHistory(order);

        return order;
    }

    private createRejectedOrder(marketId: string, side: OrderSide, outcome: PositionSide, amount: number, price: number, reason: string): Order {
        return {
            id: `ord_rej_${Math.random().toString(36).substr(2, 9)}`,
            marketId,
            side,
            outcome,
            amount,
            price,
            timestamp: new Date(),
            status: 'REJECTED',
            fee: 0
        };
    }
}
