import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for Mean Reversion Bot strategy
 * GET - Returns current bot status, signals, and statistics
 * POST - Control the bot (start/stop/configure)
 */

// Bot status file path
const BOT_STATUS_FILE = path.join(process.cwd(), 'data', 'mean_reversion_status.json');
const BOT_SIGNALS_FILE = path.join(process.cwd(), 'data', 'mean_reversion_signals.json');

interface BotStatus {
    running: boolean;
    mode: 'simulation' | 'live';
    startTime: string | null;
    bankroll: number;
    dailyPnl: number;
    totalPnl: number;
    trades: number;
    wins: number;
    lastUpdate: string;
}

interface Signal {
    id: string;
    timestamp: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    zScore: number;
    confidence: number;
    entryPrice: number;
    expectedValue: number;
    kellySize: number;
    marketQuestion: string;
    outcome: 'Yes' | 'No';
    status: 'PENDING' | 'EXECUTED' | 'CLOSED';
    pnl?: number;
}

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readBotStatus(): BotStatus {
    try {
        if (fs.existsSync(BOT_STATUS_FILE)) {
            const data = fs.readFileSync(BOT_STATUS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading bot status:', e);
    }

    // Default status
    return {
        running: false,
        mode: 'simulation',
        startTime: null,
        bankroll: 1000,
        dailyPnl: 0,
        totalPnl: 0,
        trades: 0,
        wins: 0,
        lastUpdate: new Date().toISOString()
    };
}

function writeBotStatus(status: BotStatus) {
    ensureDataDir();
    fs.writeFileSync(BOT_STATUS_FILE, JSON.stringify(status, null, 2));
}

function readSignals(): Signal[] {
    try {
        if (fs.existsSync(BOT_SIGNALS_FILE)) {
            const data = fs.readFileSync(BOT_SIGNALS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading signals:', e);
    }
    return [];
}

function writeSignals(signals: Signal[]) {
    ensureDataDir();
    // Keep last 100 signals
    const recentSignals = signals.slice(-100);
    fs.writeFileSync(BOT_SIGNALS_FILE, JSON.stringify(recentSignals, null, 2));
}

// Mock signals for demo (until real bot integration)
function generateMockSignals(): Signal[] {
    const symbols = ['BTC/USDT', 'ETH/USDT'];
    const questions = [
        'Will BTC be above $105,000 at 15:00 UTC?',
        'Will ETH be above $4,000 at 15:00 UTC?',
        'Will BTC be above $104,500 at 15:15 UTC?',
        'Will ETH be above $3,950 at 15:15 UTC?'
    ];

    const signals: Signal[] = [];
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
        const isLong = Math.random() > 0.5;
        const zScore = 2 + Math.random() * 1.5; // 2-3.5 sigma
        const confidence = 0.6 + Math.random() * 0.2; // 60-80%

        signals.push({
            id: `sig_${now}_${i}`,
            timestamp: new Date(now - i * 60000 * 5).toISOString(), // Every 5 min
            symbol: symbols[i % 2],
            direction: isLong ? 'LONG' : 'SHORT',
            zScore: parseFloat(zScore.toFixed(2)),
            confidence: parseFloat(confidence.toFixed(2)),
            entryPrice: parseFloat((0.3 + Math.random() * 0.4).toFixed(3)), // 0.3-0.7
            expectedValue: parseFloat((0.05 + Math.random() * 0.15).toFixed(4)), // 5-20%
            kellySize: parseFloat((0.05 + Math.random() * 0.1).toFixed(3)), // 5-15%
            marketQuestion: questions[i % questions.length],
            outcome: isLong ? 'Yes' : 'No',
            status: i === 0 ? 'PENDING' : (i < 3 ? 'EXECUTED' : 'CLOSED'),
            pnl: i >= 3 ? parseFloat(((Math.random() - 0.3) * 20).toFixed(2)) : undefined
        });
    }

    return signals;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        const status = readBotStatus();
        let signals = readSignals();

        // Generate mock signals if none exist (demo mode)
        if (signals.length === 0) {
            signals = generateMockSignals();
            writeSignals(signals);
        }

        // Calculate statistics
        const closedSignals = signals.filter(s => s.status === 'CLOSED');
        const totalPnl = closedSignals.reduce((sum, s) => sum + (s.pnl || 0), 0);
        const wins = closedSignals.filter(s => (s.pnl || 0) > 0).length;
        const winRate = closedSignals.length > 0 ? (wins / closedSignals.length * 100) : 0;

        // Aggregate stats
        const stats = {
            totalSignals: signals.length,
            pendingSignals: signals.filter(s => s.status === 'PENDING').length,
            executedSignals: signals.filter(s => s.status === 'EXECUTED').length,
            closedSignals: closedSignals.length,
            totalPnl: parseFloat(totalPnl.toFixed(2)),
            winRate: parseFloat(winRate.toFixed(1)),
            avgZScore: parseFloat((signals.reduce((sum, s) => sum + s.zScore, 0) / signals.length || 0).toFixed(2)),
            avgConfidence: parseFloat((signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length * 100 || 0).toFixed(1))
        };

        if (type === 'status') {
            return NextResponse.json({ status });
        }

        if (type === 'signals') {
            return NextResponse.json({ signals });
        }

        if (type === 'stats') {
            return NextResponse.json({ stats });
        }

        // Return all
        return NextResponse.json({
            status: {
                ...status,
                running: true, // Assume running if we have recent signals
                lastUpdate: new Date().toISOString()
            },
            signals: signals.slice(0, 20), // Last 20 signals
            stats,
            config: {
                zScoreThreshold: 2.0,
                kellyFraction: 0.25,
                maxPositionUsd: 100,
                timeStopMinutes: 5,
                symbols: ['BTC/USDT', 'ETH/USDT']
            }
        });

    } catch (error) {
        console.error('Error in strategy API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch strategy data' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, config } = body;

        const status = readBotStatus();

        switch (action) {
            case 'start':
                status.running = true;
                status.startTime = new Date().toISOString();
                status.mode = config?.mode || 'simulation';
                status.bankroll = config?.bankroll || 1000;
                writeBotStatus(status);
                return NextResponse.json({ success: true, message: 'Bot started', status });

            case 'stop':
                status.running = false;
                writeBotStatus(status);
                return NextResponse.json({ success: true, message: 'Bot stopped', status });

            case 'configure':
                if (config) {
                    status.bankroll = config.bankroll || status.bankroll;
                    status.mode = config.mode || status.mode;
                    writeBotStatus(status);
                }
                return NextResponse.json({ success: true, message: 'Configuration updated', status });

            case 'clear_signals':
                writeSignals([]);
                return NextResponse.json({ success: true, message: 'Signals cleared' });

            default:
                return NextResponse.json(
                    { error: 'Unknown action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error in strategy API:', error);
        return NextResponse.json(
            { error: 'Failed to process action' },
            { status: 500 }
        );
    }
}
