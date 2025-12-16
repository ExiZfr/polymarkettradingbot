"use client";

// ============================================
// PAPER TRADING ENGINE v2.2
// Multi-Account + Per-Profile Settings System
// ============================================

// Types
export interface PaperTradingSettings {
    enabled: boolean;
    initialBalance: number;
    riskPerTrade: number; // % of balance per trade (1-100)
    defaultPositionSize: number; // Fixed amount if not using risk %
    useRiskBasedSizing: boolean; // true = use riskPerTrade, false = use defaultPositionSize
    autoStopLoss: number; // % below entry (0 = disabled)
    autoTakeProfit: number; // % above entry (0 = disabled)
    maxOpenPositions: number;
    allowShorts: boolean;
}

export interface PaperOrder {
    id: string;
    marketId: string;
    profileId: string; // Linked to specific profile
    marketTitle: string;
    marketImage?: string;
    type: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    amount: number;
    entryPrice: number;
    currentPrice?: number;
    shares: number;
    timestamp: number;
    status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING';
    exitPrice?: number;
    exitTimestamp?: number;
    pnl?: number;
    roi?: number;
    source: 'MANUAL' | 'SNIPER' | 'COPY_TRADING' | 'ORACLE' | 'MEAN_REVERSION';
    stopLoss?: number;
    takeProfit?: number;
    marketSlug?: string;
    marketUrl?: string;
    notes?: string;
}

export interface PaperProfile {
    id: string; // Unique ID
    username: string; // Display Name
    initialBalance: number;
    currentBalance: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    winRate: number;
    tradesCount: number;
    winCount: number;
    lossCount: number;
    bestTrade: number;
    worstTrade: number;
    avgTradeSize: number;
    active: boolean; // Is this the currently selected profile globally?
    autoFollow: boolean;
    createdAt: number;
    lastTradeAt?: number;
    settings?: Partial<PaperTradingSettings>; // Per-profile settings override
}

export interface PaperStats {
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winRate: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
}

// Default Values
export const DEFAULT_SETTINGS: PaperTradingSettings = {
    enabled: true,
    initialBalance: 1000,
    riskPerTrade: 5,
    defaultPositionSize: 50,
    useRiskBasedSizing: true,
    autoStopLoss: 15,
    autoTakeProfit: 30,
    maxOpenPositions: 10,
    allowShorts: false
};

const DEFAULT_PROFILE_ID = "default_profile";

const DEFAULT_PROFILE: PaperProfile = {
    id: DEFAULT_PROFILE_ID,
    username: "Main Portfolio",
    initialBalance: 1000,
    currentBalance: 1000,
    totalPnL: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    tradesCount: 0,
    winCount: 0,
    lossCount: 0,
    bestTrade: 0,
    worstTrade: 0,
    avgTradeSize: 0,
    active: true,
    autoFollow: false,
    createdAt: Date.now()
};

// Risk Presets
export const RISK_PRESETS = {
    CONSERVATIVE: {
        riskPerTrade: 1,
        autoStopLoss: 5,
        autoTakeProfit: 10,
        maxOpenPositions: 3,
        allowShorts: false
    },
    BALANCED: {
        riskPerTrade: 5,
        autoStopLoss: 15,
        autoTakeProfit: 30,
        maxOpenPositions: 5,
        allowShorts: false
    },
    DEGEN: {
        riskPerTrade: 25,
        autoStopLoss: 50,
        autoTakeProfit: 100,
        maxOpenPositions: 20,
        allowShorts: true
    }
};

// Storage Keys
const STORAGE_KEY = "polybot_paper_trading_v2"; // Bumped version
const PROFILES_KEY = `${STORAGE_KEY}_profiles`;
const ACTIVE_PROFILE_KEY = `${STORAGE_KEY}_active_id`;
const ORDERS_KEY = `${STORAGE_KEY}_orders`;

// Helper Functions
function safeLocalStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch {
        return fallback;
    }
}

function saveLocalStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new Event('paper-update'));
    } catch (e) {
        console.error('[PaperTrading] Failed to save:', e);
    }
}

// ============================================
// PAPER STORE - Main API
// ============================================
export const paperStore = {

    // --- PROFILES ---
    getProfiles: (): PaperProfile[] => {
        // Migration check: if no profiles but old profile exists, migrate it
        let profiles = safeLocalStorage<PaperProfile[]>(PROFILES_KEY, []);
        if (profiles.length === 0) {
            profiles = [DEFAULT_PROFILE];
            saveLocalStorage(PROFILES_KEY, profiles);
        }
        return profiles;
    },

    getActiveProfileId: (): string => {
        return safeLocalStorage(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE_ID);
    },

    getActiveProfile: (): PaperProfile => {
        const profiles = paperStore.getProfiles();
        const activeId = paperStore.getActiveProfileId();
        return profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILE;
    },

    createProfile: (name: string, initialBalance: number, initialSettings?: Partial<PaperTradingSettings>): PaperProfile => {
        const profiles = paperStore.getProfiles();
        const settings = initialSettings || {};

        // Ensure initial balance in settings matches the profile balance
        settings.initialBalance = initialBalance;

        const newProfile: PaperProfile = {
            ...DEFAULT_PROFILE,
            id: `profile_${Date.now()}`,
            username: name,
            initialBalance: initialBalance,
            currentBalance: initialBalance,
            active: false, // Default to inactive upon creation
            createdAt: Date.now(),
            settings: settings
        };
        profiles.push(newProfile);
        saveLocalStorage(PROFILES_KEY, profiles);
        return newProfile;
    },

    saveProfile: (updates: Partial<PaperProfile>): PaperProfile => {
        const profiles = paperStore.getProfiles();
        const activeId = paperStore.getActiveProfileId();
        const index = profiles.findIndex(p => p.id === activeId);

        if (index !== -1) {
            profiles[index] = { ...profiles[index], ...updates };
            saveLocalStorage(PROFILES_KEY, profiles);
            return profiles[index];
        }
        return DEFAULT_PROFILE; // Specific fallback
    },

    switchProfile: (profileId: string): PaperProfile | null => {
        const profiles = paperStore.getProfiles();
        const target = profiles.find(p => p.id === profileId);

        if (target) {
            saveLocalStorage(ACTIVE_PROFILE_KEY, profileId);
            // Update active flags for UI convenience
            const updatedProfiles = profiles.map(p => ({
                ...p,
                active: p.id === profileId
            }));
            saveLocalStorage(PROFILES_KEY, updatedProfiles);
            return target;
        }
        return null;
    },

    resetProfile: (initialBalance?: number): PaperProfile => {
        const profiles = paperStore.getProfiles();
        const activeId = paperStore.getActiveProfileId();
        const index = profiles.findIndex(p => p.id === activeId);

        if (index !== -1) {
            const currentSettings = paperStore.getSettings(); // Get merged settings
            const balance = initialBalance || currentSettings.initialBalance;

            const resetProfile: PaperProfile = {
                ...DEFAULT_PROFILE,
                id: profiles[index].id, // Keep ID
                username: profiles[index].username, // Keep Name
                initialBalance: balance,
                currentBalance: balance,
                active: true,
                createdAt: Date.now(),
                settings: profiles[index].settings // Keep custom settings
            };
            profiles[index] = resetProfile;
            saveLocalStorage(PROFILES_KEY, profiles);

            // Also need to clear orders FOR THIS PROFILE
            const allOrders = paperStore.getAllOrders();
            const otherOrders = allOrders.filter(o => o.profileId !== activeId);
            saveLocalStorage(ORDERS_KEY, otherOrders);

            return resetProfile;
        }
        return DEFAULT_PROFILE;
    },

    deleteProfile: (profileId: string): boolean => {
        let profiles = paperStore.getProfiles();
        if (profiles.length <= 1) return false; // Cannot delete last profile

        profiles = profiles.filter(p => p.id !== profileId);
        saveLocalStorage(PROFILES_KEY, profiles);

        // If we deleted the active one, switch to the first available
        if (paperStore.getActiveProfileId() === profileId) {
            paperStore.switchProfile(profiles[0].id);
        }
        return true;
    },

    // --- SETTINGS (Scoped to Active Profile) ---
    getSettings: (): PaperTradingSettings => {
        // Return defaults merged with active profile overrides
        const activeProfile = paperStore.getActiveProfile();
        return { ...DEFAULT_SETTINGS, ...(activeProfile.settings || {}) };
    },

    saveSettings: (settings: Partial<PaperTradingSettings>): PaperTradingSettings => {
        // Save to active profile
        const currentSettings = paperStore.getSettings();
        const updatedSettings = { ...currentSettings, ...settings };

        // Persist only the diff/overrides to the profile (or just the whole object for simplicity)
        paperStore.saveProfile({ settings: updatedSettings });

        return updatedSettings;
    },

    // --- ORDERS (Scoped to Active Profile) ---
    getAllOrders: (): PaperOrder[] => {
        return safeLocalStorage(ORDERS_KEY, []);
    },

    getOrders: (): PaperOrder[] => {
        const activeId = paperStore.getActiveProfileId();
        const allOrders = paperStore.getAllOrders();
        // Return orders for active profile OR legacy orders with no profileId (migration)
        return allOrders.filter(o => o.profileId === activeId || (!o.profileId && activeId === DEFAULT_PROFILE_ID));
    },

    getOpenOrders: (): PaperOrder[] => {
        return paperStore.getOrders().filter(o => o.status === 'OPEN');
    },

    getClosedOrders: (): PaperOrder[] => {
        return paperStore.getOrders().filter(o => o.status === 'CLOSED');
    },

    getOrderById: (id: string): PaperOrder | undefined => {
        return paperStore.getOrders().find(o => o.id === id);
    },

    // Calculate position size based on settings
    calculatePositionSize: (): number => {
        const settings = paperStore.getSettings();
        const profile = paperStore.getActiveProfile();

        if (settings.useRiskBasedSizing) {
            return (profile.currentBalance * settings.riskPerTrade) / 100;
        }
        return Math.min(settings.defaultPositionSize, profile.currentBalance);
    },

    // Place a new order
    placeOrder: (orderData: {
        marketId: string;
        marketTitle: string;
        marketSlug?: string;
        marketUrl?: string;
        marketImage?: string;
        type: 'BUY' | 'SELL';
        outcome: 'YES' | 'NO';
        entryPrice: number;
        amount?: number;
        source: PaperOrder['source'];
        notes?: string;
    }): PaperOrder | null => {
        const settings = paperStore.getSettings();
        const profile = paperStore.getActiveProfile();
        const orders = paperStore.getOrders(); // Scoped to active profile

        // Check if paper trading is enabled
        if (!settings.enabled) {
            console.warn('[PaperTrading] Paper trading is disabled');
            return null;
        }

        // Check max open positions
        const openOrders = orders.filter(o => o.status === 'OPEN');
        if (openOrders.length >= settings.maxOpenPositions) {
            console.warn('[PaperTrading] Max open positions reached');
            return null;
        }

        // Calculate amount
        const amount = orderData.amount || paperStore.calculatePositionSize();

        // Check balance
        if (amount > profile.currentBalance) {
            console.warn('[PaperTrading] Insufficient balance');
            return null;
        }

        // REALISTIC TRADING GUARD: Reject unrealistic entry prices
        // Prices below $0.05 typically have no liquidity in real markets
        const MIN_REALISTIC_PRICE = 0.05;
        const MAX_REALISTIC_PRICE = 0.98;
        if (orderData.entryPrice < MIN_REALISTIC_PRICE) {
            console.warn(`[PaperTrading] Entry price $${orderData.entryPrice} too low (min: $${MIN_REALISTIC_PRICE}) - would have no liquidity in real trading`);
            return null;
        }
        if (orderData.entryPrice > MAX_REALISTIC_PRICE) {
            console.warn(`[PaperTrading] Entry price $${orderData.entryPrice} too high (max: $${MAX_REALISTIC_PRICE}) - minimal profit potential`);
            return null;
        }

        // Calculate shares (simplified: shares = amount / price)
        const shares = amount / orderData.entryPrice;

        // Calculate stop loss and take profit prices
        const stopLoss = settings.autoStopLoss > 0
            ? orderData.entryPrice * (1 - settings.autoStopLoss / 100)
            : undefined;
        const takeProfit = settings.autoTakeProfit > 0
            ? orderData.entryPrice * (1 + settings.autoTakeProfit / 100)
            : undefined;

        // Create order
        const newOrder: PaperOrder = {
            id: `PO_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            marketId: orderData.marketId,
            profileId: profile.id, // Link to profile
            marketTitle: orderData.marketTitle,
            marketSlug: orderData.marketSlug,
            marketUrl: orderData.marketUrl,
            marketImage: orderData.marketImage,
            type: orderData.type,
            outcome: orderData.outcome,
            amount,
            entryPrice: orderData.entryPrice,
            currentPrice: orderData.entryPrice,
            shares,
            timestamp: Date.now(),
            status: 'OPEN',
            source: orderData.source,
            stopLoss,
            takeProfit,
            notes: orderData.notes
        };

        // Update ALL orders storage
        const allOrders = paperStore.getAllOrders();
        allOrders.unshift(newOrder);
        saveLocalStorage(ORDERS_KEY, allOrders);

        // Deduct from balance
        paperStore.saveProfile({
            currentBalance: profile.currentBalance - amount,
            tradesCount: profile.tradesCount + 1,
            lastTradeAt: Date.now(),
            avgTradeSize: ((profile.avgTradeSize * profile.tradesCount) + amount) / (profile.tradesCount + 1)
        });

        console.log('[PaperTrading] Order placed:', newOrder.id, 'for profile:', profile.id);
        return newOrder;
    },

    // Close an order
    closeOrder: (orderId: string, exitPrice: number): PaperOrder | null => {
        const allOrders = paperStore.getAllOrders();
        const profile = paperStore.getActiveProfile();

        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return null;

        const order = allOrders[orderIndex];
        // Ensure order belongs to active profile, or at least warn/handle shared IDs if any
        if (order.profileId && order.profileId !== profile.id) {
            console.warn("Attempting to close order from different profile");
            return null;
        }

        if (order.status !== 'OPEN') return null;

        // Calculate PnL
        const returnAmount = order.shares * exitPrice;
        const pnl = returnAmount - order.amount;
        const roi = (pnl / order.amount) * 100;

        // Update order
        const closedOrder: PaperOrder = {
            ...order,
            status: 'CLOSED',
            exitPrice,
            exitTimestamp: Date.now(),
            pnl,
            roi
        };

        allOrders[orderIndex] = closedOrder;
        saveLocalStorage(ORDERS_KEY, allOrders);

        // Update profile stats
        // Re-calculate stats based on THIS profile's closed orders to be safe
        const profileOrders = allOrders.filter(o => o.profileId === profile.id || (!o.profileId && profile.id === DEFAULT_PROFILE_ID));
        const closedOrders = profileOrders.filter(o => o.status === 'CLOSED');
        const wins = closedOrders.filter(o => (o.pnl || 0) > 0);
        const losses = closedOrders.filter(o => (o.pnl || 0) < 0);
        const totalRealizedPnL = closedOrders.reduce((sum, o) => sum + (o.pnl || 0), 0);

        paperStore.saveProfile({
            currentBalance: profile.currentBalance + returnAmount,
            realizedPnL: totalRealizedPnL,
            totalPnL: totalRealizedPnL, // Assuming unrealized is calc'd separately
            winCount: wins.length,
            lossCount: losses.length,
            winRate: closedOrders.length > 0 ? (wins.length / closedOrders.length) * 100 : 0,
            bestTrade: Math.max(profile.bestTrade, pnl),
            worstTrade: Math.min(profile.worstTrade, pnl)
        });

        console.log('[PaperTrading] Order closed:', orderId, 'PnL:', pnl.toFixed(2));
        return closedOrder;
    },

    // Settle an order based on market resolution (auto-close when market resolves)
    settleOrder: (orderId: string, winningOutcome: 'YES' | 'NO'): PaperOrder | null => {
        const allOrders = paperStore.getAllOrders();
        const profile = paperStore.getActiveProfile();

        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return null;

        const order = allOrders[orderIndex];
        if (order.status !== 'OPEN') return null;

        // Determine settlement price based on outcome match
        // If user bet on the winning outcome, shares are worth $1 each
        // If user bet on the losing outcome, shares are worth $0
        const isWinner = order.outcome === winningOutcome;
        const exitPrice = isWinner ? 1 : 0;

        // Calculate final P&L
        const returnAmount = order.shares * exitPrice;
        const pnl = returnAmount - order.amount;
        const roi = (pnl / order.amount) * 100;

        // Update order
        const settledOrder: PaperOrder = {
            ...order,
            status: 'CLOSED',
            exitPrice,
            exitTimestamp: Date.now(),
            pnl,
            roi,
            notes: `${order.notes || ''} [Auto-settled: ${winningOutcome} won]`.trim()
        };

        allOrders[orderIndex] = settledOrder;
        saveLocalStorage(ORDERS_KEY, allOrders);

        // Update profile stats (same logic as closeOrder)
        const profileOrders = allOrders.filter(o => o.profileId === profile.id || (!o.profileId && profile.id === DEFAULT_PROFILE_ID));
        const closedOrders = profileOrders.filter(o => o.status === 'CLOSED');
        const wins = closedOrders.filter(o => (o.pnl || 0) > 0);
        const losses = closedOrders.filter(o => (o.pnl || 0) < 0);
        const totalRealizedPnL = closedOrders.reduce((sum, o) => sum + (o.pnl || 0), 0);

        paperStore.saveProfile({
            currentBalance: profile.currentBalance + returnAmount,
            realizedPnL: totalRealizedPnL,
            totalPnL: totalRealizedPnL,
            winCount: wins.length,
            lossCount: losses.length,
            winRate: closedOrders.length > 0 ? (wins.length / closedOrders.length) * 100 : 0,
            bestTrade: Math.max(profile.bestTrade, pnl),
            worstTrade: Math.min(profile.worstTrade, pnl)
        });

        console.log(`[PaperTrading] Order SETTLED: ${orderId} | Winner: ${winningOutcome} | User bet: ${order.outcome} | PnL: ${pnl.toFixed(2)}`);
        return settledOrder;
    },

    // Cancel an order (refund amount)
    cancelOrder: (orderId: string): boolean => {
        const allOrders = paperStore.getAllOrders();
        const profile = paperStore.getActiveProfile();

        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return false;

        const order = allOrders[orderIndex];
        if (order.profileId && order.profileId !== profile.id) return false;

        if (order.status !== 'OPEN' && order.status !== 'PENDING') return false;

        allOrders[orderIndex] = { ...order, status: 'CANCELLED' };
        saveLocalStorage(ORDERS_KEY, allOrders);

        // Refund balance
        paperStore.saveProfile({
            currentBalance: profile.currentBalance + order.amount
        });

        return true;
    },

    // Update current prices for open orders (for unrealized PnL)
    updatePrices: (priceMap: Record<string, number>) => {
        const allOrders = paperStore.getAllOrders();
        let updated = false;

        allOrders.forEach((order, index) => {
            if (order.status === 'OPEN' && priceMap[order.marketId]) {
                allOrders[index] = { ...order, currentPrice: priceMap[order.marketId] };
                updated = true;
            }
        });

        if (updated) {
            saveLocalStorage(ORDERS_KEY, allOrders);

            // Recalculate unrealized PnL for ACTIVE profile only (for now)
            const activeProfile = paperStore.getActiveProfile();
            const activeOrders = allOrders.filter(o => o.profileId === activeProfile.id || (!o.profileId && activeProfile.id === DEFAULT_PROFILE_ID));
            const openOrders = activeOrders.filter(o => o.status === 'OPEN');

            const unrealizedPnL = openOrders.reduce((sum, order) => {
                const currentValue = order.shares * (order.currentPrice || order.entryPrice);
                return sum + (currentValue - order.amount);
            }, 0);

            paperStore.saveProfile({
                unrealizedPnL,
                totalPnL: activeProfile.realizedPnL + unrealizedPnL
            });
        }
    },

    // Get comprehensive stats
    getStats: (): PaperStats => {
        const orders = paperStore.getOrders();
        const profile = paperStore.getActiveProfile();

        const openOrders = orders.filter(o => o.status === 'OPEN');
        const closedOrders = orders.filter(o => o.status === 'CLOSED');
        const wins = closedOrders.filter(o => (o.pnl || 0) > 0);
        const losses = closedOrders.filter(o => (o.pnl || 0) < 0);

        const totalWins = wins.reduce((sum, o) => sum + (o.pnl || 0), 0);
        const totalLosses = Math.abs(losses.reduce((sum, o) => sum + (o.pnl || 0), 0));

        return {
            totalTrades: orders.length,
            openTrades: openOrders.length,
            closedTrades: closedOrders.length,
            winRate: profile.winRate,
            totalPnL: profile.totalPnL,
            realizedPnL: profile.realizedPnL,
            unrealizedPnL: profile.unrealizedPnL,
            avgWin: wins.length > 0 ? totalWins / wins.length : 0,
            avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
            profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
            maxDrawdown: 0, // TODO: Calculate properly
            sharpeRatio: 0 // TODO: Calculate properly
        };
    }
};
