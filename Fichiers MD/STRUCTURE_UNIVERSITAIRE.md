# 🎓 Structure Universitaire - Syntax GU

## Hiérarchie et Relations

### 📐 Schéma de la Structure

```
UNIVERSITÉ
    │
    └── SECTION (Faculté/Département)
            │
            ├── Chef de Section
            │
            └── FILIÈRE (Option/Spécialisation)
                    │
                    ├── Chef de Filière
                    │
                    └── AUDITOIRE (Classe/Promotion)
                            │
                            ├── Niveau (L1, L2, L3, M1, M2)
                            ├── Vacation (Jour/Soir)
                            ├── Année académique (2024-2025)
                            │
                            ├── ÉTUDIANTS inscrits
                            │
                            └── COURS enseignés dans cet auditoire
                                    │
                                    ├── TITULAIRE (Enseignant responsable du cours)
                                    ├── ASSISTANTS (Enseignants adjoints)
                                    ├── Semestre (1 ou 2)
                                    ├── Crédits
                                    └── ÉTUDIANTS inscrits au cours
```

---

## 🎯 Définitions Précises

### SECTION
**C'est quoi ?** Une faculté ou un département (ex: Sciences Informatiques, Génie Civil, etc.)

**Champs :**
- `nom` - Nom de la section
- `chef_section` - User avec role "chef_section"
- Contient plusieurs **FILIÈRES**

**Exemple :** "Sciences Informatiques"

---

### FILIÈRE
**C'est quoi ?** Une spécialisation dans une section (ex: Génie Logiciel, Réseau Informatique)

**Champs :**
- `nom` - Nom de la filière
- `section` - ForeignKey vers Section
- `chef_filiere` - User avec role "chef_departement"
- Contient plusieurs **AUDITOIRES**

**Exemple :** "Génie Logiciel" (dans la section "Sciences Informatiques")

---

### AUDITOIRE
**C'est quoi ?** Une classe/promotion d'étudiants (ex: L1 Génie Logiciel Soir 2024-2025)

**C'est PAS un lieu physique !** C'est un groupe d'étudiants regroupés par :
- Même niveau (L1, L2, etc.)
- Même filière
- Même vacation (jour ou soir)
- Même année académique

**Champs :**
- `nom` - Auto-généré (ex: "L1 Génie Logiciel Soir")
- `niveau` - L1, L2, L3, M1, M2
- `filiere` - ForeignKey vers Filiere
- `vacation` - "jour" ou "soir"
- `annee_academique` - Ex: "2024-2025"
- `capacite_max` - Nombre max d'étudiants
- `created_by` - User qui a créé l'auditoire
- ❌ **PAS de titulaire** (ce n'est pas un cours !)

**Relations :**
- Contient plusieurs **ÉTUDIANTS** (via User.auditoire)
- Contient plusieurs **COURS** (via Course.auditoire)

**Exemple :** "L1 Génie Logiciel Soir" (promotion 2024-2025)

---

### COURS
**C'est quoi ?** Une matière enseignée (ex: Bases de données, Programmation Web)

**Un cours :**
- Est enseigné dans **UN SEUL auditoire**
- A **UN SEUL titulaire** (l'enseignant responsable)
- Peut avoir **plusieurs assistants**
- Est suivi par **plusieurs étudiants** (ceux de l'auditoire)

**Champs :**
- `name` - Nom du cours
- `code` - Code auto-généré (ex: "BDD-12")
- `description` - Description du cours
- `credits` - Nombre de crédits (1-10)
- `auditoire` - ForeignKey vers Auditoire (✅ UN SEUL auditoire)
- `titulaire` - ForeignKey vers User (✅ L'ENSEIGNANT qui donne le cours)
- `assistants` - ManyToManyField vers User (assistants du cours)
- `semester` - "Semestre 1" ou "Semestre 2"
- `annee_academique` - Ex: "2024-2025"
- `syllabus` - Document PDF
- `resources` - Ressources texte

**Relations :**
- Appartient à **UN auditoire**
- A **UN titulaire** (enseignant)
- A **0 ou plusieurs assistants**
- A **plusieurs étudiants inscrits** (via CourseEnrollment)

**Exemple :** "Bases de données" enseigné par "Prof. Dupont" à "L1 Génie Logiciel Soir"

---

## 🔑 Concept Clé : TITULAIRE

### Le titulaire appartient au COURS, pas à l'auditoire !

#### ❌ FAUX :
```
Auditoire "L1 Génie Logiciel Soir"
    └── titulaire: Prof. Dupont  ← NON ! Un auditoire n'a pas de titulaire
```

#### ✅ CORRECT :
```
Auditoire "L1 Génie Logiciel Soir"
    ├── Cours "Bases de données"
    │       └── titulaire: Prof. Dupont  ← OUI !
    │
    ├── Cours "Programmation Web"
    │       └── titulaire: Prof. Martin  ← OUI !
    │
    └── Cours "Mathématiques"
            └── titulaire: Prof. Durand  ← OUI !
```

**Pourquoi ?**
- Un auditoire a **plusieurs cours différents**
- Chaque cours a **son propre enseignant titulaire**
- C'est l'enseignant qui "tient" le cours, pas l'auditoire

---

## 📊 Exemples Concrets

### Exemple 1 : Université de Kinshasa

```
Section: "Sciences Informatiques"
    │
    └── Filière: "Génie Logiciel"
            │
            ├── Auditoire: "L1 Génie Logiciel Jour 2024-2025"
            │       ├── 45 étudiants
            │       │
            │       ├── Cours: "Bases de données" (Semestre 1)
            │       │       └── Titulaire: Prof. Mukendi
            │       │
            │       ├── Cours: "Programmation Web" (Semestre 1)
            │       │       └── Titulaire: Prof. Kabongo
            │       │
            │       └── Cours: "Mathématiques" (Semestre 1)
            │               └── Titulaire: Prof. Tshilombo
            │
            └── Auditoire: "L1 Génie Logiciel Soir 2024-2025"
                    ├── 38 étudiants
                    │
                    ├── Cours: "Bases de données" (Semestre 1)
                    │       └── Titulaire: Prof. Mukendi (même prof, auditoire différent)
                    │
                    └── Cours: "Programmation Web" (Semestre 1)
                            └── Titulaire: Prof. Nzuzi (prof différent)
```

### Exemple 2 : Inscription automatique

Quand un nouveau cours est créé :

1. ✅ **Cours créé :**
   - Nom: "Architecture des Ordinateurs"
   - Titulaire: Prof. Kalonji
   - Auditoire: "L2 Génie Logiciel Jour"
   - Semestre: "Semestre 2"
   - Crédits: 4

2. ✅ **Étudiants auto-inscrits :**
   - Tous les étudiants de l'auditoire "L2 Génie Logiciel Jour" sont automatiquement inscrits
   - Message: "✅ 52 étudiant(s) auto-inscrit(s) au nouveau cours Architecture des Ordinateurs"

3. ✅ **Résultat :**
   - Le cours a maintenant 52 étudiants inscrits (via CourseEnrollment)
   - Chaque étudiant peut voir ce cours dans sa liste de cours

---

## 🎓 Rôles Universitaires

### 1. SGA (Secrétaire Général Académique)
- ✅ Gère toute l'université
- ✅ Crée les sections, filières, auditoires
- ✅ Assigne les chefs de section et de filière
- ✅ Gère les inscriptions
- ✅ Accès total à tout

### 2. Chef de Section
- ✅ Gère sa section (faculté/département)
- ✅ Voit toutes les filières de sa section
- ✅ Crée des cours dans sa section
- ✅ Assigne des enseignants

### 3. Chef de Filière (Chef Département)
- ✅ Gère sa filière (spécialisation)
- ✅ Crée des auditoires dans sa filière
- ✅ Crée des cours pour sa filière
- ✅ Supervise les enseignants de sa filière

### 4. Enseignant (Titulaire)
- ✅ Enseigne un ou plusieurs cours
- ✅ Est **titulaire** d'un cours = responsable principal
- ✅ Gère les notes, devoirs, présences
- ✅ Peut avoir des assistants

### 5. Assistant
- ✅ Aide un enseignant titulaire
- ✅ Peut être assigné à plusieurs cours
- ✅ Droits limités (selon le titulaire)

### 6. Étudiant
- ✅ Appartient à **UN auditoire**
- ✅ Est inscrit à **plusieurs cours** (ceux de son auditoire)
- ✅ Suit les cours, fait les devoirs, passe les examens

---

## 🔍 Relations dans le Code

### Models

```python
# COURS
class Course(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    credits = models.IntegerField(default=3)

    # UN cours -> UN auditoire
    auditoire = models.ForeignKey(Auditoire, on_delete=models.CASCADE, related_name='courses')

    # UN cours -> UN titulaire (l'enseignant)
    titulaire = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='courses_as_teacher')

    # UN cours -> PLUSIEURS assistants
    assistants = models.ManyToManyField(User, related_name='courses_as_assistant', blank=True)

    semester = models.CharField(max_length=20, default='Semestre 1')
    annee_academique = models.CharField(max_length=20, default='2024-2025')

# AUDITOIRE
class Auditoire(models.Model):
    nom = models.CharField(max_length=200)
    niveau = models.CharField(max_length=10)  # L1, L2, L3, M1, M2
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE)
    vacation = models.CharField(max_length=10)  # jour, soir
    annee_academique = models.CharField(max_length=20)

    # ❌ PAS de champ 'titulaire' !
```

### Serializers

```python
# ✅ CORRECT - CourseSerializer affiche le titulaire du cours
class CourseSerializer(serializers.ModelSerializer):
    titulaire_name = serializers.CharField(source='titulaire.name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'titulaire', 'titulaire_name', 'auditoire', ...]

# ✅ CORRECT - SimpleAuditoireSerializer n'affiche PAS de titulaire
class SimpleAuditoireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auditoire
        fields = ['id', 'nom', 'niveau', 'vacation']
        # ❌ PAS de 'titulaire' dans les fields !
```

---

## ✅ Résumé

| Entité | A un titulaire ? | Pourquoi ? |
|--------|------------------|------------|
| **Cours** | ✅ OUI | C'est l'enseignant qui donne/enseigne le cours |
| **Auditoire** | ❌ NON | C'est juste un groupe d'étudiants, pas un cours |
| **Filière** | ❌ NON | A un "chef de filière", pas un "titulaire" |
| **Section** | ❌ NON | A un "chef de section", pas un "titulaire" |

---

**Date :** 03/12/2025
**Status :** ✅ STRUCTURE CORRECTE ET VALIDÉE
