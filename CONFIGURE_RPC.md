# 🔐 CONFIGURER POLYGON RPC

## ⚡ Quick Setup (5 minutes)

Pour obtenir des **vraies données blockchain** au lieu de simulation :

### 1. Créer un compte Alchemy (GRATUIT)

🔗 **https://dashboard.alchemy.com/**

1. Sign Up (gratuit)
2. Create New App
3. Chain: **Polygon**
4. Network: **Mainnet**
5. Name: PolygraalX Radar

### 2. Copier le WebSocket URL

Dans votre app Alchemy:
1. Click "View Key"
2. Scroll down à **WEBSOCKETS**
3. Copier l'URL qui commence par: `wss://polygon-mainnet.g.alchemy.com/v2/...`

### 3. Ajouter à GitHub Secrets

🔗 **https://github.com/ExiZfr/PolygraalX/settings/secrets/actions**

1. Click **"New repository secret"**
2. Name: `POLYGON_RPC_WSS`
3. Value: Coller votre URL WebSocket
4. Click **"Add secret"**

### 4. Re-déployer

Une fois le secret ajouté:

```bash
git commit --allow-empty -m "trigger: Enable production mode"
git push origin main
```

OU juste attendre le prochain push automatique.

---

## ✅ Vérification

Après déploiement, vérifier en SSH:

```bash
# Voir logs whale-tracker
pm2 logs whale-tracker --lines 50

# Vous devriez voir:
# ✅ Connected to Polygon RPC via WebSocket
# 🔍 Listening for OrderFilled events...
```

---

## 🎯 Différence Simulation vs Production

| Feature | Simulation | Production |
|---------|-----------|-----------|
| **Source** | Données fictives | Vraie blockchain Polygon |
| **Fréquence** | 1 whale / 10-15s | Dépend activité réelle |
| **Tags** | Vrais (WINNER, INSIDER...) | Vrais (WINNER, INSIDER...) |
| **RPC requis** | ❌ Non | ✅ Oui (Alchemy/Infura) |
| **Coût** | Gratuit | Gratuit (Alchemy free tier) |

---

## 🔧 Alternatives à Alchemy

**Infura** (https://infura.io/):
```
wss://polygon-mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
```

**QuickNode** (https://www.quicknode.com/):
```
wss://your-endpoint.quiknode.pro/YOUR_KEY/
```

**Polygon Public RPC** (gratuit mais moins stable):
```
wss://polygon-rpc.com/
```

---

**Une fois configuré, le Radar détectera automatiquement les VRAIES whales en temps réel ! 🐋**
