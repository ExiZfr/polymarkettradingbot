import { IWallet, Order, OrderSide, PositionSide, WalletPortfolio, Position } from './interfaces';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const WALLET_FILE = path.join(DATA_DIR, 'wallet.json');

export class PaperWallet implements IWallet {
    private balance: number;
    private positions: Map<string, Position> = new Map();
    private history: Order[] = [];

    constructor(initialBalance: number = 1000) {
        this.balance = initialBalance;
        this.load(); // Load state if exists
    }

    private ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    private load() {
        if (fs.existsSync(WALLET_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
                this.balance = data.balance;
                // Convert object back to Map
                this.positions = new Map(Object.entries(data.positions));
                this.history = data.history || [];
            } catch (err) {
                console.error("Failed to load wallet data:", err);
            }
        } else {
            this.save(); // Initialize file
        }
    }

    public save() {
        this.ensureDataDir();
        const data = {
            balance: this.balance,
            // Convert Map to Object for JSON
            positions: Object.fromEntries(this.positions),
            history: this.history
        };
        fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2));
    }

    getBalance(): number {
        return this.balance;
    }

    getPortfolio(): WalletPortfolio {
        let unrealizedPnl = 0;
        let positionsValue = 0;

        this.positions.forEach(pos => {
            positionsValue += pos.currentValue;
            unrealizedPnl += pos.pnl;
        });

        // Convert Map to plain object for API response if needed, but internally keeps Map
        // For Interface compliance returning Map is fine, but for JSON serializing APIs need care.
        return {
            balance: this.balance,
            locked: 0,
            totalEquity: this.balance + positionsValue,
            positions: this.positions
        };
    }

    deposit(amount: number): void {
        this.balance += amount;
        this.save();
    }

    withdraw(amount: number): boolean {
        if (this.balance >= amount) {
            this.balance -= amount;
            this.save();
            return true;
        }
        return false;
    }

    reserveFunds(amount: number): boolean {
        // In this simple model, check balance immediately. 
        // Real implementation might lock funds here.
        return this.balance >= amount;
    }

    releaseFunds(amount: number): void {
        // Used if order is cancelled
    }

    addPosition(marketId: string, outcome: PositionSide, shares: number, price: number): void {
        // Deduct cost from balance
        const cost = shares * price;
        this.balance -= cost;

        const key = `${marketId}-${outcome}`;
        let pos = this.positions.get(key);

        if (!pos) {
            pos = {
                marketId,
                outcome,
                shares: 0,
                avgPrice: 0,
                investedParams: 0,
                currentValue: 0,
                pnl: 0,
                pnlPercent: 0
            };
        }

        // Weighted Average Price
        const totalShares = pos.shares + shares;
        const totalInvested = pos.investedParams + cost;
        pos.avgPrice = totalInvested / totalShares;
        pos.shares = totalShares;
        pos.investedParams = totalInvested;
        pos.currentValue = totalShares * price; // Initially worth what we paid

        this.positions.set(key, pos);
        this.save();
    }

    closePosition(marketId: string, outcome: PositionSide, shares: number, price: number): number {
        const key = `${marketId}-${outcome}`;
        const pos = this.positions.get(key);

        if (!pos || pos.shares < shares) {
            throw new Error(`Insufficient position to close. Own: ${pos?.shares || 0}, Requested: ${shares}`);
        }

        // Calculate P&L
        const costBasis = shares * pos.avgPrice;
        const proceedValue = shares * price;
        const realizedPnl = proceedValue - costBasis;

        // Update Position
        pos.shares -= shares;
        pos.investedParams -= costBasis;
        pos.currentValue = pos.shares * price; // Update remaining value estimate

        // Credit Balance
        this.balance += proceedValue;

        if (pos.shares <= 0.0001) { // Floating point tolerance
            this.positions.delete(key);
        } else {
            this.positions.set(key, pos);
        }

        this.save();
        return realizedPnl;
    }

    updatePositionValue(marketId: string, currentPrice: number): void {
        // Update all usage of this marketId (YES and NO)
        // Note: Prices for YES and NO are different, so this simplified method signature 
        // implies we need to pass outcome or the specific price map. 
        // For simplicity, let's assume we update by key explicitly outside or pass map

        // This method strictly updates P&L calculation based on external price feed
    }

    // Helper to update specific holding
    updateMarkPrice(marketId: string, outcome: PositionSide, currentPrice: number) {
        const key = `${marketId}-${outcome}`;
        const pos = this.positions.get(key);
        if (pos) {
            pos.currentValue = pos.shares * currentPrice;
            pos.pnl = pos.currentValue - pos.investedParams;
            pos.pnlPercent = (pos.pnl / pos.investedParams) * 100;
            this.positions.set(key, pos);
            this.save(); // Save updated valuation
        }
    }

    public getHistory(): Order[] {
        return this.history;
    }

    public addOrderToHistory(order: Order): void {
        this.history.unshift(order); // Add new order to start
        this.save();
    }
}
