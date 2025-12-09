# 🚀 Quick Start - Smart Alert System

## Setup Automatique

Lancez simplement cette commande pour tout configurer automatiquement :

```bash
npm run setup:alerts
```

Le script va :
- ✅ Créer `.env.local` si nécessaire
- ✅ Vérifier les variables d'environnement
- ✅ Migrer la base de données
- ✅ Installer les dépendances manquantes
- ✅ Tester la connexion Telegram
- ✅ Envoyer un message de confirmation

## Configuration Telegram

### 1. Trouvez votre Telegram ID

Envoyez `/start` à [@userinfobot](https://t.me/userinfobot) sur Telegram.

Il vous répondra avec votre ID numérique (ex: `123456789`).

### 2. Ajoutez vos credentials dans `.env.local`

```env
# Votre bot token (existant)
TELEGRAM_BOT_TOKEN=votre_token_ici

# NOUVEAU: Votre ID personnel
OWNER_TELEGRAM_ID=123456789
```

### 3. Relancez le setup

```bash
npm run setup:alerts
```

Vous recevrez un message de confirmation sur Telegram ! 🎉

## Utilisation

### Démarrer le système

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Listener (pour auto-checks)
node scripts/hyper-listener.js
```

### Créer une alerte

1. Allez sur: `http://localhost:3000/dashboard/market-intelligence`
2. Cliquez **"New Alert"**
3. Configurez votre alerte
4. Activez **Telegram** ✅
5. Créez !

### Tester

Créez une alerte simple:
- **Type**: Score Trigger
- **Min Score**: 30 (facile à trigger)
- **Telegram**: ✅ Activé

Le listener va rapidement trouver des marchés et vous envoyer une notification !

## Notes Importantes

### 🔒 Sécurité

- ⚠️ **Les notifications vont UNIQUEMENT à votre `OWNER_TELEGRAM_ID`**
- Même si la page est publique, seul VOUS recevez les alertes
- Personne d'autre ne peut créer d'alertes sans accès à la DB

### 📱 Telegram

- Le bot DOIT avoir démarré une conversation avec vous
- Envoyez `/start` à votre bot d'abord
- Sinon il ne pourra pas vous envoyer de messages

### 🔄 Refresh

Si vous modifiez `.env.local`:
```bash
# Redémarrer dev server
Ctrl+C puis npm run dev

# Redémarrer listener  
Ctrl+C puis node scripts/hyper-listener.js
```

## Commandes Utiles

```bash
# Setup complet
npm run setup:alerts

# Voir les logs du listener
node scripts/hyper-listener.js

# Prisma Studio (voir/éditer DB)
npx prisma studio

# Reset DB (DANGER)
npx prisma migrate reset
```

## Troubleshooting

**"Telegram test failed"**
- Vérifiez votre `TELEGRAM_BOT_TOKEN`
- Vérifiez votre `OWNER_TELEGRAM_ID`
- Envoyez `/start` à votre bot d'abord

**"DATABASE_URL not found"**
- Ajoutez votre URL Supabase dans `.env.local`
- Format: `postgresql://user:pass@host:5432/dbname`

**"No alerts triggered"**
- Le listener doit tourner en arrière-plan
- Créez des alertes avec score bas (30-40) pour tester
- Vérifiez les logs du listener

---

**Enjoy your personal Smart Alert System! 🚀🔔**
