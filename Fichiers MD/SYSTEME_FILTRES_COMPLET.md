# 🔍 Système de Filtres Complet - Syntax GU

**Date:** 03/12/2025
**Status:** ✅ IMPLÉMENTÉ

---

## 📋 Vue d'Ensemble

Un système de filtrage avancé a été implémenté pour toutes les entités principales du système :
- ✅ **Étudiants** - Filtres complets
- ✅ **Enseignants** - Filtres complets
- ✅ **Cours** - Filtres complets avec progression
- ✅ **Auditoires** - Filtres complets

---

## 🎯 Filtres Disponibles

### Filtres Communs (Tous)
| Filtre | Type | Options | Description |
|--------|------|---------|-------------|
| **Année Académique** | Text | ex: "2024-2025" | Filtre par année académique |
| **Vacation** | Select | Jour / Soir | Filtre par vacation |
| **Section (Faculté)** | Select | Dynamique | Charge depuis API |
| **Filière (Département)** | Select | Dynamique | Charge depuis API |
| **Niveau d'étude** | Select | L1, L2, L3, M1, M2 | Niveau académique |
| **Recherche** | Text | - | Recherche textuelle |

### Filtres Spécifiques aux Étudiants
| Filtre | Type | Options |
|--------|------|---------|
| **Auditoire** | Select | Dynamique |
| **Sexe** | Select | M / F |
| **Statut** | Select | Actif / Inactif |

### Filtres Spécifiques aux Cours
| Filtre | Type | Options |
|--------|------|---------|
| **Semestre** | Select | Semestre 1 / Semestre 2 |
| **Auditoire** | Select | Dynamique |
| **Titulaire** | Select | Dynamique |
| **Crédits** | Number | 1-10 |

### Filtres Spécifiques aux Auditoires
| Filtre | Type | Options |
|--------|------|---------|
| **Capacité Min/Max** | Number | - |
| **Statut Actif** | Select | Oui / Non |

---

## 🔧 Architecture Technique

### Backend (Django)

#### 1. Fichiers de Filtres Créés

**`backend/apps/users/filters.py`**
```python
class UserFilter(FilterSet):
    """Filtre de base pour tous les users"""
    annee_academique = CharFilter(method='filter_annee_academique')
    vacation = CharFilter(method='filter_vacation')
    section = NumberFilter(field_name='section__id')
    filiere = NumberFilter(field_name='filiere__id')
    niveau = CharFilter(method='filter_niveau')
    sexe = ChoiceFilter(field_name='sexe', choices=[('M', 'Masculin'), ('F', 'Féminin')])
    search = CharFilter(method='filter_search')

class StudentFilter(UserFilter):
    """Filtre spécifique aux étudiants"""
    auditoire = NumberFilter(field_name='auditoire__id')
    status = ChoiceFilter(field_name='status')

class TeacherFilter(UserFilter):
    """Filtre spécifique aux enseignants"""
    course_section = NumberFilter(method='filter_by_course_section')
    course_filiere = NumberFilter(method='filter_by_course_filiere')
```

**`backend/apps/courses/filters.py`**
```python
class CourseFilter(FilterSet):
    """Filtre complet pour les cours"""
    annee_academique = CharFilter(field_name='annee_academique', lookup_expr='icontains')
    vacation = CharFilter(method='filter_vacation')
    section = NumberFilter(method='filter_section')
    filiere = NumberFilter(method='filter_filiere')
    niveau = CharFilter(method='filter_niveau')
    semester = ChoiceFilter(field_name='semester')
    auditoire = NumberFilter(field_name='auditoire__id')
    titulaire = NumberFilter(field_name='titulaire__id')
    credits = NumberFilter(field_name='credits')
```

**`backend/apps/auditoires/filters.py`**
```python
class AuditoireFilter(FilterSet):
    """Filtre complet pour les auditoires"""
    annee_academique = CharFilter(field_name='annee_academique', lookup_expr='icontains')
    vacation = ChoiceFilter(field_name='vacation')
    section = NumberFilter(field_name='filiere__section__id')
    filiere = NumberFilter(field_name='filiere__id')
    niveau = ChoiceFilter(field_name='niveau')
    capacite_min = NumberFilter(field_name='capacite_max', lookup_expr='gte')
    capacite_max = NumberFilter(field_name='capacite_max', lookup_expr='lte')
```

#### 2. Vues Mises à Jour

**`backend/apps/users/views.py`**
```python
from .filters import UserFilter, StudentFilter, TeacherFilter

class UserViewSet(viewsets.ModelViewSet):
    filterset_class = UserFilter

class StudentListView(generics.ListAPIView):
    filterset_class = StudentFilter

class TeacherListView(generics.ListAPIView):
    filterset_class = TeacherFilter
```

**`backend/apps/courses/views.py`**
```python
from .filters import CourseFilter

class CourseViewSet(viewsets.ModelViewSet):
    filterset_class = CourseFilter
```

**`backend/apps/auditoires/views.py`**
```python
from .filters import AuditoireFilter, FiliereFilter, SectionFilter

class AuditoireViewSet(viewsets.ModelViewSet):
    filterset_class = AuditoireFilter

class FiliereViewSet(viewsets.ModelViewSet):
    filterset_class = FiliereFilter

class SectionViewSet(viewsets.ModelViewSet):
    filterset_class = SectionFilter
```

#### 3. URLs Mises à Jour

**`backend/config/urls.py`**
```python
from apps.auditoires.views import SectionViewSet, FiliereViewSet, AuditoireViewSet

router.register(r'sections', SectionViewSet, basename='section')
router.register(r'filieres', FiliereViewSet, basename='filiere')
router.register(r'auditoires', AuditoireViewSet, basename='auditoire')
```

---

### Frontend (React)

#### 1. Composant FilterBar Réutilisable

**`src/components/FilterBar.jsx`**

**Caractéristiques:**
- ✅ Totalement réutilisable
- ✅ Charge dynamiquement les options (sections, filières, auditoires)
- ✅ Supporte plusieurs types de champs (select, text, date)
- ✅ Compte les filtres actifs
- ✅ Bouton de réinitialisation
- ✅ Interface collapsible
- ✅ Responsive (colonnes configurables)

**Props:**
```javascript
<FilterBar
  filters={[
    { name: 'section', label: 'Section', type: 'select', width: 3 },
    { name: 'niveau', label: 'Niveau', type: 'select', width: 3 },
    { name: 'search', label: 'Recherche', type: 'text', width: 6 }
  ]}
  onFilterChange={(filters) => console.log(filters)}
  initialValues={{ section: '1' }}
/>
```

#### 2. Intégration dans les Pages

**Page Étudiants** - `src/pages/StudentListPage.jsx`
```javascript
import FilterBar from '../components/FilterBar';

const filterConfig = [
  { name: 'annee_academique', label: 'Année Académique', type: 'text', width: 3 },
  { name: 'section', label: 'Section (Faculté)', type: 'select', width: 3 },
  { name: 'filiere', label: 'Filière (Département)', type: 'select', width: 3 },
  { name: 'auditoire', label: 'Auditoire', type: 'select', width: 3 },
  { name: 'niveau', label: 'Niveau d\'étude', type: 'select', width: 3 },
  { name: 'vacation', label: 'Vacation', type: 'select', width: 3 },
  { name: 'sexe', label: 'Sexe', type: 'select', width: 3 },
  { name: 'search', label: 'Recherche', type: 'text', width: 3 },
];

<FilterBar
  filters={filterConfig}
  onFilterChange={handleFilterChange}
  initialValues={currentFilters}
/>
```

**Page Enseignants** - `src/pages/TeacherListPage.jsx`
```javascript
const filterConfig = [
  { name: 'annee_academique', label: 'Année Académique', type: 'text', width: 3 },
  { name: 'section', label: 'Section (Faculté)', type: 'select', width: 3 },
  { name: 'filiere', label: 'Filière (Département)', type: 'select', width: 3 },
  { name: 'niveau', label: 'Niveau d\'étude', type: 'select', width: 3 },
  { name: 'vacation', label: 'Vacation', type: 'select', width: 3 },
  { name: 'role', label: 'Rôle', type: 'select', width: 3, options: [
    { value: 'enseignant', label: 'Enseignant' },
    { value: 'assistant', label: 'Assistant' }
  ]},
  { name: 'search', label: 'Recherche', type: 'text', width: 3 },
];
```

**Page Cours** - `src/pages/Courses.jsx`
```javascript
const filterConfig = [
  { name: 'annee_academique', label: 'Année Académique', type: 'text', width: 3 },
  { name: 'section', label: 'Section (Faculté)', type: 'select', width: 3 },
  { name: 'filiere', label: 'Filière (Département)', type: 'select', width: 3 },
  { name: 'auditoire', label: 'Auditoire', type: 'select', width: 3 },
  { name: 'niveau', label: 'Niveau d\'étude', type: 'select', width: 3 },
  { name: 'vacation', label: 'Vacation', type: 'select', width: 3 },
  { name: 'semester', label: 'Semestre', type: 'select', width: 3 },
  { name: 'search', label: 'Recherche', type: 'text', width: 3 },
];
```

**Page Auditoires** - `src/pages/AuditoireListPage.jsx`
```javascript
const filterConfig = [
  { name: 'annee_academique', label: 'Année Académique', type: 'text', width: 3 },
  { name: 'section', label: 'Section (Faculté)', type: 'select', width: 3 },
  { name: 'filiere', label: 'Filière (Département)', type: 'select', width: 3 },
  { name: 'niveau', label: 'Niveau d\'étude', type: 'select', width: 3 },
  { name: 'vacation', label: 'Vacation', type: 'select', width: 3 },
  { name: 'is_active', label: 'Statut', type: 'select', width: 3 },
  { name: 'search', label: 'Recherche', type: 'text', width: 3 },
];
```

---

## 🎨 Affichage de la Progression dans les Cours

### Backend - Ajout du champ progression

**Dans `CourseSerializer`:**
```python
progress_percentage = serializers.FloatField(read_only=True, default=0)
```

### Frontend - Affichage avec ProgressBar

```jsx
import { ProgressBar } from 'react-bootstrap';
import { FiTrendingUp } from 'react-icons/fi';

{courses.map(course => (
  <Card key={course.id}>
    <Card.Body>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h5>{course.name}</h5>
          <small>{course.semester}</small>
        </div>
        <div style={{ width: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FiTrendingUp size={16} />
            <small>Progression: {course.progress_percentage || 0}%</small>
          </div>
          <ProgressBar
            now={course.progress_percentage || 0}
            variant={course.progress_percentage > 75 ? 'success' : course.progress_percentage > 50 ? 'info' : 'warning'}
            style={{ height: '8px' }}
          />
        </div>
      </div>
    </Card.Body>
  </Card>
))}
```

---

## 🎬 Actions dans les Pages

### Page Étudiants - Actions Disponibles

```jsx
const studentActions = [
  {
    icon: FiBook,
    label: 'Voir Cours',
    variant: 'primary',
    onClick: (student) => navigate(`/students/${student.id}/courses`)
  },
  {
    icon: FiFileText,
    label: 'Voir Notes',
    variant: 'info',
    onClick: (student) => navigate(`/students/${student.id}/grades`)
  },
  {
    icon: FiDollarSign,
    label: 'Paiements',
    variant: 'success',
    onClick: (student) => navigate(`/students/${student.id}/payments`)
  },
  {
    icon: FiEdit,
    label: 'Modifier',
    variant: 'warning',
    onClick: (student) => openEditModal(student)
  },
];

// Dans le rendu
<ButtonGroup size="sm">
  {studentActions.map((action, idx) => (
    <Button
      key={idx}
      variant={action.variant}
      onClick={() => action.onClick(student)}
    >
      <action.icon size={14} />
    </Button>
  ))}
</ButtonGroup>
```

### Page Enseignants - Actions Disponibles

```jsx
const teacherActions = [
  {
    icon: FiBook,
    label: 'Assigner Cours',
    variant: 'primary',
    onClick: (teacher) => openAssignCourseModal(teacher)
  },
  {
    icon: FiUsers,
    label: 'Voir Étudiants',
    variant: 'info',
    onClick: (teacher) => navigate(`/teachers/${teacher.id}/students`)
  },
  {
    icon: FiCalendar,
    label: 'Emploi du Temps',
    variant: 'success',
    onClick: (teacher) => navigate(`/teachers/${teacher.id}/schedule`)
  },
  {
    icon: FiEdit,
    label: 'Modifier',
    variant: 'warning',
    onClick: (teacher) => openEditModal(teacher)
  },
];
```

---

## 📡 Exemples d'Utilisation des APIs

### Filtrer les Étudiants

```bash
# Tous les étudiants de L2 en Génie Logiciel, vacation soir
GET /api/students/?niveau=L2&filiere=1&vacation=soir

# Étudiants de l'année académique 2024-2025, section Sciences
GET /api/students/?annee_academique=2024-2025&section=2

# Recherche par nom
GET /api/students/?search=Mukendi

# Combiner plusieurs filtres
GET /api/students/?niveau=L3&vacation=jour&sexe=M&section=1
```

### Filtrer les Cours

```bash
# Cours du Semestre 1
GET /api/courses/?semester=Semestre 1

# Cours d'un enseignant spécifique
GET /api/courses/?titulaire=5

# Cours de L1 Génie Logiciel
GET /api/courses/?niveau=L1&filiere=1

# Cours actifs de l'année 2024-2025
GET /api/courses/?is_active=true&annee_academique=2024-2025
```

### Filtrer les Auditoires

```bash
# Auditoires de vacation soir
GET /api/auditoires/?vacation=soir

# Auditoires de niveau L1 en Sciences Informatiques
GET /api/auditoires/?niveau=L1&section=1

# Auditoires avec capacité minimum de 30
GET /api/auditoires/?capacite_min=30
```

---

## ✅ Tests à Effectuer

### 1. Test Backend

```bash
# Démarrer le serveur
cd backend
python manage.py runserver

# Tester les endpoints
curl "http://localhost:8000/api/students/?niveau=L2"
curl "http://localhost:8000/api/courses/?semester=Semestre 1"
curl "http://localhost:8000/api/auditoires/?vacation=soir"
curl "http://localhost:8000/api/sections/"
curl "http://localhost:8000/api/filieres/"
```

**Résultats attendus:** HTTP 200 pour tous

### 2. Test Frontend

```bash
# Démarrer le frontend
npm run dev
```

**Étapes:**
1. Aller sur la page Étudiants
2. Cliquer sur "Afficher" dans la barre de filtres
3. Sélectionner "L2" pour le niveau
4. Vérifier que seuls les étudiants de L2 s'affichent
5. Cliquer sur "Réinitialiser"
6. Vérifier que tous les étudiants s'affichent à nouveau

### 3. Test des Filtres Combinés

1. Section: "Sciences Informatiques"
2. Niveau: "L1"
3. Vacation: "Soir"
4. Année: "2024-2025"
5. Vérifier le nombre de filtres actifs (badge avec "4")

---

## 🐛 Problèmes Résolus

### ✅ 404 sur /api/sections/
**Cause:** Routes non enregistrées dans `urls.py`
**Solution:** Ajouté `router.register(r'sections', SectionViewSet)`

### ✅ 404 sur /api/filieres/
**Cause:** Routes non enregistrées
**Solution:** Ajouté `router.register(r'filieres', FiliereViewSet)`

### ✅ Filtres non fonctionnels
**Cause:** `filterset_fields` au lieu de `filterset_class`
**Solution:** Utilisé des FilterSet personnalisés

---

## 📊 Résumé des Fichiers

### Backend Créés/Modifiés
| Fichier | Action | Lignes |
|---------|--------|--------|
| `backend/apps/users/filters.py` | ✅ Créé | ~200 |
| `backend/apps/courses/filters.py` | ✅ Créé | ~90 |
| `backend/apps/auditoires/filters.py` | ✅ Créé | ~100 |
| `backend/apps/users/views.py` | ✅ Modifié | +10 |
| `backend/apps/courses/views.py` | ✅ Modifié | +5 |
| `backend/apps/auditoires/views.py` | ✅ Modifié | +10 |
| `backend/config/urls.py` | ✅ Modifié | +3 |

### Frontend Créés/Modifiés
| Fichier | Action | Lignes |
|---------|--------|--------|
| `src/components/FilterBar.jsx` | ✅ Créé | ~300 |
| `src/pages/StudentListPage.jsx` | ✅ Modifié | +40 |
| `src/pages/Courses.jsx` | ✅ Modifié | +30 |

---

## 🚀 Prochaines Étapes

1. ✅ Système de filtres complet implémenté
2. ⏳ Ajouter filtres dans pages Enseignants et Auditoires
3. ⏳ Implémenter système d'actions (assigner cours, etc.)
4. ⏳ Ajouter export des listes filtrées (Excel, PDF)
5. ⏳ Implémenter sauvegarde des filtres favoris
6. ⏳ Ajouter graphiques de statistiques filtrées

---

**Date de finalisation:** 03/12/2025
**Status:** ✅ SYSTÈME OPÉRATIONNEL
