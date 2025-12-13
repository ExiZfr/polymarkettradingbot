#!/bin/bash
# ============================================================================
# Radar Module Deployment Script - VPS/Production
# ============================================================================
# Deploys enhanced Radar module with improved whale tagging algorithm
# Usage: bash deploy_radar_patch.sh
# ============================================================================

set -e  # Exit on error

echo "=========================================="
echo "🐋 RADAR MODULE PATCH DEPLOYMENT"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/root/bot"
cd $PROJECT_DIR

echo -e "${BLUE}📂 Working directory: $PROJECT_DIR${NC}"
echo ""

# Step 1: Pull latest code from Git
echo -e "${BLUE}[1/7]${NC} 📥 Pulling latest code from GitHub..."
git pull origin main || {
    echo -e "${YELLOW}⚠️  Git pull failed or no changes. Continuing...${NC}"
}
echo ""

# Step 2: Install Python dependencies
echo -e "${BLUE}[2/7]${NC} 🐍 Installing Python dependencies..."
pip3 install -r scripts/whale_tracker_requirements.txt --quiet || {
    echo -e "${YELLOW}⚠️  Some dependencies may already be installed${NC}"
}
echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

# Step 3: Install Node dependencies (if package.json changed)
echo -e "${BLUE}[3/7]${NC} 📦 Checking Node dependencies..."
npm install --production --quiet
echo -e "${GREEN}✅ Node dependencies checked${NC}"
echo ""

# Step 4: Prisma migration
echo -e "${BLUE}[4/7]${NC} 🗄️  Running Prisma migration..."
npx prisma generate
npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migration may have already been applied${NC}"
}
echo -e "${GREEN}✅ Database schema updated${NC}"
echo ""

# Step 5: Build Next.js (if needed)
echo -e "${BLUE}[5/7]${NC} 🔨 Building Next.js application..."
npm run build
echo -e "${GREEN}✅ Application built${NC}"
echo ""

# Step 6: Restart PM2 processes
echo -e "${BLUE}[6/7]${NC} 🔄 Restarting PM2 processes..."

# Stop old radar process if exists
pm2 stop polyradar-whale-tracker 2>/dev/null || echo "Old process not found"
pm2 delete polyradar-whale-tracker 2>/dev/null || echo "Old process not found"

# Restart all processes with new config
pm2 restart ecosystem.config.js --update-env
pm2 save

echo -e "${GREEN}✅ PM2 processes restarted${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${BLUE}[7/7]${NC} 🔍 Verifying deployment..."
echo ""

# Check PM2 status
echo "PM2 Status:"
pm2 list

echo ""
echo "Whale Tracker Logs (last 20 lines):"
pm2 logs whale-tracker --lines 20 --nostream || {
    echo -e "${YELLOW}⚠️  Whale tracker not started yet or no logs${NC}"
}

echo ""
echo "=========================================="
echo -e "${GREEN}✅ RADAR MODULE DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "📊 Next steps:"
echo "  1. Monitor logs: pm2 logs whale-tracker"
echo "  2. Check dashboard: http://your-server:3000/dashboard/radar"
echo "  3. Verify transactions in DB: npx prisma studio"
echo ""
echo "🔧 Troubleshooting:"
echo "  - If whale-tracker fails: Check POLYGON_RPC_WSS in .env"
echo "  - If DB errors: Run 'npx prisma migrate reset' (⚠️ will delete data)"
echo "  - View full logs: pm2 logs whale-tracker --lines 100"
echo ""
