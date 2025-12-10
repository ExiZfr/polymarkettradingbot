#!/bin/bash
# Auto-deployment script for PolygraalX
# Fixes production build issues and deploys

set -e  # Exit on error

echo "🚀 Starting PolygraalX deployment..."

# Navigate to project directory
cd /root/PolygraalX

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies (including node-telegram-bot-api)
echo "📦 Installing dependencies..."
npm install

# Run Prisma migration
echo "🗄️ Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Build Next.js
echo "🏗️ Building Next.js app..."
npm run build

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart 57

# Save PM2 config
echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Deployment complete!"
echo "📊 Checking application status..."
pm2 list
pm2 logs 57 --lines 20 --nostream

echo ""
echo "🎉 PolygraalX successfully deployed!"
