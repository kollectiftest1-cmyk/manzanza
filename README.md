# Manzanza

Plateforme de gestion universitaire organisée en trois applications :

- `backend/` : API Django REST.
- `web/` : application web React + Vite.
- `mobile/` : application React Native JavaScript avec Expo SDK 54, limitée aux rôles étudiant et enseignant.

## Démarrage

API : consultez [backend/README.md](backend/README.md).

Web : `cd web`, puis `npm install` et `npm run dev`.

Mobile : `cd mobile`, copiez `.env.example` vers `.env`, puis lancez `npm start`. Sur un appareil physique, `EXPO_PUBLIC_API_URL` doit pointer vers l'adresse IP LAN de l'ordinateur qui héberge l'API.

## Mise en production

Déploiement classique (sans Docker) sur un VPS partagé, en une commande :

```
sudo git clone <dépôt> /opt/mazanza && cd /opt/mazanza
sudo bash deploy/deploy.sh --email admin@daianapilot.com
```

Mise à jour : `sudo bash deploy/deploy.sh --pull`. Détails, exploitation et sécurité :
[deploy/DEPLOIEMENT.md](deploy/DEPLOIEMENT.md).

## Données de démonstration

Pour une formation ou une démonstration, une université complète et cohérente se crée en une commande
(sur une base vide) :

```
cd backend
python manage.py migrate
python manage.py seed_demo
```

Elle contient l'année 2025-2026 terminée (notes, délibérations des deux sessions, PV, réinscriptions) et
l'année 2026-2027 en cours (admissions, inscriptions, paiements, horaires, présences, premières notes, paie,
TFC, bibliothèque, assistance). Comptes : `pdg@demo.mazanza.cd`, `sga@demo.mazanza.cd`,
`enseignant@demo.mazanza.cd`, `etudiant@demo.mazanza.cd`, `caisse@demo.mazanza.cd`… — mot de passe `Demo12345!`.

## Guides d’utilisation

- Vidéo explicative du système : `DOCUMENTS/Video_Universite_MAZANZA.mp4` (sous-titres `.srt` à côté).
- [Guide des opérations mobiles](mobile/GUIDE_OPERATIONS_MOBILE.md) : procédures étudiant et enseignant, connexion au backend et diagnostic.
