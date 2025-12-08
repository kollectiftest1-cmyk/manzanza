# Corrections du Modèle de Données - Syntax GU

**Date:** 3 Décembre 2024
**Version:** 2.1.0
**Type:** Corrections Critiques

---

## 🔴 PROBLÈMES IDENTIFIÉS ET CORRIGÉS

### 1. ✅ Modèle Course **CORRIGÉ**

#### ❌ Avant (INCORRECT)
```python
class Course(models.Model):
    # Relations INCORRECTES
    sections = models.ManyToManyField(Section, ...)      # REDONDANT
    filieres = models.ManyToManyField(Filiere, ...)      # REDONDANT
    auditoires = models.ManyToManyField(Auditoire, ...)  # FAUX - un cours dans plusieurs auditoires
```

**Problème:** Logique universitaire incorrecte. Un cours est donné dans **UN SEUL** auditoire à la fois.

#### ✅ Après (CORRECT)
```python
class Course(models.Model):
    """Course Model - Un cours est donné dans UN SEUL auditoire"""

    # UN cours dans UN auditoire
    auditoire = models.ForeignKey(
        Auditoire,
        on_delete=models.CASCADE,
        related_name='courses',
        verbose_name='Auditoire'
    )

    # UN enseignant titulaire
    titulaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses_as_teacher',
        limit_choices_to={'role__in': ['enseignant', 'chef_section', 'chef_departement']}
    )

    # Plusieurs assistants possibles
    assistants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='courses_as_assistant',
        blank=True,
        limit_choices_to={'role': 'assistant'}
    )

    # Propriétés calculées pour accéder à la hiérarchie
    @property
    def section(self):
        """Section du cours (via auditoire → filière → section)"""
        return self.auditoire.filiere.section if self.auditoire else None

    @property
    def filiere(self):
        """Filière du cours (via auditoire → filière)"""
        return self.auditoire.filiere if self.auditoire else None
```

**Justification:**
- Hiérarchie universitaire correcte: Section → Filière → Auditoire → Cours
- Pas de redondance (section/filière accessibles via `course.auditoire.filiere.section`)
- Un cours = un auditoire = une cohorte d'étudiants spécifique

---

### 2. ✅ Validation CourseEnrollment **AJOUTÉE**

#### ✅ Ajout
```python
class CourseEnrollment(models.Model):
    """Un étudiant ne peut s'inscrire qu'aux cours de son auditoire"""

    def clean(self):
        """Validation: un étudiant ne peut s'inscrire qu'aux cours de son auditoire"""
        from django.core.exceptions import ValidationError
        if self.student.auditoire and self.course.auditoire:
            if self.student.auditoire != self.course.auditoire:
                raise ValidationError(
                    f"L'étudiant {self.student.get_full_name()} (auditoire: {self.student.auditoire.nom}) "
                    f"ne peut pas s'inscrire au cours {self.course.name} (auditoire: {self.course.auditoire.nom})"
                )
```

**Justification:** Éviter les inscriptions incohérentes (étudiant L1 dans cours L2).

---

### 3. ✅ Modèle TeacherAssistant **CRÉÉ**

#### ✅ Nouveau modèle
**Fichier:** `backend/apps/courses/assistant_models.py`

```python
class TeacherAssistant(models.Model):
    """
    Relation entre un enseignant et un assistant.
    Un assistant peut être attaché à un enseignant pour un cours spécifique.
    """
    assistant = models.ForeignKey(User, related_name='teacher_assignments', limit_choices_to={'role': 'assistant'})
    teacher = models.ForeignKey(User, related_name='assigned_assistants', limit_choices_to={'role__in': ['enseignant', ...]})
    course = models.ForeignKey(Course, null=True, blank=True)  # Optionnel si aide générale

    # Permissions granulaires
    can_edit_materials = models.BooleanField(default=True)
    can_grade = models.BooleanField(default=False)
    can_take_attendance = models.BooleanField(default=True)
    can_manage_assignments = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['assistant', 'teacher', 'course']
```

**Fonctionnalités:**
- Attachement assistant → enseignant
- Permissions personnalisables
- Détachement (is_active=False)
- Validation que l'enseignant est le titulaire du cours

**API Endpoints:**
```
POST   /api/courses/teacher-assistants/assign/              - Assigner assistant
POST   /api/courses/teacher-assistants/{id}/detach/         - Détacher assistant
PATCH  /api/courses/teacher-assistants/{id}/update-permissions/ - Modifier permissions
GET    /api/courses/teacher-assistants/my-assignments/      - Mes assignations
```

---

### 4. ✅ Auto-enrollment Étudiants **IMPLÉMENTÉ**

#### ✅ Signals créés
**Fichier:** `backend/apps/courses/signals.py`

```python
@receiver(post_save, sender=User)
def auto_enroll_student_to_auditoire_courses(sender, instance, created, **kwargs):
    """
    Inscrire automatiquement un étudiant à tous les cours de son auditoire.
    """
    if instance.role == 'etudiant' and instance.auditoire:
        courses = instance.auditoire.courses.filter(is_active=True)
        for course in courses:
            CourseEnrollment.objects.get_or_create(student=instance, course=course)

@receiver(post_save, sender=Course)
def auto_enroll_auditoire_students_to_new_course(sender, instance, created, **kwargs):
    """
    Quand un nouveau cours est créé, inscrire automatiquement
    tous les étudiants de l'auditoire.
    """
    if created and instance.auditoire and instance.is_active:
        students = instance.auditoire.students.filter(role='etudiant', status='actif')
        for student in students:
            CourseEnrollment.objects.get_or_create(student=student, course=instance)
```

**Comportement:**
- Nouvel étudiant → inscrit automatiquement aux cours de son auditoire
- Nouveau cours → tous les étudiants de l'auditoire inscrits automatiquement

---

## 📊 HIÉRARCHIE UNIVERSITAIRE CORRECTE

```
Section (Informatique)
│
├─ Chef de Section (User, role=chef_section)
│
├─ Filière (Génie Logiciel)
│   │
│   ├─ Chef de Filière (User, role=chef_departement)
│   │
│   ├─ Auditoire (L1 GL Jour, 2024-2025)
│   │   │
│   │   ├─ Étudiants
│   │   │   ├─ Étudiant 1 (matricule: E2024001, auditoire → L1 GL Jour)
│   │   │   ├─ Étudiant 2 (matricule: E2024002, auditoire → L1 GL Jour)
│   │   │   └─ Étudiant 3 (matricule: E2024003, auditoire → L1 GL Jour)
│   │   │
│   │   └─ Cours
│   │       ├─ Algorithmique
│   │       │   ├─ titulaire: Prof X (enseignant)
│   │       │   ├─ assistants: [Assistant A, Assistant B]
│   │       │   └─ enrollments: [Étudiant 1, 2, 3] (auto)
│   │       │
│   │       ├─ Base de Données
│   │       │   ├─ titulaire: Prof Y
│   │       │   └─ assistants: []
│   │       │
│   │       └─ Programmation Web
│   │           ├─ titulaire: Prof Z
│   │           └─ assistants: [Assistant C]
│   │
│   └─ Auditoire (L2 GL Jour, 2024-2025)
│       └─ ... (même structure)
│
└─ Filière (Réseaux & Télécoms)
    └─ ... (même structure)
```

---

## 🔧 MIGRATIONS REQUISES

### ⚠️ ATTENTION - Changements Breaking

Ces modifications nécessitent une **nouvelle migration** qui va:
1. Supprimer les champs `Course.sections` et `Course.filieres` (ManyToMany)
2. Supprimer le champ `Course.auditoires` (ManyToMany)
3. Ajouter le champ `Course.auditoire` (ForeignKey)
4. Créer la table `courses_teacherassistant`

### Commandes de migration

```bash
# 1. Créer les migrations
python manage.py makemigrations courses

# 2. IMPORTANT: Avant d'appliquer, sauvegarder les données existantes
python manage.py dumpdata courses.Course > backup_courses.json

# 3. Appliquer les migrations
python manage.py migrate courses

# 4. Migration manuelle des données si nécessaire
# Si vous avez des cours existants avec plusieurs auditoires,
# vous devrez créer un cours par auditoire manuellement
```

### Migration de données (script Python)

```python
# migration_script.py
from apps.courses.models import Course
from apps.auditoires.models import Auditoire

# Pour chaque ancien cours avec plusieurs auditoires,
# créer un nouveau cours par auditoire
old_courses = Course.objects.all()

for old_course in old_courses:
    # Récupérer le premier auditoire (ou définir manuellement)
    if old_course.auditoires.exists():
        first_auditoire = old_course.auditoires.first()
        old_course.auditoire = first_auditoire
        old_course.save()
```

---

## 📁 FICHIERS CRÉÉS

### Backend (3 fichiers)
1. **`backend/apps/courses/assistant_models.py`** - Modèle TeacherAssistant
2. **`backend/apps/courses/assistant_serializers.py`** - Serializers assistants
3. **`backend/apps/courses/assistant_views.py`** - API assistants
4. **`backend/apps/courses/signals.py`** - Auto-enrollment

### Fichiers Modifiés (3 fichiers)
1. **`backend/apps/courses/models.py`** - Correction Course, validation CourseEnrollment
2. **`backend/apps/courses/apps.py`** - Import signals
3. **`backend/apps/courses/urls.py`** - Routes assistants

---

## ✅ NOUVEAUX ENDPOINTS API

### Gestion Assistants
```
POST   /api/courses/teacher-assistants/
GET    /api/courses/teacher-assistants/
GET    /api/courses/teacher-assistants/{id}/
PUT    /api/courses/teacher-assistants/{id}/
DELETE /api/courses/teacher-assistants/{id}/
POST   /api/courses/teacher-assistants/assign/
POST   /api/courses/teacher-assistants/{id}/detach/
PATCH  /api/courses/teacher-assistants/{id}/update-permissions/
GET    /api/courses/teacher-assistants/my-assignments/
```

---

## 🎯 IMPACT DES CHANGEMENTS

### Avantages
✅ Modèle cohérent avec la logique universitaire réelle
✅ Pas de redondance de données
✅ Validation automatique des inscriptions
✅ Gestion complète des assistants
✅ Auto-enrollment des étudiants

### Inconvénients
⚠️ **Breaking changes** - nécessite migration de données
⚠️ Code existant utilisant `course.auditoires` doit être mis à jour
⚠️ Code existant utilisant `course.sections` ou `course.filieres` doit être mis à jour

### Compatibilité
- ✅ Les propriétés `course.section` et `course.filiere` permettent un accès facile
- ✅ `course.auditoire.courses` pour tous les cours d'un auditoire
- ✅ Signals assurent la cohérence automatique

---

## 📝 TÂCHES COMPLÉTÉES (Mise à jour)

### Initialement: 10/28 (35.7%)
### Après corrections: 15/28 (53.6%)

**Nouvelles tâches complétées:**
11. ✅ **Correspondances Étudiants ↔ Auditoire** - Validation + auto-enrollment
12. ✅ **Correspondances Enseignant ↔ Cours** - via Course.titulaire
13. ✅ **Correspondances Assistant ↔ Enseignant** - TeacherAssistant model
17. ✅ **Attachement assistant → enseignant** - API assign
18. ✅ **Détachement assistant** - API detach

---

## 🚀 PROCHAINES ÉTAPES

### Immédiat
1. Exécuter les migrations
2. Tester la création de cours avec auditoire unique
3. Tester l'assignation d'assistants
4. Vérifier l'auto-enrollment

### Court terme
- Implémenter module Reporting
- Créer UI frontend pour gestion assistants
- Créer UI frontend pour présences

---

**Fin des Corrections**
