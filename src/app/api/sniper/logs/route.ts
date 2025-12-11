import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'scripts', 'sniper.log');

export async function GET() {
    try {
        // Debug info
        const cwd = process.cwd();
        const exists = fs.existsSync(LOG_FILE_PATH);

        if (!exists) {
            return NextResponse.json({
                logs: [
                    `[DEBUG] CWD: ${cwd}`,
                    `[DEBUG] Looking for: ${LOG_FILE_PATH}`,
                    `[DEBUG] File exists: ${exists}`,
                    "",
                    "⏳ En attente des logs du bot...",
                    "Le script Python doit être lancé pour générer des logs."
                ]
            });
        }

        // Read full file with UTF-8 encoding
        const content = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');

        // Get last 50 lines
        const recentLines = lines.slice(-50);

        // If no lines, show waiting message
        if (recentLines.length === 0) {
            return NextResponse.json({
                logs: ["📡 Fichier log vide. Le bot démarre..."]
            });
        }

        return NextResponse.json({ logs: recentLines });
    } catch (error) {
        console.error('Error reading logs:', error);
        return NextResponse.json({
            logs: [`❌ Erreur lecture logs: ${error}`]
        }, { status: 500 });
    }
}
