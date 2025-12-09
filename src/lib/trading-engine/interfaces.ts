export type OrderSide = 'BUY' | 'SELL';
export type PositionSide = 'YES' | 'NO';

export interface Order {
    id: string;
    marketId: string;
    side: OrderSide;
    outcome: PositionSide;
    amount: number; // USD Amount
    price: number; // Price per share
    timestamp: Date;
    status: 'FILLED' | 'REJECTED' | 'PENDING';
    fee: number;
}

export interface Position {
    marketId: string;
    outcome: PositionSide;
    shares: number;
    avgPrice: number;
    investedParams: number; // Total USD invested
    currentValue: number; // Updated on tick
    pnl: number;
    pnlPercent: number;
}

export interface WalletPortfolio {
    balance: number; // Available USD
    locked: number; // In orders
    totalEquity: number; // Balance + Unrealized P&L
    positions: Map<string, Position>;
}

export interface IWallet {
    getBalance(): number;
    getPortfolio(): WalletPortfolio;
    deposit(amount: number): void;
    withdraw(amount: number): boolean;
    reserveFunds(amount: number): boolean;
    releaseFunds(amount: number): void;
    addPosition(marketId: string, outcome: PositionSide, shares: number, price: number): void;
    closePosition(marketId: string, outcome: PositionSide, shares: number, price: number): number; // Returns realized P&L
    updatePositionValue(marketId: string, currentPrice: number): void;
}

export interface IExecutionStrategy {
    executeOrder(marketId: string, side: OrderSide, outcome: PositionSide, amount: number, currentPrice: number): Promise<Order>;
}
