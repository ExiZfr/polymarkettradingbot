#!/bin/bash
# Deploy marketUrl feature to VPS

echo "🚀 Deploying Market URL Storage Feature..."

cd ~/PolygraalX

# Pull latest code
echo "📥 Pulling code from GitHub..."
git fetch --all
git reset --hard origin/main

# Run Prisma migration
echo "🗄️ Running database migration..."
npx prisma migrate deploy

# Clear old transactions (they don't have market_url)
echo "🗑️ Clearing old transactions..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.whaleTransaction.deleteMany().then(r => console.log('✅ Deleted', r.count, 'transactions')).finally(() => prisma.\$disconnect());"

# Rebuild frontend
echo "🔨 Building frontend..."
npm run build

# Restart services
echo "♻️ Restarting services..."
pm2 restart polygraal-web
pm2 restart whale-tracker-v4

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://app.polygraalx.app/dashboard/tracker"
echo "⏳ Wait 30s for new trades, then click 'View on Polymarket'"
