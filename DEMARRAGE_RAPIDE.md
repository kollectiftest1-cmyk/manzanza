# 🚀 DÉMARRAGE RAPIDE - SYNTAX GU

## ⚡ Lancer l'application en 10 minutes

---

## 📋 PRÉREQUIS

✅ Python 3.10+ installé
✅ Node.js 18+ installé
✅ Un terminal PowerShell ou CMD

---

## 🔧 ÉTAPE 1 : BACKEND (5 minutes)

### Ouvrir un terminal dans le dossier backend

```powershell
cd "C:\Users\NZ\Desktop\Kollectif\syntax GU\backend"
```

### Créer et activer l'environnement virtuel

```powershell
python -m venv venv
venv\Scripts\activate
```

### Installer les dépendances

```powershell
pip install -r requirements.txt
```

### Configurer l'environnement

```powershell
copy .env.example .env
```

### Initialiser la base de données

```powershell
python manage.py makemigrations
python manage.py migrate
```

### Créer un super utilisateur

```powershell
python manage.py createsuperuser
```

**Entrez les informations :**
- Email: `admin@syntaxgu.com`
- Prénom: `Admin`
- Nom: `System`
- Mot de passe: (votre choix, ex: `admin123`)

### Lancer le serveur backend

```powershell
python manage.py runserver
```

✅ **Backend prêt sur:** http://localhost:8000
📚 **Documentation API:** http://localhost:8000/api/docs/
⚙️ **Admin Django:** http://localhost:8000/admin/

---

## 🎨 ÉTAPE 2 : FRONTEND (3 minutes)

### Ouvrir un NOUVEAU terminal à la racine du projet

```powershell
cd "C:\Users\NZ\Desktop\Kollectif\syntax GU"
```

### Configurer l'environnement

```powershell
copy .env.example .env
```

### Installer les dépendances (si pas déjà fait)

```powershell
npm install
```

### Lancer le serveur frontend

```powershell
npm run dev
```

✅ **Frontend prêt sur:** http://localhost:5173

---

## 🧪 ÉTAPE 3 : TESTER LA CONNEXION (2 minutes)

### 1. Ouvrir le navigateur

Aller sur http://localhost:5173

### 2. Se connecter

Utiliser les identifiants du super utilisateur :
- Email: `admin@syntaxgu.com`
- Mot de passe: celui que vous avez choisi

### 3. Tester l'API directement

Ouvrir http://localhost:8000/api/docs/

Cliquer sur "Authorize" et entrer le token JWT obtenu après login.

---

## 📊 CRÉER DES DONNÉES DE TEST

### Ouvrir le shell Django

```powershell
# Dans le terminal backend
python manage.py shell
```

### Coller ce code pour créer des données

```python
from apps.users.models import User
from apps.auditoires.models import Auditoire
from apps.courses.models import Course

# Créer un auditoire
auditoire = Auditoire.objects.create(
    nom="L1 Finance A",
    niveau="L1",
    filiere="finance",
    description="Première année Finance - Promotion A",
    annee_academique="2024-2025",
    capacite_max=50
)

# Créer un étudiant
etudiant = User.objects.create_user(
    email="etudiant@test.com",
    password="test123",
    first_name="Jean",
    last_name="Dupont",
    role="etudiant",
    matricule="STU2024001",
    promotion="L1 Finance 2024",
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
    description="Cours d'introduction aux principes de base de la comptabilité",
    teacher=prof,
    auditoire=auditoire,
    credits=3,
    semester="Semestre 1"
)

# Créer un bibliothécaire
biblio = User.objects.create_user(
    email="biblio@test.com",
    password="test123",
    first_name="Lucie",
    last_name="Livres",
    role="bibliothecaire"
)

# Créer un caissier
caisse = User.objects.create_user(
    email="caisse@test.com",
    password="test123",
    first_name="Paul",
    last_name="Paiement",
    role="caisse"
)

print("✅ Données de test créées avec succès !")
print("\nComptes créés:")
print("- admin@syntaxgu.com (Admin)")
print("- etudiant@test.com / test123 (Étudiant)")
print("- prof@test.com / test123 (Enseignant)")
print("- biblio@test.com / test123 (Bibliothécaire)")
print("- caisse@test.com / test123 (Caissier)")
```

### Quitter le shell

```python
exit()
```

---

## 🎯 TESTER LES FONCTIONNALITÉS

### Se connecter avec différents rôles

1. **Étudiant** (etudiant@test.com / test123)
   - Voir le dashboard étudiant
   - S'inscrire aux cours
   - Passer des quiz
   - Consulter la bibliothèque

2. **Enseignant** (prof@test.com / test123)
   - Voir le dashboard enseignant
   - Gérer les cours
   - Créer des quiz
   - Noter les devoirs

3. **Admin** (admin@syntaxgu.com)
   - Accès total
   - Gérer tous les modules
   - Interface admin Django

---

## 🔍 VÉRIFIER QUE TOUT FONCTIONNE

### ✅ Checklist

- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Login fonctionne
- [ ] Dashboard s'affiche
- [ ] Cours visibles
- [ ] API docs accessible
- [ ] Admin Django accessible

---

## 🐛 EN CAS DE PROBLÈME

### Backend ne démarre pas

**Erreur : "No module named..."**
```powershell
pip install -r requirements.txt
```

**Erreur : "Table doesn't exist"**
```powershell
python manage.py migrate
```

### Frontend ne démarre pas

**Erreur : "Cannot find module"**
```powershell
npm install
```

### CORS Error

Vérifier que le backend `.env` contient :
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Puis redémarrer le serveur backend.

### Login ne fonctionne pas

1. Vérifier que le backend est bien démarré
2. Vérifier l'URL dans `.env` du frontend : `VITE_API_URL=http://localhost:8000/api`
3. Ouvrir la console du navigateur (F12) pour voir les erreurs

---

## 📱 ACCÈS RAPIDES

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | admin@syntaxgu.com |
| **Backend API** | http://localhost:8000/api/ | - |
| **API Docs** | http://localhost:8000/api/docs/ | - |
| **Admin Django** | http://localhost:8000/admin/ | admin@syntaxgu.com |

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide complet:** `PROJET_COMPLET.md`
- **Guide d'intégration:** `INTEGRATION_GUIDE.md`
- **Backend README:** `backend/README.md`
- **Quick Start Backend:** `backend/QUICK_START.md`
- **Résumé:** `RESUME_COMPLET.md`

---

## 🎓 PROCHAINES ÉTAPES

1. ✅ Application démarrée
2. ✅ Données de test créées
3. 📖 Explorer les fonctionnalités
4. 🎨 Personnaliser selon vos besoins
5. 🚀 Déployer en production

---

## 💡 COMMANDES UTILES

### Backend

```powershell
# Activer l'environnement virtuel
venv\Scripts\activate

# Créer des migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver

# Shell Django
python manage.py shell

# Lancer les tests
python manage.py test
```

### Frontend

```powershell
# Installer les dépendances
npm install

# Lancer le dev server
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

---

## 🎉 SUCCÈS !

Votre application Syntax GU est maintenant opérationnelle avec :

✅ Backend Django REST complet
✅ Frontend React fonctionnel
✅ Authentification JWT
✅ 10 modules intégrés
✅ 15 rôles utilisateurs
✅ 100+ endpoints API
✅ Documentation complète

**Bon développement ! 🚀**

---

Pour toute question, consultez la documentation dans les fichiers MD à la racine du projet.
