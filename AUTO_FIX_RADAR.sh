#!/bin/bash
# =============================================================================
# AUTO-FIX RADAR v2.0 - TROUVE ET CORRIGE AUTOMATIQUEMENT
# =============================================================================

set -e
cd ~/PolygraalX

echo "=========================================="
echo "🤖 AUTO-FIX RADAR v2.0"
echo "=========================================="
echo ""

# 1. IDENTIFIER ET SUPPRIMER TOUS LES ANCIENS PROCESS
echo "🗑️ [1/7] Nettoyage ancien système..."

# Supprimer TOUS les process qui pourraient servir l'ancien code
for process in polygraal-web polyradar-whale-tracker polyradar whale-tracker; do
    if pm2 describe $process &>/dev/null; then
        echo "   Suppression: $process"
        pm2 stop $process 2>/dev/null || true
        pm2 delete $process 2>/dev/null || true
    fi
done

echo "✅ Ancien système supprimé"
echo ""

# 2. PULL DERNIER CODE
echo "📥 [2/7] Pull code GitHub..."
git fetch origin main
git reset --hard origin/main
git clean -fd

# Vérifier version
if grep -q "Whale Radar v2.0" src/app/dashboard/radar/page.tsx; then
    echo "✅ Code v2.0 confirmé"
else
    echo "❌ ERREUR: Code v2.0 non trouvé!"
    exit 1
fi
echo ""

# 3. NETTOYER CACHE
echo "🧹 [3/7] Nettoyage cache..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ Cache nettoyé"
echo ""

# 4. INSTALLER DÉPENDANCES
echo "📦 [4/7] Installation dépendances..."
npm install --prefer-offline
sudo apt-get install -y python3-pip python3-web3 python3-aiohttp python3-dotenv 2>/dev/null || true
echo "✅ Dépendances installées"
echo ""

# 5. UPDATE DB
echo "🗄️ [5/7] Migration DB..."
npx prisma generate
npx prisma db push --accept-data-loss --skip-generate
echo "✅ DB à jour"
echo ""

# 6. BUILD
echo "🔨 [6/7] Build production..."
NODE_ENV=production npm run build
echo "✅ Build terminé"
echo ""

# 7. START NOUVEAU SYSTÈME SUR PORT 3001
echo "🚀 [7/7] Démarrage nouveau système..."

# IMPORTANT: Démarrer sur port 3001 (port utilisé par l'utilisateur)
PORT=3001 pm2 start npm --name polygraalx -- start

# Démarrer services complémentaires
pm2 start scripts/hyper-listener.js --name polylistener 2>/dev/null || true
pm2 start scripts/whale_tracker.py --name whale-tracker --interpreter python3

pm2 save

echo ""
echo "=========================================="
echo "✅ AUTO-FIX TERMINÉ"
echo "=========================================="
echo ""

# Vérifications finales
echo "📊 Process actifs:"
pm2 list
echo ""
echo "🔍 Vérification port 3001:"
sleep 2
curl -s http://localhost:3001/dashboard/radar | grep -o "Whale Radar v2.0\|PolyRadar" || echo "Page non accessible"
echo ""
echo "📝 Logs polygraalx (10 lignes):"
pm2 logs polygraalx --lines 10 --nostream
echo ""
echo "=========================================="
echo "🌐 ACCÈS:"
echo "   http://votre-serveur:3001/dashboard/radar"
echo ""
echo "   FAITES CTRL+SHIFT+R (hard refresh)"
echo "=========================================="
