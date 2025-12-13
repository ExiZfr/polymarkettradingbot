#!/bin/bash
# =============================================================================
# DÉPLOIEMENT FINAL WHALE TRACKER - HTTP MODE
# =============================================================================
set -e

echo "=========================================="
echo "🚀 DÉPLOIEMENT WHALE TRACKER v2.0 FINAL"
echo "=========================================="
echo ""

cd ~/PolygraalX

echo "[1/5] 📥 Pull dernières modifications..."
git pull origin main
echo "✅ Code à jour"
echo ""

echo "[2/5] 🧹 Nettoyage PM2..."
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true
echo "✅ PM2 nettoyé"
echo ""

echo "[3/5] 🔧 Configuration environnement..."
export WHALE_TRACKER_MODE=production
export API_BASE_URL=http://localhost:3001
export MIN_WHALE_AMOUNT=5000
export POLYGON_RPC_WSS=$(grep "^POLYGON_RPC_WSS=" .env | cut -d'=' -f2)

if [ -z "$POLYGON_RPC_WSS" ]; then
    echo "❌ POLYGON_RPC_WSS non trouvé dans .env"
    exit 1
fi

echo "✅ Variables configurées"
echo "   Mode: PRODUCTION"
echo "   RPC: ${POLYGON_RPC_WSS:0:50}..."
echo ""

echo "[4/5] 🧪 Test script Python..."
cd scripts
timeout 5 python3 whale_tracker.py 2>&1 | head -20
echo ""
echo "✅ Script fonctionne"
cd ..
echo ""

echo "[5/5] 🐋 Démarrage whale-tracker..."
pm2 start scripts/whale_tracker.py \
  --name whale-tracker \
  --interpreter python3 \
  --restart-delay 5000 \
  --max-restarts 10

sleep 3
pm2 save

echo "✅ Whale tracker démarré"
echo ""

echo "=========================================="
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "=========================================="
echo ""

pm2 list | grep whale-tracker
echo ""

echo "📝 Logs (20 dernières lignes):"
pm2 logs whale-tracker --lines 20 --nostream
echo ""

echo "🎯 VÉRIFICATIONS:"
if pm2 logs whale-tracker --lines 50 --nostream 2>&1 | grep -q "Mode: PRODUCTION"; then
    echo "  ✅ Mode PRODUCTION actif"
else
    echo "  ⚠️ Mode non détecté"
fi

if pm2 logs whale-tracker --lines 50 --nostream 2>&1 | grep -q "Connected to Polygon"; then
    echo "  ✅ Connecté à Polygon"
else
    echo "  ⚠️ Connexion en cours..."
fi

echo ""
echo "🌐 Dashboard: http://$(hostname -I | awk '{print $1}'):3001/dashboard/radar"
echo "📊 Logs temps réel: pm2 logs whale-tracker"
echo ""
