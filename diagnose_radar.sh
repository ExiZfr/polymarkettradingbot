#!/bin/bash
# =============================================================================
# DIAGNOSTIC RADAR - FORCE FIX
# =============================================================================
# Ce script diagnostique ET répare automatiquement whale-tracker
# =============================================================================

set -e
cd ~/PolygraalX

echo "=========================================="
echo "🔍 DIAGNOSTIC + AUTO-FIX RADAR"
echo "=========================================="
echo ""

# 1. Vérifier .env
echo "[1/7] 📋 Vérification .env..."
if grep -q "^POLYGON_RPC_WSS=wss://" .env; then
    echo "✅ POLYGON_RPC_WSS configuré"
    RPC_URL=$(grep "^POLYGON_RPC_WSS=" .env | cut -d'=' -f2)
    echo "   URL: ${RPC_URL:0:50}..."
else
    echo "❌ POLYGON_RPC_WSS manquant!"
    echo "🔧 Ajout automatique en mode simulation..."
    echo "WHALE_TRACKER_MODE=simulation" >> .env
    echo "MIN_WHALE_AMOUNT=5000" >> .env
    echo "API_BASE_URL=http://localhost:3001" >> .env
fi
echo ""

# 2. Vérifier PM2
echo "[2/7] 🔄 Status PM2..."
pm2 list | grep -E "whale-tracker|polyradar" || echo "Aucun tracker trouvé"
echo ""

# 3. Vérifier si whale-tracker tourne
echo "[3/7] 🐋 Vérification whale-tracker..."
if pm2 describe whale-tracker > /dev/null 2>&1; then
    STATUS=$(pm2 describe whale-tracker | grep "status" | head -1)
    echo "Status: $STATUS"
    
    if echo "$STATUS" | grep -q "online"; then
        echo "✅ whale-tracker ONLINE"
    else
        echo "❌ whale-tracker NOT ONLINE - Redémarrage..."
        pm2 restart whale-tracker
        sleep 3
    fi
else
    echo "❌ whale-tracker ABSENT - Démarrage..."
    
    # Vérifier dépendances Python
    python3 -c "import web3" 2>/dev/null || {
        echo "🐍 Installation dépendances Python..."
        sudo apt-get update -qq
        sudo apt-get install -y python3-web3 python3-aiohttp python3-dotenv
    }
    
    # Démarrer
    pm2 start scripts/whale_tracker.py \
        --name whale-tracker \
        --interpreter python3 \
        --restart-delay 10000 \
        --max-restarts 5
    
    sleep 3
    pm2 save
fi
echo ""

# 4. Voir les VRAIS logs
echo "[4/7] 📝 Logs whale-tracker (dernières 30 lignes)..."
pm2 logs whale-tracker --lines 30 --nostream 2>/dev/null || {
    echo "⚠️ Pas de logs PM2, tentative directe..."
    cd scripts
    timeout 5 python3 whale_tracker.py 2>&1 || echo "Script timeout"
    cd ..
}
echo ""

# 5. Test API
echo "[5/7] 🌐 Test API..."
RESPONSE=$(curl -s http://localhost:3001/api/radar/transactions?limit=1)
if echo "$RESPONSE" | grep -q "transactions"; then
    echo "✅ API répond"
    echo "$RESPONSE" | head -20
else
    echo "❌ API ne répond pas correctement"
    echo "$RESPONSE"
fi
echo ""

# 6. Vérifier DB
echo "[6/7] 🗄️ Comptage transactions en DB..."
cat > /tmp/count_tx.sql <<'EOF'
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
    COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '10 minutes' THEN 1 END) as last_10min
FROM "WhaleTransaction";
EOF

npx prisma db execute --stdin < /tmp/count_tx.sql 2>/dev/null || echo "Erreur DB"
rm /tmp/count_tx.sql
echo ""

# 7. Mode actuel
echo "[7/7] ⚙️ Configuration actuelle..."
grep -E "WHALE_TRACKER_MODE|POLYGON_RPC_WSS|MIN_WHALE_AMOUNT" .env | head -5
echo ""

echo "=========================================="
echo "✅ DIAGNOSTIC TERMINÉ"
echo "=========================================="
echo ""

# Recommandations
echo "🔍 RECOMMANDATIONS:"
echo ""

if pm2 describe whale-tracker > /dev/null 2>&1; then
    if pm2 logs whale-tracker --lines 50 --nostream 2>&1 | grep -q "Connected to Polygon"; then
        echo "✅ whale-tracker connecté à Polygon"
        echo "📊 Attendez quelques minutes pour voir des whales"
        echo "    (Polymarket n'a pas toujours des grosses transactions)"
        echo ""
        echo "🔍 Pour forcer une détection, ouvrez autre terminal:"
        echo "   pm2 logs whale-tracker --lines 0"
        echo "   (Vous verrez les events en temps réel)"
    else
        echo "⚠️ whale-tracker pas encore connecté"
        echo "🔄 Redémarrez manuellement:"
        echo "   pm2 restart whale-tracker"
        echo "   pm2 logs whale-tracker"
    fi
else
    echo "❌ whale-tracker n'a pas démarré"
    echo "🐍 Vérifiez dépendances Python:"
    echo "   python3 -c 'import web3, aiohttp'"
fi

echo ""
echo "📱 Page web: http://$(hostname -I | awk '{print $1}'):3001/dashboard/radar"
echo ""
