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
            name: "polyradar-whale-tracker",
            script: "scripts/polyradar_main.py",
            interpreter: "python3",
            args: "--mode simulation --bankroll 10000",
            autorestart: true,
            watch: false,
            max_memory_restart: "300M",
            env: {
                PYTHONUNBUFFERED: "1"
            },
            error_file: "logs/polyradar-error.log",
            out_file: "logs/polyradar-out.log"
        }
    ]
};
