#!/bin/bash
set -e

echo "🚀 Deploying Production Whale Tracker..."

# Navigate to project directory
cd /root/PolygraalX

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Update Prisma schema in database
echo "🗄️ Updating database schema..."
npx prisma db push --accept-data-loss

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Uncomment clusterName in API route
echo "🔧 Enabling cluster tracking..."
sed -i 's|// clusterName: tx.cluster_name \|\| null // TODO: Uncomment after running migration|clusterName: tx.cluster_name \|\| null|g' src/app/api/tracker/transactions/route.ts

# Rebuild Next.js
echo "🏗️ Building Next.js application..."
npm run build

# Stop old whale tracker
echo "🛑 Stopping old whale-tracker..."
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true

# Start new whale tracker v4
echo "🐋 Starting whale-tracker-v4..."
pm2 start python3 --name "whale-tracker-v4" -- scripts/whale_tracker_v4.py
pm2 save

# Restart web server
echo "🔄 Restarting web server..."
pm2 restart polygraal-web

echo "✅ Deployment complete!"
echo ""
echo "📊 Services status:"
pm2 status

echo ""
echo "🔍 View tracker logs:"
echo "  pm2 logs whale-tracker-v4"
echo ""
echo "🌐 Dashboard:"
echo "  http://82.165.175.160:3000/dashboard/tracker"
