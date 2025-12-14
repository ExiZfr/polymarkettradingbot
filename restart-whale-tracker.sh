#!/bin/bash
###############################################################################
# Restart PolyRadar Whale Tracker
# Quick script to restart the whale tracker on production
###############################################################################

set -e

echo "=========================================="
echo "🐋 RESTARTING POLYRADAR WHALE TRACKER"
echo "=========================================="

cd "$HOME/PolygraalX" || exit 1

# Check current status
echo ""
echo "Current PM2 status:"
pm2 list | grep -E "(polyradar|whale)" || echo "No whale tracker processes found"

# Restart whale tracker
echo ""
echo "→ Restarting polyradar-whale-tracker..."
pm2 restart polyradar-whale-tracker || {
    echo "⚠ Process not found, starting fresh..."
    pm2 delete polyradar-whale-tracker 2>/dev/null || true
    pm2 start ecosystem.config.js --only whale-tracker
}

# Save PM2 config
echo "→ Saving PM2 configuration..."
pm2 save

# Show logs
echo ""
echo "Recent logs:"
pm2 logs polyradar-whale-tracker --nostream --lines 20 || pm2 logs whale-tracker --nostream --lines 20

echo ""
echo "=========================================="
echo "✅ WHALE TRACKER RESTARTED"
echo "=========================================="
echo ""
echo "Monitor with: pm2 logs polyradar-whale-tracker --lines 50"
echo ""
