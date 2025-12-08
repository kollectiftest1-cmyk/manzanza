# Installation Rapide - Syntax GU

**⚡ Guide rapide pour démarrer après les modifications**

---

## 🚀 Étapes d'Installation

### 1. Backend - Installation des Dépendances

```bash
cd backend
pip install qrcode==7.4.2
```

Ou réinstaller toutes les dépendances :

```bash
pip install -r requirements.txt
```

### 2. Backend - Migrations de Base de Données

```bash
# Créer les migrations pour les nouveaux modèles
python manage.py makemigrations courses
python manage.py makemigrations payments

# Appliquer toutes les migrations
python manage.py migrate

# Vérifier que tout est OK
python manage.py showmigrations
```

### 3. Frontend - Pas de nouvelles dépendances

Les bibliothèques utilisées (`react-phone-number-input`, `framer-motion`) sont déjà installées.

Si besoin, réinstaller :

```bash
npm install
```

### 4. Lancement en Mode Développement

**Backend :**
```bash
cd backend
python manage.py runserver
```

**Frontend :**
```bash
npm run dev
```

---

## ✅ Vérifications à Faire

### 1. Tester l'Inscription Publique

1. Aller sur `http://localhost:5173/inscription`
2. Vérifier :
   - ✅ Nouveau design avec header fixe
   - ✅ Indicateur d'étapes circulaires
   - ✅ Scroll naturel (pas de conteneur limité)
   - ✅ Champs téléphone avec sélecteur pays
3. Soumettre une inscription de test

### 2. Valider une Inscription (Admin)

1. Connecter comme admin
2. Aller dans Gestion Inscriptions
3. Valider une inscription
4. Vérifier qu'un auditoire est créé automatiquement si inexistant
5. Message devrait indiquer : "... affecté à l'auditoire 'XXX' (créé automatiquement)"

### 3. Tester Création Auditoire Manuel

1. Aller dans Auditoires
2. Créer un nouvel auditoire
3. **Ne PAS remplir le champ "Nom"**
4. Remplir : Niveau (L1), Filière, Vacation (Jour)
5. Sauvegarder
6. Vérifier que le nom est généré automatiquement : "L1 Nom_Filière Jour"

### 4. Tester le Système de Paiements

**Créer un Bon de Paiement :**

```bash
# Via API (Postman/Insomnia)
POST http://localhost:8000/api/payments/vouchers/create-voucher/
{
    "student_fee_id": 1,
    "amount": "500000",
    "beneficiary_account": "001234567890",
    "expiry_days": 30
}
```

**Valider un Paiement :**

```bash
POST http://localhost:8000/api/payments/vouchers/1/validate-payment/
{
    "bank_slip_number": "BORDEREAU-123456",
    "bank_slip_date": "2024-01-15",
    "payment_method": "virement",
    "send_email": true
}
```

**Vérifier un Reçu (PUBLIC) :**

```bash
GET http://localhost:8000/api/payments/verify-receipt/{uuid}/
```

### 5. Tester les Présences

**Créer une Présence :**

```bash
POST http://localhost:8000/api/courses/attendances/
{
    "student": 1,
    "course": 1,
    "date": "2024-01-15",
    "status": "present",
    "comments": "Présent et actif"
}
```

**Pointage en Masse :**

```bash
POST http://localhost:8000/api/courses/attendances/bulk-create/
{
    "course": 1,
    "date": "2024-01-15",
    "attendances": [
        {"student_id": 1, "status": "present"},
        {"student_id": 2, "status": "absent", "comments": "Malade"},
        {"student_id": 3, "status": "retard"}
    ]
}
```

**Rapport Étudiant :**

```bash
GET http://localhost:8000/api/courses/attendances/student-report/?student_id=1&course_id=1
```

---

## 🗄️ Nouveaux Modèles en Base de Données

Après migration, vous devriez avoir :

### Table `courses_attendance`
- id
- student_id
- course_id
- date
- status (present/absent/retard/excuse)
- comments
- recorded_by_id
- recorded_at
- updated_at

### Table `courses_attendancesession`
- id
- course_id
- date
- start_time
- end_time
- title
- description
- is_finalized
- created_by_id
- created_at
- updated_at

### Table `payments_paymentvoucher`
- id
- voucher_number
- student_id
- student_fee_id
- amount
- description
- beneficiary_account
- beneficiary_name
- status (pending/paid/cancelled/expired)
- issue_date
- expiry_date
- paid_date
- bank_slip_number
- bank_slip_date
- created_by_id
- validated_by_id
- notes
- created_at
- updated_at

### Table `payments_paymentreceipt`
- id
- receipt_number
- verification_code (UUID)
- voucher_id
- payment_id
- student_id
- amount_paid
- fee_type_name
- payment_date
- payment_method
- bank_slip_number
- bank_slip_date
- transaction_reference
- pdf_file
- qr_code
- email_sent
- email_sent_at
- generated_by_id
- created_at
- updated_at

### Table `payments_paymentauditlog`
- id
- action
- voucher_id
- receipt_id
- user_id
- details (JSON)
- timestamp

---

## 🔑 Nouveaux Endpoints API

### Présences
```
POST   /api/courses/attendances/
GET    /api/courses/attendances/
PUT    /api/courses/attendances/{id}/
DELETE /api/courses/attendances/{id}/
POST   /api/courses/attendances/bulk-create/
GET    /api/courses/attendances/student-report/
GET    /api/courses/attendances/course-report/

POST   /api/courses/attendance-sessions/
GET    /api/courses/attendance-sessions/
POST   /api/courses/attendance-sessions/{id}/finalize/
```

### Paiements
```
POST   /api/payments/vouchers/
GET    /api/payments/vouchers/
POST   /api/payments/vouchers/create-voucher/
POST   /api/payments/vouchers/{id}/validate-payment/
POST   /api/payments/vouchers/{id}/cancel/

GET    /api/payments/receipts/
GET    /api/payments/receipts/{id}/
GET    /api/payments/receipts/{id}/download-pdf/

GET    /api/payments/verify-receipt/{uuid}/  (PUBLIC - pas d'auth)

GET    /api/payments/audit-logs/
```

---

## 📝 Données de Test (Optionnel)

Créer un script Python pour générer des données de test :

```python
# backend/create_test_data.py
from django.contrib.auth import get_user_model
from apps.auditoires.models import Section, Filiere
from apps.payments.models import FeeType, StudentFee

User = get_user_model()

# Créer types de frais
FeeType.objects.get_or_create(
    name='Frais de scolarité',
    defaults={'category': 'scolarite', 'amount': 500000, 'is_mandatory': True}
)

# Créer sections/filières si besoin
section, _ = Section.objects.get_or_create(nom='Informatique')
filiere, _ = Filiere.objects.get_or_create(
    nom='Génie Logiciel',
    defaults={'section': section}
)

print("✅ Données de test créées")
```

Exécuter :
```bash
python manage.py shell < create_test_data.py
```

---

## 🐛 Problèmes Courants

### Erreur : "No module named 'qrcode'"
```bash
pip install qrcode
```

### Erreur : "No module named 'PIL'"
```bash
pip install Pillow
```

### Erreur de migration
```bash
# Réinitialiser les migrations (ATTENTION: perte de données)
python manage.py migrate courses zero
python manage.py migrate payments zero
python manage.py migrate

# Ou supprimer les fichiers de migration et recréer
```

### Ports déjà utilisés
```bash
# Backend
python manage.py runserver 8001

# Frontend
npm run dev -- --port 5174
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

1. **ANALYSE_COMPLETE_ARCHITECTURE.md** - Analyse approfondie du système
2. **RESUME_IMPLEMENTATION.md** - Résumé de toutes les implémentations
3. **GUIDE_DEPLOIEMENT.md** - Guide de déploiement en production
4. **Code source** - Tous les fichiers sont commentés

---

## ✨ Résumé des Améliorations

✅ **Validation téléphone internationale** - Format +XXX XXXXXXXXX
✅ **UI/UX moderne** - Indicateur étapes, scroll naturel, animations
✅ **Création auto auditoires** - Plus d'erreurs si auditoire inexistant
✅ **Génération noms auditoires** - "L1 Génie Logiciel Soir"
✅ **Système présences** - Pointage, rapports, statistiques
✅ **Système paiements complet** - Bons, bordereaux, reçus PDF+QR
✅ **Vérification QR Code** - Endpoint public de vérification
✅ **Audit logs** - Traçabilité complète des paiements

---

**Bonne installation ! 🚀**
