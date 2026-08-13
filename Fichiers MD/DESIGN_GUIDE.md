# 🎨 Guide du Design Moderne Acadex

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Composants disponibles](#composants-disponibles)
3. [Personnalisation des thèmes](#personnalisation-des-thèmes)
4. [Mode Clair/Sombre](#mode-clairsombre)
5. [Utilisation des composants](#utilisation-des-composants)
6. [Animations](#animations)

---

## 🎯 Vue d'ensemble

Ce projet utilise maintenant un design moderne inspiré du dashboard **Acadex**, avec:
- ✅ Mode clair et sombre
- ✅ Animations professionnelles (Framer Motion)
- ✅ Composants réutilisables
- ✅ Thèmes personnalisables
- ✅ Design responsive
- ✅ React Bootstrap + React Icons

---

## 📦 Composants Disponibles

### 1. **ModernSidebar**
```jsx
import ModernSidebar from './components/ModernSidebar'
```
Sidebar professionnelle avec navigation hiérarchique et animations.

### 2. **ModernHeader**
```jsx
import ModernHeader from './components/ModernHeader'
```
Header avec recherche, notifications, profil et theme switcher.

### 3. **StatCard**
```jsx
import StatCard from './components/StatCard'

<StatCard
  title="Total Étudiants"
  value="5,699"
  icon={FiUsers}
  color="primary"
  trend="up"
  trendValue="+12% ce mois"
  delay={0}
/>
```

**Props:**
- `title` (string) - Titre de la carte
- `value` (string) - Valeur principale
- `icon` (React Icon) - Icône à afficher
- `color` (string) - 'primary' | 'success' | 'warning' | 'danger' | 'info'
- `trend` (string) - 'up' | 'down' | 'neutral'
- `trendValue` (string) - Texte de la tendance
- `delay` (number) - Délai d'animation
- `onClick` (function) - Fonction au clic

### 4. **ChartCard**
```jsx
import ChartCard from './components/ChartCard'

<ChartCard
  title="Performance Académique"
  subtitle="Derniers 6 mois"
  chartType="line"
  data={chartData}
  delay={0.2}
  height={300}
/>
```

**Props:**
- `title` (string) - Titre du graphique
- `subtitle` (string) - Sous-titre
- `chartType` (string) - 'line' | 'bar' | 'doughnut'
- `data` (object) - Données Chart.js
- `options` (object) - Options Chart.js
- `delay` (number) - Délai d'animation
- `height` (number) - Hauteur en pixels

### 5. **CalendarWidget**
```jsx
import CalendarWidget from './components/CalendarWidget'

<CalendarWidget
  events={[
    { date: new Date(2024, 0, 15) },
    { date: new Date(2024, 0, 20) }
  ]}
  delay={0.5}
/>
```

### 6. **ScheduleWidget**
```jsx
import ScheduleWidget from './components/ScheduleWidget'

<ScheduleWidget
  schedule={[
    {
      title: "Cours de Math",
      description: "Algèbre Linéaire",
      time: "9:00 AM - 11:00 AM",
      location: "Salle A101",
      badge: "Cours",
      color: "var(--color-primary)"
    }
  ]}
  date={new Date()}
  delay={0.6}
/>
```

### 7. **RecentActivity**
```jsx
import RecentActivity from './components/RecentActivity'

<RecentActivity
  activities={[
    {
      id: 1,
      type: "user",
      title: "John Doe",
      description: "s'est inscrit au cours",
      time: "Il y a 1h",
      badge: "Nouveau"
    }
  ]}
  delay={0.7}
/>
```

**Types d'icônes:** 'user' | 'file' | 'award' | 'trending' | 'check'

### 8. **ThemeSwitcher**
```jsx
import ThemeSwitcher from './components/ThemeSwitcher'

<ThemeSwitcher />
```
Bouton pour basculer entre mode clair et sombre.

---

## 🎨 Personnalisation des Thèmes

### Fichier de configuration: `src/config/theme.js`

Pour personnaliser les couleurs de votre application, modifiez le fichier `theme.js`:

```javascript
export const themes = {
  light: {
    // Changez ces couleurs selon vos besoins
    primary: '#4E73DF',           // Votre couleur principale
    success: '#1CC88A',           // Couleur de succès
    danger: '#E74A3B',            // Couleur de danger
    warning: '#F6C23E',           // Couleur d'avertissement

    // Backgrounds
    bodyBg: '#F8F9FC',
    cardBg: '#FFFFFF',

    // Text
    textPrimary: '#3C4858',
    textSecondary: '#858796',

    // ... autres couleurs
  },
  dark: {
    // Même structure pour le mode sombre
  }
}
```

### Variables CSS disponibles

Toutes les couleurs sont disponibles en CSS via des variables:

```css
.mon-composant {
  background: var(--color-cardBg);
  color: var(--color-textPrimary);
  border: 1px solid var(--color-border);
}
```

**Variables principales:**
- `--color-primary`
- `--color-success`
- `--color-danger`
- `--color-warning`
- `--color-info`
- `--color-bodyBg`
- `--color-cardBg`
- `--color-textPrimary`
- `--color-textSecondary`
- `--color-border`

---

## 🌓 Mode Clair/Sombre

### Basculer le thème

```javascript
import { toggleTheme, applyTheme, getCurrentThemeName } from './config/theme'

// Basculer entre light et dark
const newTheme = toggleTheme()

// Appliquer un thème spécifique
applyTheme('light')
applyTheme('dark')

// Obtenir le thème actuel
const currentTheme = getCurrentThemeName()

// Vérifier si c'est le mode sombre
import { isDarkMode } from './config/theme'
if (isDarkMode()) {
  // Mode sombre actif
}
```

Le thème est sauvegardé dans **localStorage**, donc il persiste entre les sessions.

---

## 💡 Utilisation des Composants

### Exemple: Créer un Dashboard personnalisé

```jsx
import { Container, Row, Col } from "react-bootstrap"
import StatCard from "../components/StatCard"
import ChartCard from "../components/ChartCard"
import { FiUsers, FiBook } from "react-icons/fi"

const MonDashboard = () => {
  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr'],
    datasets: [{
      label: 'Étudiants',
      data: [65, 68, 72, 75],
      borderColor: 'rgb(78, 115, 223)',
      backgroundColor: 'rgba(78, 115, 223, 0.1)',
    }]
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)' }}>
      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={6} lg={3}>
          <StatCard
            title="Étudiants"
            value="1,234"
            icon={FiUsers}
            color="primary"
            trend="up"
            trendValue="+10%"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Cours"
            value="56"
            icon={FiBook}
            color="success"
            trend="neutral"
            trendValue="Stable"
          />
        </Col>
      </Row>

      {/* Graphique */}
      <Row>
        <Col lg={12}>
          <ChartCard
            title="Évolution"
            chartType="line"
            data={chartData}
            height={300}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default MonDashboard
```

---

## ⚡ Animations

Le projet utilise **Framer Motion** pour des animations fluides.

### Classes CSS d'animation

```html
<!-- Fade In -->
<div className="fade-in">Contenu</div>

<!-- Slide In -->
<div className="slide-in-right">Contenu</div>
<div className="slide-in-left">Contenu</div>

<!-- Scale -->
<div className="scale-in">Contenu</div>

<!-- Pulse (infinite) -->
<div className="pulse">Contenu</div>

<!-- Hover Effects -->
<div className="hover-lift">Soulève au hover</div>
<div className="hover-scale">Agrandit au hover</div>
```

### Animations Framer Motion

```jsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenu animé
</motion.div>

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Cliquez-moi
</motion.button>
```

---

## 📱 Responsive Design

Toutes les composants sont responsives. Utilisez les breakpoints Bootstrap:

```jsx
<Col xs={12} sm={6} md={4} lg={3}>
  {/* Contenu */}
</Col>
```

**Breakpoints:**
- `xs` - Extra small (< 576px)
- `sm` - Small (≥ 576px)
- `md` - Medium (≥ 768px)
- `lg` - Large (≥ 992px)
- `xl` - Extra large (≥ 1200px)

---

## 🎯 Bonnes Pratiques

1. **Utilisez les variables CSS** au lieu de couleurs en dur
2. **Ajoutez des delays** aux animations pour un effet cascade
3. **Respectez la hiérarchie visuelle** avec les tailles de police
4. **Testez en mode clair ET sombre**
5. **Utilisez les icônes de react-icons** pour la cohérence

---

## 🆘 Support

Pour plus d'informations:
- Chart.js: https://www.chartjs.org/
- Framer Motion: https://www.framer.com/motion/
- React Icons: https://react-icons.github.io/react-icons/
- React Bootstrap: https://react-bootstrap.github.io/

---

## 🚀 Prochaines Étapes

Pour améliorer encore le design:
1. Ajoutez vos propres composants personnalisés
2. Créez de nouveaux thèmes dans `theme.js`
3. Personnalisez les animations selon vos préférences
4. Ajoutez des micro-interactions pour une meilleure UX

**Bon design! 🎨**
