#!/bin/bash
# PolyRadar Setup Script
# Installs all Python dependencies needed for PolyRadar

echo "🐋 PolyRadar - Installing Dependencies..."

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Installing..."
    sudo apt-get install -y python3-pip
fi

# Install dependencies
echo "📦 Installing Python packages..."
pip3 install --user web3 websockets aiohttp pandas numpy

echo "✅ PolyRadar dependencies installed!"
echo ""
echo "To start PolyRadar manually:"
echo "  cd scripts"
echo "  python3 polyradar_main.py --mode simulation --bankroll 10000"
echo ""
echo "To start with PM2 (persistent):"
echo "  pm2 start ecosystem.config.js --only polyradar-whale-tracker"
