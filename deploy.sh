#!/bin/bash

# Arrêter le script en cas d'erreur
set -e

echo "🚀 Démarrage du déploiement..."

# 1. Récupérer les dernières modifications
echo "📥 Pull du code depuis GitHub..."
git fetch origin
git reset --hard origin/main  # Force la mise à jour exacte comme sur le repo
git pull origin main

# Détection de la commande Docker Compose
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Erreur : Docker Compose n'est pas installé."
    exit 1
fi

echo "🐳 Utilisation de : $COMPOSE_CMD"

# 2. Rebuild et redémarrage des conteneurs
echo "🐳 Redémarrage des conteneurs Docker..."
$COMPOSE_CMD down
$COMPOSE_CMD up -d --build

# 3. Nettoyage (optionnel)
echo "🧹 Nettoyage des images inutilisées..."
docker image prune -f

echo "✅ Déploiement terminé avec succès !"
