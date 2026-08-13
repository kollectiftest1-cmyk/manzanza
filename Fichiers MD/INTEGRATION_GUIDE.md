# 🔗 Guide d'intégration Frontend-Backend - Syntax GU

Ce document explique comment connecter le frontend React/Vite au backend Django REST Framework.

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Démarrage des serveurs](#démarrage-des-serveurs)
3. [Mapping des routes](#mapping-des-routes)
4. [Compatibilité des données](#compatibilité-des-données)
5. [Gestion de l'authentification](#gestion-de-lauthentification)
6. [Exemples d'utilisation](#exemples-dutilisation)

---

## 🚀 Configuration initiale

### Backend (Django)

1. **Installer les dépendances Python**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

2. **Configurer l'environnement**
```bash
# Copier le fichier .env.example
copy .env.example .env

# Éditer .env avec vos paramètres
```

Exemple de `.env` pour le backend:
```env
SECRET_KEY=django-insecure-votre-cle-secrete-ici
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données (SQLite pour dev)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# CORS - Important !
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

3. **Initialiser la base de données**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Frontend (React/Vite)

1. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

2. **Configurer l'environnement**
```bash
# Créer .env à la racine
copy .env.example .env
```

Exemple de `.env` pour le frontend:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Syntax GU
VITE_APP_VERSION=1.0.0
```

---

## 🖥️ Démarrage des serveurs

### Terminal 1 - Backend Django
```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```
✅ Backend disponible sur: `http://localhost:8000`
📚 API Docs: `http://localhost:8000/api/docs/`

### Terminal 2 - Frontend React
```bash
npm run dev
# ou
yarn dev
```
✅ Frontend disponible sur: `http://localhost:5173`

---

## 🗺️ Mapping des routes Frontend ↔ Backend

### Authentication

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/login` | `/api/auth/login/` | POST | Connexion utilisateur |
| N/A | `/api/auth/logout/` | POST | Déconnexion |
| `/profile` | `/api/auth/users/me/` | GET | Profil actuel |
| `/profile` | `/api/auth/users/update_profile/` | PUT | Mise à jour profil |

### Dashboard

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/dashboard` | `/api/auth/users/me/` | GET | Données utilisateur |
| `/dashboard` | `/api/notifications/unread_count/` | GET | Notifications |
| `/dashboard` | `/api/courses/my_courses/` | GET | Cours (étudiant) |

### Courses

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/courses` | `/api/courses/` | GET | Liste des cours |
| `/courses/:id` | `/api/courses/{id}/` | GET | Détails d'un cours |
| `/courses` | `/api/courses/my_courses/` | GET | Mes cours |
| N/A | `/api/courses/{id}/enroll/` | POST | S'inscrire |

### Quiz

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/quiz` | `/api/quiz/` | GET | Liste des quiz |
| `/quiz/:id` | `/api/quiz/{id}/` | GET | Détails quiz |
| N/A | `/api/quiz/{id}/start_attempt/` | POST | Démarrer |
| N/A | `/api/quiz/{id}/submit_attempt/` | POST | Soumettre |

### Chat

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/chat` | `/api/chat/channels/` | GET | Canaux |
| `/chat/:channelId` | `/api/chat/channels/{id}/messages/` | GET | Messages |
| N/A | `/api/chat/messages/` | POST | Envoyer message |

### Library

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/library` | `/api/library/books/` | GET | Livres |
| N/A | `/api/library/books/{id}/borrow/` | POST | Emprunter |
| N/A | `/api/library/loans/my_loans/` | GET | Mes emprunts |

### Payments

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/paiements` | `/api/payments/student-fees/my_fees/` | GET | Mes frais |
| `/paiements` | `/api/payments/` | GET | Paiements |
| N/A | `/api/payments/` | POST | Nouveau paiement |

### HR

| Frontend Route | Backend Endpoint | Méthode | Description |
|---------------|------------------|---------|-------------|
| `/rh` | `/api/hr/employees/` | GET | Employés |
| `/rh` | `/api/hr/payrolls/` | GET | Paies |
| `/rh` | `/api/hr/leaves/` | GET | Congés |

---

## 📊 Compatibilité des données

### Structure User (Frontend ↔ Backend)

**Frontend attend:**
```javascript
{
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  role: "etudiant",
  matricule: "STU001",
  promotion: "L1 Finance"
}
```

**Backend retourne:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "etudiant",
  "matricule": "STU001",
  "promotion": "L1 Finance",
  "profile_picture": "/media/profiles/john.jpg"
}
```

✅ **Compatible** - Le backend inclut le champ `name` calculé

### Structure Course

**Frontend attend:**
```javascript
{
  id: 1,
  name: "Introduction à la Comptabilité",
  code: "COMP101",
  teacher: { name: "Dr. Smith" },
  progress: 45
}
```

**Backend retourne:**
```json
{
  "id": 1,
  "name": "Introduction à la Comptabilité",
  "code": "COMP101",
  "teacher_name": "Dr. Smith",
  "students_count": 30,
  "progress_percentage": 45
}
```

✅ **Compatible** - Utiliser `teacher_name` et `progress_percentage`

### Structure Quiz

**Frontend attend:**
```javascript
{
  id: 1,
  title: "Quiz de Comptabilité",
  duration: 30,
  questions: [...],
  totalQuestions: 10
}
```

**Backend retourne:**
```json
{
  "id": 1,
  "title": "Quiz de Comptabilité",
  "duration": 30,
  "total_questions": 10,
  "questions": [...]
}
```

✅ **Compatible** - Utiliser `total_questions`

---

## 🔐 Gestion de l'authentification

### 1. Connexion

**Frontend (authSlice.js):**
```javascript
import { authAPI } from '../services/api';

const login = async (credentials) => {
  const response = await authAPI.login(credentials);
  const { access, refresh, user } = response.data;

  // Stocker les tokens
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user', JSON.stringify(user));

  return user;
};
```

**Backend attend:**
```json
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Backend retourne:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "etudiant"
  }
}
```

### 2. Requêtes authentifiées

Toutes les requêtes suivantes incluent automatiquement le token:
```javascript
Authorization: Bearer <access_token>
```

Le fichier `src/services/api.js` gère automatiquement:
- ✅ Ajout du token à chaque requête
- ✅ Rafraîchissement automatique du token expiré
- ✅ Redirection vers login si token invalide

---

## 💡 Exemples d'utilisation

### Exemple 1: Récupérer mes cours

**Frontend:**
```javascript
import { coursesAPI } from '../services/api';

// Dans un composant React
useEffect(() => {
  const fetchMyCourses = async () => {
    try {
      const response = await coursesAPI.getMyCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  fetchMyCourses();
}, []);
```

**Requête envoyée:**
```
GET /api/courses/my_courses/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Réponse reçue:**
```json
[
  {
    "id": 1,
    "name": "Introduction à la Comptabilité",
    "code": "COMP101",
    "teacher_name": "Dr. Smith",
    "progress_percentage": 45
  }
]
```

### Exemple 2: Soumettre un quiz

**Frontend:**
```javascript
import { quizAPI } from '../services/api';

const submitQuiz = async (quizId, answers) => {
  try {
    const response = await quizAPI.submitAttempt(quizId, answers);
    const { score, passed } = response.data;

    if (passed) {
      alert(`Félicitations ! Score: ${score}%`);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Format des réponses
const answers = [
  {
    question_id: 1,
    selected_option_id: 3
  },
  {
    question_id: 2,
    answer_text: "Ma réponse"
  }
];

submitQuiz(5, answers);
```

### Exemple 3: Envoyer un message dans le chat

**Frontend:**
```javascript
import { chatAPI } from '../services/api';

const sendMessage = async (channelId, content) => {
  try {
    const response = await chatAPI.sendMessage({
      channel: channelId,
      content: content
    });

    return response.data;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Exemple 4: Obtenir les notifications non lues

**Frontend:**
```javascript
import { notificationsAPI } from '../services/api';

// Obtenir le nombre
const count = await notificationsAPI.getUnreadCount();
console.log(`${count.data.count} notifications non lues`);

// Obtenir la liste
const notifications = await notificationsAPI.getUnread();
```

---

## 🔧 Adaptation du Redux Store

### Mise à jour de authSlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

export const login = createAsyncThunk('auth/login', async (credentials) => {
  const response = await authAPI.login(credentials);
  const { access, refresh, user } = response.data;

  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user', JSON.stringify(user));

  return user;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authAPI.logout();
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  }
});

export default authSlice.reducer;
```

---

## ✅ Checklist de vérification

Avant de lancer l'application:

### Backend
- [ ] `.env` configuré avec les bonnes valeurs
- [ ] Base de données migrée (`python manage.py migrate`)
- [ ] Superuser créé (`python manage.py createsuperuser`)
- [ ] CORS configuré pour le frontend (`http://localhost:5173`)
- [ ] Serveur démarré (`python manage.py runserver`)

### Frontend
- [ ] `.env` configuré avec `VITE_API_URL=http://localhost:8000/api`
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `src/services/api.js` créé
- [ ] Redux slices mis à jour pour utiliser les nouvelles API
- [ ] Serveur démarré (`npm run dev`)

### Tests de connexion
- [ ] Login fonctionne et retourne un token
- [ ] Les requêtes incluent le header Authorization
- [ ] Le rafraîchissement du token fonctionne
- [ ] Les données sont correctement affichées

---

## 🐛 Résolution de problèmes

### CORS Error

**Problème:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
1. Vérifier que `CORS_ALLOWED_ORIGINS` dans `backend/.env` inclut `http://localhost:5173`
2. Redémarrer le serveur Django

### Token invalide

**Problème:** `401 Unauthorized` sur toutes les requêtes

**Solution:**
1. Vérifier que le token est bien stocké: `localStorage.getItem('access_token')`
2. Se reconnecter pour obtenir un nouveau token
3. Vérifier que le header Authorization est bien envoyé

### Données non compatibles

**Problème:** Les données ne s'affichent pas correctement

**Solution:**
1. Vérifier la structure des données retournées par le backend
2. Adapter les composants pour utiliser les bons noms de champs
3. Utiliser `console.log(response.data)` pour déboguer

---

## 📞 Support

Pour toute question:
- Backend: Voir `backend/README.md`
- Frontend: Voir documentation React/Vite
- API: `http://localhost:8000/api/docs/`

---

✨ **Votre application est maintenant prête à fonctionner avec le backend Django !**
