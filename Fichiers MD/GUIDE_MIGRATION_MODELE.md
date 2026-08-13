# Guide de Migration - Corrections Modèle Course

**⚠️ IMPORTANT - Breaking Changes**

Ce guide vous accompagne pour migrer vers le nouveau modèle de données corrigé.

---

## 🔴 CHANGEMENTS CRITIQUES

### Avant → Après

| Champ | Avant | Après | Raison |
|-------|-------|-------|--------|
| `Course.auditoires` | ManyToManyField | ❌ SUPPRIMÉ | Un cours = un auditoire |
| `Course.auditoire` | ❌ N'existait pas | ForeignKey | Nouveau champ obligatoire |
| `Course.sections` | ManyToManyField | ❌ SUPPRIMÉ | Redondant (via auditoire) |
| `Course.filieres` | ManyToManyField | ❌ SUPPRIMÉ | Redondant (via auditoire) |
| `Course.titulaire` | FK (related_name='courses_held') | FK (related_name='courses_as_teacher') | Renommé pour clarté |
| `Course.assistants` | M2M (related_name='courses_assisted') | M2M (related_name='courses_as_assistant') | Renommé pour clarté |

---

## 📋 ÉTAPES DE MIGRATION

### Étape 1 : Sauvegarder les Données Existantes

```bash
# Sauvegarder tous les cours
python manage.py dumpdata courses.Course > backup_courses.json

# Sauvegarder les enrollments
python manage.py dumpdata courses.CourseEnrollment > backup_enrollments.json

# Sauvegarder toute la DB (recommandé)
python manage.py dumpdata > full_backup.json
```

### Étape 2 : Créer un Script de Migration des Données

Créer `backend/migrate_courses.py` :

```python
"""
Script pour migrer les cours vers le nouveau modèle
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Course
from apps.auditoires.models import Auditoire

def migrate_courses():
    """
    Migrer les cours existants.
    Pour chaque cours avec plusieurs auditoires, créer un cours distinct par auditoire.
    """
    print("🔄 Migration des cours...")

    # Si vous aviez des cours avec le champ auditoires (M2M)
    # Ce code ne fonctionnera qu'AVANT la migration Django
    # Après la migration, ce champ n'existera plus

    # Option 1: Si vous n'avez pas encore de données
    print("✅ Aucune donnée à migrer, vous pouvez procéder directement avec les migrations.")

    # Option 2: Si vous avez des données et AVANT migration
    # courses = Course.objects.all()
    # for course in courses:
    #     # Récupérer le premier auditoire
    #     if hasattr(course, 'auditoires') and course.auditoires.exists():
    #         first_auditoire = course.auditoires.first()
    #         # Note: vous devrez faire cela manuellement ou via une migration personnalisée
    #         print(f"Cours {course.name} → Auditoire {first_auditoire.nom}")

if __name__ == '__main__':
    migrate_courses()
```

### Étape 3 : Créer les Migrations Django

```bash
# Créer les migrations
python manage.py makemigrations courses

# Vous verrez un message comme:
# - Remove field auditoires from course
# - Remove field sections from course
# - Remove field filieres from course
# - Add field auditoire to course
# - Create model TeacherAssistant
```

### Étape 4 : Appliquer les Migrations

```bash
# Appliquer les migrations
python manage.py migrate courses

# Si vous obtenez des erreurs, voir section "Résolution de problèmes" ci-dessous
```

### Étape 5 : Vérification Post-Migration

```bash
# Lancer le shell Django
python manage.py shell
```

```python
from apps.courses.models import Course, TeacherAssistant
from apps.auditoires.models import Auditoire

# Vérifier qu'aucun cours n'a auditoire=None
courses_without_auditoire = Course.objects.filter(auditoire__isnull=True)
print(f"Cours sans auditoire: {courses_without_auditoire.count()}")

# Si > 0, assigner manuellement
for course in courses_without_auditoire:
    # Trouver un auditoire approprié
    auditoire = Auditoire.objects.first()  # Ou une logique plus complexe
    course.auditoire = auditoire
    course.save()
    print(f"✅ {course.name} → {auditoire.nom}")

# Vérifier l'auto-enrollment
from apps.users.models import User
student = User.objects.filter(role='etudiant').first()
if student and student.auditoire:
    print(f"Étudiant: {student.get_full_name()}")
    print(f"Auditoire: {student.auditoire.nom}")
    print(f"Cours de l'auditoire: {student.auditoire.courses.count()}")
    print(f"Inscriptions de l'étudiant: {student.enrollments.count()}")
```

---

## 🔧 RÉSOLUTION DE PROBLÈMES

### Erreur : "Cannot add field 'auditoire' without default"

**Solution :** Django demande une valeur par défaut pour les cours existants.

Option A - Permettre NULL temporairement :
```bash
# Modifier temporairement le modèle pour permettre null=True
# puis appliquer la migration
# puis remplir les valeurs
# puis modifier le modèle pour null=False
# puis nouvelle migration
```

Option B - Fournir une valeur par défaut dans la migration :
```python
# Dans le fichier de migration généré (ex: 0002_auto_*.py)
operations = [
    migrations.AddField(
        model_name='course',
        name='auditoire',
        field=models.ForeignKey(
            default=1,  # ID d'un auditoire existant
            on_delete=django.db.models.deletion.CASCADE,
            to='auditoires.auditoire'
        ),
        preserve_default=False,
    ),
]
```

### Erreur : "No such table: courses_teacherassistant"

**Solution :** Table pas encore créée.
```bash
python manage.py migrate courses
```

### Code Frontend Cassé (API Errors)

**Problème :** Le frontend utilise peut-être `course.auditoires` (pluriel).

**Solution :** Mettre à jour les appels API :

```javascript
// ❌ Avant
const auditoires = course.auditoires  // Tableau

// ✅ Après
const auditoire = course.auditoire    // Objet unique
const section = course.section        // Propriété calculée
const filiere = course.filiere        // Propriété calculée
```

---

## 📝 MIGRATION DES VUES/SERIALIZERS

### Course Serializer

```python
# backend/apps/courses/serializers.py

# ❌ À SUPPRIMER
sections = serializers.PrimaryKeyRelatedField(many=True, ...)
filieres = serializers.PrimaryKeyRelatedField(many=True, ...)
auditoires = serializers.PrimaryKeyRelatedField(many=True, ...)

# ✅ À AJOUTER
auditoire = serializers.PrimaryKeyRelatedField(queryset=Auditoire.objects.all())
section = serializers.CharField(source='section.nom', read_only=True)
filiere = serializers.CharField(source='filiere.nom', read_only=True)
```

### Course Views (filtrage)

```python
# ❌ Avant
courses = Course.objects.filter(sections__id=section_id)
courses = Course.objects.filter(filieres__id=filiere_id)
courses = Course.objects.filter(auditoires__id=auditoire_id)

# ✅ Après
courses = Course.objects.filter(auditoire__filiere__section__id=section_id)
courses = Course.objects.filter(auditoire__filiere__id=filiere_id)
courses = Course.objects.filter(auditoire__id=auditoire_id)
```

---

## ✅ CHECKLIST POST-MIGRATION

- [ ] Migrations appliquées sans erreur
- [ ] Tous les cours ont un auditoire (aucun NULL)
- [ ] Auto-enrollment fonctionne (nouvel étudiant → inscrit aux cours)
- [ ] Nouveaux cours → étudiants auditoire auto-inscrits
- [ ] TeacherAssistant model créé
- [ ] API teacher-assistants accessible
- [ ] Frontend mis à jour (si nécessaire)
- [ ] Tests passent

---

## 🧪 TESTS À EXÉCUTER

```bash
# 1. Créer un nouvel auditoire
python manage.py shell
```

```python
from apps.auditoires.models import Section, Filiere, Auditoire

section = Section.objects.first()
filiere = Filiere.objects.filter(section=section).first()

auditoire = Auditoire.objects.create(
    nom="Test L1 Info Jour",
    niveau='L1',
    filiere=filiere,
    vacation='jour',
    annee_academique='2024-2025'
)
print(f"✅ Auditoire créé: {auditoire}")
```

```python
# 2. Créer un cours pour cet auditoire
from apps.courses.models import Course
from apps.users.models import User

teacher = User.objects.filter(role='enseignant').first()

course = Course.objects.create(
    name="Algorithmique Avancée",
    auditoire=auditoire,
    titulaire=teacher,
    credits=5
)
print(f"✅ Cours créé: {course}")
print(f"   Section: {course.section.nom}")
print(f"   Filière: {course.filiere.nom}")
```

```python
# 3. Créer un étudiant dans cet auditoire
student = User.objects.create_user(
    email='test.student@example.com',
    password='testpass123',
    first_name='Test',
    last_name='Student',
    role='etudiant',
    auditoire=auditoire
)
print(f"✅ Étudiant créé: {student.get_full_name()}")

# Vérifier auto-enrollment
import time
time.sleep(1)  # Attendre que le signal s'exécute
enrollments = student.enrollments.all()
print(f"   Inscriptions: {enrollments.count()}")
for e in enrollments:
    print(f"   - {e.course.name}")
```

```python
# 4. Assigner un assistant
from apps.courses.models import TeacherAssistant

assistant = User.objects.create_user(
    email='assistant@example.com',
    password='testpass123',
    first_name='John',
    last_name='Assistant',
    role='assistant'
)

assignment = TeacherAssistant.objects.create(
    assistant=assistant,
    teacher=teacher,
    course=course,
    can_grade=True
)
print(f"✅ Assistant assigné: {assignment}")
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :

1. Vérifiez les logs : `python manage.py runserver` (messages dans le terminal)
2. Consultez `CORRECTIONS_MODELE_DONNEES.md` pour la logique
3. Vérifiez que les signals sont importés (dans `apps.py`)

---

**Bonne migration ! 🚀**
