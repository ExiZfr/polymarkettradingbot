#!/bin/bash
###############################################################################
# Force Production Cache Clear and Rebuild
# Clears Next.js cache, rebuilds, and restarts the application
###############################################################################

set -e

echo "=========================================="
echo "🔄 FORCE PRODUCTION REBUILD"
echo "=========================================="

cd "$HOME/PolygraalX" || exit 1

echo ""
echo "→ Stopping polygraal-web..."
pm2 stop polygraal-web || true

echo "→ Clearing Next.js cache..."
rm -rf .next

echo "→ Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "→ Rebuilding Next.js application..."
npm run build

echo "→ Restarting polygraal-web..."
pm2 restart polygraal-web || pm2 start ecosystem.config.js --only polygraal-web

echo "→ Saving PM2 configuration..."
pm2 save

echo ""
echo "→ Waiting for application to start..."
sleep 5

echo ""
echo "→ Testing application..."
if curl -f -s -o /dev/null http://localhost:3001; then
    echo "✅ Application responding on port 3001"
else
    echo "⚠ Application not responding yet, check logs"
fi

echo ""
echo "=========================================="
echo "✅ REBUILD COMPLETE"
echo "=========================================="
echo ""
echo "The production cache has been cleared and the app rebuilt."
echo "Please refresh your browser (Ctrl+Shift+R) to see the latest changes."
echo ""
echo "Monitor with: pm2 logs polygraal-web --lines 50"
echo ""
