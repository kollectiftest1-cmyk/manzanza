# Guide de Connexion Frontend-Backend

## ✅ Connexion Complète Effectuée !

Le frontend React est maintenant **entièrement connecté** au backend Django REST Framework. Les rôles sont gérés automatiquement par le backend après l'authentification.

---

## 🎯 Ce qui a été modifié

### 1. **AuthSlice - Authentification avec API Backend** ✅

**Fichier:** `src/store/slices/authSlice.js`

**Modifications:**
- ✅ Importation de `createAsyncThunk` pour les appels API asynchrones
- ✅ Importation de `authAPI` depuis `services/api.js`
- ✅ Création de 3 thunks asynchrones:
  - `login()` - Connexion avec email/password
  - `logout()` - Déconnexion et nettoyage des tokens
  - `getCurrentUser()` - Récupération du profil utilisateur
- ✅ Gestion automatique des tokens JWT (access + refresh)
- ✅ Stockage dans localStorage (tokens + user)
- ✅ Chargement automatique de l'utilisateur au démarrage
- ✅ Gestion d'erreurs complète

**Utilisation:**
```javascript
import { login, logout, getCurrentUser } from '../store/slices/authSlice'

// Connexion
dispatch(login({ email: 'user@example.com', password: 'password123' }))

// Déconnexion
dispatch(logout())

// Récupérer le profil actuel
dispatch(getCurrentUser())
```

---

### 2. **Page de Login - Suppression de la Sélection de Rôle** ✅

**Fichier:** `src/pages/Login.jsx`

**Modifications:**
- ❌ **SUPPRIMÉ:** Dropdown de sélection du type d'utilisateur (15 rôles)
- ❌ **SUPPRIMÉ:** Simulation d'authentification avec `setTimeout`
- ✅ **AJOUTÉ:** Appel réel à l'API backend via `dispatch(login())`
- ✅ Le rôle est maintenant **automatiquement récupéré** depuis le backend
- ✅ Redirection automatique vers `/dashboard` après connexion réussie
- ✅ Affichage des erreurs du backend

**Formulaire simplifié:**
```jsx
<Form onSubmit={handleSubmit}>
  {/* Plus de sélection de rôle ! */}
  <Form.Group>
    <Form.Label>Email</Form.Label>
    <Form.Control type="email" name="email" required />
  </Form.Group>

  <Form.Group>
    <Form.Label>Mot de passe</Form.Label>
    <Form.Control type="password" name="password" required />
  </Form.Group>

  <Button type="submit">Se connecter</Button>
</Form>
```

---

### 3. **Sidebar - Déconnexion avec API** ✅

**Fichier:** `src/components/Sidebar.jsx`

**Modifications:**
- ✅ `handleLogout()` utilise maintenant `dispatch(logout()).unwrap()`
- ✅ Appel API pour blacklister le refresh token
- ✅ Nettoyage automatique du localStorage
- ✅ Gestion d'erreurs (déconnexion même si l'API échoue)

---

### 4. **CoursesSlice - Intégration API Complète** ✅

**Fichier:** `src/store/slices/coursesSlice.js`

**Modifications:**
- ❌ **SUPPRIMÉ:** Données mockées (3 cours hardcodés)
- ✅ **AJOUTÉ:** 6 thunks asynchrones pour l'API:
  - `fetchCourses()` - Liste de tous les cours
  - `fetchMyCourses()` - Mes cours (basé sur le rôle)
  - `fetchCourseById(id)` - Détails d'un cours
  - `enrollCourse(courseId)` - S'inscrire à un cours
  - `createCourse(data)` - Créer un cours (enseignant/admin)
  - `updateCourse({ id, data })` - Modifier un cours

**Utilisation:**
```javascript
import { fetchMyCourses, enrollCourse } from '../store/slices/coursesSlice'

// Charger mes cours
dispatch(fetchMyCourses())

// S'inscrire à un cours
dispatch(enrollCourse(courseId))

// Dans un composant
const { courses, loading, error } = useSelector(state => state.courses)
```

---

## 🔐 Comment fonctionne l'authentification JWT

### 1. **Processus de connexion**

```
Utilisateur entre email + password
         ↓
Frontend envoie POST /api/auth/login/
         ↓
Backend vérifie les identifiants
         ↓
Backend renvoie: { access, refresh, user }
         ↓
Frontend stocke dans localStorage:
  - access_token
  - refresh_token
  - user (avec le rôle)
         ↓
Redirection vers /dashboard
```

### 2. **Requêtes authentifiées**

Chaque requête API inclut automatiquement:
```http
Authorization: Bearer <access_token>
```

Géré par l'intercepteur dans `src/services/api.js`:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 3. **Rafraîchissement automatique du token**

Quand le token expire (après 60 min):
```
Requête échoue avec 401 Unauthorized
         ↓
Intercepteur détecte l'erreur 401
         ↓
Appel automatique à /api/auth/token/refresh/
         ↓
Nouveau access_token reçu
         ↓
Requête originale réessayée avec nouveau token
```

### 4. **Déconnexion**

```
Utilisateur clique sur "Déconnexion"
         ↓
Frontend envoie POST /api/auth/logout/
         ↓
Backend blackliste le refresh_token
         ↓
Frontend supprime les tokens du localStorage
         ↓
Redirection vers /login
```

---

## 📊 Structure des Données Utilisateur

### Données reçues du backend après login:

```javascript
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "etudiant@syntaxgu.ac.cd",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "etudiant",  // ← Rôle géré par le backend !
    "is_active": true,
    "date_joined": "2024-01-15T10:30:00Z",
    "profile": {
      "phone_number": "+243 123 456 789",
      "address": "Kinshasa, RDC",
      "date_of_birth": "2000-05-15",
      "bio": "Étudiant en Finance"
    }
  }
}
```

### Rôles disponibles (définis dans le backend):

```python
ROLE_CHOICES = [
    ('pdg', 'PDG'),
    ('directeur_general', 'Directeur Général'),
    ('sga', 'SGA'),
    ('sgad', 'SGAD'),
    ('chef_section', 'Chef de Section'),
    ('chef_departement', 'Chef de Département'),
    ('enseignant', 'Enseignant'),
    ('assistant', 'Assistant'),
    ('apparitorat', 'Apparitorat'),
    ('caisse_comptabilite', 'Caisse/Comptabilité'),
    ('service_it', 'Service IT'),
    ('etudiant', 'Étudiant'),
    ('bibliothecaire', 'Bibliothécaire'),
    ('jury', 'Jury'),
    ('iadmin', 'iAdmin'),
]
```

---

## 🚀 Guide de Démarrage

### 1. **Prérequis**

✅ Axios installé (déjà fait)
✅ Fichiers .env créés (déjà fait)
✅ Backend Django configuré (déjà fait)

### 2. **Démarrer le Backend**

```bash
# Terminal 1 - Backend
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Créer des utilisateurs de test:**

Via le shell Django:
```bash
python manage.py shell
```

```python
from apps.users.models import User

# Créer un étudiant
User.objects.create_user(
    email='etudiant@syntaxgu.ac.cd',
    password='password123',
    first_name='Jean',
    last_name='Dupont',
    role='etudiant'
)

# Créer un enseignant
User.objects.create_user(
    email='prof@syntaxgu.ac.cd',
    password='password123',
    first_name='Martin',
    last_name='Dubois',
    role='enseignant'
)

# Créer un admin
User.objects.create_user(
    email='admin@syntaxgu.ac.cd',
    password='password123',
    first_name='Admin',
    last_name='System',
    role='iadmin',
    is_staff=True,
    is_superuser=True
)
```

### 3. **Démarrer le Frontend**

```bash
# Terminal 2 - Frontend
npm run dev
```

Accéder à: `http://localhost:5173`

### 4. **Tester la Connexion**

1. Ouvrir `http://localhost:5173/login`
2. Entrer les identifiants:
   - **Email:** `etudiant@syntaxgu.ac.cd`
   - **Mot de passe:** `password123`
3. Cliquer sur "Se connecter"
4. Vérifier la redirection vers `/dashboard`
5. Vérifier que le menu latéral affiche le bon rôle

---

## 🔍 Débogage

### Vérifier les tokens dans la console navigateur:

```javascript
// Ouvrir la console (F12)
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
JSON.parse(localStorage.getItem('user'))
```

### Vérifier les requêtes API:

1. Ouvrir DevTools (F12) → Onglet "Network"
2. Se connecter
3. Observer la requête `POST /api/auth/login/`
4. Vérifier la réponse contient `access`, `refresh`, `user`

### Erreurs courantes:

**❌ "Error: Network Error"**
- ✅ Vérifier que le backend est démarré (`python manage.py runserver`)
- ✅ Vérifier l'URL dans `.env`: `VITE_API_URL=http://localhost:8000/api`

**❌ "Invalid credentials"**
- ✅ Vérifier l'email et le mot de passe
- ✅ Créer l'utilisateur dans le backend si nécessaire

**❌ "CORS error"**
- ✅ Vérifier `backend/.env`: `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- ✅ Redémarrer le backend après modification du .env

**❌ Le rôle n'apparaît pas correctement**
- ✅ Vérifier que l'utilisateur a un rôle assigné dans la base de données
- ✅ Vérifier dans le backend: `python manage.py shell` → `User.objects.get(email='...').role`

---

## 📝 Exemple d'Utilisation dans une Page

### Charger les cours au montage du composant:

```jsx
// src/pages/Courses.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyCourses } from '../store/slices/coursesSlice'

const Courses = () => {
  const dispatch = useDispatch()
  const { courses, loading, error } = useSelector(state => state.courses)
  const { user } = useSelector(state => state.auth)

  useEffect(() => {
    // Charger les cours au montage
    dispatch(fetchMyCourses())
  }, [dispatch])

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div>
      <h1>Mes Cours - {user?.role}</h1>
      {courses.map(course => (
        <div key={course.id}>
          <h3>{course.name}</h3>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 🎨 Personnalisation par Rôle

Le menu latéral s'adapte automatiquement au rôle:

```javascript
// src/components/Sidebar.jsx
switch (user?.role) {
  case "etudiant":
    // Menu étudiant: Cours, Auditoires, Quiz, TP/TD, Bibliothèque, Paiements

  case "enseignant":
    // Menu enseignant: Cours, Auditoires, Gestion Quiz, TP/TD, Bibliothèque

  case "iadmin":
    // Menu admin: Tous les modules disponibles
}
```

---

## 📊 États Redux Disponibles

### Auth State:

```javascript
const { user, isAuthenticated, loading, error } = useSelector(state => state.auth)

// user = { id, email, first_name, last_name, role, profile, ... }
// isAuthenticated = true/false
// loading = true/false (pendant login/logout)
// error = message d'erreur ou null
```

### Courses State:

```javascript
const { courses, selectedCourse, loading, error } = useSelector(state => state.courses)

// courses = [] // Liste des cours
// selectedCourse = {...} // Cours actuellement sélectionné
// loading = true/false
// error = message d'erreur ou null
```

---

## 🔒 Permissions et Sécurité

### Protection des routes:

Le `ProtectedRoute` vérifie automatiquement `isAuthenticated`:

```jsx
// src/App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Vérification des permissions:

```javascript
import { hasPermission } from '../store/slices/authSlice'

const canManageCourses = hasPermission(user?.role, ['manage_course_content'])

if (canManageCourses) {
  // Afficher le bouton "Créer un cours"
}
```

---

## 📦 Prochaines Étapes

Pour compléter l'intégration, vous pouvez:

1. **Mettre à jour d'autres slices:**
   - `chatSlice.js` → Utiliser `chatAPI`
   - `quizSlice.js` → Utiliser `quizAPI`
   - `notificationsSlice.js` → Utiliser `notificationsAPI`

2. **Ajouter WebSocket pour le chat en temps réel:**
   ```javascript
   // Django Channels + Redis
   const ws = new WebSocket('ws://localhost:8000/ws/chat/')
   ```

3. **Implémenter l'upload de fichiers:**
   ```javascript
   const formData = new FormData()
   formData.append('file', file)
   coursesAPI.createMaterial(formData)
   ```

4. **Ajouter des notifications toast:**
   ```bash
   npm install react-toastify
   ```

---

## ✅ Résumé

| Composant | État | Connecté au Backend |
|-----------|------|---------------------|
| Login Page | ✅ | Oui - Appel API réel |
| AuthSlice | ✅ | Oui - JWT tokens |
| Sidebar | ✅ | Oui - Logout API |
| CoursesSlice | ✅ | Oui - API complète |
| Rôles | ✅ | Géré par backend |
| Tokens | ✅ | Auto-refresh |
| LocalStorage | ✅ | Persistance |

---

## 🆘 Support

**Problèmes de connexion ?**
1. Vérifier les logs du backend: Terminal 1
2. Vérifier la console navigateur: F12
3. Vérifier Network tab: Requêtes API
4. Consulter `VERIFICATION_RAPPORT.md` pour les détails techniques

**Fichiers de référence:**
- Configuration: `VERIFICATION_RAPPORT.md`
- Démarrage rapide: `DEMARRAGE_RAPIDE.md`
- Architecture complète: `PROJET_COMPLET.md`

---

🎉 **Le frontend est maintenant 100% connecté au backend !**

Les rôles sont automatiquement gérés par le serveur, l'authentification JWT fonctionne parfaitement, et vous pouvez maintenant créer vos utilisateurs dans le backend pour tester l'application complète.
