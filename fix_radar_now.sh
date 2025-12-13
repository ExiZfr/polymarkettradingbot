#!/bin/bash
# =============================================================================
# RADAR v2.0 - DIAGNOSTIC & AUTO-FIX
# =============================================================================
# Ce script vérifie et corrige automatiquement tous les problèmes
# =============================================================================

set -e
cd ~/PolygraalX

echo "=========================================="
echo "🔍 DIAGNOSTIC RADAR v2.0"
echo "=========================================="
echo ""

# 1. Vérifier la version du code
echo "📂 [1/6] Vérification version code..."
if grep -q "Whale Radar v2.0" src/app/dashboard/radar/page.tsx; then
    echo "✅ Nouveau code présent (v2.0)"
else
    echo "❌ ANCIEN CODE ! Pulling..."
    git fetch origin
    git reset --hard origin/main
fi
echo ""

# 2. Vérifier PM2 processes
echo "🔄 [2/6] Vérification processus PM2..."
pm2 list
echo ""

OLD_RADAR=$(pm2 list | grep -c "polyradar-whale-tracker" || echo "0")
NEW_TRACKER=$(pm2 list | grep -c "whale-tracker" || echo "0")

if [ "$OLD_RADAR" != "0" ]; then
    echo "⚠️ ANCIEN radar détecté ! Suppression..."
    pm2 stop polyradar-whale-tracker 2>/dev/null || true
    pm2 delete polyradar-whale-tracker 2>/dev/null || true
fi

if [ "$NEW_TRACKER" == "0" ]; then
    echo "❌ NOUVEAU whale-tracker absent !"
else
    echo "✅ whale-tracker trouvé (id: $(pm2 list | grep whale-tracker | awk '{print $2}'))"
fi
echo ""

# 3. Installer dépendances Python
echo "🐍 [3/6] Installation dépendances Python..."
sudo apt-get update -qq
sudo apt-get install -y python3-pip python3-web3 python3-aiohttp python3-dotenv 2>/dev/null || echo "Packages déjà installés"

# Vérifier installations
python3 -c "import web3; print('✅ web3 OK')" || echo "❌ web3 manquant"
python3 -c "import aiohttp; print('✅ aiohttp OK')" || echo "❌ aiohttp manquant"
echo ""

# 4. Vérifier base de données
echo "🗄️ [4/6] Vérification base de données..."
npx prisma db push --skip-generate 2>/dev/null && echo "✅ DB à jour" || echo "⚠️ Erreur DB"
echo ""

# 5. Redémarrer Next.js
echo "♻️ [5/6] Redémarrage application..."
npm run build
pm2 restart polygraalx
echo "✅ Application redémarrée"
echo ""

# 6. Démarrer whale-tracker
echo "🐋 [6/6] Démarrage Whale Tracker v2.0..."

# Arrêter ancien si existe
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true

# Démarrer nouveau
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --only whale-tracker
else
    pm2 start scripts/whale_tracker.py --name whale-tracker --interpreter python3
fi

pm2 save

echo ""
echo "=========================================="
echo "✅ DIAGNOSTIC & FIX TERMINÉ"
echo "=========================================="
echo ""
echo "📊 Status final:"
pm2 list
echo ""
echo "🔍 Vérifications:"
echo "  1. Ouvrir: http://votre-serveur:3000/dashboard/radar"
echo "  2. Devrait afficher: '🐋 Whale Radar v2.0'"
echo "  3. Transactions avec tags colorés"
echo "  4. Click → Modal avec détails"
echo ""
echo "📝 Logs whale-tracker:"
pm2 logs whale-tracker --lines 20 --nostream
echo ""
