# FIX URGENT - Login Page Error

## Problème
La page de login affiche une erreur client-side au lieu du widget Telegram.

## Cause
La variable `.env.local` contient `VOTRE_BOT_USERNAME` au lieu du vrai nom du bot.

## Solution Rapide

### 1. Éditer .env.local
```bash
# Ouvrir le fichier
notepad .env.local

# Remplacer
NEXT_PUBLIC_BOT_USERNAME=VOTRE_BOT_USERNAME

# Par (utilisez le vrai nom de votre bot)
NEXT_PUBLIC_BOT_USERNAME=Plmktradingbot
```

### 2. Redémarrer le serveur dev
```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

### 3. Vider le cache du navigateur
- Ouvrir DevTools (F12)
- Right-click sur le bouton refresh → "Empty Cache and Hard Reload"
- Ou `Ctrl+Shift+Delete` → Cocher "Cached images and files"

## Vérification

### Fichier .env.local doit contenir:
```env
NEXT_PUBLIC_BOT_USERNAME=Plmktradingbot
```

### Console navigateur (F12)
Si tout fonctionne, vous devriez voir:
```
Checking Telegram WebApp... undefined
```

Si vous voyez des erreurs, vérifiez que:
1. Le nom du bot est correct
2. Le bot existe sur Telegram (@BotFather)
3. Le bot a le login widget activé

## Alternative: Modifier directement le code

Si vous voulez éviter les problèmes d'env, hardcodez le nom:

```tsx
// Dans src/app/(auth)/login/page.tsx ligne 108
const BOT_USERNAME = "Plmktradingbot"  // ← Hardcodé
```

## Tester

1. Accéder à `http://localhost:3000/login`
2. Vous devriez voir le bouton Telegram bleu
3. Cliquer dessus devrait ouvrir la popup Telegram

## Si ça ne fonctionne toujours pas

Vérifier que votre bot Telegram:
1. Existe (@Plmktradingbot)
2. A le login widget activé sur BotFather:
   ```
   /mybots → Sélectionner bot → Bot Settings → Domain → polygraalx.app
   ```
