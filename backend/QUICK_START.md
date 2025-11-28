# 🚀 Guide de démarrage rapide - Backend Syntax GU

## Installation en 5 minutes

### 1️⃣ Prérequis
- Python 3.10 ou supérieur installé
- pip installé

### 2️⃣ Installation

```bash
# Naviguer vers le dossier backend
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3️⃣ Configuration

```bash
# Copier le fichier d'exemple
copy .env.example .env

# Le .env par défaut fonctionne pour SQLite (dev)
# Vous pouvez l'éditer si nécessaire
```

### 4️⃣ Base de données

```bash
# Créer les tables
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser
```

Entrez:
- Email: `admin@syntaxgu.com`
- Prénom: `Admin`
- Nom: `System`
- Mot de passe: (votre choix)

### 5️⃣ Lancer le serveur

```bash
python manage.py runserver
```

✅ **C'est prêt !**

- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
- Documentation: http://localhost:8000/api/docs/

## 📝 Créer des données de test

### Option 1: Interface Admin

1. Ouvrir http://localhost:8000/admin/
2. Connexion avec le super utilisateur
3. Créer manuellement des données

### Option 2: Shell Django

```bash
python manage.py shell
```

```python
from apps.users.models import User
from apps.auditoires.models import Auditoire
from apps.courses.models import Course

# Créer un auditoire
auditoire = Auditoire.objects.create(
    nom="L1 Finance A",
    niveau="L1",
    filiere="finance",
    annee_academique="2024-2025"
)

# Créer un étudiant
etudiant = User.objects.create_user(
    email="etudiant@test.com",
    password="test123",
    first_name="Jean",
    last_name="Dupont",
    role="etudiant",
    matricule="STU001",
    promotion="L1 Finance",
    auditoire=auditoire
)

# Créer un enseignant
prof = User.objects.create_user(
    email="prof@test.com",
    password="test123",
    first_name="Marie",
    last_name="Martin",
    role="enseignant",
    department="Comptabilité"
)

# Créer un cours
cours = Course.objects.create(
    name="Introduction à la Comptabilité",
    code="COMP101",
    teacher=prof,
    auditoire=auditoire,
    credits=3
)

print("✅ Données de test créées !")
```

## 🧪 Tester l'API

### Avec curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"etudiant@test.com\",\"password\":\"test123\"}"

# Récupérer le token retourné et l'utiliser
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### Avec Postman

1. Importer la collection API depuis http://localhost:8000/api/docs/
2. Configurer l'authentification Bearer Token
3. Tester les endpoints

## 🔧 Commandes utiles

```bash
# Créer une nouvelle migration
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser

# Lancer les tests
python manage.py test

# Shell Django
python manage.py shell

# Collecter les fichiers statiques
python manage.py collectstatic
```

## 📊 Structure des rôles par défaut

Créer des utilisateurs avec différents rôles:

```python
# Dans le shell Django
from apps.users.models import User

# PDG
User.objects.create_user(
    email="pdg@syntaxgu.com",
    password="test123",
    first_name="Pierre",
    last_name="Directeur",
    role="pdg"
)

# SGA
User.objects.create_user(
    email="sga@syntaxgu.com",
    password="test123",
    first_name="Sophie",
    last_name="Académique",
    role="sga"
)

# Bibliothécaire
User.objects.create_user(
    email="biblio@syntaxgu.com",
    password="test123",
    first_name="Lucie",
    last_name="Livres",
    role="bibliothecaire"
)
```

## 🐛 Problèmes courants

### Erreur: "No module named 'decouple'"

```bash
pip install python-decouple
```

### Erreur: "Table doesn't exist"

```bash
python manage.py migrate
```

### Port 8000 déjà utilisé

```bash
# Utiliser un autre port
python manage.py runserver 8001
```

### CORS Error depuis le frontend

Vérifier que `.env` contient:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📖 Documentation complète

- README principal: `README.md`
- Guide d'intégration: `../INTEGRATION_GUIDE.md`
- Documentation API: http://localhost:8000/api/docs/

## 🎯 Prochaines étapes

1. ✅ Backend installé et fonctionnel
2. 📱 Configurer le frontend (voir `INTEGRATION_GUIDE.md`)
3. 🔗 Connecter frontend et backend
4. 🎨 Personnaliser selon vos besoins

Bon développement ! 🚀
