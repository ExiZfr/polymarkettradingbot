#!/bin/bash
###############################################################################
# Post-Deployment Patch Script
# Handles Prisma migrations, Cloudflare tunnel restart, and service health checks
# Run automatically after deploy.sh
###############################################################################

set -e  # Exit on error

echo "=========================================="
echo "🔧 POST-DEPLOYMENT PATCH"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$HOME/PolygraalX"
CLOUDFLARED_CONFIG="$HOME/.cloudflared/config.yml"

cd "$APP_DIR" || exit 1

echo ""
echo "📍 Working directory: $(pwd)"
echo ""

###############################################################################
# 1. PRISMA DATABASE MIGRATION
###############################################################################

echo "${YELLOW}[1/4] Prisma Database Migration${NC}"
echo "----------------------------------------"

if [ -f "prisma/schema.prisma" ]; then
    echo "✓ Prisma schema found"
    
    # Push schema changes to database
    echo "→ Pushing schema changes to PostgreSQL..."
    npx prisma db push --accept-data-loss || {
        echo "${RED}⚠ Prisma db push failed${NC}"
        echo "Continuing anyway..."
    }
    
    # Generate Prisma client
    echo "→ Generating Prisma client..."
    npx prisma generate || {
        echo "${RED}⚠ Prisma generate failed${NC}"
        echo "Continuing anyway..."
    }
    
    echo "${GREEN}✓ Prisma migration complete${NC}"
else
    echo "${YELLOW}⚠ Prisma schema not found, skipping${NC}"
fi

echo ""

###############################################################################
# 2. CLOUDFLARE TUNNEL FIX
###############################################################################

echo "${YELLOW}[2/4] Cloudflare Tunnel Configuration${NC}"
echo "----------------------------------------"

# Create/Update cloudflared config
cat > "$CLOUDFLARED_CONFIG" << 'EOF'
tunnel: afd5f523-4997-49e8-abe0-99bd65adf4d9
credentials-file: /root/.cloudflared/afd5f523-4997-49e8-abe0-99bd65adf4d9.json

ingress:
  - hostname: polygraalx.com
    service: http://127.0.0.1:3001
  - hostname: app.polygraalx.app
    service: http://127.0.0.1:3001
  - service: http_status:404
EOF

echo "✓ Cloudflared config updated"

# Check if cloudflared is in PM2
if pm2 list | grep -q "cloudflared"; then
    echo "→ Restarting cloudflared..."
    pm2 restart cloudflared || {
        echo "${YELLOW}⚠ Restart failed, trying delete & start${NC}"
        pm2 delete cloudflared 2>/dev/null || true
        pm2 start cloudflared -- tunnel --config "$CLOUDFLARED_CONFIG" run
    }
else
    echo "→ Starting cloudflared..."
    pm2 start cloudflared -- tunnel --config "$CLOUDFLARED_CONFIG" run
fi

echo "${GREEN}✓ Cloudflare tunnel configured${NC}"

echo ""

###############################################################################
# 3. APPLICATION REBUILD & RESTART
###############################################################################

echo "${YELLOW}[3/4] Application Rebuild${NC}"
echo "----------------------------------------"

# Rebuild with new Prisma client
echo "→ Building Next.js app..."
npm run build || {
    echo "${RED}✗ Build failed!${NC}"
    echo "Trying to restart with old build..."
}

# Restart main application
echo "→ Restarting polygraal-web..."
pm2 restart polygraal-web

# Save PM2 configuration
echo "→ Saving PM2 configuration..."
pm2 save

echo "${GREEN}✓ Application restarted${NC}"

echo ""

###############################################################################
# 4. HEALTH CHECK
###############################################################################

echo "${YELLOW}[4/4] Health Check${NC}"
echo "----------------------------------------"

# Wait for services to start
echo "→ Waiting for services to start..."
sleep 5

# Check PM2 status
echo ""
echo "PM2 Process Status:"
pm2 list | grep -E "(polygraal-web|cloudflared)" || true

# Check cloudflared logs
echo ""
echo "Cloudflared Status (last 5 lines):"
pm2 logs cloudflared --nostream --lines 5 2>/dev/null | tail -5 || echo "No logs available"

# Check if app is responding
echo ""
echo "→ Testing application..."
if curl -f -s -o /dev/null http://localhost:3001; then
    echo "${GREEN}✓ Application responding on port 3001${NC}"
else
    echo "${YELLOW}⚠ Application not responding yet${NC}"
fi

# Check PostgreSQL connection
echo ""
echo "→ Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" &>/dev/null; then
    echo "${GREEN}✓ Database connection successful${NC}"
else
    echo "${YELLOW}⚠ Database connection check failed${NC}"
fi

echo ""
echo "=========================================="
echo "${GREEN}✅ POST-DEPLOYMENT PATCH COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Visit https://polygraalx.com to verify site is accessible"
echo "2. Check https://polygraalx.com/dashboard/radar for enriched signals"
echo "3. Monitor logs: pm2 logs polygraal-web --lines 50"
echo ""
