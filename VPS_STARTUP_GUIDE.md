# Guide de Démarrage VPS - PolyGraalX V1

## Localisation du Projet

Le projet est probablement dans l'un de ces répertoires:
- `/var/www/polygraalx`
- `/var/www/botpolymarket`
- `/home/deploy/polygraalx`
- `/opt/polygraalx`

## Commandes pour Trouver et Démarrer

### 1. Trouver le projet
```bash
# Chercher le répertoire du projet
find / -name "package.json" -path "*/botpolymarket/*" 2>/dev/null | head -5

# Ou chercher par nom
find / -type d -name "botpolymarket" 2>/dev/null
```

### 2. Se déplacer dans le bon répertoire
```bash
# Exemple (ajuster selon le résultat ci-dessus)
cd /var/www/botpolymarket
# ou
cd /home/deploy/botpolymarket
```

### 3. Vérifier que vous êtes dans le bon dossier
```bash
ls -la
# Vous devriez voir: package.json, src/, scripts/, etc.
```

### 4. Installer les dépendances (si nécessaire)
```bash
npm install
```

### 5. Lancer en développement
```bash
npm run dev
```

### 6. Ou lancer en production avec PM2
```bash
# Build
npm run build

# Start avec PM2
pm2 start npm --name "polygraalx-v1" -- start

# Voir les logs
pm2 logs polygraalx-v1

# Status
pm2 status
```

## Accès depuis l'extérieur

Si vous voulez accéder depuis votre navigateur local:

### Option 1: Tunnel SSH
Sur votre machine locale (Windows):
```powershell
ssh -L 3000:localhost:3000 root@VOTRE_IP_VPS
```
Puis accédez à `http://localhost:3000`

### Option 2: Ouvrir le port
Sur le VPS:
```bash
# Ouvrir le port 3000
ufw allow 3000

# Vérifier
ufw status
```
Puis accédez à `http://VOTRE_IP_VPS:3000`

## Production (Port 80/443)

Pour production avec Nginx:
```bash
# Build
npm run build

# PM2 start
pm2 start npm --name "polygraalx-v1" -- start

# Nginx proxy vers le port 3000
# Voir /etc/nginx/sites-available/polygraalx
```

## Variables d'Environnement

Assurez-vous que `.env` existe dans le répertoire du projet:
```bash
cat .env
```

Si absent, créez-le:
```bash
nano .env
# Ajoutez vos variables
# NEXT_PUBLIC_BOT_USERNAME=...
# TELEGRAM_BOT_TOKEN=...
# DATABASE_URL=...
```

## Common Issues

### Port déjà utilisé
```bash
# Trouver le processus sur le port 3000
lsof -i :3000

# Tuer le processus
kill -9 PID
```

### Rebuild nécessaire
```bash
rm -rf .next node_modules
npm install
npm run build
```
