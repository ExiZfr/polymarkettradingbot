import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const logsPath = path.join(process.cwd(), 'data', 'listener-logs.json');

        if (fs.existsSync(logsPath)) {
            const content = fs.readFileSync(logsPath, 'utf8');
            const logs = JSON.parse(content);
            return NextResponse.json(logs);
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error('Failed to read listener logs:', error);
        return NextResponse.json([], { status: 500 });
    }
}
