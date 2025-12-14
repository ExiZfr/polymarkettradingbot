/**
 * Whale Tracker API - Logs Endpoint
 * POST: Receive logs from Python tracker
 * GET: Return logs for console display
 */

import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

// In-memory log store (max 200 logs)
const MAX_LOGS = 200;
const logs: LogEntry[] = [];

export async function POST(request: NextRequest) {
    try {
        const log: LogEntry = await request.json();

        // Add to beginning (newest first)
        logs.unshift({
            message: log.message,
            level: log.level || 'info',
            timestamp: log.timestamp || new Date().toISOString()
        });

        // Trim if over limit
        if (logs.length > MAX_LOGS) {
            logs.pop();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Tracker Logs] Error:', error);
        return NextResponse.json({ error: 'Invalid log data' }, { status: 400 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), MAX_LOGS);
    const level = searchParams.get('level');

    let result = logs;

    // Filter by level
    if (level) {
        result = result.filter(log => log.level === level);
    }

    return NextResponse.json(result.slice(0, limit));
}
