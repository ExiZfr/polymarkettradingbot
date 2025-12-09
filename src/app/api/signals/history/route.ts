import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const signalsPath = path.join(process.cwd(), 'data', 'signals-history.json');

        if (fs.existsSync(signalsPath)) {
            const content = fs.readFileSync(signalsPath, 'utf8');
            const data = JSON.parse(content);
            return NextResponse.json(data.signals || []);
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error('Failed to read signals history:', error);
        return NextResponse.json([], { status: 500 });
    }
}
