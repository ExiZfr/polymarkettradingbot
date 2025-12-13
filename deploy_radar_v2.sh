#!/bin/bash
# =============================================================================
# DÉPLOIEMENT RADAR v2.0 - GUIDE ULTRA-SIMPLE
# =============================================================================
# Exécuter sur le VPS en SSH
# =============================================================================

echo "=========================================="
echo "🚀 DÉPLOIEMENT RADAR v2.0"
echo "=========================================="

# 1. Aller dans le dossier projet
cd /root/bot  # ← Adapter si votre dossier est différent

# 2. Arrêter l'ancien radar
echo ""
echo "📛 Arrêt ancien système..."
pm2 stop polyradar-whale-tracker 2>/dev/null || echo "Ancien process non trouvé"
pm2 delete polyradar-whale-tracker 2>/dev/null || echo "OK"

# 3. Pull nouveau code GitHub
echo ""
echo "📥 Récupération nouveau code..."
git fetch origin
git reset --hard origin/main  # ⚠️ ÉCRASE modifications locales
git pull origin main

# 4. Installer dépendances Python
echo ""
echo "🐍 Installation dépendances Python..."
pip3 install -r scripts/whale_tracker_requirements.txt

# 5. Migration Prisma (IMPORTANT!)
echo ""
echo "🗄️ Migration base de données..."
npx prisma generate
npx prisma migrate deploy

# 6. Build Next.js
echo ""
echo "🔨 Build application..."
npm install
npm run build

# 7. Redémarrer TOUT avec nouveau config
echo ""
echo "🔄 Redémarrage services..."
pm2 delete all  # ⚠️ Supprime tous les anciens process
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=========================================="
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo "=========================================="
echo ""
echo "🔍 Vérification:"
pm2 list
echo ""
echo "📊 Ouvrir: http://votre-serveur:3000/dashboard/radar"
echo ""
echo "📝 Logs en temps réel:"
echo "   pm2 logs whale-tracker"
echo ""
