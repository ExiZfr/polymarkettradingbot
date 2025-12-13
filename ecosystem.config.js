module.exports = {
    apps: [
        {
            name: "polygraal-web",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3000
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
            name: "whale-tracker",
            script: "scripts/whale_tracker.py",
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
                POLYGON_RPC_WSS: process.env.POLYGON_RPC_WSS || "",
                API_BASE_URL: "http://localhost:3000",
                WHALE_TRACKER_MODE: process.env.WHALE_TRACKER_MODE || "simulation",
                MIN_WHALE_AMOUNT: process.env.MIN_WHALE_AMOUNT || "1000"
            },
            error_file: "logs/whale-tracker-error.log",
            out_file: "logs/whale-tracker-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        }
    ]
};
