# 🚀 Guide de Configuration Vercel

## Problème Identifié

L'erreur **"Impossible de charger les notifications"** signifie que:
1. Le frontend ne sait pas où appeler le backend
2. Les variables d'environnement ne sont pas configurées
3. CORS bloque les requêtes

## ✅ Solution

### Étape 1: Vérifier les URLs Vercel

Vous avez probablement 2 déploiements Vercel:
- **Frontend**: https://fromagerie-smine-1ut6.vercel.app
- **Backend**: https://fromagerie-smine-swart.vercel.app

### Étape 2: Configurer le Frontend

1. Ouvrir Vercel Dashboard
2. Sélectionner le projet **Frontend**
3. Aller dans `Settings > Environment Variables`
4. **Ajouter** ou **modifier**:
   ```
   REACT_APP_API_URL=https://fromagerie-smine-swart.vercel.app
   ```
5. **Redéployer** le frontend

### Étape 3: Configurer le Backend

1. Ouvrir Vercel Dashboard
2. Sélectionner le projet **Backend**
3. Aller dans `Settings > Environment Variables`
4. **Vérifier** que ces variables existent:

   ```
   MONGO_URL=mongodb+srv://oussamaNegzaoui:oussamaNegzaoui@cluster0.mhe6vf.mongodb.net/fromagerie_db?appName=Cluster0
   JWT_SECRET=jwtSecret
   CLIENT_URL=https://fromagerie-smine-1ut6.vercel.app
   FRONTEND_URL=https://fromagerie-smine-1ut6.vercel.app
   ```

5. **Redéployer** le backend

### Étape 4: Tester

1. Accéder au **Frontend**: https://fromagerie-smine-1ut6.vercel.app
2. Ouvrir la **Console** (F12)
3. Vérifier que vous voyez: `🔌 API URL configurée: https://fromagerie-smine-swart.vercel.app`
4. Essayer de vous connecter
5. Vérifier que les notifications se chargent

## 🔍 Dépannage

### Si le message "Veuillez réessayer dans quelques secondes" persiste:

1. Vérifier les Logs Vercel (Backend):
   ```
   Vercel Dashboard → Backend → Deployments → Function Logs
   ```

2. Tester l'endpoint health:
   ```
   https://fromagerie-smine-swart.vercel.app/health
   ```
   Devrait retourner:
   ```json
   {
     "status": "ok",
     "mongodb": "✅ Connecté"
   }
   ```

3. Si MongoDB n'est pas connecté, vérifier `MONGO_URL` dans Vercel

### Si "Impossible de charger les notifications":

1. Vérifier que `REACT_APP_API_URL` est correctement défini
2. Ouvrir DevTools (F12) → Console
3. Chercher les erreurs CORS ou 500
4. Vérifier les logs du backend

## 📋 Variable d'Environnement FINALE

### Backend (Vercel)
```
MONGO_URL=mongodb+srv://oussamaNegzaoui:oussamaNegzaoui@cluster0.mhe6vf.mongodb.net/fromagerie_db?appName=Cluster0
JWT_SECRET=jwtSecret
TOKEN_EXPIRE=2592000
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=+1234567890
CLIENT_URL=https://fromagerie-smine-1ut6.vercel.app
FRONTEND_URL=https://fromagerie-smine-1ut6.vercel.app
NODE_ENV=production
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://fromagerie-smine-swart.vercel.app
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## ✨ Si vous déployez le backend ailleurs:

Modifier dans le Frontend:
```javascript
REACT_APP_API_URL=https://votreurl-backend.vercel.app
```

---

**Questions? Exécutez sur votre machine locale:**
```bash
cd backend
npm run diagnose
```
