#!/bin/bash
################################################################################
# PRODUCTION DIAGNOSTIC SCRIPT
# Checks PM2 status, logs, environment, and build artifacts
################################################################################

echo "========================================================================"
echo "🔍 PRODUCTION DIAGNOSTIC SCRIPT"
echo "========================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check PM2 Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 [1/7] PM2 Process Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
echo ""

# 2. Check polygraal-web specifically
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 [2/7] polygraal-web Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 show polygraal-web | grep -A 20 "env:"
echo ""

# 3. Check for Turbopack in .next build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 [3/7] Build Artifacts Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d ".next" ]; then
    echo "✅ .next directory exists"
    echo "   Build type check:"
    if grep -r "turbopack" .next/ 2>/dev/null | head -5; then
        echo -e "${RED}❌ TURBOPACK DETECTED in build artifacts!${NC}"
    else
        echo -e "${GREEN}✅ No turbopack references found${NC}"
    fi
else
    echo -e "${RED}❌ .next directory NOT found!${NC}"
fi
echo ""

# 4. Check package.json scripts
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 [4/7] package.json Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -A 5 '"scripts"' package.json
echo ""

# 5. Check whale-tracker status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐋 [5/7] whale-tracker Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if pm2 describe whale-tracker > /dev/null 2>&1; then
    echo "✅ whale-tracker process exists"
    pm2 show whale-tracker | grep -E "(status|uptime|restarts|env:)"
else
    echo -e "${RED}❌ whale-tracker NOT running!${NC}"
fi
echo ""

# 6. Recent whale-tracker logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 [6/7] Recent whale-tracker Logs (last 20 lines)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs whale-tracker --lines 20 --nostream 2>/dev/null || echo "No logs available"
echo ""

# 7. Test API endpoint
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 [7/7] API Endpoint Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing http://localhost:3000/api/radar/transactions..."
curl -s http://localhost:3000/api/radar/transactions | head -20
echo ""
echo ""

# Summary
echo "========================================================================"
echo "🏁 DIAGNOSTIC COMPLETE"
echo "========================================================================"
echo ""
echo "⚠️  COMMON ISSUES:"
echo "   1. If NODE_ENV != 'production' → PM2 not using ecosystem.config.js"
echo "   2. If Turbopack in .next → Need clean rebuild"
echo "   3. If whale-tracker not running → Need restart"
echo ""
echo "💡 NEXT STEPS:"
echo "   - If Turbopack detected: Run ./scripts/force-production-rebuild.sh"
echo "   - If whale-tracker down: pm2 restart whale-tracker"
echo "   - Check full logs: pm2 logs polygraal-web --lines 100"
echo ""
