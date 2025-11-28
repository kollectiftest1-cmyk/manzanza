# Guide d'Installation - Syntax GU Backend

## 📋 Prérequis

- Python 3.10 ou supérieur
- PostgreSQL 14+ (recommandé) ou SQLite (développement)
- pip (gestionnaire de paquets Python)
- Git

## 🚀 Installation Rapide

### 1. Cloner le projet

```bash
cd "C:/Users/NZ/Desktop/Kollectif/syntax GU/backend"
```

### 2. Créer un environnement virtuel

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configuration de l'environnement

Créer un fichier `.env` à la racine du dossier `backend/` :

```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos paramètres :

```env
# Django Settings
SECRET_KEY=votre-cle-secrete-ultra-longue-et-complexe-ici
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données SQLite (développement)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# OU PostgreSQL (production recommandée)
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=syntax_gu_db
# DB_USER=postgres
# DB_PASSWORD=votre_mot_de_passe
# DB_HOST=localhost
# DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

### 5. Créer la base de données

```bash
# Créer les migrations pour toutes les apps
python manage.py makemigrations users
python manage.py makemigrations auditoires
python manage.py makemigrations courses
python manage.py makemigrations quiz
python manage.py makemigrations chat
python manage.py makemigrations assignments
python manage.py makemigrations library
python manage.py makemigrations payments
python manage.py makemigrations hr
python manage.py makemigrations notifications

# Appliquer toutes les migrations
python manage.py migrate
```

### 6. Créer un superutilisateur

```bash
python manage.py createsuperuser
```

Suivre les instructions :
- Email: admin@syntax.gu
- Prénom: Admin
- Nom: System
- Mot de passe: [votre mot de passe sécurisé]

### 7. Charger les données initiales (optionnel)

```bash
# Créer des données de test
python manage.py shell
```

Dans le shell Python, exécuter :

```python
from apps.users.models import User
from apps.auditoires.models import Auditoire
from apps.courses.models import Course

# Créer des auditoires
auditoire_l1 = Auditoire.objects.create(
    nom="L1 Finance",
    niveau="L1",
    filiere="finance",
    capacite_max=50,
    annee_academique="2024-2025"
)

# Créer un enseignant
teacher = User.objects.create_user(
    email="teacher@syntax.gu",
    password="teacher123",
    first_name="Jean",
    last_name="Dupont",
    role="enseignant"
)

# Créer un étudiant
student = User.objects.create_user(
    email="student@syntax.gu",
    password="student123",
    first_name="Marie",
    last_name="Martin",
    role="etudiant",
    matricule="STU2024001",
    promotion="2024-2025",
    auditoire=auditoire_l1
)

# Créer un cours
course = Course.objects.create(
    name="Comptabilité Générale",
    code="COMPT101",
    description="Introduction à la comptabilité",
    credits=6,
    teacher=teacher,
    auditoire=auditoire_l1,
    semester="Semestre 1"
)

print("✅ Données de test créées avec succès!")
exit()
```

### 8. Lancer le serveur de développement

```bash
python manage.py runserver
```

Le serveur sera accessible sur : **http://localhost:8000**

API Documentation : **http://localhost:8000/api/docs/**

Admin Panel : **http://localhost:8000/admin/**

## 🔍 Vérification de l'installation

### Tester l'API

**1. Tester le endpoint de santé :**

```bash
curl http://localhost:8000/api/
```

**2. Tester la connexion :**

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@syntax.gu\",\"password\":\"votre_mot_de_passe\"}"
```

**3. Accéder à la documentation interactive :**

Ouvrir dans le navigateur : http://localhost:8000/api/docs/

## 🗄️ Configuration PostgreSQL (Production)

### Installation PostgreSQL

**Windows:**
Télécharger depuis : https://www.postgresql.org/download/windows/

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### Créer la base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le prompt PostgreSQL
CREATE DATABASE syntax_gu_db;
CREATE USER syntax_user WITH PASSWORD 'votre_mot_de_passe_fort';
ALTER ROLE syntax_user SET client_encoding TO 'utf8';
ALTER ROLE syntax_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE syntax_user SET timezone TO 'Africa/Kinshasa';
GRANT ALL PRIVILEGES ON DATABASE syntax_gu_db TO syntax_user;
\q
```

### Mettre à jour .env

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syntax_gu_db
DB_USER=syntax_user
DB_PASSWORD=votre_mot_de_passe_fort
DB_HOST=localhost
DB_PORT=5432
```

### Réexécuter les migrations

```bash
python manage.py migrate
```

## 📦 Collecter les fichiers statiques

Pour la production :

```bash
python manage.py collectstatic
```

## 🧪 Tests

```bash
# Lancer tous les tests
python manage.py test

# Tester une app spécifique
python manage.py test apps.users

# Avec coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## 🐛 Dépannage

### Erreur : "ModuleNotFoundError"

```bash
pip install -r requirements.txt --force-reinstall
```

### Erreur : "django.db.utils.OperationalError"

Vérifier que PostgreSQL est en cours d'exécution :

```bash
# Windows
Get-Service postgresql*

# Linux
sudo systemctl status postgresql
```

### Erreur : "CORS policy"

Vérifier que `CORS_ALLOWED_ORIGINS` dans `.env` inclut votre URL frontend.

### Migrations en conflit

```bash
# Supprimer toutes les migrations
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Recréer les migrations
python manage.py makemigrations
python manage.py migrate
```

### Réinitialiser la base de données

```bash
# Supprimer la base SQLite
rm db.sqlite3

# Ou pour PostgreSQL
# DROP DATABASE syntax_gu_db;
# CREATE DATABASE syntax_gu_db;

# Réappliquer les migrations
python manage.py migrate
python manage.py createsuperuser
```

## 🔐 Sécurité

### Générer une nouvelle SECRET_KEY

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### Configurer HTTPS (Production)

Ajouter dans `settings.py` :

```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
```

## 📊 Commandes utiles

```bash
# Créer un nouveau superuser
python manage.py createsuperuser

# Shell interactif Django
python manage.py shell

# Vérifier les problèmes du projet
python manage.py check

# Afficher toutes les URLs
python manage.py show_urls

# Créer des migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Afficher les migrations
python manage.py showmigrations

# Revenir à une migration spécifique
python manage.py migrate app_name migration_name

# Créer un fichier de dump de la base de données
python manage.py dumpdata > backup.json

# Charger des données depuis un dump
python manage.py loaddata backup.json
```

## 📝 Notes importantes

1. **Ne jamais commiter le fichier `.env`** dans Git
2. **Changer la SECRET_KEY** en production
3. **Désactiver DEBUG** en production (`DEBUG=False`)
4. **Utiliser PostgreSQL** en production
5. **Configurer un serveur WSGI** (Gunicorn, uWSGI) pour la production
6. **Utiliser HTTPS** en production
7. **Configurer des backups réguliers** de la base de données

## ✅ Checklist de déploiement

- [ ] SECRET_KEY changée
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS configuré
- [ ] PostgreSQL configuré
- [ ] Migrations appliquées
- [ ] Fichiers statiques collectés
- [ ] CORS configuré correctement
- [ ] HTTPS activé
- [ ] Backups configurés
- [ ] Monitoring en place
- [ ] Variables d'environnement sécurisées

## 🆘 Support

Pour toute question ou problème :
1. Consulter la documentation : `/backend/README.md`
2. Vérifier les logs : `python manage.py runserver` (mode verbose)
3. Contacter l'équipe de développement

---

**Installation réussie ! 🎉**
