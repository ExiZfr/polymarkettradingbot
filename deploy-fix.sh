#!/bin/bash
# Auto-deploy script for VPS

echo "🚀 Starting auto-deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git fetch --all
git reset --hard origin/main
git clean -fd

# Clean database
echo "🗑️ Cleaning database..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.whaleTransaction.deleteMany().then(r => console.log('✅ Deleted', r.count, 'transactions')).finally(() => prisma.\$disconnect());"

# Rebuild frontend
echo "🔨 Building frontend..."
rm -rf .next node_modules/.cache
npm run build

# Restart all services
echo "♻️ Restarting services..."
pm2 delete all
pm2 start ecosystem.config.js

# Wait and show logs
echo "⏳ Waiting 10 seconds..."
sleep 10

echo "📋 Service status:"
pm2 list

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check: http://82.165.175.160:3001/dashboard/tracker"
