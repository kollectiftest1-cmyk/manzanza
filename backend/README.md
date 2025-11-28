# Syntax GU - Backend Django REST API

Backend complet pour le système de gestion universitaire Syntax GU, construit avec Django et Django REST Framework.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Modèles de données](#modèles-de-données)
- [Authentification](#authentification)
- [Permissions](#permissions)

## 🚀 Fonctionnalités

### Modules principaux

1. **👥 Gestion des utilisateurs (users)**
   - 15 rôles différents (Étudiant, Enseignant, PDG, etc.)
   - Authentification JWT
   - Profils utilisateurs personnalisés

2. **📚 Cours (courses)**
   - Gestion des cours
   - Inscriptions
   - Matériels de cours
   - Progression des étudiants

3. **🏛️ Auditoires (auditoires)**
   - Classes virtuelles
   - Gestion des promotions
   - Niveaux et filières

4. **📝 Quiz & Évaluations (quiz)**
   - Questions à choix multiples
   - Vrai/Faux
   - Réponses courtes
   - Système de notation automatique

5. **💬 Chat & Forums (chat)**
   - Canaux de discussion par cours
   - Messages avec réactions
   - Fil de réponses

6. **📄 Travaux TP/TD (assignments)**
   - Gestion des devoirs
   - Soumissions
   - Notation et feedback

7. **📖 Bibliothèque (library)**
   - Gestion des livres
   - Emprunts et réservations
   - Amendes pour retards

8. **💰 Paiements (payments)**
   - Types de frais
   - Suivi des paiements
   - Statistiques financières

9. **👔 Ressources Humaines (hr)**
   - Gestion du personnel
   - Contrats
   - Paies
   - Congés

10. **🔔 Notifications (notifications)**
    - Notifications personnelles
    - Annonces publiques
    - Système de priorités

## 🏗️ Architecture

```
backend/
├── config/                 # Configuration Django
│   ├── settings.py        # Paramètres
│   ├── urls.py            # URLs principales
│   └── wsgi.py            # WSGI
├── apps/                   # Applications Django
│   ├── users/             # Utilisateurs & Auth
│   ├── courses/           # Cours
│   ├── auditoires/        # Auditoires
│   ├── quiz/              # Quiz
│   ├── chat/              # Chat
│   ├── assignments/       # TP/TD
│   ├── library/           # Bibliothèque
│   ├── payments/          # Paiements
│   ├── hr/                # RH
│   └── notifications/     # Notifications
├── media/                  # Fichiers uploadés
├── static/                 # Fichiers statiques
├── manage.py              # Script Django
└── requirements.txt       # Dépendances

Chaque app contient:
├── models.py              # Modèles de données
├── serializers.py         # Serializers DRF
├── views.py               # ViewSets et vues
├── urls.py                # Routes
├── admin.py               # Interface admin
└── apps.py                # Configuration
```

## 📦 Installation

### Prérequis

- Python 3.10+
- PostgreSQL (ou SQLite pour dev)
- pip

### Étapes

1. **Créer un environnement virtuel**
```bash
cd backend
python -m venv venv
```

2. **Activer l'environnement**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configurer les variables d'environnement**
```bash
# Copier le fichier exemple
copy .env.example .env

# Éditer .env avec vos paramètres
```

5. **Créer la base de données**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Créer un superutilisateur**
```bash
python manage.py createsuperuser
```

7. **Lancer le serveur**
```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://localhost:8000`

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syntax_gu_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

## 🔗 API Endpoints

### Base URL: `http://localhost:8000/api/`

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/logout/` - Déconnexion
- `POST /api/auth/token/refresh/` - Rafraîchir le token
- `GET /api/auth/users/me/` - Profil utilisateur actuel
- `POST /api/auth/users/change_password/` - Changer le mot de passe

### Cours
- `GET /api/courses/` - Liste des cours
- `POST /api/courses/` - Créer un cours
- `GET /api/courses/{id}/` - Détails d'un cours
- `POST /api/courses/{id}/enroll/` - S'inscrire à un cours
- `GET /api/courses/my_courses/` - Mes cours
- `GET /api/courses/materials/` - Matériels de cours

### Auditoires
- `GET /api/auditoires/` - Liste des auditoires
- `GET /api/auditoires/{id}/students/` - Étudiants d'un auditoire
- `GET /api/auditoires/{id}/courses/` - Cours d'un auditoire

### Quiz
- `GET /api/quiz/` - Liste des quiz
- `POST /api/quiz/{id}/start_attempt/` - Démarrer une tentative
- `POST /api/quiz/{id}/submit_attempt/` - Soumettre les réponses
- `GET /api/quiz/my_quizzes/` - Mes quiz
- `GET /api/quiz/attempts/` - Historique des tentatives

### Chat
- `GET /api/chat/channels/` - Canaux de discussion
- `GET /api/chat/messages/` - Messages
- `POST /api/chat/messages/` - Envoyer un message
- `POST /api/chat/messages/{id}/react/` - Réagir à un message

### Assignments (TP/TD)
- `GET /api/assignments/` - Liste des travaux
- `POST /api/assignments/{id}/submit/` - Soumettre un travail
- `GET /api/assignments/submissions/` - Soumissions
- `POST /api/assignments/submissions/{id}/grade/` - Noter une soumission

### Bibliothèque
- `GET /api/library/books/` - Liste des livres
- `POST /api/library/books/{id}/borrow/` - Emprunter un livre
- `POST /api/library/books/{id}/reserve/` - Réserver un livre
- `GET /api/library/loans/my_loans/` - Mes emprunts

### Paiements
- `GET /api/payments/student-fees/my_fees/` - Mes frais
- `GET /api/payments/` - Historique des paiements
- `POST /api/payments/` - Effectuer un paiement
- `GET /api/payments/student-fees/statistics/` - Statistiques

### RH
- `GET /api/hr/employees/` - Liste du personnel
- `GET /api/hr/contracts/` - Contrats
- `GET /api/hr/payrolls/` - Paies
- `GET /api/hr/leaves/` - Congés
- `POST /api/hr/leaves/{id}/approve/` - Approuver un congé

### Notifications
- `GET /api/notifications/` - Liste des notifications
- `GET /api/notifications/unread/` - Notifications non lues
- `GET /api/notifications/unread_count/` - Nombre de non lues
- `POST /api/notifications/{id}/mark_read/` - Marquer comme lu
- `GET /api/notifications/announcements/` - Annonces

## 📊 Modèles de données

### User (Utilisateur)
```python
- email (unique)
- first_name, last_name
- role (15 types)
- status (actif, inactif, suspendu)
- matricule (pour étudiants)
- promotion, auditoire
- department, section (pour staff)
```

### Rôles disponibles
1. pdg - PDG
2. directeur_general - Directeur Général
3. sga - SGA (Secrétariat Général Académique)
4. sgad - SGAD (Administration & Finances)
5. chef_section - Chef de Section
6. chef_departement - Chef de Département
7. enseignant - Enseignant
8. assistant - Assistant
9. apparitorat - Apparitorat
10. caisse - Caisse/Comptabilité
11. service_it - Service IT
12. etudiant - Étudiant
13. bibliothecaire - Bibliothécaire
14. jury - Jury Mémoire/Défense
15. iadmin - iAdmin (Super Utilisateur)

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token

```bash
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

### Utiliser le token

Ajouter le header à chaque requête:
```
Authorization: Bearer <access_token>
```

### Rafraîchir le token

```bash
POST /api/auth/token/refresh/
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## 🔒 Permissions

### Hiérarchie des permissions

1. **IsAdminUser** - PDG, Directeur Général, SGA, SGAD, iAdmin
2. **IsTeacherOrAdmin** - Enseignants, Assistants, Chefs + Admins
3. **IsLibrarianOrAdmin** - Bibliothécaires + Admins
4. **IsHROrAdmin** - SGAD, Directeur Général, iAdmin
5. **IsCaisseOrAdmin** - Caisse, SGAD, iAdmin
6. **IsOwnerOrAdmin** - Propriétaire de la ressource + Admins

## 📚 Documentation API

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Admin Panel**: `http://localhost:8000/admin/`

## 🧪 Tests

```bash
# Lancer tous les tests
python manage.py test

# Tests pour une app spécifique
python manage.py test apps.users
```

## 🔄 Commandes utiles

```bash
# Créer des migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superuser
python manage.py createsuperuser

# Collecter les fichiers statiques
python manage.py collectstatic

# Lancer le shell Django
python manage.py shell

# Vider la base de données
python manage.py flush
```

## 📝 Notes importantes

- Toutes les dates/heures sont en UTC et converties en fuseau Africa/Kinshasa
- Les fichiers uploadés sont stockés dans `/media/`
- Pagination: 20 items par page par défaut
- Format de date: YYYY-MM-DD
- Format datetime: YYYY-MM-DD HH:MM:SS

## 🛠️ Technologies utilisées

- Django 4.2.9
- Django REST Framework 3.14.0
- JWT Authentication
- PostgreSQL/SQLite
- Pillow (images)
- drf-yasg (documentation API)

## 👥 Développement

Ce backend a été développé pour supporter toutes les fonctionnalités du frontend React, avec une compatibilité totale des routes et des structures de données.

## 📄 Licence

Propriétaire - Syntax GU © 2024
