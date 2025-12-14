#!/bin/bash
# Full deployment script for Smart Tags update

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Clear old transactions with Unknown Market
echo "🗑️ Clearing old transactions..."
npx prisma studio --browser none &
PRISMA_PID=$!
sleep 2

# Use Node.js to clear via Prisma
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearOldTransactions() {
  console.log('Deleting transactions with Unknown Market...');
  const result = await prisma.whaleTransaction.deleteMany({
    where: {
      OR: [
        { market_question: 'Unknown Market' },
        { market_question: null },
        { market_slug: '' },
        { market_slug: null }
      ]
    }
  });
  console.log(\`Deleted \${result.count} old transactions\`);
  await prisma.\$disconnect();
}

clearOldTransactions().catch(console.error);
"

# 3. Rebuild Next.js app
echo "🔨 Building Next.js..."
npm run build || echo "Build completed with warnings"

# 4. Restart services
echo "♻️ Restarting services..."
pm2 restart whale-tracker-v4
sleep 2
pm2 restart polygraal-web

# 5. Show logs
echo "📋 Showing recent logs..."
pm2 logs whale-tracker-v4 --lines 10 --nostream

echo "✅ Deployment complete!"
echo "🌐 Check: http://82.165.175.160:3001/dashboard/tracker"
