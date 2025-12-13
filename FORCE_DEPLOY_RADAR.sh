#!/bin/bash
# =============================================================================
# FORCE RADAR v2.0 - NUKE & REBUILD
# =============================================================================
# Supprime TOUT et force le nouveau système
# =============================================================================

set -e
cd ~/PolygraalX

echo "=========================================="
echo "💥 FORCE DEPLOYMENT RADAR v2.0"
echo "=========================================="
echo ""

# 1. STOP TOUT
echo "🛑 [1/8] Arrêt de TOUS les services..."
pm2 stop all
pm2 delete all 2>/dev/null || true
echo "✅ Tous les process arrêtés"
echo ""

# 2. PULL CODE
echo "📥 [2/8] Pull code GitHub (FORCE)..."
git fetch origin main
git reset --hard origin/main
git clean -fd
echo "✅ Code à jour"
echo ""

# 3. VÉRIFIER VERSION
echo "🔍 [3/8] Vérification version..."
if grep -q "Whale Radar v2.0" src/app/dashboard/radar/page.tsx; then
    echo "✅ NOUVEAU CODE CONFIRMÉ (v2.0)"
else
    echo "❌ ERREUR: ANCIEN CODE TOUJOURS LÀ!"
    exit 1
fi
echo ""

# 4. CLEAN CACHE
echo "🧹 [4/8] Nettoyage cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force
echo "✅ Cache supprimé"
echo ""

# 5. INSTALL DEPS
echo "📦 [5/8] Installation dépendances..."
npm install
sudo apt-get install -y python3-pip python3-web3 python3-aiohttp python3-dotenv 2>/dev/null || true
echo "✅ Dépendances installées"
echo ""

# 6. DB MIGRATION
echo "🗄️ [6/8] Migration base de données..."
npx prisma generate
npx prisma db push --accept-data-loss
echo "✅ DB à jour"
echo ""

# 7. BUILD
echo "🔨 [7/8] Build Next.js (PRODUCTION)..."
NODE_ENV=production npm run build
echo "✅ Build terminé"
echo ""

# 8. START TOUT
echo "🚀 [8/8] Démarrage services..."

# Main app
pm2 start npm --name polygraalx -- start

# Listener
pm2 start scripts/hyper-listener.js --name polylistener

# Whale Tracker v2.0 (NOUVEAU)
pm2 start scripts/whale_tracker.py --name whale-tracker --interpreter python3

pm2 save

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT FORCÉ TERMINÉ"
echo "=========================================="
echo ""

pm2 list

echo ""
echo "🔍 VÉRIFICATIONS FINALES:"
echo ""
echo "1. Code version:"
grep -A 2 "Whale Radar v2.0" src/app/dashboard/radar/page.tsx | head -3
echo ""
echo "2. Process whale-tracker:"
pm2 describe whale-tracker | grep -E "status|restart"
echo ""
echo "3. Logs whale-tracker (20 dernières lignes):"
pm2 logs whale-tracker --lines 20 --nostream
echo ""
echo "=========================================="
echo "🌐 OUVREZ MAINTENANT:"
echo "   http://votre-serveur:3000/dashboard/radar"
echo ""
echo "   Faites CTRL+SHIFT+R (hard refresh)"
echo "=========================================="
