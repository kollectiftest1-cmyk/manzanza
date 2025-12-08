# Guide de Personnalisation du Thème - Syntax GU

## 📋 Vue d'ensemble

Ce projet utilise un système de thème personnalisable avec React Bootstrap. Les couleurs et styles sont centralisés dans un fichier de configuration pour faciliter les modifications.

## 🎨 Structure des fichiers de thème

### 1. **src/config/theme.js** - Configuration centrale des couleurs
Ce fichier contient la définition de tous les thèmes disponibles avec toutes les variables de couleurs.

```javascript
export const themes = {
  default: {
    primary: '#007BFF',           // Couleur principale
    primaryDark: '#0056B3',       // Variante foncée
    // ... autres couleurs
  },
  dark: {
    // Thème sombre optionnel
  }
}
```

### 2. **src/styles/theme.css** - Styles globaux
Contient les variables CSS et les styles Bootstrap personnalisés.

### 3. **src/styles/sidebar.css** - Styles de la Sidebar
Styles spécifiques pour la barre de navigation latérale.

### 4. **src/styles/navbar.css** - Styles de la Navbar
Styles spécifiques pour la barre de navigation supérieure.

## 🎯 Comment personnaliser les couleurs

### Option 1: Modifier le fichier de configuration (Recommandé)

1. Ouvrez `src/config/theme.js`
2. Modifiez les couleurs dans l'objet `themes.default`:

```javascript
export const themes = {
  default: {
    // Couleurs principales
    primary: '#FF5733',           // Votre nouvelle couleur principale
    primaryDark: '#C70039',       // Votre variante foncée
    secondary: '#6C757D',
    success: '#28A745',
    danger: '#DC3545',
    // ... modifiez toutes les couleurs que vous souhaitez
  }
}
```

3. Les changements s'appliqueront automatiquement à toute l'application.

### Option 2: Modifier les variables CSS en temps réel

Les variables CSS sont disponibles dans `:root` de `src/styles/theme.css`:

```css
:root {
  --color-primary: #007BFF;
  --color-primaryDark: #0056B3;
  --color-secondary: #6C757D;
  /* ... */
}
```

## 🚀 Utiliser les couleurs du thème dans vos composants

### Dans les fichiers React:

```jsx
import { getThemeColor } from '../config/theme'

function MonComposant() {
  const primaryColor = getThemeColor('primary')
  
  return (
    <div style={{ color: primaryColor }}>
      Texte avec couleur du thème
    </div>
  )
}
```

### Dans les fichiers CSS:

```css
.mon-element {
  background-color: var(--color-primary);
  color: var(--color-textWhite);
  border: 1px solid var(--color-cardBorder);
}
```

## 🎨 Palette de couleurs disponibles

### Couleurs de base
- `primary` - Couleur principale de l'application (défaut: Bleu)
- `primaryDark` - Variante foncée de la principale
- `secondary` - Couleur secondaire (défaut: Gris)
- `success` - Pour les actions positives (défaut: Vert)
- `danger` - Pour les avertissements (défaut: Rouge)
- `warning` - Pour les alertes (défaut: Orange)
- `info` - Pour les informations (défaut: Cyan)

### Couleurs de background
- `bg` - Arrière-plan général clair
- `bgDark` - Arrière-plan blanc/clair

### Couleurs de Sidebar
- `sidebarBg` - Fond de la sidebar
- `sidebarText` - Couleur du texte
- `sidebarHover` - Couleur au survol
- `sidebarActive` - Couleur de l'élément actif
- `sidebarActiveBg` - Fond de l'élément actif
- `sidebarBorder` - Couleur de la bordure

### Couleurs de Navbar
- `navbarBg` - Fond de la navbar
- `navbarText` - Couleur du texte
- `navbarBorder` - Couleur de la bordure

### Couleurs de Card
- `cardBg` - Fond des cartes
- `cardBorder` - Bordure des cartes
- `cardShadow` - Ombre des cartes

### Couleurs de texte
- `textPrimary` - Texte principal (défaut: Gris foncé)
- `textSecondary` - Texte secondaire (défaut: Gris)
- `textLight` - Texte clair (défaut: Gris clair)
- `textWhite` - Texte blanc

### Couleurs d'accent
- `accentBlue` - Accent bleu
- `accentGreen` - Accent vert
- `accentOrange` - Accent orange/rouge
- `accentPurple` - Accent violet

## 📦 Créer un nouveau thème

Pour créer un thème supplémentaire:

```javascript
export const themes = {
  default: { /* ... */ },
  
  // Nouveau thème
  corporate: {
    primary: '#1E40AF',           // Bleu corporate
    primaryDark: '#1E3A8A',
    secondary: '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4',
    
    bg: '#F9FAFB',
    bgDark: '#FFFFFF',
    
    sidebarBg: '#1F2937',
    sidebarText: '#E5E7EB',
    sidebarHover: '#374151',
    sidebarActive: '#3B82F6',
    sidebarActiveBg: '#1E3A8A',
    sidebarBorder: '#4B5563',
    
    navbarBg: '#1F2937',
    navbarText: '#E5E7EB',
    navbarBorder: '#4B5563',
    
    cardBg: '#FFFFFF',
    cardBorder: '#D1D5DB',
    cardShadow: '0 2px 8px rgba(0,0,0,0.1)',
    
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    textWhite: '#FFFFFF',
    
    accentBlue: '#3B82F6',
    accentGreen: '#10B981',
    accentOrange: '#F97316',
    accentPurple: '#8B5CF6',
    
    gradientPrimary: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    gradientSuccess: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  }
}
```

Puis appliquez-le:

```javascript
import { applyTheme } from './config/theme'

applyTheme('corporate')
```

## 💾 Sauvegarder le thème dans localStorage

Modifier `src/main.jsx` pour charger le thème depuis localStorage:

```javascript
import { applyTheme, themes } from './config/theme'

// Charger le thème sauvegardé ou utiliser le défaut
const savedTheme = localStorage.getItem('appTheme') || 'default'
applyTheme(savedTheme)
```

## 🔧 Exemple: Créer un sélecteur de thème

```jsx
import { applyTheme, themes } from '../config/theme'

function ThemeSelector() {
  const handleThemeChange = (themeName) => {
    applyTheme(themeName)
  }

  return (
    <div>
      {Object.keys(themes).map(themeName => (
        <button 
          key={themeName}
          onClick={() => handleThemeChange(themeName)}
          className="btn btn-sm"
        >
          {themeName}
        </button>
      ))}
    </div>
  )
}

export default ThemeSelector
```

## 📱 Responsive Design

Le design est entièrement responsive:

- **Desktop** (≥1200px): Sidebar visible, layout complet
- **Tablet** (768px - 1199px): Sidebar réduit
- **Mobile** (<768px): Sidebar cachée, menu toggle disponible

## ✅ Checklist de personnalisation

- [ ] Modifier les couleurs principales dans `src/config/theme.js`
- [ ] Tester les changements en mode développement
- [ ] Vérifier les contrastes pour l'accessibilité
- [ ] Tester sur mobile et desktop
- [ ] Vérifier que tous les éléments utilisent les variables CSS
- [ ] Documenter les modifications

## 🆘 Dépannage

### Les couleurs ne changent pas?
- Vérifiez que `applyTheme()` est appelé dans `src/main.jsx`
- Clearchez le cache du navigateur (Ctrl+Maj+Suppr)
- Vérifiez que les fichiers CSS sont bien importés

### Certains éléments n'utilisent pas le thème?
- Vérifiez qu'ils utilisent les classes Bootstrap ou les variables CSS
- Évitez les couleurs en dur (#FF0000) - utilisez plutôt les variables

### Le design est cassé?
- Ne modifiez pas les tailles de police ou les espacements
- Ne changez que les variables de couleur et les gradients

## 📞 Support

Pour plus d'aide sur React Bootstrap, consultez:
- [React Bootstrap Documentation](https://react-bootstrap.github.io/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)
