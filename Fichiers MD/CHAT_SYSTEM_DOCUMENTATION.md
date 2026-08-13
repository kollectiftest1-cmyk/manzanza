# 📱 Système de Chat Automatique - Documentation Complète

## 🎯 Vue d'ensemble

Le système de chat est maintenant entièrement fonctionnel avec **création automatique de groupes** lors de la création de cours, sections et filières.

---

## 🔄 Fonctionnement Automatique

### 1️⃣ Chat de Cours (création automatique)

**Quand ?** Dès qu'un cours est créé

**Qui est ajouté automatiquement ?**
- ✅ Tous les étudiants de l'auditoire du cours
- ✅ L'enseignant titulaire du cours
- ✅ Les assistants du cours
- ✅ Le chef de département (filière)
- ✅ Le chef de section

**Exemple :**
```python
# Quand vous créez un cours :
Course.objects.create(
    name="Programmation Python",
    auditoire=auditoire_l1_gl,
    titulaire=prof_jean,
    ...
)

# Un ChatChannel est créé automatiquement avec :
# - Nom: "💬 Programmation Python"
# - Type: course
# - Membres: tous les étudiants + prof + chefs
```

### 2️⃣ Chat de Section (pour enseignants)

**Quand ?** Dès qu'une section est créée

**Qui est ajouté automatiquement ?**
- ✅ Le chef de section
- ✅ Tous les enseignants qui donnent des cours dans cette section
- ✅ Tous les assistants des cours de cette section
- ✅ Tous les chefs de filières de cette section

### 3️⃣ Chat de Filière (pour enseignants)

**Quand ?** Dès qu'une filière est créée

**Qui est ajouté automatiquement ?**
- ✅ Le chef de filière
- ✅ Le chef de section parent
- ✅ Tous les enseignants qui donnent des cours dans cette filière
- ✅ Tous les assistants des cours de cette filière

---

## 🆕 Ajout Automatique des Nouveaux Étudiants

**Important :** Quand un étudiant est affecté à un auditoire, il est **automatiquement ajouté** à tous les chats des cours de cet auditoire.

```python
# Quand vous créez/modifiez un étudiant :
etudiant = User.objects.create(
    role='etudiant',
    auditoire=auditoire_l1_gl,
    ...
)

# L'étudiant est automatiquement ajouté aux chats de tous les cours de l'auditoire
```

---

## 📊 Schéma de la Structure

```
Section (ex: Sciences Informatiques)
    └── Chat Section (enseignants uniquement)
    └── Filière (ex: Génie Logiciel)
        └── Chat Filière (enseignants uniquement)
        └── Auditoire (ex: L1 GL Jour 2024-2025)
            └── Cours 1 (ex: Python)
                └── Chat Cours 1 (étudiants + enseignants + chefs)
            └── Cours 2 (ex: Java)
                └── Chat Cours 2 (étudiants + enseignants + chefs)
```

---

## 🔧 Backend - Fichiers Modifiés/Créés

### 1. **Modèle ChatChannel** (`backend/apps/chat/models.py`)
```python
class ChatChannel(models.Model):
    CHANNEL_TYPES = [
        ('course', 'Chat de cours'),
        ('section', 'Chat de section'),
        ('filiere', 'Chat de filière'),
        ('general', 'Chat général'),
    ]

    channel_type = models.CharField(...)
    course = models.OneToOneField(...)  # Pour chat de cours
    section = models.OneToOneField(...) # Pour chat de section
    filiere = models.OneToOneField(...) # Pour chat de filière
    members = models.ManyToManyField(User) # Tous les membres
```

### 2. **Signaux Django** (`backend/apps/chat/signals.py`) ✨ NOUVEAU
- `create_course_chat()` - Créer chat quand cours créé
- `add_course_chat_members()` - Ajouter tous les membres
- `create_section_chat()` - Créer chat de section
- `create_filiere_chat()` - Créer chat de filière
- `update_user_chats()` - Ajouter étudiant aux chats de son auditoire

### 3. **Serializers** (`backend/apps/chat/serializers.py`)
```python
class ChatChannelSerializer:
    - course_name, section_name, filiere_name
    - participants_count
    - latest_message
    - unread_count (TODO)
```

### 4. **Views** (`backend/apps/chat/views.py`)
```python
class ChatChannelViewSet:
    - get_queryset() : Filtrer par membre
    - my_channels() : Tous les canaux de l'utilisateur
```

---

## 🎨 Frontend - Fichiers Modifiés/Créés

### 1. **Service Chat** (`src/services/chatService.js`) ✨ NOUVEAU
```javascript
- getMyChannels()
- getChannelMessages(id)
- sendMessage(data)
- reactToMessage(messageId, reactionType)
```

### 2. **Redux Slice** (`src/store/slices/chatSlice.js`)
- Mise à jour pour utiliser `chatService`
- Actions: fetchChannels, fetchMessages, sendMessage

### 3. **Page Chat** (`src/pages/Chat.jsx`)
- Icônes par type de canal (📚 cours, 👥 section, 🎓 filière)
- Affichage du dernier message
- Compteur de participants
- Design moderne avec animations

---

## 🚀 Instructions de Déploiement

### Backend

```bash
# 1. Créer les migrations
cd backend
python manage.py makemigrations chat

# 2. Appliquer les migrations
python manage.py migrate chat

# 3. (Optionnel) Créer des chats pour les cours existants
python manage.py shell
```

```python
from apps.chat.signals import create_course_chat, add_course_chat_members
from apps.courses.models import Course
from apps.chat.models import ChatChannel

# Pour chaque cours existant sans chat
for course in Course.objects.filter(is_active=True):
    if not hasattr(course, 'chat_channel'):
        create_course_chat(Course, course, created=True)
        print(f"✅ Chat créé pour {course.name}")
```

### Frontend

```bash
# Aucune migration nécessaire - tout est prêt !
cd ..
npm run dev
```

---

## 🎯 Utilisation

### Pour les Étudiants
1. Se connecter
2. Aller sur `/chat`
3. Voir tous les chats des cours de son auditoire
4. Discuter avec enseignants et camarades

### Pour les Enseignants
1. Se connecter
2. Aller sur `/chat`
3. Voir :
   - Chats de leurs cours (titulaire/assistant)
   - Chat de leur section
   - Chat de leur filière

### Pour les Admins/SGA
1. Les cours sont assignés via le bouton **"Assigner cours"** dans la liste des enseignants
2. Pas besoin de spécifier filière lors de la création d'un enseignant

---

## 📝 Notes Importantes

### ✅ Ce qui fonctionne automatiquement :
- ✅ Création de chat lors de la création d'un cours
- ✅ Ajout de tous les membres pertinents
- ✅ Ajout automatique des nouveaux étudiants
- ✅ Mise à jour lors de l'ajout/retrait d'assistants

### ⚠️ Limitations actuelles :
- Les étudiants ne s'inscrivent PAS manuellement aux cours
- Les cours appartiennent à un auditoire
- Les étudiants voient automatiquement tous les cours de leur auditoire

### 🔮 Améliorations futures possibles :
- [ ] WebSocket pour messages en temps réel
- [ ] Notification push de nouveaux messages
- [ ] Statut de lecture des messages
- [ ] Partage de fichiers dans le chat
- [ ] Recherche dans les messages

---

## 🐛 Troubleshooting

### Le chat ne se crée pas automatiquement
```bash
# Vérifier que les signaux sont bien chargés
python manage.py shell
>>> from apps.chat import signals
>>> # Si pas d'erreur, c'est bon !
```

### Un étudiant ne voit pas les chats
```python
# Vérifier qu'il a un auditoire
user = User.objects.get(id=123)
print(user.auditoire)  # Doit afficher un auditoire

# Vérifier les chats
print(user.chat_channels.all())
```

### Un enseignant ne voit pas les chats
```python
# Vérifier qu'il est titulaire ou assistant d'un cours
user = User.objects.get(id=456)
print(user.courses_as_teacher.all())
print(user.courses_as_assistant.all())
```

---

## 📞 Support

Pour toute question ou problème, consultez :
- Ce fichier de documentation
- Le code commenté dans `backend/apps/chat/signals.py`
- Les logs Django pour les erreurs backend

---

**✨ Le système de chat est maintenant prêt à l'emploi !**
