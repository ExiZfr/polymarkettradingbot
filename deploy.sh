#!/bin/bash

# Polymarket Bot - VPS Deployment Script

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

# 3. Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt

# 4. Build Next.js App
echo "🏗️ Building Web App..."
npm run build

# 5. Start/Reload PM2 services
echo "🔄 Reloading Services..."
if command -v pm2 &> /dev/null
then
    pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Deployment Complete! Services are running."
    pm2 status
    
    # 6. Run post-deployment patch (Prisma migration + Cloudflare tunnel)
    echo ""
    echo "🔧 Running post-deployment patches..."
    if [ -f "post-deploy.sh" ]; then
        chmod +x post-deploy.sh
        ./post-deploy.sh
    else
        echo "⚠️  post-deploy.sh not found, skipping patches"
    fi
else
    echo "❌ PM2 is not installed. Please install it globally: npm install -g pm2"
fi

