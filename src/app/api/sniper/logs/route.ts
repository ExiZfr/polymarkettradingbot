import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'scripts', 'sniper.log');

export async function GET() {
    try {
        if (!fs.existsSync(LOG_FILE_PATH)) {
            return NextResponse.json({ logs: ["Waiting for logs..."] });
        }

        const stats = fs.statSync(LOG_FILE_PATH);
        const fileSize = stats.size;

        // Read the last 10KB to get recent logs
        const bufferSize = Math.min(10240, fileSize);
        const buffer = Buffer.alloc(bufferSize);

        const fd = fs.openSync(LOG_FILE_PATH, 'r');
        fs.readSync(fd, buffer, 0, bufferSize, fileSize - bufferSize);
        fs.closeSync(fd);

        const content = buffer.toString('utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');

        return NextResponse.json({ logs: lines.slice(-50) }); // Return last 50 lines
    } catch (error) {
        console.error('Error reading logs:', error);
        return NextResponse.json({ logs: ["Error reading logs"] }, { status: 500 });
    }
}
