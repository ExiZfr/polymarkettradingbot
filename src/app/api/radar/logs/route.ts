/**
 * API Route: GET /api/radar/logs
 * Returns recent logs from PolyRadar bot
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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

        // If no log file found, return simulated status
        if (logs.length === 0) {
            logs = [
                `[${new Date().toLocaleTimeString()}] 🐋 PolyRadar - Whale Detection System`,
                `[${new Date().toLocaleTimeString()}] ⏳ Waiting for bot to start...`,
                `[${new Date().toLocaleTimeString()}] 💡 Run: pm2 start polyradar-whale-tracker`,
            ];
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Error reading radar logs:', error);
        return NextResponse.json({ logs: ['Error reading logs'] });
    }
}
