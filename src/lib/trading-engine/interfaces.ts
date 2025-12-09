
export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL'
}

export enum PositionSide {
    YES = 'YES',
    NO = 'NO'
}

export interface Order {
    id: string;
    marketId: string;
    outcome: PositionSide;
    side: OrderSide;

    // Support both 'shares' (quantity-based) and 'amount' (USD-based) for compatibility
    shares?: number;
    amount?: number;

    price: number;
    avgPrice?: number; // Optional - average execution price
    timestamp: string; // Normalized to ISO string
    status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    fee?: number;
    realizedPnl?: number; // Added for stat tracking
}

export interface Position {
    marketId: string;
    outcome: PositionSide;
    shares: number;
    avgPrice: number;
    investedParams: number; // Total $ put in
    currentValue: number;
    pnl: number;
    pnlPercent: number;
}

export interface WalletPortfolio {
    balance: number;
    locked: number; // Funds in open orders
    totalEquity: number;
    positions: Map<string, Position>;
}

export interface IWallet {
    getBalance(): number;
    getPortfolio(): WalletPortfolio;
    deposit(amount: number): void;
    withdraw(amount: number): boolean;
    reserveFunds(amount: number): boolean;
    releaseFunds(amount: number): void;

    // Trading
    addPosition(marketId: string, outcome: PositionSide, shares: number, price: number): void;
    closePosition(marketId: string, outcome: PositionSide, shares: number, price: number): number; // Returns realized PnL
    addOrderToHistory?(order: Order): void; // Optional method for tracking orders
}

export interface IExecutionStrategy {
    executeOrder(
        marketId: string,
        side: OrderSide,
        outcome: PositionSide,
        amount: number, // USD amount
        currentPrice: number
    ): Promise<Order>;
}
