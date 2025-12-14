#!/bin/bash
################################################################################
# FORCE PRODUCTION REBUILD SCRIPT
# Deletes build artifacts, rebuilds, and restarts PM2 with fresh config
################################################################################

set -e  # Exit on error

echo "========================================================================"
echo "🔨 FORCE PRODUCTION REBUILD"
echo "========================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirmation
echo -e "${YELLOW}⚠️  WARNING: This will:${NC}"
echo "   1. Stop all PM2 processes"
echo "   2. Delete .next build directory"
echo "   3. Rebuild Next.js app (production mode)"
echo "   4. Restart PM2 with fresh config"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# 1. Stop PM2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 [1/6] Stopping PM2 processes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 stop all
echo -e "${GREEN}✅ PM2 stopped${NC}"
echo ""

# 2. Delete build artifacts
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  [2/6] Deleting build artifacts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Build artifacts deleted${NC}"
echo ""

# 3. Clean install (optional, commented out for speed)
# echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# echo "📦 [3/6] Clean npm install..."
# echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# npm ci
# echo -e "${GREEN}✅ Dependencies reinstalled${NC}"
# echo ""

# 4. Rebuild production
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 [3/6] Building Next.js (PRODUCTION MODE)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NODE_ENV=production npm run build
echo -e "${GREEN}✅ Production build complete${NC}"
echo ""

# 5. Verify no Turbopack in build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 [4/6] Verifying build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if grep -r "turbopack" .next/ 2>/dev/null | head -5; then
    echo -e "${RED}❌ WARNING: Turbopack still in build!${NC}"
    echo "This might be a Next.js 16 issue. Checking package.json..."
    grep '"start"' package.json
else
    echo -e "${GREEN}✅ No Turbopack in build${NC}"
fi
echo ""

# 6. Delete and restart PM2 processes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "♻️  [5/6] Restarting PM2 with fresh config..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Delete existing processes
pm2 delete all 2>/dev/null || true

# Start fresh from ecosystem config
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

echo -e "${GREEN}✅ PM2 restarted${NC}"
echo ""

# 7. Show status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 [6/6] Current Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
echo ""

# Final message
echo "========================================================================"
echo "🎉 REBUILD COMPLETE!"
echo "========================================================================"
echo ""
echo "✅ Next.js app rebuilt in PRODUCTION mode"
echo "✅ PM2 restarted with ecosystem.config.js"
echo ""
echo "🌐 Check your site now: https://app.polygraalx.app"
echo "📊 Monitor logs: pm2 logs polygraal-web --lines 50"
echo ""
echo "💡 If Turbopack still appears:"
echo "   1. Check package.json 'start' script has NO --turbo flag"
echo "   2. Ensure NODE_ENV=production in ecosystem.config.js"
echo "   3. Try: pm2 restart polygraal-web --update-env"
echo ""
