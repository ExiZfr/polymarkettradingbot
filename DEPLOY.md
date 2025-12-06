# Guide de Déploiement VPS

Ce guide vous explique comment mettre en ligne votre **Polymarket Bot & TWA** sur un serveur VPS (Ubuntu/Debian recommandé).

## Pré-requis
*   Un VPS (DigitalOcean, Hetzner, AWS, etc.) avec au moins 2GB de RAM.
*   Un nom de domaine (ex: `monbot.com`) pointant vers l'IP du VPS (Obligatoire pour Telegram/HTTPS).
*   Docker & Docker Compose installés sur le VPS.

## Étape 1 : Préparer le VPS
Connectez-vous à votre VPS en SSH :
```bash
ssh root@votre-ip-vps
```

Installez Docker si ce n'est pas fait :
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## Étape 2 : Transférer les fichiers
Depuis votre ordinateur local (où se trouve le code), copiez le dossier du projet vers le VPS.
*Option A (Git)* : Poussez votre code sur GitHub/GitLab et faites un `git clone` sur le VPS.
*Option B (SCP)* :
```bash
# Depuis votre terminal local (pas dans le VPS)
scp -r c:\Users\santa\Desktop\botpolymarket root@votre-ip-vps:/root/app
```

## Étape 3 : Configuration
Sur le VPS, allez dans le dossier :
```bash
cd /root/app
```

Créez le fichier de configuration de production :
```bash
cp frontend/env.example frontend/.env.local
nano frontend/.env.local
```
**Modifications importantes pour la PROD :**
*   `NEXT_PUBLIC_SUPABASE_URL` : Si vous utilisez la DB locale, laissez vide ou mettez l'URL de votre API.
*   `DATABASE_URL` : `postgresql://user:password@db:5432/polymarket_bot` (C'est l'URL interne Docker, ne changez pas `db` ni le port).

## Étape 4 : Lancer l'application
Utilisez le script fourni :
```bash
chmod +x deploy.sh
./deploy.sh
```
Ce script va :
1.  Construire les images Docker.
2.  Lancer les conteneurs (Frontend, Backend, DB).
3.  Créer les tables SQL automatiquement.

## Étape 5 : HTTPS (Obligatoire pour Telegram)
Telegram refuse d'ouvrir les Mini Apps qui ne sont pas en HTTPS.
La méthode la plus simple est d'utiliser **Cloudflare Tunnel** (Gratuit et sécurisé) ou **Nginx Proxy Manager**.

### Méthode Cloudflare Tunnel (Recommandée)
1.  Installez `cloudflared` sur le VPS.
2.  Lancez un tunnel pointant vers `http://localhost:3000`.
3.  Cloudflare vous donnera une URL `https://...` sécurisée.
4.  Donnez cette URL à @BotFather pour votre Web App.

### Méthode Nginx (Classique)
Installez Nginx et Certbot, puis configurez un `proxy_pass` vers `http://localhost:3000`.

## Vérification
Ouvrez votre navigateur sur `http://votre-ip-vps:3000`. Vous devriez voir la page de Login.
