#!/bin/bash
# =============================================================================
# DEPLOY WHALE TRACKER V3.0 - POLYMARKET API
# =============================================================================
set -e

echo "=========================================="
echo "🚀 DÉPLOIEMENT WHALE TRACKER v3.0"
echo "=========================================="
echo ""

cd ~/PolygraalX

echo "[1/4] 📥 Pull code..."
git pull origin main
echo "✅ Code à jour"
echo ""

echo "[2/4] 🧹 Nettoyer ancien tracker..."
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true
echo "✅ Ancien tracker supprimé"
echo ""

echo "[3/4] 🐋 Démarrer Whale Tracker v3.0..."

# Start in SIMULATION mode first for testing
pm2 start scripts/whale_tracker_v3.py \
  --name whale-tracker \
  --interpreter python3 \
  --restart-delay 5000 \
  --max-restarts 10

sleep 3
pm2 save
echo "✅ Whale Tracker v3.0 démarré"
echo ""

echo "[4/4] 📊 Vérification..."
pm2 list | grep whale-tracker
echo ""
pm2 logs whale-tracker --lines 30 --nostream
echo ""

echo "=========================================="
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "=========================================="
echo ""
echo "📱 Dashboard: http://$(hostname -I | awk '{print $1}'):3001/dashboard/radar"
echo "📊 Logs: pm2 logs whale-tracker"
echo ""
echo "🎯 Le tracker est en mode SIMULATION par défaut."
echo "   Vous devriez voir des 🐋 toutes les 5-20 secondes !"
echo ""
