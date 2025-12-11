#!/bin/bash
# PolyGraalX VPS Setup Script - Install html2canvas dependency
# Usage: bash vps-install-deps.sh

echo "🚀 PolyGraalX VPS Dependency Installer"
echo "======================================"
echo ""

# Navigate to project directory (adjust if needed)
cd /root/PolygraalX || cd ~/PolygraalX || {
    echo "❌ Error: Project directory not found"
    echo "Please specify the correct path to your project"
    exit 1
}

echo "📂 Current directory: $(pwd)"
echo ""

# Install html2canvas
echo "📦 Installing html2canvas..."
npm install html2canvas --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ html2canvas installed successfully!"
else
    echo "⚠️  Installation failed. Trying without legacy flag..."
    npm install html2canvas
    
    if [ $? -eq 0 ]; then
        echo "✅ html2canvas installed successfully!"
    else
        echo "❌ Failed to install html2canvas"
        echo "Try manually: npm install html2canvas"
        exit 1
    fi
fi

echo ""
echo "🔄 Rebuilding Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "⚠️  Build failed. Check errors above."
    exit 1
fi

echo ""
echo "🔄 Restarting PM2 process..."
pm2 restart polygraalx 2>/dev/null || pm2 restart all

echo ""
echo "✅ Installation complete!"
echo "📊 Check PM2 status: pm2 status"
echo "📝 Check logs: pm2 logs polygraalx"
