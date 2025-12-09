import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const settings = await request.json();
        const configPath = path.join(process.cwd(), 'listener-config.json');

        // Write settings to file for the listener script to read
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const configPath = path.join(process.cwd(), 'listener-config.json');
        if (fs.existsSync(configPath)) {
            const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return NextResponse.json(settings);
        }
        return NextResponse.json({});
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
