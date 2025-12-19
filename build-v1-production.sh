#!/bin/bash
# V1 Production Build & Test Script

echo "========================================="
echo "PolyGraalX V1 - Production Build"
echo "========================================="

# Check Node version
echo "Checking Node.js version..."
node --version

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Run production build
echo "Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Next steps:"
    echo "1. Test locally: npm run start"
    echo "2. Deploy to production"
    echo ""
    echo "V1 Features:"
    echo "- Landing: Coming Soon page"
    echo "- Auth: Telegram only"
    echo "- Dashboard: Oracle + Order Book"
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi
