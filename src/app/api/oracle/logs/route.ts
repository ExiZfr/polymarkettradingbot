import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOG_FILES = [
    'logs/oracle-scraper-out.log',
    'logs/oracle-scraper-error.log',
    'logs/crypto-oracle-out.log',
    'logs/crypto-oracle-error.log'
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lines = parseInt(searchParams.get('lines') || '50');

    try {
        const logs: { file: string; content: string[]; error?: boolean }[] = [];

        for (const logFile of LOG_FILES) {
            try {
                const filePath = path.join(process.cwd(), logFile);
                const content = await fs.readFile(filePath, 'utf-8');
                const allLines = content.split('\n').filter(l => l.trim());
                const lastLines = allLines.slice(-lines);

                logs.push({
                    file: path.basename(logFile),
                    content: lastLines,
                    error: logFile.includes('error')
                });
            } catch (e) {
                // File doesn't exist yet
                logs.push({
                    file: path.basename(logFile),
                    content: ['[No logs yet]'],
                    error: logFile.includes('error')
                });
            }
        }

        // Combine and sort by timestamp if possible
        const combinedLogs = logs.flatMap(l =>
            l.content.map(line => ({
                line,
                source: l.file.replace('.log', ''),
                isError: l.error
            }))
        ).slice(-lines);

        return NextResponse.json({
            logs: combinedLogs,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Oracle logs error:', error);
        return NextResponse.json({
            logs: [{ line: 'Failed to read logs', source: 'system', isError: true }],
            error: 'Failed to fetch logs'
        }, { status: 500 });
    }
}
