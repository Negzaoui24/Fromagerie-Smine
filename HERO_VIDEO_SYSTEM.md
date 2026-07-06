# 🎬 Configuration Vidéo Hero - Système Centralisé

## 📋 Vue d'ensemble

Un système centralisé a été mis en place pour charger la vidéo hero `videoHero.mp4` sur **toutes les pages** au lancement de l'application.

## 🏗️ Architecture

### 1. Hook personnalisé: `useClientHeroMedia`
**Fichier**: `src/hooks/useClientHeroMedia.js`

```javascript
const { clientHeroMedia, setClientHeroMedia } = useClientHeroMedia();
```

**Fonctionnalités:**
- ✅ Charge automatiquement `/videoHero.mp4` par défaut au démarrage
- ✅ Gère le cache localStorage
- ✅ Support du fallback legacy `clientHeroVideo`
- ✅ Synchronise entre les pages
- ✅ Fournit une fonction `setClientHeroMedia()` pour modifier la vidéo

### 2. Pages utilisant le hook

Toutes les pages suivantes utilisent maintenant le hook:

1. **Home.js** - Page d'accueil client
2. **gros.js** - Page gros (wholesale)
3. **ClientDashboard.js** - Tableau de bord client

### 3. Flux de chargement

```
App démarre
    ↓
Page chargée
    ↓
useClientHeroMedia() appelé
    ↓
Cherche dans localStorage
    ↓
Si pas trouvé → Charge /videoHero.mp4 par défaut
    ↓
Affiche la vidéo
```

## 📁 Fichiers modifiés

```
src/
├── hooks/
│   └── useClientHeroMedia.js (NOUVEAU)
├── pages/
│   ├── Home.js (modifié)
│   ├── gros.js (modifié)
│   └── ClientDashboard.js (modifié)
└── public/
    └── videoHero.mp4 (existant)
```

## 🚀 Utilisation dans une nouvelle page

Pour ajouter la vidéo hero à une nouvelle page:

```javascript
import useClientHeroMedia from "../hooks/useClientHeroMedia";

function NewPage() {
  const { clientHeroMedia } = useClientHeroMedia();

  return (
    <section className="hero-video">
      {clientHeroMedia?.kind === "video" ? (
        <video autoPlay muted loop playsInline>
          <source src={clientHeroMedia.src} type="video/mp4" />
        </video>
      ) : null}
    </section>
  );
}
```

## 🎯 Comportement par défaut

| Scénario | Résultat |
|----------|----------|
| Premier lancement | `/videoHero.mp4` chargée automatiquement |
| Admin change la vidéo | Nouvelle vidéo sauvegardée en localStorage |
| Rechargement page | Vidéo du localStorage affichée |
| localStorage vidé | `/videoHero.mp4` reloadée par défaut |

## 🔧 Modifier la vidéo par défaut

Pour changer la vidéo par défaut au lancement, modifier dans `useClientHeroMedia.js`:

```javascript
const defaultHero = {
  kind: "video",
  src: "/videoHero.mp4",  // ← Changer ce chemin
  name: "videoHero"
};
```

## 📊 LocalStorage

Les données sauvegardées dans localStorage:

```json
{
  "clientHeroMedia": {
    "kind": "video",
    "src": "/videoHero.mp4",
    "name": "videoHero"
  }
}
```

## ✅ Avantages du système

1. **Centralisé** - Un seul endroit pour gérer le media hero
2. **Réutilisable** - Facile à ajouter à de nouvelles pages
3. **Performant** - Cache localStorage
4. **Robuste** - Gestion d'erreurs et fallbacks
5. **Flexible** - Support vidéos et images
6. **Synchronisé** - Les changements se reflètent partout

## 🐛 Dépannage

### La vidéo ne s'affiche pas
1. Vérifier que `videoHero.mp4` existe dans `/public`
2. Vérifier que le chemin est correct: `/videoHero.mp4`
3. Ouvrir la console (F12) pour les erreurs

### localStorage problématique
```javascript
// Vider et réinitialiser
localStorage.removeItem("clientHeroMedia");
// La page rechargera la vidéo par défaut
```

### Tester dans la console
```javascript
// Voir la vidéo actuelle
JSON.parse(localStorage.getItem("clientHeroMedia"))

// Réinitialiser
localStorage.removeItem("clientHeroMedia");
location.reload();
```
