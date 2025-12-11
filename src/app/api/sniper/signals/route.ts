import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SIGNALS_FILE = path.join(process.cwd(), 'scripts', 'sniper_signals.json');

// GET: Read signals for frontend
export async function GET() {
    try {
        if (!fs.existsSync(SIGNALS_FILE)) {
            return NextResponse.json({ signals: [] });
        }
        const data = fs.readFileSync(SIGNALS_FILE, 'utf-8');
        const signals = JSON.parse(data);
        return NextResponse.json({ signals: signals.slice(-50) }); // Last 50
    } catch (error) {
        return NextResponse.json({ signals: [] });
    }
}

// POST: Receive signal from Python bot
export async function POST(request: Request) {
    try {
        const body = await request.json();

        let signals = [];
        if (fs.existsSync(SIGNALS_FILE)) {
            const data = fs.readFileSync(SIGNALS_FILE, 'utf-8');
            signals = JSON.parse(data);
        }

        // Add new signal
        signals.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            level: body.level || 'SNIPE',
            message: body.message,
            market: body.market,
            price: body.price,
            outcome: body.outcome
        });

        // Keep only last 100 signals
        if (signals.length > 100) {
            signals = signals.slice(-100);
        }

        fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save signal' }, { status: 500 });
    }
}
