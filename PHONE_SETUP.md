# 📱 Guide - Ajouter des Numéros de Téléphone pour WhatsApp

Ce guide vous aide à ajouter les numéros de téléphone des administrateurs et commerciaux pour permettre l'envoi de messages WhatsApp.

## 🚀 Étapes Rapides

### 1️⃣ Voir la liste des utilisateurs

```bash
cd backend
npm run users:list
```

Cela affiche tous les admins et commerciaux avec leurs numéros actuels:

```
1. admin_user (admin)
   Rôle: admin
   Email: admin@example.com
   ❌ Téléphone: (aucun)

2. john_commercial (commercial)
   Rôle: commercial
   Email: john@example.com
   ✅ Téléphone: +33612345678

📊 Résumé:
   • Total: 2
   • Avec téléphone: 1
   • Sans téléphone: 1
```

### 2️⃣ Ajouter les numéros de téléphone

```bash
npm run users:add-phones
```

Le script va vous présenter chaque utilisateur et vous demander son numéro:

```
1. admin_user (admin)
   Email: admin@example.com
   Téléphone actuel: (aucun)

Numéro pour admin_user (admin) [format: +33612345678 ou vide pour passer]: 
```

**Formats acceptés:**
- ✅ `+33612345678` (international avec +)
- ✅ `33612345678` (sera automatiquement converti en +33612345678)
- ✅ `+33 6 12 34 56 78` (espaces supprimés automatiquement)
- ❌ Laisser vide pour passer cet utilisateur

### 3️⃣ Vérifier le résumé

Après avoir rempli tous les numéros, vous verrez:

```
✅ Mise à jour terminée!

📊 Résumé:
   • Total utilisateurs: 5
   • Avec téléphone: 5
   • Sans téléphone: 0
```

## 📋 Formats de Numéros de Téléphone

Voici les formats pour différents pays:

| Pays | Format | Exemple |
|------|--------|---------|
| 🇫🇷 France | +33 | +33612345678 |
| 🇬🇧 UK | +44 | +447911123456 |
| 🇺🇸 USA | +1 | +12015551234 |
| 🇩🇪 Allemagne | +49 | +491234567890 |
| 🇮🇹 Italie | +39 | +391234567890 |
| 🇪🇸 Espagne | +34 | +341234567890 |
| 🇵🇹 Portugal | +351 | +351912345678 |
| 🇧🇪 Belgique | +32 | +321234567890 |
| 🇬🇷 Grèce | +30 | +301234567890 |
| 🇳🇱 Pays-Bas | +31 | +31612345678 |

## ⚙️ Comment Cela Fonctionne

### Architecture Globale

```
Client valide commande
    ↓
POST /orders/client
    ↓
Crée commande MongoDB
    ↓
createOrderValidationNotifications()
    ├─→ Crée notification in-app pour COMMERCIAL
    ├─→ Crée notifications in-app pour TOUS ADMINS
    ├─→ Récupère phone du COMMERCIAL depuis DB
    ├─→ Récupère phone de CHAQUE ADMIN depuis DB
    ├─→ Envoie WhatsApp au COMMERCIAL (via Twilio) ✅
    └─→ Envoie WhatsApp à CHAQUE ADMIN (via Twilio) ✅
```

### Message WhatsApp Envoyé

```
✅ Commande validée: Commande #6789abcd pour Jean Dupont 
a été confirmée. Veuillez procéder au traitement.
```

## 🔑 Dépendances Requises

Pour que les WhatsApp fonctionnent, assurez-vous que:

1. ✅ **Numéros de téléphone remplis** ← C'est ce guide!
2. ⏳ **Variables Vercel configurées** → Voir ci-dessous

### Variables d'Environnement Nécessaires

Dans le fichier `.env` (ou sur Vercel):

```env
# WhatsApp / Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=+1234567890
```

**Où obtenir ces infos:**
1. Créez un compte Twilio: https://www.twilio.com/
2. Récupérez `ACCOUNT_SID` et `AUTH_TOKEN` depuis la console
3. Configurez un numéro WhatsApp dans Twilio
4. Ajoutez les variables à votre `.env` local ET sur Vercel

## 🧪 Test Local

Pour vérifier que tout fonctionne:

1. **Démarrez le backend:**
   ```bash
   npm start
   ```

2. **Testez les notifications:**
   ```bash
   npm run test:notifications
   ```

3. **Vérifiez les logs:**
   ```
   ✅ Notification créée pour admin
   ✅ Message WhatsApp envoyé à +33612345678
   ```

## 🔐 Sécurité

- Les numéros de téléphone ne sont **jamais** logués en clair
- Seul le backend a accès aux numéros
- Les messages WhatsApp utilisent l'API sécurisée de Twilio

## ❓ Dépannage

### "❌ MONGO_URL non défini"
→ Assurez-vous que `.env` contient `MONGO_URL=...`

### "Format invalide!"
→ Utilisez le format: `+33612345678` ou simplement `33612345678`

### Les WhatsApp ne s'envoient pas
→ Vérifiez les variables Twilio dans `.env`:
   - `TWILIO_ACCOUNT_SID` ✓
   - `TWILIO_AUTH_TOKEN` ✓
   - `TWILIO_WHATSAPP_FROM` ✓

### "Impossible de charger les notifications" en production
→ Configurez les variables sur le dashboard Vercel

## 📚 Fichiers Utilisés

- `backend/add-phone-numbers.js` - Script interactif pour ajouter les phones
- `backend/list-users.js` - Affiche la liste des users
- `backend/models/User.js` - Schéma avec champ `phone`
- `backend/routes/api/orders.js` - Logique d'envoi des notifications
- `backend/utils/whatsapp.js` - Intégration Twilio

## ✅ Checklist Complète

- [ ] Exécuter `npm run users:list`
- [ ] Exécuter `npm run users:add-phones` et remplir tous les numéros
- [ ] Vérifier avec `npm run users:list` que tous les phones sont là
- [ ] Configurer les variables Twilio dans `.env`
- [ ] Tester localement avec `npm run test:notifications`
- [ ] Configurer les variables sur Vercel
- [ ] Redéployer sur Vercel
- [ ] Tester en production

Vous avez des questions? 🚀
