import { IWallet, Order, OrderSide, PositionSide, WalletPortfolio, Position } from './interfaces';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'paper-profiles.json');

// Profile Data Structure
export interface ProfileSettings {
    riskPerTrade: number;
    autoStopLoss: number;
    autoTakeProfit: number;
}

export interface PaperCopySetting {
    walletAddress: string; // The ID/Address of the wallet being copied
    enabled: boolean;
    label?: string; // Custom name for the wallet
    copyMode: 'fixed' | 'percentage' | 'smart_mirror';
    fixedAmount?: number; // For 'fixed' mode
    percentageAmount?: number; // For 'percentage' mode (e.g., 5% of my balance)
    maxCap?: number; // Max $ per trade safety cap
    stopLoss?: number; // Stop copying if position drops X%
    inverse?: boolean; // "Inverse Kramer" mode - bet opposite
    createdAt: string;
}

export interface PaperProfile {
    id: string;
    name: string;
    balance: number;
    positions: Record<string, Position>;
    history: Order[];
    settings: ProfileSettings;
    copySettings: Record<string, PaperCopySetting>; // Map address -> settings
    createdAt: string;
}

export interface ProfilesData {
    activeProfileId: string;
    profiles: Record<string, PaperProfile>;
}

// Default profile template
const DEFAULT_PROFILE: PaperProfile = {
    id: 'default',
    name: 'Main Account',
    balance: 1000,
    positions: {},
    history: [],
    settings: {
        riskPerTrade: 5,
        autoStopLoss: 15,
        autoTakeProfit: 30
    },
    copySettings: {},
    createdAt: new Date().toISOString()
};

const DEFAULT_PROFILES_DATA: ProfilesData = {
    activeProfileId: 'default',
    profiles: {
        default: { ...DEFAULT_PROFILE }
    }
};

export class PaperWallet implements IWallet {
    private profileId: string;
    private profile: PaperProfile;

    constructor(profileId?: string) {
        this.ensureDataDir();
        PaperWallet.ensureProfilesFileExists();
        const data = this.loadAllProfiles();
        this.profileId = profileId || data.activeProfileId;
        this.profile = data.profiles[this.profileId] || { ...DEFAULT_PROFILE };
    }

    private ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    // CRITICAL: Ensure file exists with valid structure
    static ensureProfilesFileExists() {
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(PROFILES_FILE)) {
            fs.writeFileSync(PROFILES_FILE, JSON.stringify(DEFAULT_PROFILES_DATA, null, 2));
        }
    }

    private loadAllProfiles(): ProfilesData {
        try {
            const content = fs.readFileSync(PROFILES_FILE, 'utf-8');
            const data = JSON.parse(content);
            // Validate structure
            if (!data || !data.profiles || !data.activeProfileId) {
                throw new Error('Invalid profiles data structure');
            }
            return data;
        } catch (err) {
            console.error("Failed to load profiles, using defaults:", err);
            // Reset to default
            this.saveAllProfiles(DEFAULT_PROFILES_DATA);
            return DEFAULT_PROFILES_DATA;
        }
    }

    private saveAllProfiles(data: ProfilesData) {
        this.ensureDataDir();
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
    }

    public save() {
        const data = this.loadAllProfiles();
        data.profiles[this.profileId] = this.profile;
        this.saveAllProfiles(data);
    }

    // Static Helpers for Profile Management
    static getActiveProfileId(): string {
        PaperWallet.ensureProfilesFileExists();
        try {
            const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
            return data.activeProfileId || 'default';
        } catch {
            return 'default';
        }
    }

    static setActiveProfile(profileId: string): boolean {
        PaperWallet.ensureProfilesFileExists();
        try {
            const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
            if (data.profiles[profileId]) {
                data.activeProfileId = profileId;
                fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
                return true;
            }
        } catch { }
        return false;
    }

    static getAllProfiles(): ProfilesData {
        PaperWallet.ensureProfilesFileExists();
        try {
            const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
            // Guarantee valid structure
            if (!data || !data.profiles) {
                return DEFAULT_PROFILES_DATA;
            }
            return data;
        } catch {
            return DEFAULT_PROFILES_DATA;
        }
    }

    static createProfile(name: string, balance: number, settings: Partial<ProfileSettings>): PaperProfile {
        PaperWallet.ensureProfilesFileExists();
        const data = PaperWallet.getAllProfiles();
        const id = `profile_${Date.now()}`;
        const newProfile: PaperProfile = {
            id,
            name,
            balance,
            positions: {},
            history: [],
            settings: {
                riskPerTrade: settings.riskPerTrade ?? 5,
                autoStopLoss: settings.autoStopLoss ?? 15,
                autoTakeProfit: settings.autoTakeProfit ?? 30
            },
            copySettings: {},
            createdAt: new Date().toISOString()
        };
        data.profiles[id] = newProfile;
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
        return newProfile;
    }

    static deleteProfile(profileId: string): boolean {
        if (profileId === 'default') return false;
        PaperWallet.ensureProfilesFileExists();
        const data = PaperWallet.getAllProfiles();
        if (data.profiles[profileId]) {
            delete data.profiles[profileId];
            if (data.activeProfileId === profileId) {
                data.activeProfileId = 'default';
            }
            fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
            return true;
        }
        return false;
    }

    // IWallet Implementation
    getBalance(): number {
        return this.profile.balance;
    }

    getPortfolio(): WalletPortfolio {
        let unrealizedPnl = 0;
        let positionsValue = 0;
        const positionsMap = new Map<string, Position>();

        Object.entries(this.profile.positions).forEach(([key, pos]) => {
            positionsMap.set(key, pos);
            positionsValue += pos.currentValue;
            unrealizedPnl += pos.pnl;
        });

        return {
            balance: this.profile.balance,
            locked: 0,
            totalEquity: this.profile.balance + positionsValue,
            positions: positionsMap
        };
    }

    deposit(amount: number): void {
        this.profile.balance += amount;
        this.save();
    }

    withdraw(amount: number): boolean {
        if (this.profile.balance >= amount) {
            this.profile.balance -= amount;
            this.save();
            return true;
        }
        return false;
    }

    reserveFunds(amount: number): boolean {
        return this.profile.balance >= amount;
    }

    releaseFunds(amount: number): void {
        // Used if order is cancelled
    }

    addPosition(marketId: string, outcome: PositionSide, shares: number, price: number): void {
        const cost = shares * price;
        this.profile.balance -= cost;

        const key = `${marketId}-${outcome}`;
        let pos = this.profile.positions[key];

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

        const totalShares = pos.shares + shares;
        const totalInvested = pos.investedParams + cost;
        pos.avgPrice = totalInvested / totalShares;
        pos.shares = totalShares;
        pos.investedParams = totalInvested;
        pos.currentValue = totalShares * price;

        this.profile.positions[key] = pos;
        this.save();
    }

    closePosition(marketId: string, outcome: PositionSide, shares: number, price: number): number {
        const key = `${marketId}-${outcome}`;
        const pos = this.profile.positions[key];

        if (!pos || pos.shares < shares) {
            throw new Error(`Insufficient position to close. Own: ${pos?.shares || 0}, Requested: ${shares}`);
        }

        const costBasis = shares * pos.avgPrice;
        const proceedValue = shares * price;
        const realizedPnl = proceedValue - costBasis;

        pos.shares -= shares;
        pos.investedParams -= costBasis;
        pos.currentValue = pos.shares * price;

        this.profile.balance += proceedValue;

        if (pos.shares <= 0.0001) {
            delete this.profile.positions[key];
        } else {
            this.profile.positions[key] = pos;
        }

        this.save();
        return realizedPnl;
    }

    updatePositionValue(marketId: string, currentPrice: number): void {
        // Update all positions for this market
    }

    updateMarkPrice(marketId: string, outcome: PositionSide, currentPrice: number) {
        const key = `${marketId}-${outcome}`;
        const pos = this.profile.positions[key];
        if (pos) {
            pos.currentValue = pos.shares * currentPrice;
            pos.pnl = pos.currentValue - pos.investedParams;
            pos.pnlPercent = (pos.pnl / pos.investedParams) * 100;
            this.profile.positions[key] = pos;
            this.save();
        }
    }

    public addOrderToHistory(order: Order): void {
        this.profile.history.unshift(order);
        this.save();
    }

    public getHistory(): Order[] {
        return this.profile.history;
    }

    public getProfileId(): string {
        return this.profileId;
    }

    public getProfileName(): string {
        return this.profile.name;
    }

    public getProfileSettings(): ProfileSettings {
        return this.profile.settings;
    }
}
