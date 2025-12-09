#!/bin/bash
# Script pour récupérer les informations PostgreSQL depuis le VPS

echo "🔍 Recherche des informations PostgreSQL..."
echo ""

# 1. Vérifier si PostgreSQL est installé
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL est installé"
    psql --version
else
    echo "❌ PostgreSQL n'est pas installé ou pas dans le PATH"
fi

echo ""
echo "========================================="
echo "📋 INFORMATIONS DE CONNEXION"
echo "========================================="

# 2. Chercher dans le fichier .env s'il existe
if [ -f ~/PolygraalX/.env ]; then
    echo ""
    echo "📄 Fichier .env trouvé dans ~/PolygraalX/.env:"
    echo ""
    cat ~/PolygraalX/.env
    echo ""
fi

# 3. Lister les bases de données PostgreSQL
echo ""
echo "📊 Bases de données PostgreSQL disponibles:"
echo ""
sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | sed '/^$/d' | grep -v "template" || echo "❌ Impossible de lister les bases de données"

echo ""
echo "========================================="
echo "💡 AIDE"
echo "========================================="
echo ""
echo "Si tu as oublié tes identifiants PostgreSQL, tu peux:"
echo ""
echo "1. Te connecter à PostgreSQL en tant que superuser:"
echo "   sudo -u postgres psql"
echo ""
echo "2. Lister les utilisateurs:"
echo "   \\du"
echo ""
echo "3. Créer un nouvel utilisateur si nécessaire:"
echo "   CREATE USER polygraal_user WITH PASSWORD 'ton_mot_de_passe';"
echo ""
echo "4. Créer une base de données:"
echo "   CREATE DATABASE polygraalx OWNER polygraal_user;"
echo ""
echo "5. La connection string sera alors:"
echo "   postgresql://polygraal_user:ton_mot_de_passe@localhost:5432/polygraalx"
echo ""
