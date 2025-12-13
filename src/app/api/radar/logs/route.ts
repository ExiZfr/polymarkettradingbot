/**
 * API Route: /api/radar/logs
 * 
 * POST: Receives structured logs from Python whale tracker
 * GET: Returns recent logs for frontend console
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory log storage (last 1000 entries)
interface LogEntry {
    level: 'INFO' | 'WARNING' | 'ERROR';
    timestamp: string;
    message: string;
    data?: any;
}

const MAX_LOGS = 1000;
let logStore: LogEntry[] = [];

/**
 * POST /api/radar/logs
 * Receives logs from Python whale tracker script
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const logEntry: LogEntry = {
            level: body.level || 'INFO',
            timestamp: body.timestamp || new Date().toISOString(),
            message: body.message || '',
            data: body.data,
        };

        // Add to store
        logStore.push(logEntry);

        // Trim to max size (keep last MAX_LOGS entries)
        if (logStore.length > MAX_LOGS) {
            logStore = logStore.slice(-MAX_LOGS);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error storing log:', error);
        return NextResponse.json({ error: 'Invalid log format' }, { status: 400 });
    }
}

/**
 * GET /api/radar/logs
 * Returns recent logs for frontend console
 */
export async function GET() {
    try {
        // If no logs in memory, return simulated logs
        if (logStore.length === 0) {
            return NextResponse.json({ logs: generateSimulatedLogs() });
        }

        // Return formatted logs for console
        const formattedLogs = logStore.map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const levelIcon = entry.level === 'ERROR' ? '❌' : entry.level === 'WARNING' ? '⚠️' : 'ℹ️';
            return `[${time}] ${levelIcon} ${entry.message}`;
        });

        return NextResponse.json({ logs: formattedLogs });
    } catch (error) {
        console.error('Error reading radar logs:', error);
        return NextResponse.json({ logs: generateSimulatedLogs() });
    }
}

// Simulated logs for demo/fallback
function generateSimulatedLogs(): string[] {
    const now = new Date();
    const logs: string[] = [];

    const events = [
        '🐋 WHALE DETECTED | WINNER | $25,000 YES @ 0.68 | "Will Trump win 2024?"',
        '🐋 WHALE DETECTED | SMART_MONEY | $12,500 NO @ 0.45 | "Bitcoin above 100k in 2025?"',
        '🐋 WHALE DETECTED | INSIDER | $50,000 YES @ 0.72 | "AI achieves AGI by 2030?"',
        '🐋 WHALE DETECTED | LOOSER | $3,200 NO @ 0.38 | "Stock market crash in 2025?"',
        '✅ Transaction saved | 0x742d35Cc66...',
        '🔍 Whale profile updated | Win Rate: 75% | PnL: $85,000',
        '🐋 WHALE DETECTED | DUMB_MONEY | $5,000 YES @ 0.52 | "Aliens confirmed by NASA?"',
        '📊 Active whales this hour: 12 | Total volume: $350,000',
    ];

    for (let i = 0; i < 15; i++) {
        const time = new Date(now.getTime() - (15 - i) * 8000);
        const timeStr = time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const event = events[i % events.length];
        logs.push(`[${timeStr}] ℹ️ ${event}`);
    }

    return logs;
}
