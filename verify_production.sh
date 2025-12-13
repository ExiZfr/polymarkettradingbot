#!/bin/bash
# =============================================================================
# VÉRIFICATION RADAR MODE PRODUCTION
# =============================================================================
# Exécuter sur le VPS pour vérifier que le radar fonctionne en mode production
# =============================================================================

echo "=========================================="
echo "🔍 VÉRIFICATION RADAR PRODUCTION MODE"
echo "=========================================="
echo ""

cd ~/PolygraalX

# 1. Vérifier variable d'environnement
echo "📋 [1/5] Vérification configuration..."
if grep -q "^POLYGON_RPC_WSS=wss://" .env; then
    echo "✅ POLYGON_RPC_WSS configuré"
    grep "^WHALE_TRACKER_MODE=" .env || echo "WHALE_TRACKER_MODE non trouvé"
else
    echo "❌ POLYGON_RPC_WSS manquant ou invalide"
    echo "Contenu actuel:"
    grep "POLYGON_RPC_WSS" .env || echo "Variable absente"
fi
echo ""

# 2. Vérifier PM2 status
echo "🔄 [2/5] Vérification processus PM2..."
pm2 list | grep -E "whale-tracker|polyradar"
echo ""

# 3. Vérifier logs whale-tracker
echo "📝 [3/5] Derniers logs whale-tracker (50 lignes)..."
pm2 logs whale-tracker --lines 50 --nostream 2>/dev/null || echo "⚠️ Pas de logs disponibles"
echo ""

# 4. Tester connexion API
echo "🌐 [4/5] Test API transactions..."
curl -s http://localhost:3001/api/radar/transactions?limit=5 | head -20
echo ""

# 5. Vérifier DB
echo "🗄️ [5/5] Vérification base de données..."
echo "Nombre de transactions:"
npx prisma db execute --stdin <<'EOF' 2>/dev/null || echo "Erreur connexion DB"
SELECT COUNT(*) as total FROM "WhaleTransaction";
EOF
echo ""

echo "=========================================="
echo "✅ VÉRIFICATION TERMINÉE"
echo "=========================================="
echo ""
echo "🔍 Points à vérifier:"
echo "  1. whale-tracker doit être 'online' dans PM2"
echo "  2. Logs doivent montrer 'Connected to Polygon RPC'"
echo "  3. Si mode production: 'Listening for OrderFilled events'"
echo "  4. Si mode simulation: 'Generating mock transaction'"
echo ""
echo "📊 Pour voir logs en temps réel:"
echo "   pm2 logs whale-tracker --lines 100"
echo ""
