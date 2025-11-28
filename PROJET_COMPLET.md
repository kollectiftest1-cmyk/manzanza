# 🎓 SYNTAX GU - PROJET COMPLET
## Système de Gestion Universitaire - Documentation Complète

---

## 📊 ANALYSE COMPLÈTE DE L'APPLICATION

### 🎯 Vue d'ensemble

**Syntax GU** est une plateforme de gestion universitaire complète qui permet de gérer tous les aspects d'une institution d'enseignement supérieur, de l'inscription des étudiants à la gestion du personnel.

---

## 👥 RÔLES ET PERMISSIONS (15 Rôles)

### 1. **Conseil d'administration**
- **PDG** (`pdg`)
  - Accès total au système
  - Consultation de tous les rapports
  - Validation des décisions stratégiques

### 2. **Direction**
- **Directeur Général** (`directeur_general`)
  - Gestion globale de l'institution
  - Accès à tous les modules
  - Supervision de tous les départements

### 3. **Secrétariat Académique**
- **SGA** (`sga`) - Secrétariat Général Académique
  - Gestion des cours et programmes
  - Suivi académique des étudiants
  - Gestion des horaires et auditoires

- **SGAD** (`sgad`) - Administration & Finances
  - Gestion financière
  - Gestion du personnel (RH)
  - Paiements et comptabilité

### 4. **Encadrement Académique**
- **Chef de Section** (`chef_section`)
  - Gestion d'une section académique
  - Supervision des enseignants
  - Organisation des cours

- **Chef de Département** (`chef_departement`)
  - Gestion d'un département
  - Coordination pédagogique
  - Suivi des programmes

### 5. **Personnel Enseignant**
- **Enseignant** (`enseignant`)
  - Création et gestion des cours
  - Création de quiz et évaluations
  - Notation des étudiants
  - Gestion des TP/TD

- **Assistant** (`assistant`)
  - Assistance aux enseignants
  - Correction des devoirs
  - Animation des TD

### 6. **Personnel Administratif**
- **Apparitorat** (`apparitorat`)
  - Gestion logistique
  - Support technique
  - Maintenance

- **Caisse/Comptabilité** (`caisse`)
  - Gestion des paiements
  - Traitement des transactions
  - Génération de reçus

- **Service IT** (`service_it`)
  - Support technique
  - Gestion du système
  - Maintenance informatique

### 7. **Étudiants**
- **Étudiant** (`etudiant`)
  - Consultation des cours
  - Participation aux quiz
  - Soumission de devoirs
  - Accès à la bibliothèque
  - Consultation des paiements

### 8. **Services Spécialisés**
- **Bibliothécaire** (`bibliothecaire`)
  - Gestion des livres
  - Gestion des emprunts
  - Catalogage

- **Jury** (`jury`) - Mémoire/Défense
  - Évaluation des mémoires
  - Organisation des défenses
  - Notation finale

### 9. **Super Administrateur**
- **iAdmin** (`iadmin`)
  - Accès total au système
  - Configuration système
  - Gestion des utilisateurs
  - Accès à tous les modules

---

## 📱 ÉCRANS ET FONCTIONNALITÉS

### 1. **Authentification**
- Page de connexion avec validation
- Gestion de session JWT
- Récupération de mot de passe
- Déconnexion sécurisée

### 2. **Dashboard (Tableau de bord)**

#### Dashboard Étudiant
- **Vue d'ensemble:**
  - Cours en cours
  - Prochains quiz
  - TP/TD à rendre
  - Notifications récentes
- **Statistiques:**
  - Progression par cours
  - Notes moyennes
  - Présence

#### Dashboard Enseignant
- **Vue d'ensemble:**
  - Cours enseignés
  - Étudiants inscrits
  - Devoirs à corriger
  - Statistiques de classe
- **Accès rapide:**
  - Création de quiz
  - Notation
  - Messages

#### Dashboard Administrateur
- **Statistiques globales:**
  - Nombre d'étudiants
  - Nombre d'enseignants
  - Revenus
  - Taux de réussite
- **Alertes:**
  - Paiements en retard
  - Absences
  - Demandes en attente

### 3. **Cours (Courses)**

#### Liste des cours
- Filtres: Niveau, Filière, Enseignant
- Recherche par nom/code
- Tri: Date, Nom, Popularité

#### Détails d'un cours
- Informations générales
- Syllabus
- Matériels de cours (documents, vidéos)
- Liste des étudiants
- Progression

#### Actions
- S'inscrire (étudiants)
- Créer/Modifier (enseignants)
- Ajouter du matériel
- Gérer les inscriptions

### 4. **Auditoires (Classes virtuelles)**

#### Gestion
- Liste des auditoires
- Niveaux: L1, L2, L3, M1, M2
- Filières: Finance, Comptabilité, Gestion, etc.

#### Fonctionnalités
- Voir les étudiants d'un auditoire
- Voir les cours d'un auditoire
- Capacité maximale
- Année académique

### 5. **Quiz & Évaluations**

#### Types de questions
- Choix multiples
- Vrai/Faux
- Réponses courtes

#### Fonctionnalités
- Durée limitée
- Tentatives multiples
- Score de passage
- Mélange des questions
- Affichage des corrections
- Historique des tentatives

#### Workflow
1. Enseignant crée le quiz
2. Étudiant démarre une tentative
3. Étudiant soumet les réponses
4. Notation automatique
5. Affichage du résultat

### 6. **Chat & Forums**

#### Canaux
- Canal par cours
- Canaux généraux
- Discussions privées

#### Messages
- Texte
- Pièces jointes
- Réactions (👍, ❤️, 😂, 😮)
- Fil de réponses
- Édition/Suppression

#### Support IA
- Réponses automatiques
- Suggestions

### 7. **TP/TD (Travaux Pratiques/Dirigés)**

#### Types de travaux
- TP (Travaux Pratiques)
- TD (Travaux Dirigés)
- Projets
- Devoirs

#### Workflow étudiant
1. Consulter l'énoncé
2. Télécharger les ressources
3. Rédiger/Soumettre
4. Consulter les commentaires
5. Voir la note

#### Workflow enseignant
1. Créer le travail
2. Définir la date limite
3. Recevoir les soumissions
4. Corriger et noter
5. Donner du feedback

#### Fonctionnalités
- Date limite
- Soumissions tardives (avec pénalité)
- Note maximale
- Commentaires
- Historique des versions

### 8. **Bibliothèque**

#### Catalogue
- Livres physiques
- Livres numériques
- Livres audio
- Mémoires
- Projets

#### Catégories
- Comptabilité
- Économie
- Mathématiques
- Droit
- Finance
- Gestion
- Marketing
- RH

#### Emprunts
- Durée: 30 jours par défaut
- Renouvellement possible
- Amendes pour retard (500 FCFA/jour)
- Historique

#### Réservations
- Réserver un livre non disponible
- Notification quand disponible
- Expiration après 7 jours

### 9. **Paiements**

#### Types de frais
- Frais de scolarité
- Frais de laboratoire
- Frais de bibliothèque
- Frais d'inscription
- Frais d'examen

#### Méthodes de paiement
- Espèces
- Virement bancaire
- Chèque
- Paiement mobile
- Carte bancaire

#### Suivi
- Statut: Impayé, Paiement partiel, Payé
- Montant total vs payé
- Montant restant
- Pourcentage payé
- Historique des paiements

#### Fonctionnalités
- Génération de reçus
- Références uniques
- Confirmation/Rejet
- Statistiques financières

### 10. **Ressources Humaines (RH)**

#### Gestion du personnel
- Liste des employés
- Postes et départements
- Date d'embauche
- Salaires

#### Contrats
- Types: CDI, CDD, Stage, Vacation
- Dates de début/fin
- Salaire
- Heures par semaine
- Statut

#### Paies
- Périodes de paie
- Salaire de base
- Primes
- Déductions
- Salaire net
- Méthode de paiement

#### Congés
- Types: Annuel, Maladie, Maternité, Paternité
- Demande de congé
- Approbation/Rejet
- Durée
- Solde de congés

### 11. **Notifications**

#### Types
- Cours
- Quiz
- TP/TD
- Chat
- Paiement
- Bibliothèque
- RH
- Système

#### Priorités
- Basse
- Moyenne
- Haute
- Urgente

#### Fonctionnalités
- Notifications non lues
- Marquer comme lu
- Tout marquer comme lu
- Supprimer
- Liens vers ressources

#### Annonces
- Annonces publiques
- Audiences: Tous, Étudiants, Enseignants, Personnel
- Épinglage
- Date de publication/expiration

---

## 🗄️ MODÈLES DE DONNÉES (Base de données)

### User (Utilisateur personnalisé)
```
- id (auto)
- email (unique)
- password (hashé)
- first_name, last_name
- phone
- role (choix parmi 15 rôles)
- status (actif, inactif, suspendu)
- matricule (étudiants)
- promotion, auditoire (étudiants)
- department, section, specialty (staff)
- address, date_of_birth
- profile_picture
- is_active, is_staff
- date_joined, last_login
```

### UserProfile
```
- user (OneToOne)
- bio, website, linkedin, github
- language, timezone
- email_notifications, quiz_reminders
- course_updates, chat_notifications
```

### Auditoire
```
- nom
- niveau (L1-M2)
- filiere
- description
- annee_academique
- capacite_max
- is_active
```

### Course
```
- name, code
- description, credits
- teacher, assistants
- auditoire
- syllabus, resources
- semester, annee_academique
- is_active
```

### CourseEnrollment
```
- student, course
- progress (%)
- grade
- enrolled_at
- is_active
```

### CourseMaterial
```
- course
- title, description
- material_type (document, video, audio, link)
- file, link
- order, is_public
```

### Quiz
```
- title, description
- course
- duration, max_attempts, passing_score
- shuffle_questions, show_correct_answers
- available_from, available_until
- is_active
```

### Question
```
- quiz
- question_text
- question_type (multiple_choice, true_false, short_answer)
- points, order
- correct_answer (pour short_answer)
```

### QuestionOption
```
- question
- option_text
- is_correct
- order
```

### QuizAttempt
```
- quiz, student
- score
- started_at, completed_at
- is_completed
```

### Answer
```
- attempt, question
- selected_option
- answer_text
- is_correct
```

### ChatChannel
```
- name, description
- course
- is_general, is_active
```

### Message
```
- channel, sender
- content
- is_ai_response
- parent_message (pour réponses)
- attachment
- is_edited, is_deleted
```

### MessageReaction
```
- message, user
- reaction_type (like, love, laugh, wow)
```

### Assignment (TP/TD)
```
- title, description, instructions
- course
- assignment_type (TP, TD, projet, devoir)
- start_date, due_date
- max_score
- allow_late_submission, late_penalty
- attachment
- status, is_active
```

### Submission
```
- assignment, student
- content, attachment
- score, feedback
- graded_by, graded_at
- status, is_late
- submitted_at
```

### SubmissionComment
```
- submission, author
- comment
```

### Book
```
- title, author, isbn
- description, category
- book_type (physique, numerique, audio)
- publisher, publication_year, pages
- location, quantity, available_quantity
- file, cover_image
- downloadable, borrowable
- is_available, is_active
```

### BookLoan
```
- book, borrower
- borrow_date, due_date, return_date
- status
- fine_amount, fine_paid
- librarian
```

### BookReservation
```
- book, user
- reserved_at, expires_at
- status
```

### FeeType
```
- name, category
- description, amount
- is_mandatory, is_active
- academic_year
```

### StudentFee
```
- student, fee_type
- total_amount, amount_paid
- due_date, status
```

### Payment
```
- student_fee
- amount
- payment_method
- reference (unique)
- status
- transaction_id, receipt
- processed_by, payment_date
```

### Employee
```
- user
- employee_id, position, department
- hire_date, end_date
- base_salary, currency
- status
- emergency_contact, emergency_phone
```

### Contract
```
- employee
- contract_type (CDI, CDD, stage, vacation)
- start_date, end_date
- salary, hours_per_week
- status, contract_file
```

### Payroll
```
- employee
- period_start, period_end
- base_salary, bonuses, deductions, net_salary
- status
- payment_date, payment_method
```

### Leave
```
- employee
- leave_type
- start_date, end_date
- reason, status
- approved_by, approved_at
```

### Notification
```
- recipient
- title, message
- notification_type, priority
- link, related_object_id
- is_read, read_at
```

### Announcement
```
- title, content
- audience
- attachment
- is_active, is_pinned
- publish_date, expire_date
- created_by
```

---

## 🔗 ENDPOINTS API (Routes Backend)

### Base URL: `http://localhost:8000/api/`

### Authentication (`/auth/`)
```
POST   /auth/login/                    # Connexion
POST   /auth/logout/                   # Déconnexion
POST   /auth/token/refresh/            # Rafraîchir token
GET    /auth/users/                    # Liste utilisateurs
POST   /auth/users/                    # Créer utilisateur
GET    /auth/users/me/                 # Profil actuel
PUT    /auth/users/update_profile/     # Mettre à jour profil
POST   /auth/users/change_password/    # Changer mot de passe
GET    /auth/users/by_role/            # Filtrer par rôle
```

### Courses (`/courses/`)
```
GET    /courses/                       # Liste des cours
POST   /courses/                       # Créer un cours
GET    /courses/{id}/                  # Détails d'un cours
PUT    /courses/{id}/                  # Modifier un cours
DELETE /courses/{id}/                  # Supprimer un cours
POST   /courses/{id}/enroll/           # S'inscrire
POST   /courses/{id}/unenroll/         # Se désinscrire
GET    /courses/my_courses/            # Mes cours
GET    /courses/materials/             # Matériels
POST   /courses/materials/             # Ajouter matériel
GET    /courses/enrollments/           # Inscriptions
```

### Auditoires (`/auditoires/`)
```
GET    /auditoires/                    # Liste
POST   /auditoires/                    # Créer
GET    /auditoires/{id}/               # Détails
GET    /auditoires/{id}/students/      # Étudiants
GET    /auditoires/{id}/courses/       # Cours
```

### Quiz (`/quiz/`)
```
GET    /quiz/                          # Liste des quiz
POST   /quiz/                          # Créer un quiz
GET    /quiz/{id}/                     # Détails
POST   /quiz/{id}/start_attempt/       # Démarrer tentative
POST   /quiz/{id}/submit_attempt/      # Soumettre réponses
GET    /quiz/my_quizzes/               # Mes quiz
GET    /quiz/attempts/                 # Tentatives
GET    /quiz/questions/                # Questions
POST   /quiz/questions/                # Créer question
```

### Chat (`/chat/`)
```
GET    /chat/channels/                 # Canaux
POST   /chat/channels/                 # Créer canal
GET    /chat/channels/{id}/messages/   # Messages d'un canal
GET    /chat/messages/                 # Liste messages
POST   /chat/messages/                 # Envoyer message
PUT    /chat/messages/{id}/            # Modifier message
POST   /chat/messages/{id}/delete_message/  # Supprimer
POST   /chat/messages/{id}/react/      # Réagir
GET    /chat/messages/{id}/replies/    # Réponses
```

### Assignments (`/assignments/`)
```
GET    /assignments/                   # Liste TP/TD
POST   /assignments/                   # Créer
GET    /assignments/{id}/              # Détails
POST   /assignments/{id}/submit/       # Soumettre travail
GET    /assignments/{id}/submissions/  # Soumissions
GET    /assignments/submissions/       # Toutes soumissions
POST   /assignments/submissions/{id}/grade/     # Noter
POST   /assignments/submissions/{id}/add_comment/  # Commenter
```

### Library (`/library/`)
```
GET    /library/books/                 # Liste livres
POST   /library/books/                 # Ajouter livre
GET    /library/books/{id}/            # Détails
POST   /library/books/{id}/borrow/     # Emprunter
POST   /library/books/{id}/reserve/    # Réserver
GET    /library/loans/                 # Emprunts
GET    /library/loans/my_loans/        # Mes emprunts
POST   /library/loans/{id}/return_book/  # Retourner
GET    /library/reservations/          # Réservations
POST   /library/reservations/{id}/cancel/  # Annuler
```

### Payments (`/payments/`)
```
GET    /payments/fee-types/            # Types de frais
GET    /payments/student-fees/         # Frais étudiants
GET    /payments/student-fees/my_fees/ # Mes frais
GET    /payments/student-fees/statistics/  # Statistiques
GET    /payments/                      # Paiements
POST   /payments/                      # Nouveau paiement
POST   /payments/{id}/confirm/         # Confirmer
POST   /payments/{id}/reject/          # Rejeter
```

### HR (`/hr/`)
```
GET    /hr/employees/                  # Employés
POST   /hr/employees/                  # Ajouter employé
GET    /hr/contracts/                  # Contrats
POST   /hr/contracts/                  # Nouveau contrat
GET    /hr/payrolls/                   # Paies
POST   /hr/payrolls/                   # Créer paie
POST   /hr/payrolls/{id}/mark_paid/    # Marquer payé
GET    /hr/leaves/                     # Congés
POST   /hr/leaves/                     # Demander congé
POST   /hr/leaves/{id}/approve/        # Approuver
POST   /hr/leaves/{id}/reject/         # Rejeter
```

### Notifications (`/notifications/`)
```
GET    /notifications/                 # Liste
GET    /notifications/unread/          # Non lues
GET    /notifications/unread_count/    # Nombre non lues
POST   /notifications/{id}/mark_read/  # Marquer lu
POST   /notifications/mark_all_read/   # Tout marquer lu
DELETE /notifications/clear_all/       # Tout supprimer
GET    /notifications/announcements/   # Annonces
POST   /notifications/announcements/   # Créer annonce
GET    /notifications/announcements/pinned/  # Annonces épinglées
```

---

## 🚀 INSTALLATION ET DÉMARRAGE

### Prérequis
- Python 3.10+
- Node.js 18+
- Git

### Installation Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

✅ Backend: http://localhost:8000

### Installation Frontend

```bash
npm install
copy .env.example .env
npm run dev
```

✅ Frontend: http://localhost:5173

---

## 📁 STRUCTURE DU PROJET

```
syntax-gu/
├── backend/                    # Backend Django
│   ├── config/                # Configuration
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/                  # Applications
│   │   ├── users/            # Utilisateurs & Auth
│   │   ├── courses/          # Cours
│   │   ├── auditoires/       # Auditoires
│   │   ├── quiz/             # Quiz
│   │   ├── chat/             # Chat
│   │   ├── assignments/      # TP/TD
│   │   ├── library/          # Bibliothèque
│   │   ├── payments/         # Paiements
│   │   ├── hr/               # RH
│   │   └── notifications/    # Notifications
│   ├── media/                # Fichiers uploadés
│   ├── manage.py
│   ├── requirements.txt
│   ├── README.md
│   └── QUICK_START.md
│
├── src/                       # Frontend React
│   ├── components/           # Composants
│   ├── pages/                # Pages
│   ├── store/                # Redux
│   ├── services/             # API Services
│   │   └── api.js           # ⭐ API centralisée
│   └── App.jsx
│
├── INTEGRATION_GUIDE.md      # ⭐ Guide d'intégration
├── PROJET_COMPLET.md         # ⭐ Ce document
└── package.json
```

---

## 🔐 SÉCURITÉ

### Authentification JWT
- Tokens d'accès (60 min)
- Tokens de rafraîchissement (24h)
- Rotation automatique
- Blacklist après déconnexion

### Permissions
- Basées sur les rôles
- Hiérarchie stricte
- Validation côté serveur

### Données
- Mots de passe hashés (Argon2)
- HTTPS en production
- CORS configuré
- CSRF protection

---

## 📚 DOCUMENTATION

1. **README.md** - Vue d'ensemble du backend
2. **QUICK_START.md** - Démarrage rapide
3. **INTEGRATION_GUIDE.md** - Guide d'intégration frontend-backend
4. **PROJET_COMPLET.md** - Ce document
5. **API Docs** - http://localhost:8000/api/docs/

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Backend
- [ ] Variables d'environnement (.env)
- [ ] Base de données PostgreSQL
- [ ] Migrations appliquées
- [ ] Superuser créé
- [ ] CORS configuré
- [ ] SECRET_KEY sécurisée
- [ ] DEBUG=False en production
- [ ] ALLOWED_HOSTS configuré
- [ ] Fichiers statiques collectés
- [ ] HTTPS activé

### Frontend
- [ ] API URL configurée
- [ ] Build de production créé
- [ ] Variables d'environnement
- [ ] Service worker (optionnel)

---

## 🎯 FONCTIONNALITÉS CLÉS

✅ **15 rôles utilisateurs** avec permissions granulaires
✅ **10 modules complets** interconnectés
✅ **Authentification JWT** sécurisée
✅ **API RESTful** complète et documentée
✅ **Frontend React** moderne et réactif
✅ **Redux** pour la gestion d'état
✅ **Notifications** en temps réel
✅ **Chat** avec réactions et fils de discussion
✅ **Quiz** avec notation automatique
✅ **Bibliothèque** avec système d'emprunts
✅ **RH** complète (paies, congés, contrats)
✅ **Paiements** avec multiples méthodes
✅ **Documentation** complète

---

## 🏆 POINTS FORTS

1. **Architecture modulaire** - Facile à maintenir et étendre
2. **Séparation frontend/backend** - Flexibilité maximale
3. **API-First** - Réutilisable pour mobile/autres clients
4. **Permissions robustes** - Sécurité à tous les niveaux
5. **Documentation exhaustive** - Facile à comprendre
6. **Code propre** - Suivant les best practices
7. **Évolutif** - Prêt pour la croissance

---

## 📞 SUPPORT

- Documentation API: http://localhost:8000/api/docs/
- Admin Django: http://localhost:8000/admin/
- Guide d'intégration: INTEGRATION_GUIDE.md
- Démarrage rapide: backend/QUICK_START.md

---

## 🎓 DÉVELOPPÉ POUR SYNTAX GU

**Version:** 1.0.0
**Date:** 2024
**Stack:** Django REST Framework + React + Redux

---

## 🚀 PROCHAINES ÉTAPES

1. Tester tous les endpoints
2. Créer des données de démonstration
3. Configurer la production
4. Déployer l'application
5. Former les utilisateurs

---

**🎉 Votre système de gestion universitaire est prêt à l'emploi !**
