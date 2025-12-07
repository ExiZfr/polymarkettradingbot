import { ProcessedMarket } from './polymarket';

// Types d'événements
export type ListenerEventType = 'log' | 'market_found' | 'signal_detected' | 'error';

export interface ListenerLog {
    id: string;
    timestamp: Date;
    type: 'SCAN' | 'INFO' | 'WARNING' | 'SUCCESS';
    message: string;
    source: 'Twitter' | 'News' | 'Polymarket' | 'System';
}

export interface SignalData {
    marketId: string;
    marketTitle: string;
    score: number;
    reason: string;
}

export interface ListenerStatus {
    active: boolean;
    marketsTracked: number;
    signalsDetected: number;
}

type ListenerCallback = (data: any) => void;

class PolymarketListener {
    private isRunning: boolean = false;
    private subscribers: Record<ListenerEventType, ListenerCallback[]> = {
        log: [],
        market_found: [],
        signal_detected: [],
        error: []
    };

    private trackedMarkets: Set<string> = new Set();
    private scanInterval: NodeJS.Timeout | null = null;

    // Keywords for simulation
    private keywords = ['Trump', 'Elon Musk', 'Fed Rate', 'Bitcoin', 'Binance', 'SpaceX', 'Inflation', 'SEC'];
    private sources = ['Twitter (X)', 'Bloomberg Terminal', 'Polymarket API', 'CoinDesk RSS'];

    // --- PUB/SUB SYSTEM ---

    public on(event: ListenerEventType, callback: ListenerCallback) {
        if (!this.subscribers[event]) this.subscribers[event] = [];
        this.subscribers[event].push(callback);
    }

    public off(event: ListenerEventType, callback: ListenerCallback) {
        if (!this.subscribers[event]) return;
        this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    }

    private emit(event: ListenerEventType, data: any) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(cb => cb(data));
        }
    }

    // --- VISIBLE ACTIONS ---

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.emitLog('System', 'INFO', 'Starting AI Listener Engine v2.4...');

        // Start the simulation loop
        this.scanInterval = setInterval(() => {
            if (!this.isRunning) return;
            this.performMicroTask();
        }, 2000); // New log every 2 seconds
    }

    public stop() {
        this.isRunning = false;
        if (this.scanInterval) clearInterval(this.scanInterval);
        this.emitLog('System', 'WARNING', 'Listener Engine Stopped.');
    }

    public trackMarket(market: ProcessedMarket, isFavorite: boolean) {
        if (!this.trackedMarkets.has(market.id)) {
            this.trackedMarkets.add(market.id);
            // Don't spam regular tracks, but maybe favorite tracks
            if (isFavorite) {
                this.emitLog('System', 'SUCCESS', `Now tracking favorite: "${market.title.substring(0, 30)}..."`);
            }
        }
    }

    public toggleFavorite(marketId: string) {
        // Logic handled in UI, just logging here
        this.emitLog('System', 'INFO', `Updated priority for market ${marketId.substring(0, 8)}`);
    }

    public getStatus() {
        return {
            active: this.isRunning,
            marketsTracked: this.trackedMarkets.size,
            signalsDetected: Math.floor(Math.random() * 20) + 5 // Fake stats for now
        };
    }

    // --- INTERNAL SIMULATION ---

    private performMicroTask() {
        const rand = Math.random();
        const source = this.sources[Math.floor(Math.random() * this.sources.length)] as any;
        const keyword = this.keywords[Math.floor(Math.random() * this.keywords.length)];

        // 70% chance of a scan log
        if (rand > 0.3) {
            this.emitLog(source, 'SCAN', `Scanning ${source} for keyword: "${keyword}"...`);
            return;
        }

        // 10% chance of a Signal (Snipe Opportunity)
        if (rand < 0.1 && this.trackedMarkets.size > 0) {
            const signal: SignalData = {
                marketId: 'mock-id',
                marketTitle: `${keyword} prediction update`,
                score: 85 + Math.floor(Math.random() * 10),
                reason: `Breaking news detected on ${source}`
            };
            this.emit('signal_detected', signal);
            this.emitLog(source, 'SUCCESS', `SIGNAL DETECTED: ${signal.reason} (Score: ${signal.score})`);
            return;
        }

        // 5% chance of New Market Found
        if (rand > 0.1 && rand < 0.15) {
            this.emit('market_found', { title: `New market: Will ${keyword} hit ATH?` });
            this.emitLog('Polymarket API', 'INFO', `New market detected: Will ${keyword} hit ATH?`);
        }
    }

    private emitLog(source: any, type: any, message: string) {
        const log: ListenerLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            source,
            type,
            message
        };
        this.emit('log', log);
    }
}

// Singleton Instance
export const listener = new PolymarketListener();
