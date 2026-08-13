# Guide de Test - Connexion Frontend-Backend

## 🚀 Démarrage Rapide

### Étape 1: Démarrer le Backend

```bash
# Ouvrir un terminal (Terminal 1)
cd backend

# Créer les tables de la base de données
python manage.py migrate

# Créer les utilisateurs de test
python create_test_users.py

# Démarrer le serveur
python manage.py runserver
```

Le backend sera accessible sur: **http://localhost:8000**

### Étape 2: Démarrer le Frontend

```bash
# Ouvrir un nouveau terminal (Terminal 2)
# Rester dans le dossier racine du projet
npm run dev
```

Le frontend sera accessible sur: **http://localhost:5173**

---

## 👥 Utilisateurs de Test Disponibles

Tous les utilisateurs utilisent le mot de passe: **`password123`**

| Rôle | Email | Nom |
|------|-------|-----|
| **Étudiant** | `etudiant@syntaxgu.ac.cd` | Jean Dupont |
| **Enseignant** | `enseignant@syntaxgu.ac.cd` | Martin Dubois |
| **Assistant** | `assistant@syntaxgu.ac.cd` | Sophie Laurent |
| **Chef de Département** | `chef.departement@syntaxgu.ac.cd` | Pierre Morel |
| **Chef de Section** | `chef.section@syntaxgu.ac.cd` | Marie Legrand |
| **SGA** | `sga@syntaxgu.ac.cd` | Luc Bernard |
| **SGAD** | `sgad@syntaxgu.ac.cd` | Anne Petit |
| **Directeur Général** | `directeur@syntaxgu.ac.cd` | Claude Rousseau |
| **PDG** | `pdg@syntaxgu.ac.cd` | François Vincent |
| **Bibliothécaire** | `bibliothecaire@syntaxgu.ac.cd` | Isabelle Girard |
| **Caisse/Comptabilité** | `caisse@syntaxgu.ac.cd` | Robert Bonnet |
| **Service IT** | `it@syntaxgu.ac.cd` | Nicolas Fournier |
| **Apparitorat** | `apparitorat@syntaxgu.ac.cd` | Thomas Mercier |
| **Jury** | `jury@syntaxgu.ac.cd` | Christine Blanc |
| **Admin (iAdmin)** | `admin@syntaxgu.ac.cd` | Admin System |

---

## ✅ Tests à Effectuer

### Test 1: Connexion Basique

1. Ouvrir `http://localhost:5173/login`
2. Entrer:
   - **Email:** `etudiant@syntaxgu.ac.cd`
   - **Mot de passe:** `password123`
3. Cliquer sur "Se connecter"

**Résultat attendu:**
- ✅ Redirection vers `/dashboard`
- ✅ Menu latéral affiche "JEAN DUPONT"
- ✅ Menu latéral affiche "ETUDIANT"
- ✅ Menu étudiant visible: Mes Cours, Auditoires, Quiz, TP/TD, Bibliothèque, Paiements

### Test 2: Vérifier les Tokens JWT

1. Se connecter (comme Test 1)
2. Ouvrir la console du navigateur (F12)
3. Taper:
```javascript
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
JSON.parse(localStorage.getItem('user'))
```

**Résultat attendu:**
- ✅ `access_token` contient un long token JWT
- ✅ `refresh_token` contient un autre token JWT
- ✅ `user` contient: `{ id, email, first_name, last_name, role: "etudiant", ... }`

### Test 3: Menu par Rôle

Tester différents rôles pour vérifier que le menu change:

**Enseignant** (`enseignant@syntaxgu.ac.cd`):
- ✅ Menu: Mes Cours, Auditoires, Gestion Quiz, TP/TD, Bibliothèque

**Admin** (`admin@syntaxgu.ac.cd`):
- ✅ Menu: TOUS les modules disponibles (11 items)

**Bibliothécaire** (`bibliothecaire@syntaxgu.ac.cd`):
- ✅ Menu: Bibliothèque, Ressources Cours

### Test 4: Déconnexion

1. Se connecter
2. Cliquer sur "Déconnexion" dans le menu latéral
3. Vérifier la console (F12)

**Résultat attendu:**
- ✅ Redirection vers `/login`
- ✅ localStorage vidé (vérifier avec `localStorage.getItem('access_token')` → null)
- ✅ Requête POST vers `/api/auth/logout/` visible dans Network tab

### Test 5: Protection des Routes

1. Ne PAS se connecter
2. Essayer d'accéder à `http://localhost:5173/dashboard`

**Résultat attendu:**
- ✅ Redirection automatique vers `/login`

### Test 6: Persistance de la Session

1. Se connecter
2. Fermer le navigateur
3. Rouvrir et aller sur `http://localhost:5173`

**Résultat attendu:**
- ✅ Utilisateur toujours connecté (chargé depuis localStorage)
- ✅ Affichage direct du dashboard

### Test 7: Requêtes API avec Token

1. Se connecter en tant qu'étudiant
2. Aller sur la page `/courses`
3. Ouvrir DevTools (F12) → Network tab
4. Observer les requêtes

**Résultat attendu:**
- ✅ Requête GET vers `/api/courses/` avec header `Authorization: Bearer ...`
- ✅ Si aucun cours: réponse vide `[]` (normal, base de données vide)

### Test 8: Gestion d'Erreur - Mauvais Identifiants

1. Sur `/login`, entrer:
   - Email: `faux@email.com`
   - Password: `mauvais`
2. Cliquer sur "Se connecter"

**Résultat attendu:**
- ✅ Message d'erreur affiché: "Erreur de connexion. Vérifiez vos identifiants."
- ✅ Reste sur la page de login
- ✅ Aucun token dans localStorage

### Test 9: Expiration du Token (Optionnel)

1. Se connecter
2. Dans la console, expirer manuellement le token:
```javascript
localStorage.setItem('access_token', 'invalid_token')
```
3. Naviguer vers `/courses`

**Résultat attendu:**
- ✅ Tentative automatique de refresh du token
- ✅ Si refresh échoue: redirection vers `/login`

---

## 🔍 Débogage

### Vérifier que le Backend fonctionne

```bash
# Tester l'API directement avec curl
curl http://localhost:8000/api/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"etudiant@syntaxgu.ac.cd","password":"password123"}'
```

**Réponse attendue:**
```json
{
  "access": "eyJ0eXAi...",
  "refresh": "eyJ0eXAi...",
  "user": {
    "id": 1,
    "email": "etudiant@syntaxgu.ac.cd",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "etudiant",
    ...
  }
}
```

### Vérifier les Logs du Backend

Dans le terminal du backend, observer les requêtes:
```
[15/Jan/2024 10:30:15] "POST /api/auth/login/ HTTP/1.1" 200 1234
[15/Jan/2024 10:30:16] "GET /api/courses/ HTTP/1.1" 200 567
```

### Vérifier la Console du Frontend

Ouvrir F12 → Console, observer:
- Erreurs JavaScript
- Messages de connexion/déconnexion
- Erreurs réseau

### Vérifier Network Tab

F12 → Network:
- Observer les requêtes vers `localhost:8000`
- Vérifier les headers `Authorization`
- Vérifier les réponses (200 OK, 401 Unauthorized, etc.)

---

## ⚠️ Problèmes Courants

### ❌ "Network Error" lors du login

**Causes possibles:**
1. Backend non démarré
2. Mauvaise URL dans `.env`
3. CORS non configuré

**Solutions:**
```bash
# 1. Vérifier que le backend tourne
curl http://localhost:8000/api/auth/login/

# 2. Vérifier .env
cat .env
# Doit contenir: VITE_API_URL=http://localhost:8000/api

# 3. Vérifier backend/.env
cat backend/.env
# Doit contenir: CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### ❌ "Invalid credentials" malgré les bons identifiants

**Causes:**
1. Utilisateurs non créés
2. Mauvais mot de passe

**Solution:**
```bash
cd backend
python create_test_users.py
```

### ❌ Le menu ne s'affiche pas correctement

**Causes:**
1. Rôle non défini dans la base de données
2. Mauvais mapping dans Sidebar.jsx

**Solution:**
```bash
# Vérifier le rôle dans la console:
python manage.py shell
>>> from apps.users.models import User
>>> user = User.objects.get(email='etudiant@syntaxgu.ac.cd')
>>> user.role
'etudiant'
```

### ❌ Redirection infinie entre /login et /dashboard

**Causes:**
1. `isAuthenticated` mal géré
2. Tokens corrompus

**Solution:**
```javascript
// Console navigateur
localStorage.clear()
// Puis recharger la page
```

---

## 📊 Checklist Complète

Avant de considérer les tests réussis:

- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] 15 utilisateurs créés avec succès
- [ ] Connexion étudiant fonctionne
- [ ] Tokens JWT stockés dans localStorage
- [ ] Menu latéral affiche le bon rôle
- [ ] Déconnexion fonctionne
- [ ] Routes protégées redirigent vers /login
- [ ] Persistance de session fonctionne
- [ ] Requêtes API incluent le token JWT
- [ ] Gestion d'erreur fonctionne
- [ ] Plusieurs rôles testés (au moins 3)

---

## 🎯 Tests Avancés (Optionnel)

### Test API Courses

1. Créer un cours via Django Admin:
   - Aller sur `http://localhost:8000/admin`
   - Se connecter avec `admin@syntaxgu.ac.cd` / `password123`
   - Créer un cours dans "Courses"

2. Dans le frontend:
   - Se connecter en tant qu'étudiant
   - Aller sur `/courses`
   - Vérifier que le cours apparaît

### Test API Documentation

1. Ouvrir `http://localhost:8000/api/docs/`
2. Vérifier la documentation Swagger
3. Tester un endpoint directement depuis Swagger

---

## ✅ Confirmation Finale

Si tous les tests passent:

🎉 **Le frontend est 100% connecté au backend !**

Vous pouvez maintenant:
- Créer des cours dans le backend
- Les voir dans le frontend
- Gérer l'authentification par rôle
- Développer de nouvelles fonctionnalités

---

## 📞 Besoin d'Aide ?

Consultez:
- `GUIDE_CONNEXION_FRONTEND_BACKEND.md` - Guide détaillé
- `VERIFICATION_RAPPORT.md` - Rapport technique
- `DEMARRAGE_RAPIDE.md` - Guide de démarrage
- `backend/README.md` - Documentation backend
