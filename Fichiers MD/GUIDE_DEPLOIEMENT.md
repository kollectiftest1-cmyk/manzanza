# Guide de Déploiement - Syntax GU

**Date:** 2024
**Version:** 2.0
**Projet:** Système de Gestion Universitaire

---

## 📋 Vue d'ensemble des changements

Ce guide documente les améliorations majeures apportées au système Syntax GU, incluant :

✅ Validation téléphone internationale (frontend + backend)
✅ UI/UX refondée du formulaire d'inscription
✅ Création automatique d'auditoires
✅ Système de présences complet
✅ Système de paiements avec bons, bordereaux et reçus PDF+QR
✅ Génération automatique de noms d'auditoires
✅ Vérification anti-duplication

---

## 🔧 Prérequis

### Backend
- Python 3.10+
- PostgreSQL 13+ (recommandé pour production)
- pip 23+

### Frontend
- Node.js 18+
- npm 9+

### Serveur
- Ubuntu 20.04+ ou Windows Server 2019+
- Nginx ou Apache
- SSL Certificate (Let's Encrypt recommandé)

---

## 📦 Installation Backend

### 1. Cloner le dépôt et installer les dépendances

```bash
cd backend
pip install -r requirements.txt
```

### 2. Nouvelles dépendances ajoutées

```
qrcode==7.4.2          # Génération QR codes pour reçus
```

### 3. Configuration de l'environnement

Créer/mettre à jour le fichier `.env` :

```env
# Django
SECRET_KEY=votre-secret-key-tres-securisee
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com

# Database (Production)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=syntax_gu_db
DB_USER=syntax_gu_user
DB_PASSWORD=mot-de-passe-securise
DB_HOST=localhost
DB_PORT=5432

# Frontend URL (pour les QR codes)
FRONTEND_URL=https://votre-domaine.com

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-app-password

# CORS
CORS_ALLOWED_ORIGINS=https://votre-domaine.com

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

### 4. Migrations de base de données

⚠️ **IMPORTANT** : Ces migrations créent de nouveaux modèles

```bash
# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superuser si nécessaire
python manage.py createsuperuser
```

**Nouveaux modèles créés :**
- `Attendance` - Enregistrement des présences
- `AttendanceSession` - Séances de présence
- `PaymentVoucher` - Bons de paiement
- `PaymentReceipt` - Reçus de paiement
- `PaymentAuditLog` - Journal d'audit des paiements

### 5. Collecte des fichiers statiques

```bash
python manage.py collectstatic --noinput
```

### 6. Configuration des médias

Créer les dossiers pour les uploads :

```bash
mkdir -p media/receipts/pdf
mkdir -p media/receipts/qr
mkdir -p media/inscriptions
```

**Pour production (avec S3 ou équivalent) :**

Installer `django-storages` et configurer :

```bash
pip install django-storages boto3
```

Dans `settings.py` :

```python
# AWS S3 Configuration
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

---

## 🎨 Installation Frontend

### 1. Installer les dépendances

```bash
cd frontend  # ou racine du projet
npm install
```

### 2. Configuration de l'environnement

Créer/mettre à jour `.env` :

```env
VITE_API_URL=https://api.votre-domaine.com/api
VITE_APP_NAME=Syntax GU
```

### 3. Build pour production

```bash
npm run build
```

Les fichiers de build seront dans le dossier `dist/`.

---

## 🚀 Déploiement

### Option 1 : Déploiement avec Nginx + Gunicorn (Ubuntu)

#### Backend

1. **Installer Gunicorn**

```bash
pip install gunicorn
```

2. **Créer un service systemd** (`/etc/systemd/system/syntax-gu.service`)

```ini
[Unit]
Description=Syntax GU Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/syntax-gu/backend
Environment="PATH=/var/www/syntax-gu/venv/bin"
ExecStart=/var/www/syntax-gu/venv/bin/gunicorn --workers 3 --bind unix:/var/www/syntax-gu/backend/gunicorn.sock config.wsgi:application

[Install]
WantedBy=multi-user.target
```

3. **Démarrer le service**

```bash
sudo systemctl start syntax-gu
sudo systemctl enable syntax-gu
```

#### Frontend (Nginx)

Configuration Nginx (`/etc/nginx/sites-available/syntax-gu`) :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/syntax-gu/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://unix:/var/www/syntax-gu/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend Media
    location /media/ {
        alias /var/www/syntax-gu/backend/media/;
    }

    # Backend Static
    location /static/ {
        alias /var/www/syntax-gu/backend/staticfiles/;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/syntax-gu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2 : Déploiement avec Docker

**Dockerfile Backend** :

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
```

**docker-compose.yml** :

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: syntax_gu_db
      POSTGRES_USER: syntax_gu_user
      POSTGRES_PASSWORD: secure_password

  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - media_volume:/app/media
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  media_volume:
```

---

## 🔄 Migrations à Exécuter

### Commandes de migration

```bash
# 1. Créer les migrations pour les nouveaux modèles
python manage.py makemigrations courses
python manage.py makemigrations payments

# 2. Appliquer les migrations
python manage.py migrate

# 3. Vérifier les migrations
python manage.py showmigrations
```

### Script de données initiales

Créer un fichier `backend/setup_initial_data.py` :

```python
from django.core.management.base import BaseCommand
from apps.payments.models import FeeType

class Command(BaseCommand):
    help = 'Setup initial data'

    def handle(self, *args, **kwargs):
        # Créer types de frais par défaut
        fee_types = [
            {'name': 'Frais de scolarité', 'category': 'scolarite', 'amount': 500000, 'is_mandatory': True},
            {'name': 'Frais d\'inscription', 'category': 'inscription', 'amount': 50000, 'is_mandatory': True},
            {'name': 'Frais de bibliothèque', 'category': 'bibliotheque', 'amount': 20000, 'is_mandatory': False},
        ]

        for ft in fee_types:
            FeeType.objects.get_or_create(**ft)

        self.stdout.write(self.style.SUCCESS('Initial data created successfully'))
```

Exécuter :

```bash
python manage.py setup_initial_data
```

---

## 📊 Tests

### Backend

```bash
# Tests unitaires
python manage.py test

# Tests avec coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend

```bash
npm run test  # Si configuré
```

---

## 🔐 Sécurité

### Checklist de sécurité

- [ ] `DEBUG=False` en production
- [ ] `SECRET_KEY` unique et sécurisée
- [ ] HTTPS activé avec certificat SSL
- [ ] CORS configuré correctement
- [ ] Mots de passe de base de données sécurisés
- [ ] Permissions fichiers correctes (755 pour dossiers, 644 pour fichiers)
- [ ] Firewall configuré (ports 80, 443, 22 uniquement)
- [ ] Backups automatiques configurés

---

## 📝 Endpoints Ajoutés

### Présences (Attendance)

```
POST   /api/courses/attendances/                    - Créer une présence
GET    /api/courses/attendances/                    - Liste des présences
POST   /api/courses/attendances/bulk-create/        - Création en masse
GET    /api/courses/attendances/student-report/     - Rapport étudiant
GET    /api/courses/attendances/course-report/      - Rapport cours

POST   /api/courses/attendance-sessions/            - Créer une séance
GET    /api/courses/attendance-sessions/            - Liste des séances
POST   /api/courses/attendance-sessions/{id}/finalize/ - Finaliser une séance
```

### Paiements (Payments)

```
POST   /api/payments/vouchers/                      - Créer un bon
GET    /api/payments/vouchers/                      - Liste des bons
POST   /api/payments/vouchers/create-voucher/       - Créer bon pour frais
POST   /api/payments/vouchers/{id}/validate-payment/ - Valider paiement
POST   /api/payments/vouchers/{id}/cancel/          - Annuler bon

GET    /api/payments/receipts/                      - Liste des reçus
GET    /api/payments/receipts/{id}/                 - Détail reçu
GET    /api/payments/receipts/{id}/download-pdf/    - Télécharger PDF

GET    /api/payments/verify-receipt/{uuid}/         - Vérifier reçu (PUBLIC)

GET    /api/payments/audit-logs/                    - Logs d'audit
```

---

## 🐛 Troubleshooting

### Erreur : "No module named 'qrcode'"

```bash
pip install qrcode
```

### Erreur : "Unable to generate QR code"

Installer Pillow :

```bash
pip install Pillow
```

### Erreur de permissions sur media/

```bash
sudo chown -R www-data:www-data /var/www/syntax-gu/backend/media
sudo chmod -R 755 /var/www/syntax-gu/backend/media
```

### Frontend ne se connecte pas au backend

Vérifier les variables d'environnement et CORS_ALLOWED_ORIGINS.

---

## 📞 Support

Pour toute question :
- Documentation API : `https://votre-domaine.com/api/docs/`
- Email : support@syntax-gu.com

---

**Fin du Guide de Déploiement**
