import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Server-side Notifications API
 * 
 * Stores notifications in a JSON file that persists across page navigations.
 * The frontend polls this endpoint to show notifications on any page.
 * 
 * GET - Fetch unread notifications
 * POST - Add a new notification
 * DELETE - Mark notifications as read
 */

const NOTIFS_FILE = path.join(process.cwd(), 'data', 'notifications.json');

interface Notification {
    id: string;
    type: 'ORACLE_TRADE' | 'TP_HIT' | 'SL_HIT' | 'INFO' | 'WARNING';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    data?: Record<string, unknown>;
}

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readNotifications(): Notification[] {
    try {
        ensureDataDir();
        if (fs.existsSync(NOTIFS_FILE)) {
            return JSON.parse(fs.readFileSync(NOTIFS_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('[Notifications] Error reading:', e);
    }
    return [];
}

function writeNotifications(notifs: Notification[]) {
    ensureDataDir();
    // Keep only last 100 notifications
    const recent = notifs.slice(-100);
    fs.writeFileSync(NOTIFS_FILE, JSON.stringify(recent, null, 2));
}

// GET - Fetch notifications
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        let notifs = readNotifications();

        if (unreadOnly) {
            notifs = notifs.filter(n => !n.read);
        }

        // Sort by timestamp (newest first) and limit
        notifs = notifs
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);

        return NextResponse.json({
            notifications: notifs,
            unreadCount: readNotifications().filter(n => !n.read).length
        });

    } catch (error) {
        console.error('[Notifications] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST - Add notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, title, message, data } = body;

        if (!type || !title || !message) {
            return NextResponse.json(
                { error: 'type, title, and message required' },
                { status: 400 }
            );
        }

        const notif: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            data
        };

        const notifs = readNotifications();
        notifs.push(notif);
        writeNotifications(notifs);

        console.log(`[Notifications] Added: ${title}`);

        return NextResponse.json({
            success: true,
            notification: notif
        });

    } catch (error) {
        console.error('[Notifications] POST Error:', error);
        return NextResponse.json({ error: 'Failed to add notification' }, { status: 500 });
    }
}

// DELETE - Mark as read
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const all = searchParams.get('all') === 'true';

        const notifs = readNotifications();

        if (all) {
            notifs.forEach(n => n.read = true);
        } else if (id) {
            const notif = notifs.find(n => n.id === id);
            if (notif) notif.read = true;
        }

        writeNotifications(notifs);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Notifications] DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
