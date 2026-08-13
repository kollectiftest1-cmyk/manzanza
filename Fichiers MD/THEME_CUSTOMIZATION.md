# 🎨 Guide de Personnalisation des Thèmes

## 📍 Localisation du Fichier de Thème

Le fichier principal pour personnaliser les couleurs se trouve ici:
```
src/config/theme.js
```

---

## 🌈 Comment Changer les Couleurs

### 1️⃣ Mode Clair (Light Mode)

Ouvrez `src/config/theme.js` et trouvez la section `light`:

```javascript
export const themes = {
  light: {
    // 🔵 COULEURS PRINCIPALES
    primary: '#4E73DF',        // ← Changez cette couleur
    primaryHover: '#2E59D9',   // ← Couleur hover du primary
    success: '#1CC88A',        // ← Couleur de succès (vert)
    danger: '#E74A3B',         // ← Couleur de danger (rouge)
    warning: '#F6C23E',        // ← Couleur d'avertissement (jaune)
    info: '#36B9CC',           // ← Couleur info (cyan)

    // 🎨 COULEURS DE FOND
    bodyBg: '#F8F9FC',         // ← Fond de la page
    cardBg: '#FFFFFF',         // ← Fond des cartes

    // 📱 SIDEBAR
    sidebarBg: '#FFFFFF',      // ← Fond de la sidebar
    sidebarText: '#3C4858',    // ← Texte de la sidebar
    sidebarActive: '#4E73DF',  // ← Couleur item actif

    // ✍️ TEXTE
    textPrimary: '#3C4858',    // ← Texte principal
    textSecondary: '#858796',  // ← Texte secondaire

    // ... autres couleurs
  }
}
```

### 2️⃣ Mode Sombre (Dark Mode)

Même principe pour le mode sombre:

```javascript
dark: {
  primary: '#5A8DEE',          // ← Changez pour mode sombre
  bodyBg: '#0F1419',           // ← Fond sombre
  cardBg: '#1E2533',           // ← Fond carte sombre
  textPrimary: '#E4E6EB',      // ← Texte clair
  // ... autres couleurs
}
```

---

## 🎯 Exemples de Palettes de Couleurs

### Palette 1: Bleu Moderne (par défaut)
```javascript
primary: '#4E73DF',
success: '#1CC88A',
warning: '#F6C23E',
danger: '#E74A3B',
```

### Palette 2: Violet Élégant
```javascript
primary: '#6F42C1',
success: '#20C997',
warning: '#FFC107',
danger: '#DC3545',
```

### Palette 3: Vert Naturel
```javascript
primary: '#28A745',
success: '#20C997',
warning: '#FD7E14',
danger: '#DC3545',
```

### Palette 4: Rouge Corporate
```javascript
primary: '#E74A3B',
success: '#1CC88A',
warning: '#F6C23E',
danger: '#DC3545',
```

### Palette 5: Orange Dynamique
```javascript
primary: '#FF6B6B',
success: '#51CF66',
warning: '#FFA94D',
danger: '#FA5252',
```

---

## 🔧 Comment Appliquer Vos Changements

### Étape 1: Modifier theme.js
Éditez les couleurs dans `src/config/theme.js`

### Étape 2: Sauvegarder
Sauvegardez le fichier (Ctrl+S)

### Étape 3: Recharger l'application
L'application se rechargera automatiquement avec vos nouvelles couleurs!

---

## 💡 Conseils pour Choisir les Couleurs

### ✅ Do's (À faire)
- Utiliser des couleurs qui ont un bon contraste
- Tester en mode clair ET sombre
- Garder une cohérence entre les couleurs
- Utiliser des outils comme [Coolors](https://coolors.co/) pour générer des palettes

### ❌ Don'ts (À éviter)
- Ne pas utiliser des couleurs trop vives qui fatiguent les yeux
- Éviter les couleurs avec peu de contraste (difficiles à lire)
- Ne pas utiliser trop de couleurs différentes (max 5-6 couleurs principales)

---

## 🌐 Outils Recommandés

### Générateurs de Palettes
1. **Coolors** - https://coolors.co/
2. **Adobe Color** - https://color.adobe.com/
3. **Paletton** - https://paletton.com/
4. **Color Hunt** - https://colorhunt.co/

### Vérifier le Contraste
1. **WebAIM** - https://webaim.org/resources/contrastchecker/
2. **Contrast Checker** - https://contrastchecker.com/

---

## 📋 Liste Complète des Variables

Voici toutes les couleurs que vous pouvez personnaliser:

```javascript
{
  // Couleurs principales
  primary, primaryHover, primaryLight,
  secondary, success, danger, warning, info,

  // Backgrounds
  bodyBg, contentBg, cardBg,

  // Sidebar
  sidebarBg, sidebarText, sidebarTextLight,
  sidebarHover, sidebarActive, sidebarActiveBg,
  sidebarBorder, sidebarLogo,

  // Header
  headerBg, headerText, headerBorder, headerSearchBg,

  // Cartes
  cardBorder, cardShadow, cardHoverShadow,

  // Texte
  textPrimary, textSecondary, textMuted,
  textWhite, textDark,

  // Bordures
  border, divider,

  // Accents
  accentBlue, accentGreen, accentOrange,
  accentRed, accentPurple, accentCyan,

  // Charts
  chartBlue, chartGreen, chartOrange,
  chartRed, chartPurple, chartCyan, chartGray,

  // Gradients
  gradientPrimary, gradientSuccess,
  gradientWarning, gradientDanger, gradientInfo,

  // Boutons
  btnPrimaryBg, btnPrimaryHover, btnPrimaryText
}
```

---

## 🎨 Créer Votre Propre Thème

Vous pouvez créer un nouveau thème en ajoutant une nouvelle clé:

```javascript
export const themes = {
  light: { /* ... */ },
  dark: { /* ... */ },

  // Votre nouveau thème
  ocean: {
    primary: '#0077B6',
    success: '#06D6A0',
    warning: '#FFD60A',
    danger: '#EF476F',
    bodyBg: '#CAF0F8',
    cardBg: '#FFFFFF',
    textPrimary: '#03045E',
    // ... etc
  }
}
```

Puis pour l'utiliser:
```javascript
import { applyTheme } from './config/theme'

applyTheme('ocean')
```

---

## 🚀 Exemple Complet

Voici un exemple complet de personnalisation:

```javascript
// src/config/theme.js

export const themes = {
  light: {
    // Palette violette élégante
    primary: '#6F42C1',
    primaryHover: '#5A32A3',
    primaryLight: '#EDE7F6',

    success: '#20C997',
    danger: '#E63946',
    warning: '#FFC107',
    info: '#00B4D8',

    bodyBg: '#F8F9FA',
    cardBg: '#FFFFFF',

    sidebarBg: '#FFFFFF',
    sidebarText: '#495057',
    sidebarActive: '#6F42C1',
    sidebarActiveBg: '#EDE7F6',

    textPrimary: '#212529',
    textSecondary: '#6C757D',

    // Gradients personnalisés
    gradientPrimary: 'linear-gradient(135deg, #6F42C1 0%, #5A32A3 100%)',
    gradientSuccess: 'linear-gradient(135deg, #20C997 0%, #17A589 100%)',
  },

  dark: {
    // Version sombre de la palette violette
    primary: '#8B6FD6',
    bodyBg: '#1A1A2E',
    cardBg: '#252540',
    textPrimary: '#E8E8E8',
    // ... etc
  }
}
```

---

## ✅ Checklist Après Modification

Après avoir changé les couleurs, vérifiez:

- [ ] Les couleurs sont lisibles en mode clair
- [ ] Les couleurs sont lisibles en mode sombre
- [ ] Le contraste texte/fond est suffisant
- [ ] Les boutons sont visibles et cliquables
- [ ] La sidebar est claire
- [ ] Les cartes statistiques sont bien colorées
- [ ] Les graphiques utilisent les bonnes couleurs

---

**Amusez-vous bien à personnaliser votre dashboard! 🎨✨**
