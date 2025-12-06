#!/bin/bash

# Polymarket Bot Deployment Script

echo "🚀 Starting Deployment..."

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sh get-docker.sh"
    exit 1
fi

# 2. Check for .env files
if [ ! -f frontend/.env.local ]; then
    echo "⚠️  frontend/.env.local not found!"
    echo "   Creating from example..."
    cp frontend/env.example frontend/.env.local
    echo "   Please edit frontend/.env.local with your real keys before continuing."
    exit 1
fi

# 3. Build and Start Containers
echo "📦 Building and Starting Containers..."
docker-compose down
docker-compose up -d --build

# 4. Wait for DB
echo "⏳ Waiting for Database to initialize..."
sleep 10

# 5. Initialize Database Schema
echo "🗄️  Initializing Database Schema..."
# We use the 'db' container to run psql
docker-compose exec -T db psql -U user -d polymarket_bot < schema.sql
docker-compose exec -T db psql -U user -d polymarket_bot < copy_strategies.sql

echo "✅ Deployment Complete!"
echo "   Frontend: http://localhost:3000 (or your VPS IP:3000)"
echo "   Backend:  http://localhost:8000"
echo ""
echo "📝 NOTE: For Telegram Mini App, you MUST have HTTPS."
echo "   You should set up Nginx + Certbot or use Cloudflare Tunnel."
