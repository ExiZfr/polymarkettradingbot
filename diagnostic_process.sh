#!/bin/bash
# =============================================================================
# DIAGNOSTIC: Quel process sert la page?
# =============================================================================

echo "=========================================="
echo "🔍 DIAGNOSTIC COMPLET"
echo "=========================================="
echo ""

cd ~/PolygraalX

# 1. Lister TOUS les process PM2
echo "📊 [1/5] Process PM2 actifs:"
pm2 list
echo ""

# 2. Identifier les ports
echo "🔌 [2/5] Ports utilisés:"
echo ""
echo "polygraal-web:"
pm2 describe polygraal-web 2>/dev/null | grep -E "script|port|cwd" || echo "N/A"
echo ""
echo "polygraalx:"
pm2 describe polygraalx 2>/dev/null | grep -E "script|port|cwd" || echo "N/A"
echo ""

# 3. Vérifier quel code chaque process a
echo "📂 [3/5] Version du code dans chaque dossier:"
echo ""

if [ -d "/root/bot" ]; then
    echo "→ /root/bot (ancien?):"
    grep -h "PolyRadar\|Whale Radar" /root/bot/src/app/dashboard/radar/page.tsx 2>/dev/null | head -1 || echo "Fichier non trouvé"
fi

if [ -d "/root/PolygraalX" ]; then
    echo "→ /root/PolygraalX (nouveau?):"
    grep -h "PolyRadar\|Whale Radar" /root/PolygraalX/src/app/dashboard/radar/page.tsx 2>/dev/null | head -1 || echo "Fichier non trouvé"
fi

if [ -d "$HOME/bot" ]; then
    echo "→ $HOME/bot:"
    grep -h "PolyRadar\|Whale Radar" $HOME/bot/src/app/dashboard/radar/page.tsx 2>/dev/null | head -1 || echo "Fichier non trouvé"
fi

if [ -d "$HOME/PolygraalX" ]; then
    echo "→ $HOME/PolygraalX:"
    grep -h "PolyRadar\|Whale Radar" $HOME/PolygraalX/src/app/dashboard/radar/page.tsx 2>/dev/null | head -1 || echo "Fichier non trouvé"
fi
echo ""

# 4. Netstat
echo "🌐 [4/5] Ports écoutés:"
netstat -tuln | grep -E ":3000|:3001" || echo "Aucun port 3000/3001"
echo ""

# 5. Recommandation
echo "=========================================="
echo "🔧 [5/5] SOLUTION:"
echo "=========================================="
echo ""
echo "Si polygraal-web est dans /root/bot (ancien code):"
echo "  → Vous accédez au MAUVAIS process!"
echo ""
echo "ACTIONS À FAIRE:"
echo ""
echo "1. SUPPRIMER ancien process:"
echo "   pm2 stop polygraal-web"
echo "   pm2 delete polygraal-web"
echo ""
echo "2. REDÉMARRER nouveau process:"
echo "   pm2 restart polygraalx"
echo ""
echo "3. VÉRIFIER port:"
echo "   pm2 logs polygraalx | grep -i port"
echo ""
echo "4. ACCÉDER AU BON PORT:"
echo "   Si polygraalx écoute sur 3001 → http://serveur:3001"
echo "   Si polygraal-web était sur 3000 → http://serveur:3000 affichera erreur"
echo ""
echo "=========================================="
