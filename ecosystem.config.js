module.exports = {
    apps: [
        {
            name: "polygraal-web",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3001  // Fixed: was 3000, should be 3001 for production
            }
        },
        {
            name: "polygraal-sniper",
            script: "scripts/polymarket_sniper.py",
            interpreter: "python3",
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            env: {
                PYTHONUNBUFFERED: "1"
            }
        },
        {
            name: "whale-tracker-v4",
            script: "scripts/whale_tracker_v4.py",
            interpreter: "python3",
            cwd: process.cwd(),
            max_restarts: 10,
            min_uptime: "30s",
            restart_delay: 10000,
            autorestart: true,
            watch: false,
            max_memory_restart: "300M",
            env: {
                PYTHONUNBUFFERED: "1",
                API_BASE_URL: "http://127.0.0.1:3001",  // Fixed: Use 3001 (production port)
                WHALE_THRESHOLD: "10",  // Testing: lowered to $10
                POLL_INTERVAL: "10"
            },
            error_file: "logs/whale-tracker-v4-error.log",
            out_file: "logs/whale-tracker-v4-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        }
    ]
};
