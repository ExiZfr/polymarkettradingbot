// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

module.exports = {
    apps: [
        {
            name: "polygraal-web",
            script: "npm",
            args: "start",
            // Zero-downtime restart settings
            wait_ready: true,           // Wait for process to send 'ready' signal
            listen_timeout: 10000,      // 10s timeout for ready signal
            kill_timeout: 5000,         // 5s grace period before SIGKILL
            max_restarts: 10,           // Max restart attempts
            min_uptime: "10s",          // Min uptime to consider "started"
            restart_delay: 2000,        // 2s delay between restarts
            autorestart: true,
            watch: false,
            max_memory_restart: "512M", // Restart if memory exceeds 512MB
            error_file: "logs/polygraal-web-error.log",
            out_file: "logs/polygraal-web-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            env: {
                NODE_ENV: "production",
                PORT: 3001
            }
        },
        {
            name: "cloudflared",
            script: "/usr/local/bin/cloudflared",
            args: "tunnel --config /root/.cloudflared/config.yml run afd5f523-4997-49e8-abe0-99bd65adf4d9",
            autorestart: true,
            watch: false,
            max_memory_restart: "200M",
            error_file: "logs/cloudflared-error.log",
            out_file: "logs/cloudflared-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
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
                WHALE_THRESHOLD: "1000",  // Only track trades > $1000
                POLL_INTERVAL: "10"
            },
            error_file: "logs/whale-tracker-v4-error.log",
            out_file: "logs/whale-tracker-v4-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        },
        {
            name: "mean-reversion-bot",
            script: "scripts/mean_reversion_bot.py",
            interpreter: "./venv/bin/python",
            cwd: process.cwd(),
            args: "--bankroll 100 --dry-run",  // Start in simulation mode
            max_restarts: 5,
            min_uptime: "30s",
            restart_delay: 30000,
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            env: {
                PYTHONUNBUFFERED: "1",
                POLY_API_KEY: process.env.POLY_API_KEY || "",
                POLY_SECRET: process.env.POLY_SECRET || ""
            },
            error_file: "logs/mean-reversion-error.log",
            out_file: "logs/mean-reversion-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        },
        {
            name: "oracle-scraper",
            script: "scripts/oracle_scraper.py",
            interpreter: "./venv/bin/python",
            cwd: process.cwd(),
            max_restarts: 5,
            min_uptime: "60s",
            restart_delay: 60000,
            autorestart: true,
            watch: false,
            max_memory_restart: "400M",
            env: {
                PYTHONUNBUFFERED: "1",
                DATABASE_URL: process.env.DATABASE_URL || ""
            },
            error_file: "logs/oracle-scraper-error.log",
            out_file: "logs/oracle-scraper-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        }
    ]
};
