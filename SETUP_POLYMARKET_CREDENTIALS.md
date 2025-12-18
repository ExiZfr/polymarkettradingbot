# 🔐 Configuration des Credentials Polymarket

## Étape 1 : Obtenir tes Credentials API

### 1.1 Crée ton compte Polymarket API
1. Va sur https://polymarket.com/settings/api
2. Clique sur **"Generate API Key"**
3. **SAUVEGARDE** immédiatement :
   - API Key
   - API Secret
   - Passphrase

> ⚠️ **CRITICAL** : Ces credentials ne s'affichent qu'une seule fois !

### 1.2 Récupère ta Private Key (EOA Wallet)
- Depuis MetaMask : **Settings → Security & Privacy → Reveal Private Key**
- Format : `0x...` (64 caractères hex après 0x)

### 1.3 Trouve ton Proxy Wallet Address
1. Va sur https://polymarket.com/wallet
2. Copie l'adresse sous **"Proxy Wallet"**
3. Format : `0x...` (adresse Ethereum standard)

---

## Étape 2 : Configure le fichier .env

```bash
# Dans le dossier PolygraalX
cp env.polymarket.example .env
nano .env  # ou ton éditeur préféré
```

Remplis avec tes vraies credentials :

```bash
# Private Key (commence par 0x)
PK=0xVOTRE_PRIVATE_KEY_ICI

# API Credentials de Polymarket
CLOB_API_KEY=votre_api_key_ici
CLOB_SECRET=votre_secret_ici
CLOB_PASSPHRASE=votre_passphrase_ici

# Proxy Wallet Address
PROXY_ADDRESS=0xVOTRE_PROXY_ADDRESS_ICI
```

---

## Étape 3 : Sécurise ton .env

```bash
# Assure-toi que .env est dans .gitignore
echo ".env" >> .gitignore

# Permissions Linux/Mac (si applicable)
chmod 600 .env
```

---

## Étape 4 : Vérifie que ça marche

```bash
# Installe les dépendances
pip install -r requirements-polymarket.txt

# Test de connexion
python scripts/polymarket_trader.py
```

Tu devrais voir :
```
🚀 Initializing PolymarketTrader
✅ Connected to Polymarket CLOB (Chain ID: 137)
📍 Proxy Wallet: 0x12345678...abcdef12
💰 Fetching USDC balance...
✅ Current USDC Balance: $XXX.XX
```

---

## ⚠️ Sécurité - CHECK-LIST

- [ ] `.env` n'est PAS commité dans git
- [ ] Private Key commence par `0x` et fait 66 caractères
- [ ] Proxy Wallet a de l'USDC dessus
- [ ] API credentials sont corrects (testés)
- [ ] Fichier .env a les bonnes permissions

---

## 🆘 Troubleshooting

### "Missing env variables"
→ Vérifie que toutes les variables sont remplies dans `.env`

### "Failed to initialize CLOB client"
→ Vérifie que les API credentials sont corrects

### "Balance is 0"
→ Dépose de l'USDC sur ton Proxy Wallet via Polymarket UI

---

**✅ Prêt pour le trading réel !**
