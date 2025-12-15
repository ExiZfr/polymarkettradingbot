import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        const { action } = await request.json();

        if (!['start', 'stop', 'status', 'restart'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'start':
                result = await execAsync('pm2 start whale-tracker-v4');
                return NextResponse.json({ success: true, message: 'Tracker started', output: result.stdout });

            case 'stop':
                result = await execAsync('pm2 stop whale-tracker-v4');
                return NextResponse.json({ success: true, message: 'Tracker stopped', output: result.stdout });

            case 'restart':
                result = await execAsync('pm2 restart whale-tracker-v4');
                return NextResponse.json({ success: true, message: 'Tracker restarted', output: result.stdout });

            case 'status':
                try {
                    result = await execAsync('pm2 jlist');
                    const processes = JSON.parse(result.stdout);
                    const tracker = processes.find((p: any) => p.name === 'whale-tracker-v4');

                    if (tracker) {
                        return NextResponse.json({
                            running: tracker.pm2_env.status === 'online',
                            status: tracker.pm2_env.status,
                            uptime: tracker.pm2_env.pm_uptime,
                            restarts: tracker.pm2_env.restart_time,
                            memory: tracker.monit?.memory || 0
                        });
                    }

                    return NextResponse.json({ running: false, status: 'not_found' });
                } catch {
                    return NextResponse.json({ running: false, status: 'error' });
                }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Tracker control error:', error);
        return NextResponse.json({ error: 'Control failed', details: String(error) }, { status: 500 });
    }
}

export async function GET() {
    // Get current tracker status
    try {
        const result = await execAsync('pm2 jlist');
        const processes = JSON.parse(result.stdout);
        const tracker = processes.find((p: any) => p.name === 'whale-tracker-v4');

        if (tracker) {
            return NextResponse.json({
                running: tracker.pm2_env.status === 'online',
                status: tracker.pm2_env.status,
                uptime: tracker.pm2_env.pm_uptime,
                restarts: tracker.pm2_env.restart_time,
                memory: tracker.monit?.memory || 0
            });
        }

        return NextResponse.json({ running: false, status: 'not_found' });
    } catch {
        return NextResponse.json({ running: false, status: 'error' });
    }
}
