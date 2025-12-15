#!/bin/bash

# Script to fix API_BASE_URL configuration for whale tracker
echo "🔧 Fixing API_BASE_URL configuration..."

# Create/update .env.example with the correct port
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/polymarket_bot"

# API Configuration
API_BASE_URL="http://127.0.0.1:3001"

# Whale Tracker Settings
WHALE_THRESHOLD="10"
POLL_INTERVAL="10"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3001"
EOF

echo "✅ Created .env.example with correct API_BASE_URL"

# Add documentation
cat > docs/API_CONFIGURATION.md << 'EOF'
# API Configuration

## Environment Variables

### API_BASE_URL
The base URL for the internal API used by the whale tracker Python script.

**Production**: `http://127.0.0.1:3001`
**Development**: `http://localhost:3001`

### Important Notes
- The whale tracker script (`whale_tracker_v4.py`) uses this to send detected transactions to the Next.js API
- Make sure this matches the port where your Next.js server is running
- Default Next.js port is 3000, but this project uses 3001

## Deployment Checklist
1. Update `.env` with correct `API_BASE_URL`
2. Restart whale tracker: `pm2 restart whale-tracker-v4`
3. Verify in logs: `pm2 logs whale-tracker-v4 --lines 50`
EOF

echo "✅ Created API configuration documentation"

# Commit changes
git add .env.example docs/API_CONFIGURATION.md
git commit -m "docs: add API_BASE_URL configuration and documentation for port 3001"

echo ""
echo "📝 Changes committed. Push with:"
echo "   git push origin main"
echo ""
echo "⚠️  Don't forget to update .env on your server:"
echo "   echo 'API_BASE_URL=http://127.0.0.1:3001' >> .env"
echo "   pm2 restart whale-tracker-v4"
