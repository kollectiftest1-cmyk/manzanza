# Notes Développeur - Syntax GU

**Informations techniques pour l'équipe de développement**

---

## 🏗️ Architecture des Nouveautés

### 1. Validation Téléphone

**Localisation :** `backend/apps/core/validators.py`

**Fonctions :**
- `validate_international_phone(value)` - Validation stricte
- `normalize_phone_number(value)` - Normalisation format
- `validate_national_phone_length(national_number, max_length=15)`

**Usage :**
```python
from apps.core.validators import validate_international_phone, normalize_phone_number

# Dans un serializer
def validate_phone(self, value):
    normalized = normalize_phone_number(value)
    validate_international_phone(normalized)
    return normalized
```

**Format attendu :** `+243 123456789` (espace entre indicatif et numéro)

---

### 2. Génération Automatique Auditoires

**Localisation :** `backend/apps/auditoires/utils.py`

**Fonctions :**
- `generate_auditoire_name(niveau, filiere, vacation)` - Génère nom lisible
- `find_or_create_auditoire(filiere, niveau, vacation, annee_academique, created_by)` - Trouve ou crée

**Logique Anti-Duplication :**
```python
# Basé sur unique_together dans le modèle Auditoire
unique_together = ['filiere', 'niveau', 'vacation', 'annee_academique']
```

**Exemple d'utilisation :**
```python
from apps.auditoires.utils import find_or_create_auditoire

auditoire, created = find_or_create_auditoire(
    filiere=filiere_obj,
    niveau='L1',
    vacation='jour',
    created_by=request.user
)

if created:
    print(f"Nouvel auditoire créé : {auditoire.nom}")
```

---

### 3. Système de Présences

**Modèles :** `backend/apps/courses/attendance_models.py`

**Relations :**
```
Attendance:
  - student (FK → User)
  - course (FK → Course)
  - recorded_by (FK → User)

AttendanceSession:
  - course (FK → Course)
  - created_by (FK → User)
```

**Contraintes importantes :**
- `unique_together = ['student', 'course', 'date']` sur Attendance
- `unique_together = ['course', 'date', 'start_time']` sur AttendanceSession

**Indexes pour performance :**
```python
indexes = [
    models.Index(fields=['course', 'date']),
    models.Index(fields=['student', 'course']),
    models.Index(fields=['date']),
]
```

**Propriétés calculées (AttendanceSession) :**
- `total_students` - Compte étudiants inscrits au cours
- `present_count`, `absent_count`, `late_count`
- `attendance_rate` - Pourcentage de présence

---

### 4. Système de Paiements

**Modèles :** `backend/apps/payments/models.py`

**Flow du processus :**

```
1. StudentFee (créé par admin)
   ↓
2. PaymentVoucher (bon généré)
   - voucher_number: BON-YYYYMMDD-XXXXX
   - status: pending
   ↓
3. Étudiant paie à la banque
   ↓
4. Staff saisit bordereau + valide
   ↓
5. PaymentReceipt (auto-généré)
   - receipt_number: REC-YYYYMMDD-XXXXX
   - verification_code: UUID unique
   - qr_code: Image QR
   - pdf_file: PDF du reçu
   ↓
6. PaymentAuditLog (traçabilité)
```

**Génération Numéros Uniques :**
```python
def save(self, *args, **kwargs):
    if not self.voucher_number:
        from datetime import datetime
        date_str = datetime.now().strftime('%Y%m%d')
        random_str = get_random_string(5, allowed_chars='0123456789')
        self.voucher_number = f"BON-{date_str}-{random_str}"
    super().save(*args, **kwargs)
```

**UUID pour Vérification :**
```python
verification_code = models.UUIDField(
    default=uuid.uuid4,
    unique=True
)
```

---

### 5. Génération PDF et QR Codes

**Localisation :** `backend/apps/payments/utils.py`

**Bibliothèques utilisées :**
- `reportlab` - Génération PDF
- `qrcode` - Génération QR codes
- `Pillow` (via reportlab) - Images

**Fonctions principales :**

#### generate_qr_code(data, size=10)
```python
# Retourne un ContentFile prêt pour Django FileField
qr_image = generate_qr_code("https://example.com/verify/uuid")
receipt.qr_code.save('qr.png', qr_image, save=False)
```

#### generate_payment_voucher_pdf(voucher)
```python
# Génère PDF du bon de paiement
# Inclut: infos étudiant, montant, compte bénéficiaire
pdf_content = generate_payment_voucher_pdf(voucher)
```

#### generate_payment_receipt_pdf(receipt)
```python
# Génère PDF du reçu
# Inclut: QR code, infos paiement, bordereau
pdf_content = generate_payment_receipt_pdf(receipt)
receipt.pdf_file.save('recu.pdf', pdf_content, save=False)
```

**Structure des PDFs :**
- Header avec titre stylisé
- Tableaux avec infos formatées
- QR Code intégré (pour reçus)
- Footer avec notes

---

## 🔐 Permissions

**Classes de permissions utilisées :**

```python
# apps/users/permissions.py
IsAdminUser          # iadmin, pdg, directeur_general, sga, sgad
IsSGAOrAdmin         # sga ou staff
IsTeacherOrAdmin     # enseignant, assistant, chef_section, chef_departement
CanViewUsers         # Rôles spécifiques peuvent voir users
CanViewAcademicData  # Rôles spécifiques peuvent voir data académique
```

**Utilisation dans ViewSets :**
```python
class PaymentVoucherViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtrer selon le rôle
        if self.request.user.role == 'etudiant':
            return self.queryset.filter(student=self.request.user)
        return self.queryset
```

---

## 📊 Optimisations de Requêtes

**Utilisation de select_related et prefetch_related :**

```python
# Présences
queryset = Attendance.objects.select_related(
    'student', 'course', 'recorded_by'
).all()

# Bons de paiement
queryset = PaymentVoucher.objects.select_related(
    'student', 'student_fee__fee_type', 'created_by', 'validated_by'
).all()

# Reçus
queryset = PaymentReceipt.objects.select_related(
    'student', 'voucher', 'payment', 'generated_by'
).all()
```

**Annotations pour statistiques :**

```python
# Dans AuditoireViewSet
queryset = Auditoire.objects.annotate(
    etudiants_count=Count('students', filter=Q(students__status='actif')),
    cours_count=Count('filiere__courses', filter=Q(filiere__courses__is_active=True))
)
```

---

## 🎨 Frontend - Composants React

### StepIndicator

**Localisation :** `src/components/Inscription/StepIndicator.jsx`

**Props :**
```jsx
<StepIndicator
  steps={[
    { title: 'Étape 1' },
    { title: 'Étape 2' },
    { title: 'Étape 3' }
  ]}
  currentStep={0}
/>
```

**Animations :** Utilise Framer Motion pour transitions fluides

**Features :**
- Cercles avec numéros/checkmarks
- Lignes de connexion animées
- Titre de l'étape actuelle
- Responsive mobile

---

## 🧪 Tests à Écrire

### Backend

**Tests unitaires suggérés :**

```python
# tests/test_validators.py
def test_validate_international_phone():
    valid_phones = ['+243 123456789', '+1 2345678901']
    invalid_phones = ['123456789', '+', '+243']
    # ...

# tests/test_auditoire_utils.py
def test_generate_auditoire_name():
    # Test génération nom
    # Test anti-duplication

# tests/test_payment_workflow.py
def test_create_voucher():
    # Test création bon

def test_validate_payment():
    # Test validation + génération reçu

def test_verify_receipt():
    # Test vérification QR code
```

### Frontend

**Tests suggérés :**

```javascript
// StepIndicator.test.jsx
describe('StepIndicator', () => {
  it('renders correct number of steps', () => {})
  it('highlights current step', () => {})
  it('shows checkmark for completed steps', () => {})
})

// MultiStepForm.test.jsx
describe('MultiStepForm', () => {
  it('validates phone input', () => {})
  it('navigates between steps', () => {})
  it('submits form correctly', () => {})
})
```

---

## 🔧 Configuration Recommandée

### Settings Django

```python
# settings.py

# Pour les PDFs
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Pour les QR codes et emails
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# Email (pour envoi automatique reçus)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
# ... autres configs email
```

### CORS

```python
# Si frontend et backend sur domaines différents
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://votre-domaine.com'
]

CORS_ALLOW_CREDENTIALS = True
```

---

## 📝 TODO / Améliorations Futures

### Priorité Haute
- [ ] Implémenter envoi automatique emails (reçus, notifications)
- [ ] Créer UI frontend pour module présences
- [ ] Créer UI frontend pour gestion paiements
- [ ] Tests unitaires et d'intégration

### Priorité Moyenne
- [ ] Module reporting avancé avec filtres multiples
- [ ] Système résultats et communiqués
- [ ] Système assistants (attachement/détachement)
- [ ] Notifications in-app (websockets)

### Priorité Basse
- [ ] Export Excel pour rapports
- [ ] Graphiques et statistiques avancées
- [ ] API pour mobile app
- [ ] Multi-langue (i18n)

---

## 🐞 Bugs Connus / Limitations

1. **Email non implémenté** - L'envoi automatique de reçus nécessite configuration SMTP
2. **Pas de retry logic** - Si génération PDF échoue, pas de mécanisme de retry
3. **QR Code paths** - Vérifier chemins des fichiers QR en production (utiliser S3)
4. **Validation côté client** - Pourrait être renforcée pour meilleure UX

---

## 💡 Bonnes Pratiques

### Transactions Atomiques

Toujours utiliser `@transaction.atomic` pour opérations critiques :

```python
@action(detail=True, methods=['post'])
@transaction.atomic
def validate_payment(self, request, pk=None):
    # Si une étape échoue, tout est rollback
    voucher.save()
    receipt.save()
    audit_log.save()
```

### Audit Logs

Toujours créer un log d'audit pour actions importantes :

```python
PaymentAuditLog.objects.create(
    action='payment_validated',
    voucher=voucher,
    user=request.user,
    details={'amount': float(voucher.amount)}
)
```

### Sécurité

- ✅ Validation côté serveur TOUJOURS
- ✅ Permissions granulaires
- ✅ UUID pour reçus (non-guessable)
- ✅ Filtrage queryset selon rôle utilisateur

---

**Dernière mise à jour :** 2024
**Mainteneur :** Expert Fullstack
