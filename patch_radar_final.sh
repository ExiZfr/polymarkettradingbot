#!/bin/bash
# =============================================================================
# PATCH RADAR - NETTOYAGE COMPLET ET REDÉPLOIEMENT
# =============================================================================
set -e

echo "=========================================="
echo "🔧 PATCH RADAR - NETTOYAGE COMPLET"
echo "=========================================="
echo ""

cd ~/PolygraalX

echo "[1/6] 📥 Pull dernières modifications..."
git pull origin main
echo "✅ Code à jour"
echo ""

echo "[2/6] 🗑️  Supprimer TOUS les anciens trackers..."
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true

# Supprimer aussi si lancé sous d'autres noms
pm2 stop whale-tracker-v3 2>/dev/null || true
pm2 delete whale-tracker-v3 2>/dev/null || true

pm2 stop polyradar 2>/dev/null || true
pm2 delete polyradar 2>/dev/null || true

echo "✅ Anciens processus supprimés"
echo ""

echo "[3/6] 🐋 Installer dépendances Python..."
pip3 install --break-system-packages aiohttp || echo "aiohttp déjà installé"
echo "✅ Dépendances OK"
echo ""

echo "[4/6] 🚀 Démarrer NOUVEAU Whale Tracker (API Polymarket)..."
# whale_tracker.py est maintenant la version API (ex-v3)
pm2 start scripts/whale_tracker.py \
  --name whale-tracker \
  --interpreter python3 \
  --restart-delay 5000 \
  --max-restarts 10

sleep 3
pm2 save
echo "✅ Whale Tracker démarré"
echo ""

echo "[5/6] 📊 Vérification..."
pm2 list | grep whale-tracker
echo ""

echo "[6/6] 📝 Logs (30 dernières lignes)..."
pm2 logs whale-tracker --lines 30 --nostream
echo ""

echo "=========================================="
echo "✅ PATCH RADAR TERMINÉ"
echo "=========================================="
echo ""
echo "🎯 VÉRIFICATIONS :"
echo ""
echo "1. Le tracker doit afficher :"
echo "   🐋 WHALE TRACKER v3.0 - POLYMARKET API"
echo "   Mode: SIMULATION"
echo ""
echo "2. Vous DEVEZ voir des transactions :"
echo "   🐋 [SIM] WINNER | \$15,000 YES @ 0.42"
echo ""
echo "3. AUCUNE erreur API 500 !"
echo ""
echo "4. Dashboard : http://$(hostname -I | awk '{print $1}'):3001/dashboard/radar"
echo ""
echo "📊 Logs temps réel : pm2 logs whale-tracker"
echo ""
