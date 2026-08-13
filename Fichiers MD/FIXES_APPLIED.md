# Corrections appliquées - Syntax GU

## Date: 03/12/2025

## Problèmes résolus

### 1. ❌ Erreur 500 sur `/api/teachers/` - RÉSOLU ✅

**Problème:**
```
TypeError: 'Meta.fields' must not contain non-model field names: courses_held__filieres, courses_held__sections
```

**Cause:**
- Le champ `courses_held` n'existe pas dans le modèle User (le bon nom est `courses_as_teacher`)
- Les cours n'ont pas de champs `filieres` et `sections` (ils ont `auditoire` qui pointe vers une filière)
- Le filterset tentait de filtrer sur des champs inexistants

**Solution:**
- Créé un `TeacherFilter` personnalisé dans `backend/apps/users/views.py`
- Utilisé des méthodes de filtrage personnalisées avec les bons noms de champs:
  - `courses_as_teacher` et `courses_as_assistant` au lieu de `courses_held`
  - `courses_as_teacher__auditoire__filiere__section` pour filtrer par section
  - `courses_as_teacher__auditoire__filiere` pour filtrer par filière
- Ajouté `prefetch_related` pour optimiser les requêtes

**Fichiers modifiés:**
- `backend/apps/users/views.py`: Ajout de `TeacherFilter` avec filtres personnalisés

---

### 2. ❌ Sélection multiple dans la création de cours - RÉSOLU ✅

**Problème:**
- Le formulaire de création de cours utilisait un select multiple pour les auditoires
- Le modèle Course n'accepte qu'UN SEUL auditoire (ForeignKey, pas ManyToMany)

**Solution:**
- Remplacé `<Form.Control as="select" multiple>` par `<Form.Select>`
- Mis à jour la logique pour gérer un seul auditoire au lieu d'un tableau
- Corrigé `openEditModal` pour extraire correctement l'ID de l'auditoire

**Fichiers modifiés:**
- `src/pages/Courses.jsx`: Changé de multi-select à select simple pour auditoire

---

### 3. ❌ Erreurs de sérialisation avec champs null - RÉSOLU ✅

**Problème:**
- Les serializers utilisaient `source='field.subfield'` qui causait des erreurs quand les relations étaient null
- Par exemple: `source='titulaire.name'` échouait si `titulaire` était None
- Même problème avec `chef_filiere`, `chef_section`, `created_by`, etc.

**Solution:**
- Remplacé tous les `serializers.CharField(source='...')` par `serializers.SerializerMethodField()`
- Ajouté des méthodes `get_*` qui vérifient si l'objet existe avant d'accéder aux attributs
- Appliqué cette correction dans tous les serializers

**Fichiers modifiés:**
1. `backend/apps/courses/serializers.py`:
   - `SimpleFiliereSerializer`: get_chef_filiere
   - `SimpleSectionSerializer`: get_chef_section
   - `SimpleAuditoireSerializer`: get_titulaire
   - `CourseSerializer`: get_filiere, get_section, get_auditoire_detail

2. `backend/apps/auditoires/serializers.py`:
   - `SimpleCourseSerializer`: get_titulaire_name
   - `FiliereDetailSerializer`: get_section_nom
   - `FiliereSerializer`: get_section_nom
   - `AuditoireSerializer`: get_created_by_name, get_section_name, get_filiere_name

3. `backend/apps/users/serializers.py`:
   - Changé toutes les références de `courses_held` à `courses_as_teacher`
   - Corrigé `get_sections` et `get_filieres` pour naviguer via `auditoire.filiere.section`

---

### 4. ❌ Références incorrectes à `courses_held` - RÉSOLU ✅

**Problème:**
- De nombreux endroits utilisaient `courses_held` qui n'existe pas
- Le bon nom de relation est `courses_as_teacher` (défini dans le modèle Course)

**Solution:**
- Remplacé toutes les occurrences de `courses_held` par `courses_as_teacher`
- Remplacé `courses_assisted` par `courses_as_assistant`

**Fichiers modifiés:**
- `backend/apps/users/serializers.py`: 4 occurrences corrigées
- `backend/apps/auditoires/serializers.py`: 2 occurrences corrigées

---

## Résumé des changements

### Backend (Python/Django)

**Fichiers créés:**
- `backend/test_all_endpoints.py` - Script de test pour tous les endpoints
- `backend/test_endpoints_http.py` - Test HTTP des endpoints

**Fichiers modifiés:**
1. `backend/apps/users/views.py`:
   - Ajout de `TeacherFilter` avec méthodes de filtrage personnalisées
   - Correction des champs de filtrage pour TeacherListView

2. `backend/apps/users/serializers.py`:
   - Correction de `courses_held` → `courses_as_teacher`
   - Correction de `courses_assisted` → `courses_as_assistant`
   - Mise à jour de `get_sections()` et `get_filieres()` pour naviguer correctement via auditoire

3. `backend/apps/courses/serializers.py`:
   - Ajout de SerializerMethodField pour tous les champs relationnels
   - Protection contre les valeurs null avec vérifications conditionnelles

4. `backend/apps/auditoires/serializers.py`:
   - Correction de `courses_held` → `courses_as_teacher`
   - Ajout de SerializerMethodField pour gérer les valeurs null

### Frontend (React)

**Fichiers modifiés:**
1. `src/pages/Courses.jsx`:
   - Changement du select multiple en select simple pour auditoire
   - Correction de la logique de modification de cours

---

## Tests recommandés

Pour vérifier que tout fonctionne:

```bash
# 1. Redémarrer le serveur Django
cd backend
python manage.py runserver

# 2. Tester les endpoints critiques
# Ouvrir dans le navigateur ou avec curl:
GET http://localhost:8000/api/teachers/
GET http://localhost:8000/api/students/
GET http://localhost:8000/api/courses/
GET http://localhost:8000/api/auditoires/
GET http://localhost:8000/api/sections/
GET http://localhost:8000/api/filieres/

# 3. Tester la création de cours dans le frontend
# - Se connecter en tant que SGA/Chef de section
# - Créer un nouveau cours
# - Vérifier que le select d'auditoire n'est pas multiple
```

---

## Points d'attention

### 1. Relations de modèle importantes

```python
# Course model
Course.titulaire → User (ForeignKey, related_name='courses_as_teacher')
Course.assistants → User (ManyToMany, related_name='courses_as_assistant')
Course.auditoire → Auditoire (ForeignKey)

# Auditoire model
Auditoire.filiere → Filiere (ForeignKey)
Auditoire.filiere.section → Section (via ForeignKey)
```

### 2. Noms de relations corrects

❌ **Mauvais:**
- `user.courses_held`
- `user.courses_assisted`
- `course.filieres` (n'existe pas)
- `course.sections` (n'existe pas)

✅ **Correct:**
- `user.courses_as_teacher`
- `user.courses_as_assistant`
- `course.auditoire.filiere`
- `course.auditoire.filiere.section`

### 3. Protection contre les valeurs null

Toujours utiliser `SerializerMethodField` pour les relations qui peuvent être null:

```python
# ❌ Mauvais - peut crasher si titulaire est None
titulaire_name = serializers.CharField(source='titulaire.name')

# ✅ Bon - protégé contre None
titulaire_name = serializers.SerializerMethodField()

def get_titulaire_name(self, obj):
    return obj.titulaire.name if obj.titulaire else None
```

---

## Prochaines étapes recommandées

1. ✅ Tester tous les endpoints avec le script fourni
2. ✅ Vérifier la création/modification de cours dans le frontend
3. 🔄 Exécuter les tests unitaires (si disponibles)
4. 🔄 Tester les filtres sur la page des enseignants
5. 🔄 Vérifier les permissions et l'accès selon les rôles

---

## Contact

En cas de problème ou de question, vérifier:
1. Les logs du serveur Django
2. La console du navigateur (erreurs JavaScript)
3. Les réponses API dans l'onglet Network des DevTools
