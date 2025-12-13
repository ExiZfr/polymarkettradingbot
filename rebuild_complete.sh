#!/bin/bash
# =============================================================================
# REBUILD COMPLET - NETTOYAGE TOTAL
# =============================================================================
set -e

echo "=========================================="
echo "🔧 REBUILD COMPLET - NETTOYAGE TOTAL"
echo "=========================================="
echo ""

cd ~/PolygraalX

echo "[1/6] 🛑 Arrêt serveur..."
pm2 stop polygraalx
echo "✅ Serveur arrêté"
echo ""

echo "[2/6] 🗑️  Nettoyage COMPLET..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
echo "✅ Cache supprimé"
echo ""

echo "[3/6] 📥 Pull code..."
git pull origin main
echo "✅ Code à jour"
echo ""

echo "[4/6] 📦 Réinstallation dépendances..."
npm install
echo "✅ Dépendances OK"
echo ""

echo "[5/6] 🏗️  Build production..."
NODE_ENV=production npm run build
echo "✅ Build terminé"
echo ""

echo "[6/6] 🚀 Redémarrage..."
pm2 restart polygraalx
sleep 5
pm2 save
echo ""

echo "=========================================="
echo "✅ REBUILD COMPLET TERMINÉ"
echo "=========================================="
echo ""
pm2 logs polygraalx --lines 20 --nostream
echo ""
echo "🌐 Dashboard: https://app.polygraalx.app/dashboard/radar"
echo "📊 Logs: pm2 logs polygraalx"
echo ""
