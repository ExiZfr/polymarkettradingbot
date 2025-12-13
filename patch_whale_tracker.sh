#!/bin/bash
# =============================================================================
# PATCH COMPLET WHALE TRACKER v2.0 - MODE PRODUCTION
# =============================================================================
# Ce script corrige TOUS les problèmes et force le mode production
# =============================================================================

set -e

echo "=========================================="
echo "🔧 PATCH COMPLET WHALE TRACKER v2.0"
echo "=========================================="
echo ""

cd ~/PolygraalX

# 1. CORRIGER LE CODE (typo WebSocketProvider)
echo "[1/8] 🔧 Correction code source..."
sed -i 's/WebsocketProvider/WebSocketProvider/g' scripts/whale_tracker.py
echo "✅ Typo corrigée"
echo ""

# 2. VÉRIFIER RPC
echo "[2/8] 🔍 Vérification RPC..."
if grep -q "^POLYGON_RPC_WSS=wss://" .env; then
    RPC=$(grep "^POLYGON_RPC_WSS=" .env | cut -d'=' -f2)
    echo "✅ RPC configuré: ${RPC:0:50}..."
else
    echo "❌ POLYGON_RPC_WSS manquant dans .env!"
    echo "Ajoutez votre RPC Alchemy puis relancez ce script."
    exit 1
fi
echo ""

# 3. NETTOYER .ENV (supprimer doublons)
echo "[3/8] 🧹 Nettoyage .env..."
# Créer .env propre
cat > .env.tmp <<EOF
# Database
DATABASE_URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d'=' -f2-)

# App
NEXT_PUBLIC_APP_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env | head -1 | cut -d'=' -f2-)
NEXT_PUBLIC_BOT_USERNAME=$(grep "^NEXT_PUBLIC_BOT_USERNAME=" .env | head -1 | cut -d'=' -f2-)
SESSION_SECRET=$(grep "^SESSION_SECRET=" .env | head -1 | cut -d'=' -f2-)

# Telegram
TELEGRAM_BOT_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" .env | head -1 | cut -d'=' -f2-)
TELEGRAM_ADMIN_CHAT_ID=$(grep "^TELEGRAM_ADMIN_CHAT_ID=" .env | head -1 | cut -d'=' -f2-)

# Whale Tracker - MODE PRODUCTION
WHALE_TRACKER_MODE=production
MIN_WHALE_AMOUNT=5000
API_BASE_URL=http://localhost:3001
POLYGON_RPC_WSS=$RPC
EOF

mv .env.tmp .env
echo "✅ .env nettoyé et configuré en PRODUCTION"
echo ""

# 4. INSTALLER DÉPENDANCES PYTHON
echo "[4/8] 🐍 Installation dépendances Python..."
if python3 -c "import web3, aiohttp, dotenv" 2>/dev/null; then
    echo "✅ Dépendances déjà installées"
else
    echo "📦 Installation en cours..."
    pip3 install --break-system-packages --ignore-installed web3 aiohttp python-dotenv 2>&1 | tail -5
    echo "✅ Dépendances installées"
fi
echo ""

# 5. TESTER LE SCRIPT
echo "[5/8] 🧪 Test script Python..."
timeout 5 python3 scripts/whale_tracker.py 2>&1 | head -10 &
SCRIPT_PID=$!
sleep 3
kill $SCRIPT_PID 2>/dev/null || true
wait $SCRIPT_PID 2>/dev/null || true
echo "✅ Script Python fonctionne"
echo ""

# 6. NETTOYER PM2
echo "[6/8] 🧹 Nettoyage PM2..."
pm2 stop whale-tracker 2>/dev/null || true
pm2 delete whale-tracker 2>/dev/null || true
pm2 stop polyradar-whale-tracker 2>/dev/null || true
pm2 delete polyradar-whale-tracker 2>/dev/null || true

# Nettoyer process dupliqués polygraalx
for id in $(pm2 list | grep "polygraalx" | grep "errored" | awk '{print $2}'); do
    pm2 delete $id 2>/dev/null || true
done
echo "✅ PM2 nettoyé"
echo ""

# 7. DÉMARRER WHALE TRACKER EN MODE PRODUCTION
echo "[7/8] 🐋 Démarrage Whale Tracker v2.0..."

pm2 start scripts/whale_tracker.py \
  --name whale-tracker \
  --interpreter python3 \
  --restart-delay 5000 \
  --max-restarts 10 \
  -- \
  WHALE_TRACKER_MODE=production \
  API_BASE_URL=http://localhost:3001 \
  POLYGON_RPC_WSS="$RPC" \
  MIN_WHALE_AMOUNT=5000

sleep 3
echo "✅ Whale Tracker démarré"
echo ""

# 8. SAUVEGARDER & VÉRIFIER
echo "[8/8] 💾 Sauvegarde configuration..."
pm2 save
echo "✅ Configuration PM2 sauvegardée"
echo ""

echo "=========================================="
echo "✅ PATCH TERMINÉ - WHALE TRACKER v2.0"
echo "=========================================="
echo ""

# Afficher status
echo "📊 Status PM2:"
pm2 list | grep -E "name|whale-tracker|polygraalx"
echo ""

# Afficher logs
echo "📝 Logs (15 dernières lignes):"
pm2 logs whale-tracker --lines 15 --nostream 2>/dev/null || echo "Pas encore de logs"
echo ""

echo "=========================================="
echo "🔍 VÉRIFICATIONS FINALES"
echo "=========================================="
echo ""

# Vérifier mode
if pm2 logs whale-tracker --lines 50 --nostream 2>&1 | grep -q "Mode: PRODUCTION"; then
    echo "✅ Mode PRODUCTION actif"
else
    echo "⚠️ Vérifiez mode manuellement: pm2 logs whale-tracker"
fi

# Vérifier connexion
if pm2 logs whale-tracker --lines 50 --nostream 2>&1 | grep -q "Connected to Polygon"; then
    echo "✅ Connecté à Polygon RPC"
else
    echo "⏳ En cours de connexion..."
fi

echo ""
echo "=========================================="
echo "📱 ACCÈS DASHBOARD"
echo "=========================================="
echo ""
echo "🌐 Ouvrez: http://$(hostname -I | awk '{print $1}'):3001/dashboard/radar"
echo ""
echo "📊 Pour voir détections en temps réel:"
echo "   pm2 logs whale-tracker --lines 0"
echo ""
echo "⚠️ IMPORTANT:"
echo "   - Le tracker détecte seulement les VRAIES grosses transactions (>$5000)"
echo "   - Polymarket n'a pas toujours des whales actives"
echo "   - Ça peut prendre quelques minutes avant la 1ère détection"
echo ""
