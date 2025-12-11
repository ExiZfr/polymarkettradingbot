/**
 * API Route: GET /api/radar/logs
 * Returns recent logs from PolyRadar bot
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Simulated logs for demo mode
function generateSimulatedLogs(): string[] {
    const now = new Date();
    const logs: string[] = [];

    const events = [
        '🐋 WHALE SIGNAL #{{n}} | Wallet: 0x742d35Cc66... | ${{amount}} on YES @ 0.{{price}}',
        '🔍 Analyzing wallet... Category: SMART_MONEY | Win Rate: {{wr}}%',
        '🧠 Decision Score: {{score}}/100 | Threshold: 75',
        '✅ TRADE EXECUTED | Position: ${{pos}} | Confidence: {{score}}/100',
        '📊 SESSION STATS | Signals: {{n}} | Trades: {{trades}} | Copy Rate: {{rate}}%',
        '⏭️  TRADE SKIPPED: Score below threshold ({{score}}/100)',
        '🔗 Connected to Polygon mainnet...',
        '👂 Listening for whale transactions...',
        '🐋 WHALE SIGNAL #{{n}} | Wallet: 0xdead1234... | ${{amount}} on NO @ 0.{{price}}',
        '🔍 Analyzing wallet... Category: INSIDER | Win Rate: {{wr}}%',
    ];

    for (let i = 0; i < 20; i++) {
        const time = new Date(now.getTime() - (20 - i) * 5000);
        const timeStr = time.toLocaleTimeString('en-US', { hour12: false });
        let event = events[i % events.length]
            .replace('{{n}}', String(Math.floor(Math.random() * 50) + 1))
            .replace('{{amount}}', String(Math.floor(Math.random() * 50000) + 5000).toLocaleString())
            .replace('{{price}}', String(Math.floor(Math.random() * 80) + 10))
            .replace('{{wr}}', String(Math.floor(Math.random() * 30) + 55))
            .replace(/\{\{score\}\}/g, String(Math.floor(Math.random() * 40) + 50))
            .replace('{{pos}}', String(Math.floor(Math.random() * 500) + 100))
            .replace('{{trades}}', String(Math.floor(Math.random() * 10) + 1))
            .replace('{{rate}}', String(Math.floor(Math.random() * 40) + 40));

        logs.push(`[${timeStr}] ${event}`);
    }

    return logs;
}

export async function GET() {
    try {
        // Try to read from PM2 log file
        const logPaths = [
            path.join(process.cwd(), 'logs', 'polyradar-out.log'),
            path.join(process.cwd(), 'scripts', 'polyradar.log'),
            '/root/.pm2/logs/polyradar-whale-tracker-out.log',
            '/home/ubuntu/.pm2/logs/polyradar-whale-tracker-out.log',
        ];

        let logs: string[] = [];

        for (const logPath of logPaths) {
            if (fs.existsSync(logPath)) {
                const content = fs.readFileSync(logPath, 'utf-8');
                const lines = content.split('\n').filter(l => l.trim());
                // Get last 100 lines
                logs = lines.slice(-100);
                break;
            }
        }

        // If no log file found, use simulation mode
        if (logs.length === 0) {
            logs = generateSimulatedLogs();
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Error reading radar logs:', error);
        return NextResponse.json({ logs: generateSimulatedLogs() });
    }
}
