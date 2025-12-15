export interface WhaleTransaction {
    wallet_address: string;
    wallet_tag: string;
    wallet_win_rate: number | null;
    wallet_pnl: number | null;
    market_id: string;
    market_question: string;
    market_slug: string;
    market_url: string | null;
    outcome: string;
    amount: number;
    price: number;
    timestamp: string;
    tx_hash: string;
}

export interface TrackerStats {
    totalTransactions: number;
    totalVolume: number;
    uniqueWhales: number;
    avgTradeSize: number;
    tagDistribution: Record<string, number>;
    topWhales: Array<{
        address: string;
        tag: string;
        totalVolume: number;
        tradeCount: number;
    }>;
}

export interface LogEntry {
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

export interface FilterState {
    tag: string;
    minAmount: number;
}
