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
            name: "crypto-oracle",
            script: "scripts/crypto_oracle.py",
            interpreter: "./venv/bin/python",  // Use venv Python
            cwd: process.cwd(),
            max_restarts: 5,
            min_uptime: "30s",
            restart_delay: 30000,
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            env: {
                PYTHONUNBUFFERED: "1",
                POLY_PRIVATE_KEY: ""  // Set via: pm2 set crypto-oracle:POLY_PRIVATE_KEY <key>
            },
            error_file: "logs/crypto-oracle-error.log",
            out_file: "logs/crypto-oracle-out.log",
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
