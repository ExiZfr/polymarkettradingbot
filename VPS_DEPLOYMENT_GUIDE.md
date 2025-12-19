# Déploiement PolyGraalX V1 sur VPS - Guide Complet

## Option 1: Cloner depuis GitHub (Recommandé)

### Sur le VPS:

```bash
# 1. Aller dans le répertoire web
cd /var/www

# 2. Cloner le projet (si vous avez un repo GitHub)
git clone https://github.com/ExiZfr/PolygraalX.git botpolymarket
cd botpolymarket

# 3. Installer les dépendances
npm install

# 4. Copier et configurer .env
cp .env.example .env
nano .env
# Remplir les variables d'environnement

# 5. Build production
npm run build

# 6. Démarrer avec PM2
pm2 start npm --name "polygraalx-v1" -- start
pm2 save
pm2 startup

# 7. Vérifier
pm2 status
pm2 logs polygraalx-v1
```

---

## Option 2: Transfer depuis votre PC local

### Sur votre PC Windows (PowerShell):

```powershell
# Se placer dans le dossier du projet
cd C:\Users\santa\Desktop\botpolymarket

# Transfer via SCP (remplacer VOTRE_IP_VPS)
scp -r * root@VOTRE_IP_VPS:/var/www/botpolymarket/

# Ou utiliser rsync (si disponible)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' . root@VOTRE_IP_VPS:/var/www/botpolymarket/
```

### Sur le VPS (après transfer):

```bash
# Aller dans le répertoire
cd /var/www/botpolymarket

# Installer dépendances
npm install

# Build
npm run build

# Démarrer
pm2 start npm --name "polygraalx-v1" -- start
```

---

## Option 3: Utiliser Git Deployment (le plus professionnel)

### 1. Sur GitHub:
- Pushez votre code: `git push origin main`

### 2. Sur le VPS:
```bash
# Créer le répertoire
mkdir -p /var/www/botpolymarket
cd /var/www/botpolymarket

# Cloner
git clone https://github.com/ExiZfr/PolygraalX.git .

# Installer
npm install

# Variables d'environnement
nano .env
```

Ajoutez dans `.env`:
```env
# Telegram
NEXT_PUBLIC_BOT_USERNAME=Plmktradingbot
TELEGRAM_BOT_TOKEN=your_token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/polygraalx

# Polymarket
POLY_PRIVATE_KEY=0x...
CLOB_API_KEY=...
CLOB_SECRET=...
CLOB_PASSPHRASE=...

# Next.js
NODE_ENV=production
NEXT_PUBLIC_VERCEL_ENV=production
```

```bash
# Build
npm run build

# Démarrer
pm2 start npm --name "polygraalx-v1" -- start
pm2 save
```

---

## Configuration Nginx (pour accès via nom de domaine)

### Créer config Nginx:

```bash
nano /etc/nginx/sites-available/polygraalx
```

Contenu:
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer:
```bash
ln -s /etc/nginx/sites-available/polygraalx /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## SSL avec Let's Encrypt (HTTPS)

```bash
# Installer certbot
apt install certbot python3-certbot-nginx -y

# Obtenir certificat
certbot --nginx -d votre-domaine.com

# Auto-renewal
certbot renew --dry-run
```

---

## Vérification Post-Déploiement

```bash
# Status PM2
pm2 status

# Logs
pm2 logs polygraalx-v1 --lines 50

# Tester localement
curl http://localhost:3000

# Tester depuis l'extérieur
curl http://VOTRE_IP_VPS

# Ports ouverts
ufw status
ufw allow 80
ufw allow 443
ufw allow 3000  # Si accès direct
```

---

## Commandes Utiles PM2

```bash
# Restart
pm2 restart polygraalx-v1

# Stop
pm2 stop polygraalx-v1

# Delete
pm2 delete polygraalx-v1

# Monitoring
pm2 monit

# Logs en temps réel
pm2 logs polygraalx-v1 --lines 100 --raw
```

---

## Mise à Jour (après modifications)

### Via Git:
```bash
cd /var/www/botpolymarket
git pull origin main
npm install
npm run build
pm2 restart polygraalx-v1
```

### Via SCP (depuis PC):
```powershell
# Sur Windows
scp -r src/* root@VOTRE_IP_VPS:/var/www/botpolymarket/src/
```

```bash
# Sur VPS
cd /var/www/botpolymarket
npm run build
pm2 restart polygraalx-v1
```

---

## Troubleshooting

### Port 3000 déjà utilisé
```bash
lsof -i :3000
kill -9 PID
pm2 restart polygraalx-v1
```

### Build fails
```bash
cd /var/www/botpolymarket
rm -rf .next node_modules
npm install
npm run build
```

### Database connection error
```bash
# Vérifier PostgreSQL
systemctl status postgresql

# Tester connexion
psql -U postgres -d polygraalx
```

### Logs errors
```bash
pm2 logs polygraalx-v1 --err --lines 100
```

---

## Structure du Projet sur VPS

```
/var/www/botpolymarket/
├── .next/              # Build Next.js
├── node_modules/       # Dépendances
├── public/             # Assets statiques
├── scripts/            # Scripts Python (Oracle)
├── src/               # Code source
│   ├── app/           # Pages Next.js
│   ├── components/    # Composants React
│   ├── lib/           # Utilities
│   └── archive/       # Anciens modules
├── .env               # Variables d'env (NE PAS COMMIT)
├── package.json       # Dépendances
└── next.config.ts     # Config Next.js
```

---

## Quick Start (résumé)

```bash
# 1. Créer répertoire
mkdir -p /var/www/botpolymarket
cd /var/www/botpolymarket

# 2. Cloner ou transférer projet
git clone https://github.com/ExiZfr/PolygraalX.git .

# 3. Setup
npm install
cp .env.example .env
nano .env  # Configurer

# 4. Build
npm run build

# 5. Start
pm2 start npm --name "polygraalx-v1" -- start
pm2 save

# 6. Vérifier
curl http://localhost:3000
```

Votre app sera accessible sur `http://VOTRE_IP_VPS:3000`
