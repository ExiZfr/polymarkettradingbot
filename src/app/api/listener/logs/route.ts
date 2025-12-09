import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const logsPath = path.join(process.cwd(), 'data', 'listener-logs.json');

        console.log('[API/listener/logs] Checking path:', logsPath);
        console.log('[API/listener/logs] File exists:', fs.existsSync(logsPath));

        if (fs.existsSync(logsPath)) {
            const content = fs.readFileSync(logsPath, 'utf8');
            const logs = JSON.parse(content);
            console.log('[API/listener/logs] Found', logs.length, 'logs');
            return NextResponse.json(logs);
        }

        console.log('[API/listener/logs] No logs file found');
        return NextResponse.json([]);
    } catch (error) {
        console.error('[API/listener/logs] Error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
