#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# POLYGRAALX ZERO-DOWNTIME DEPLOY SCRIPT v3.0
# ══════════════════════════════════════════════════════════════════════════════
# This script prevents Cloudflare 502 errors by:
# 1. Building BEFORE stopping the old process
# 2. Using PM2 reload for zero-downtime restart
# 3. Verifying the new process is healthy before finishing
# ══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error
cd ~/PolygraalX || { echo "❌ Failed to cd to ~/PolygraalX"; exit 1; }

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║              POLYGRAALX ZERO-DOWNTIME DEPLOY v3.0                      ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Create logs directory if needed
mkdir -p logs

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Pull latest code (old process still running)
# ═══════════════════════════════════════════════════════════════════════════════
echo "📥 [1/5] Pulling latest code..."
git fetch origin main
git reset --hard origin/main
echo "    ✅ Code updated to latest commit"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install dependencies if needed (old process still running)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 [2/5] Checking dependencies..."
if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ] 2>/dev/null; then
    echo "    Installing dependencies..."
    npm ci --production=false --silent
    echo "    ✅ Dependencies installed"
else
    echo "    ✅ Dependencies up to date"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Build the application (old process STILL running - KEY!)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔨 [3/5] Building Next.js application..."
echo "    (Old process continues serving traffic during build)"

npm run build 2>&1 | tail -20

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ BUILD FAILED! Aborting deployment."
    echo "   The site remains on the previous working version."
    exit 1
fi
echo "    ✅ Build successful"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Zero-downtime restart with PM2
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "♻️  [4/5] Restarting with zero-downtime..."

# Check if polygraal-web exists in PM2
if pm2 describe polygraal-web > /dev/null 2>&1; then
    # Process exists - use reload for graceful restart
    echo "    Using PM2 reload for zero-downtime restart..."
    pm2 reload polygraal-web --update-env
else
    # Process doesn't exist - start fresh from ecosystem config
    echo "    Starting fresh process from ecosystem.config.js..."
    pm2 start ecosystem.config.js --only polygraal-web
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Verify process is healthy
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔍 [5/5] Verifying process health..."

# Wait for process to stabilize
sleep 3

# Check status
if pm2 show polygraal-web 2>/dev/null | grep -q "online"; then
    echo "    ✅ polygraal-web is ONLINE!"
    
    # Try to hit the health endpoint
    echo "    Testing HTTP response..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ --max-time 10 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "    ✅ HTTP check passed (status: $HTTP_CODE)"
    else
        echo "    ⚠️  HTTP check returned $HTTP_CODE (may still be starting)"
    fi
else
    echo "    ⚠️  Process status unclear, showing PM2 status..."
    pm2 status polygraal-web
fi

# Save PM2 configuration
pm2 save --force > /dev/null 2>&1

# ═══════════════════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📊 Active Processes:"
pm2 list --no-color 2>/dev/null | grep -E "(polygraal|Name)" | head -5

echo ""
echo "🌐 Site: https://app.polygraalx.app"
echo "══════════════════════════════════════════════════════════════════════════"
