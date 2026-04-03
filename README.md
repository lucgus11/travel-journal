# ✈️ Carnet de Voyage PWA

Une Progressive Web App complète pour immortaliser vos aventures — journal enrichi, galerie photo/vidéo, montage, cartes interactives, budget, checklists et bien plus. **100% hors-ligne** grâce à IndexedDB + Service Worker.

![Preview](https://img.shields.io/badge/PWA-Ready-brightgreen) ![Offline](https://img.shields.io/badge/Offline-First-blue) ![React](https://img.shields.io/badge/React-18-61dafb)

---

## 🚀 Déploiement en 5 minutes

### Étape 1 — Fork & clone

```bash
git clone https://github.com/VOTRE_USERNAME/carnet-voyage.git
cd carnet-voyage
npm install
```

### Étape 2 — Push sur GitHub

```bash
git init
git add .
git commit -m "feat: carnet de voyage PWA initial"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/carnet-voyage.git
git push -u origin main
```

### Étape 3 — Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) → **New Project**
2. Importez votre repo GitHub `carnet-voyage`
3. **Framework Preset** : Vite *(détecté automatiquement)*
4. **Build Command** : `npm run build`
5. **Output Directory** : `dist`
6. Cliquez **Deploy** → ✅ Votre app est en ligne !

> **URL automatique** : `https://carnet-voyage-XXXX.vercel.app`

---

## 📱 Installation en tant qu'app

### iOS (Safari)
1. Ouvrez l'URL dans Safari
2. Appuyez sur **Partager** → **Sur l'écran d'accueil**
3. Confirmez → L'app s'installe comme une app native

### Android (Chrome)
1. Ouvrez l'URL dans Chrome
2. La bannière d'installation apparaît automatiquement
3. Ou : Menu → **Ajouter à l'écran d'accueil**

### Desktop (Chrome/Edge)
1. Cliquez l'icône d'installation dans la barre d'adresse
2. Ou utilisez la bannière dans l'app

---

## ✨ Fonctionnalités

### 📓 Journal de voyage
- Éditeur de texte enrichi (gras, italique, souligné)
- Humeur du jour (6 émojis)
- Géolocalisation GPS automatique + saisie manuelle
- Météo en temps réel (Open-Meteo API)
- Tags personnalisés
- Photos attachées à chaque entrée

### 📸 Galerie & Médias
- Import multi-photos et vidéos
- Compression automatique des images (qualité optimale)
- Visionneuse lightbox avec navigation
- Capture directe depuis la caméra (mobile)

### 🎨 Créateur de montage
- 5 dispositions : 2×1, 2×2, 3×1, Story, En vedette
- 7 filtres photo : Original, Chaud, Frais, Vintage, N&B, Vif, Fané
- Texte overlay avec couleur personnalisable
- Espacement réglable
- Téléchargement JPG ou partage direct

### 🗺️ Carte interactive
- Carte Leaflet + OpenStreetMap (cache hors-ligne)
- Marqueurs dorés pour chaque lieu géolocalisé
- Tracé de l'itinéraire avec polyligne
- Navigation GPS en temps réel
- Popup d'informations par lieu

### 💰 Budget & Dépenses
- 8 catégories : Transport, Hébergement, Nourriture, Activités, Shopping, Santé, Communication, Autre
- Progression visuelle du budget
- Graphique de répartition par catégorie
- Multi-devises (EUR, USD, GBP, JPY, CHF...)

### ✅ Checklists
- Création de listes personnalisées
- 3 modèles prêts : Bagages essentiels, Vêtements, Hygiène
- Progression par liste
- Ajout d'items instantané

### 📤 Partage
- Web Share API (natif iOS/Android)
- Générateur de "stories" : format Portrait, Paysage, Carré
- Photo de fond sélectionnable
- Export JSON de chaque voyage
- Copie de lien

### 🔍 Recherche globale
- Recherche dans titres, contenu, lieux, tags
- Surlignage des résultats
- Recherche en temps réel (debounce 350ms)

### ⚙️ Réglages
- Devise par défaut
- Localisation automatique ON/OFF
- Notifications ON/OFF
- Jauge d'espace utilisé (IndexedDB)
- Vider le cache SW
- Export JSON complet de tous les voyages
- Suppression complète des données

---

## 🔌 Hors-ligne — Ce qui fonctionne sans connexion

| Fonctionnalité | Hors-ligne |
|---|---|
| Journal — lecture & écriture | ✅ |
| Photos & vidéos | ✅ |
| Montage photo | ✅ |
| Carte (tuiles cachées) | ✅ partiel |
| Budget & dépenses | ✅ |
| Checklists | ✅ |
| Recherche globale | ✅ |
| Météo | ❌ (API) |
| Géocodage inverse | ❌ (Nominatim) |

---

## 🏗️ Stack technique

| Technologie | Usage |
|---|---|
| React 18 | UI |
| Vite + vite-plugin-pwa | Build + Service Worker |
| Workbox | Cache stratégies |
| IndexedDB (idb) | Stockage offline |
| React Router v6 | Navigation SPA |
| Leaflet + React-Leaflet | Cartes |
| Tailwind CSS | Styles utilitaires |
| Canvas API | Montage photo |
| Web Share API | Partage natif |
| Geolocation API | GPS |
| Open-Meteo API | Météo gratuite |
| Nominatim API | Géocodage inverse |
| date-fns | Manipulation dates |
| Framer Motion | Animations |
| Lucide React | Icônes |
| Playfair Display + Nunito | Typographie |

---

## 📁 Structure du projet

```
src/
├── contexts/
│   └── AppContext.jsx        # État global + install PWA
├── utils/
│   ├── db.js                 # Couche IndexedDB complète
│   └── helpers.js            # Utilitaires (dates, devises, géo...)
├── pages/
│   ├── Home.jsx              # Dashboard
│   ├── Trips.jsx             # Liste des voyages
│   ├── NewTrip.jsx           # Créer un voyage
│   ├── TripDetail.jsx        # Hub d'un voyage
│   ├── NewEntry.jsx          # Nouvelle entrée journal
│   ├── EntryDetail.jsx       # Lire une entrée
│   ├── Gallery.jsx           # Galerie + montage
│   ├── TripMap.jsx           # Carte Leaflet
│   ├── Budget.jsx            # Suivi dépenses
│   ├── Checklist.jsx         # Listes de bagages
│   ├── Search.jsx            # Recherche globale
│   └── Settings.jsx          # Réglages & export
└── components/
    ├── layout/
    │   ├── Layout.jsx         # Wrapper principal
    │   ├── BottomNav.jsx      # Navigation mobile
    │   └── TopBar.jsx
    ├── common/
    │   ├── Toast.jsx          # Notifications
    │   ├── OfflineBanner.jsx  # Bandeau hors-ligne
    │   └── InstallBanner.jsx  # Bannière installation
    └── features/
        ├── PhotoMontage.jsx   # Créateur montage Canvas
        ├── WeatherWidget.jsx  # Météo temps réel
        └── ShareModal.jsx     # Partage + story generator
```

---

## 🛠️ Développement local

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # Build production
npm run preview    # Prévisualiser le build
```

---

## 📊 Données

Toutes les données sont stockées **localement** dans le navigateur via IndexedDB :

- `trips` — Métadonnées des voyages
- `entries` — Entrées de journal
- `media` — Photos et vidéos (ArrayBuffer)
- `expenses` — Dépenses
- `checklists` — Listes
- `settings` — Préférences utilisateur

**Export/Import** : utilisez les Réglages → Exporter pour créer une sauvegarde JSON.

---

## 🎨 Design

- **Thème** : Midnight Explorer — sombre, élégant, doré
- **Palette** : `#0d0d1a` (fond) · `#d4a853` (or) · `#e8e8f5` (texte)
- **Typo** : Playfair Display (titres) + Nunito (corps)
- **Effets** : grain texture, glass morphism, gradient animé

---

## 📄 Licence

MIT — Libre d'utilisation et de modification.

---

*Fait avec ❤️ pour les voyageurs du monde entier.*
