# 🚀 DÉPLOIEMENT RADAR v2.0 - COMMANDES À COPIER-COLLER

## ⚡ MÉTHODE RAPIDE (5 minutes)

**Connectez-vous en SSH à votre VPS, puis copiez-collez :**

```bash
cd /root/bot
pm2 stop polyradar-whale-tracker
pm2 delete polyradar-whale-tracker
git fetch origin
git reset --hard origin/main
git pull origin main
pip3 install -r scripts/whale_tracker_requirements.txt
npx prisma generate
npx prisma migrate deploy
npm install
npm run build
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
pm2 list
```

**C'est tout ! Attendez 30 secondes puis ouvrez :**
`http://votre-serveur:3000/dashboard/radar`

---

## ✅ CE QUE VOUS DEVRIEZ VOIR APRÈS

**Avant (screenshot actuel) :**
- ❌ "Market #90560"
- ❌ Anciens tags
- ❌ Pas de modal

**Après (nouveau système) :**
- ✅ "🐋 Whale Radar v2.0"
- ✅ Questions de marché complètes
- ✅ Tags: WINNER (vert), INSIDER (orange), LOOSER (rouge)
- ✅ Click transaction → Modal détails
- ✅ Bouton "View on Polymarket" fonctionnel

---

## 🐛 SI PROBLÈME

**Voir les logs :**
```bash
pm2 logs whale-tracker
```

**Redémarrer :**
```bash
pm2 restart whale-tracker
```

**Mode simulation (test sans RPC) :**
```bash
pm2 stop whale-tracker
pm2 delete whale-tracker
WHALE_TRACKER_MODE=simulation pm2 start scripts/whale_tracker.py --interpreter python3 --name whale-tracker
pm2 save
```

---

**Voilà ! Le nouveau système sera déployé en 5 minutes. 🎯**
