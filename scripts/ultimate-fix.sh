#!/bin/bash
# ULTIMATE FIX SCRIPT - Patches everything for production deployment
# Run this on the server to fix all issues

set -e  # Exit on any error

echo "🔧 ============================================"
echo "🔧 POLYGRAALX ULTIMATE FIX & DEPLOY SCRIPT"
echo "🔧 ============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project
cd /root/PolygraalX || exit 1

echo -e "${YELLOW}📥 Step 1: Pulling latest changes...${NC}"
git pull origin main

echo -e "${YELLOW}📦 Step 2: Cleaning npm cache and node_modules...${NC}"
rm -rf node_modules package-lock.json
npm cache clean --force

echo -e "${YELLOW}📦 Step 3: Installing ALL dependencies (fresh)...${NC}"
npm install

echo -e "${YELLOW}🔍 Step 4: Verifying node-telegram-bot-api installation...${NC}"
if ! npm list node-telegram-bot-api > /dev/null 2>&1; then
    echo -e "${RED}❌ node-telegram-bot-api not found, installing manually...${NC}"
    npm install node-telegram-bot-api --save
else
    echo -e "${GREEN}✅ node-telegram-bot-api is installed${NC}"
fi

echo -e "${YELLOW}🗄️ Step 5: Syncing Prisma schema with database...${NC}"
npx prisma db push --accept-data-loss
npx prisma generate

echo -e "${YELLOW}🏗️ Step 6: Building Next.js (this may take a while)...${NC}"
export NODE_OPTIONS="--max_old_space_size=4096"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Check errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

echo -e "${YELLOW}🔄 Step 7: Restarting PM2 application...${NC}"
pm2 restart 57 || pm2 start npm --name "polygraalx" -- start

echo -e "${YELLOW}💾 Step 8: Saving PM2 configuration...${NC}"
pm2 save

echo -e "${YELLOW}🧹 Step 9: Cleaning up old builds...${NC}"
rm -rf .next/cache/*

echo ""
echo -e "${GREEN}🎉 ============================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}🎉 ============================================${NC}"
echo ""
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 list

echo ""
echo -e "${YELLOW}📋 Recent Logs (last 20 lines):${NC}"
pm2 logs 57 --lines 20 --nostream

echo ""
echo -e "${GREEN}✅ PolygraalX is now running with all advanced features!${NC}"
echo -e "${GREEN}🌐 Access at: http://82.165.175.160:3001${NC}"
echo ""
echo -e "${YELLOW}To view live logs, run: pm2 logs 57${NC}"
