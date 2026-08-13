# 🎯 Système Intelligent de Filtrage par Rôle

## 📋 Vue d'ensemble

Le système de filtrage intelligent garantit que **chaque utilisateur voit uniquement ce qui le concerne** selon son rôle, automatiquement et sans configuration manuelle.

---

## 🔐 Règles de Filtrage par Rôle

### 1️⃣ **SGA / Admin / IAdmin**
**Privilèges :** Voir TOUT
- ✅ Tous les cours
- ✅ Tous les auditoires
- ✅ Tous les utilisateurs
- ✅ Toutes les sections et filières
- ✅ Tous les chats

### 2️⃣ **Chef de Section**
**Privilèges :** Voir tout de SA section
- ✅ Tous les cours de sa section
- ✅ Tous les auditoires de sa section
- ✅ Tous les étudiants de sa section
- ✅ Tous les enseignants qui enseignent dans sa section
- ✅ Toutes les filières de sa section
- ✅ Chat de sa section + chats des filières + chats des cours

**Exemples :**
- Chef de "Sciences Informatiques" voit tout de cette section
- Voit "Génie Logiciel", "Réseaux", "IA" (filières de sa section)
- Voit tous les cours de ces filières

### 3️⃣ **Chef de Département (Filière)**
**Privilèges :** Voir tout de SA filière
- ✅ Tous les cours de sa filière
- ✅ Tous les auditoires de sa filière
- ✅ Tous les étudiants de sa filière
- ✅ Tous les enseignants qui enseignent dans sa filière
- ✅ Sa section parente
- ✅ Chat de sa filière + chat de sa section + chats des cours

**Exemples :**
- Chef de "Génie Logiciel" voit tout de cette filière
- Voit L1 GL, L2 GL, L3 GL (auditoires)
- Voit tous les cours de ces auditoires

### 4️⃣ **Enseignant / Assistant**
**Privilèges :** Voir uniquement les cours où il enseigne
- ✅ Cours où il est titulaire ou assistant
- ✅ Auditoires de ces cours
- ✅ Étudiants de ces auditoires
- ✅ Chats de ses cours

**Exemples :**
- Enseignant de "Python" et "Java" voit uniquement ces 2 cours
- Voit les étudiants des auditoires de ces cours
- Ne voit PAS les autres cours de la filière

### 5️⃣ **Étudiant**
**Privilèges :** Voir uniquement SON auditoire
- ✅ Tous les cours de son auditoire
- ✅ Ses camarades de classe
- ✅ Ses enseignants
- ✅ Sa section et sa filière
- ✅ Chats des cours de son auditoire

**Exemples :**
- Étudiant de "L1 GL Jour 2024-2025" voit uniquement :
  - Cours de cet auditoire
  - Ses camarades
  - Ses enseignants
- Ne voit PAS les autres auditoires (L2 GL, L1 GL Soir, etc.)

---

## 🏗️ Architecture Technique

### Backend : RoleBasedFilterMixin

**Fichier :** `backend/apps/users/mixins.py`

```python
class RoleBasedFilterMixin:
    def filter_queryset_by_role(self, queryset, user, model_type):
        """
        Filtrer automatiquement basé sur :
        - Le rôle de l'utilisateur
        - Le type de modèle (course, auditoire, user, section, filiere)
        """
```

**ViewSets mis à jour :**
- ✅ `CourseViewSet` - Cours
- ✅ `AuditoireViewSet` - Auditoires
- ✅ `UserViewSet` - Utilisateurs
- ✅ `StudentListView` - Étudiants
- ✅ `TeacherListView` - Enseignants
- ✅ `SectionViewSet` - Sections
- ✅ `FiliereViewSet` - Filières
- ✅ `ChatChannelViewSet` - Chats

---

## 📱 Système de Chat Intelligent

### Visibilité des Chats

#### SGA/Admin
```
✅ Tous les chats de tous les cours
✅ Tous les chats de sections
✅ Tous les chats de filières
```

#### Chef de Section
```
✅ Chat de SA section
✅ Chats de toutes les filières de sa section
✅ Chats de tous les cours de sa section
```

#### Chef de Département
```
✅ Chat de SA filière
✅ Chat de la section parente
✅ Chats de tous les cours de sa filière
```

#### Enseignant/Assistant
```
✅ Chats des cours où il enseigne
❌ Autres chats
```

#### Étudiant
```
✅ Chats des cours de son auditoire
❌ Autres chats
```

### Noms de Chat Intelligents

**Avant :**
```
💬 Programmation Python
💬 Bases de données
```

**Maintenant :**
```
L1 Génie Logiciel - Programmation Python
L2 Réseaux - Bases de données
👥 Section Sciences Informatiques
🎓 Filière Génie Logiciel
```

**Format :**
- Cours : `{Auditoire} - {Nom du cours}`
- Section : `👥 Section {Nom}`
- Filière : `🎓 Filière {Nom}`

---

## 🔄 Mise à Jour Automatique lors du Changement de Rôle

**Signal :** `update_user_chats` dans `backend/apps/chat/signals.py`

### Scénarios :

#### Étudiant affecté à un auditoire
```python
user.auditoire = auditoire_l1_gl
user.save()
# → Automatiquement ajouté aux chats de tous les cours de cet auditoire
```

#### Utilisateur devient SGA
```python
user.role = 'sga'
user.save()
# → Automatiquement ajouté à TOUS les chats
```

#### Utilisateur devient Chef de Section
```python
user.role = 'chef_section'
# → Automatiquement ajouté aux chats de sa section et de ses cours
```

#### Enseignant assigné à un cours
```python
course.titulaire = enseignant
course.save()
# → Automatiquement ajouté au chat du cours
```

---

## 📊 Exemples Pratiques

### Exemple 1 : Chef de Section

**Utilisateur :** Marie Dubois, Chef de Section "Sciences Informatiques"

**Ce qu'elle voit :**

**Sections :**
```
✅ Sciences Informatiques (sa section)
❌ Droit
❌ Médecine
```

**Filières :**
```
✅ Génie Logiciel
✅ Réseaux et Télécommunications
✅ Intelligence Artificielle
❌ Droit des Affaires (autre section)
```

**Cours :**
```
✅ L1 GL - Python
✅ L2 Réseaux - Administration Réseaux
✅ L3 IA - Machine Learning
❌ L1 Droit - Introduction au Droit
```

**Chats :**
```
✅ 👥 Section Sciences Informatiques
✅ 🎓 Filière Génie Logiciel
✅ L1 GL - Python
✅ Tous les cours de sa section
```

### Exemple 2 : Chef de Département

**Utilisateur :** Paul Martin, Chef de Département "Génie Logiciel"

**Ce qu'il voit :**

**Sections :**
```
✅ Sciences Informatiques (section parente)
```

**Filières :**
```
✅ Génie Logiciel (sa filière)
❌ Réseaux (autre filière de la même section)
```

**Cours :**
```
✅ L1 GL - Python
✅ L2 GL - Java
✅ L3 GL - Architecture Logicielle
❌ L1 Réseaux - Introduction aux Réseaux
```

**Chats :**
```
✅ 🎓 Filière Génie Logiciel
✅ 👥 Section Sciences Informatiques
✅ Tous les cours de Génie Logiciel
❌ Cours d'autres filières
```

### Exemple 3 : Enseignant

**Utilisateur :** Sophie Laurent, Enseignante de Python (L1 GL) et Java (L2 GL)

**Ce qu'elle voit :**

**Cours :**
```
✅ L1 GL - Python (titulaire)
✅ L2 GL - Java (titulaire)
❌ L3 GL - Architecture Logicielle (autre enseignant)
```

**Auditoires :**
```
✅ L1 Génie Logiciel Jour 2024-2025
✅ L2 Génie Logiciel Jour 2024-2025
❌ L3 Génie Logiciel (pas de cours)
```

**Étudiants :**
```
✅ Étudiants de L1 GL
✅ Étudiants de L2 GL
❌ Étudiants de L3 GL
```

**Chats :**
```
✅ L1 GL - Python
✅ L2 GL - Java
❌ Autres cours
```

### Exemple 4 : Étudiant

**Utilisateur :** Jean Dupont, Étudiant de L1 Génie Logiciel Jour 2024-2025

**Ce qu'il voit :**

**Auditoires :**
```
✅ L1 Génie Logiciel Jour 2024-2025 (son auditoire)
❌ L2 GL, L3 GL, L1 GL Soir
```

**Cours :**
```
✅ Python
✅ Mathématiques
✅ Algorithmes
❌ Cours de L2 ou autres auditoires
```

**Étudiants :**
```
✅ Ses camarades de L1 GL
✅ Ses enseignants
❌ Étudiants d'autres auditoires
```

**Chats :**
```
✅ L1 GL - Python
✅ L1 GL - Mathématiques
✅ L1 GL - Algorithmes
❌ Chats d'autres cours
```

---

## 🧪 Comment Tester

### Test 1 : SGA
```bash
# Se connecter en tant que SGA
# Aller sur /courses
# Vérifier : Voir TOUS les cours
```

### Test 2 : Chef de Section
```bash
# Se connecter en tant que Chef de Section
# Aller sur /courses
# Vérifier : Voir uniquement les cours de SA section
```

### Test 3 : Enseignant
```bash
# Se connecter en tant qu'enseignant
# Aller sur /courses
# Vérifier : Voir uniquement SES cours
```

### Test 4 : Étudiant
```bash
# Se connecter en tant qu'étudiant
# Aller sur /courses
# Vérifier : Voir uniquement les cours de SON auditoire
```

---

## 🔧 Maintenance

### Ajouter un nouveau rôle

1. **Ajouter le rôle dans le modèle User**
```python
ROLE_CHOICES = [
    ('nouveau_role', 'Nouveau Rôle'),
    ...
]
```

2. **Ajouter la logique de filtrage**
```python
# Dans RoleBasedFilterMixin
def _filter_for_nouveau_role(self, queryset, user, model_type):
    # Logique de filtrage
    return queryset.filter(...)
```

3. **Mettre à jour les signaux de chat**
```python
# Dans update_user_chats
if instance.role == 'nouveau_role':
    # Ajouter aux chats appropriés
```

---

## 📝 Résumé

### ✅ Avantages du Système

1. **Sécurité :** Chaque utilisateur voit uniquement ce qu'il doit voir
2. **Automatique :** Aucune configuration manuelle nécessaire
3. **Intelligent :** S'adapte au rôle de chaque utilisateur
4. **Cohérent :** Même logique partout (cours, auditoires, chats, etc.)
5. **Performant :** Filtrage au niveau de la base de données

### 🎯 Cas d'Usage Couverts

- ✅ Gestion multi-niveaux (section > filière > auditoire > cours)
- ✅ Chats automatiques avec membres pertinents
- ✅ Mise à jour lors du changement de rôle
- ✅ Noms de chat intelligents et clairs
- ✅ Filtrage cohérent sur toutes les pages

---

**Le système est maintenant intelligent et s'adapte automatiquement à chaque utilisateur ! 🎉**
