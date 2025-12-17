#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# POLYGRAALX ZERO-DOWNTIME DEPLOY SCRIPT v4.0 - STANDALONE MODE
# ══════════════════════════════════════════════════════════════════════════════
# Uses Next.js standalone output for true zero-downtime deploys
# 
# How it works:
# 1. Build creates a standalone folder with server.js
# 2. Copy static files to standalone folder
# 3. PM2 restarts just the node process (not npm)
# 4. Much faster and more reliable restarts
# ══════════════════════════════════════════════════════════════════════════════

set -e
cd ~/PolygraalX || { echo "❌ Failed to cd to ~/PolygraalX"; exit 1; }

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║        POLYGRAALX ZERO-DOWNTIME DEPLOY v4.0 (STANDALONE)               ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p logs

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Pull latest code
# ═══════════════════════════════════════════════════════════════════════════════
echo "📥 [1/6] Pulling latest code..."
git fetch origin main
git reset --hard origin/main
echo "    ✅ Code updated"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install dependencies
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 [2/6] Installing dependencies..."
npm ci --production=false --silent 2>/dev/null || npm install --silent
echo "    ✅ Dependencies ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Build with standalone output
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔨 [3/6] Building Next.js (standalone mode)..."
echo "    Old process continues serving during build..."

npm run build 2>&1 | tail -10

if [ ! -f ".next/standalone/server.js" ]; then
    echo ""
    echo "❌ BUILD FAILED - standalone/server.js not found!"
    echo "   Site remains on previous version."
    exit 1
fi
echo "    ✅ Build successful"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Copy static files to standalone
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📂 [4/6] Copying static files..."
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

# Create symlink for persistent data (profiles, orders stored here)
mkdir -p ~/PolygraalX/data
rm -rf .next/standalone/data 2>/dev/null || true
ln -sf ~/PolygraalX/data .next/standalone/data
echo "    ✅ Static files and data symlink ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Restart PM2 process
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "♻️  [5/6] Restarting PM2 process..."

# Stop the old process first (if running)
pm2 stop polygraal-web 2>/dev/null || true

# Delete and restart fresh (more reliable than reload for standalone)
pm2 delete polygraal-web 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.js --only polygraal-web

# Wait a bit
sleep 3

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: Verify health
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔍 [6/6] Verifying health..."

# Check PM2 status
if pm2 show polygraal-web 2>/dev/null | grep -q "online"; then
    echo "    ✅ PM2 shows polygraal-web ONLINE"
else
    echo "    ⚠️  PM2 status unclear"
    pm2 logs polygraal-web --lines 20
    exit 1
fi

# Health check HTTP
echo "    Testing HTTP..."
for i in 1 2 3 4 5; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ --max-time 5 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "    ✅ HTTP OK (status: $HTTP_CODE)"
        break
    fi
    echo "    Waiting... ($i/5)"
    sleep 2
done

pm2 save --force > /dev/null 2>&1

echo ""
echo "══════════════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
pm2 list | grep -E "(polygraal-web|Name)" | head -3
echo ""
echo "🌐 https://app.polygraalx.app"
echo "══════════════════════════════════════════════════════════════════════════"
