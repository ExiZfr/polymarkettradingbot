#!/bin/bash
# ===========================================
# POLYGRAALX ZERO-DOWNTIME DEPLOY SCRIPT
# ===========================================

echo "🚀 Starting deployment..."

cd ~/PolygraalX || exit 1

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies if needed
if [ -f "package-lock.json" ] && [ package.json -nt node_modules ]; then
    echo "📦 Installing dependencies..."
    npm ci --production=false
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi

# Graceful restart with PM2
echo "♻️ Restarting PM2 process..."

# Delete old process if exists (ignore errors)
pm2 delete polygraal-web 2>/dev/null || true

# Start fresh with ecosystem config
pm2 start ecosystem.config.js --only polygraal-web

# Wait for process to be ready
sleep 3

# Check if running
if pm2 show polygraal-web | grep -q "online"; then
    echo "✅ polygraal-web is running!"
else
    echo "⚠️ Process might not be running, trying npm start directly..."
    pm2 start npm --name "polygraal-web" -- run start
fi

# Save PM2 config
pm2 save

# Show status
pm2 list

echo ""
echo "✅ Deployment complete!"
echo "🌐 Site should be live at https://app.polygraalx.app"
