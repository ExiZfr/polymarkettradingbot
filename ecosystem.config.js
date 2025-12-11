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
        }
    ]
};
