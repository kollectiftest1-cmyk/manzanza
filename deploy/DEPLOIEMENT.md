# Mise en production — Université MAZANZA

Déploiement **classique** (sans Docker) sur un VPS Debian / Ubuntu **partagé avec d'autres
applications** : `mazanza.daianapilot.com` sur `72.60.66.248`.

## Architecture

```
Navigateur ──HTTPS──▶ nginx (déjà présent sur le VPS, un fichier dédié : mazanza.conf)
                        │  /                 → application React (fichiers du build Vite)
                        │  /api, /admin      → Gunicorn (socket Unix /run/mazanza/gunicorn.sock)
                        │  /media/<public>   → servi directement par nginx
                        │  /media/<privé>    → Django uniquement (lien signé obligatoire)
                        ▼
                 Gunicorn + Django (utilisateur système « mazanza », service systemd)
                        │
                        ▼
                 PostgreSQL (rôle et base « mazanza » dédiés)
```

| Élément | Emplacement |
|---|---|
| Code (lecture seule pour l'application) | `/opt/mazanza` (clone git) |
| Configuration et secrets | `/etc/mazanza/mazanza.env` (jamais écrasé) |
| Données : médias, statiques, build web, environnement Python | `/var/lib/mazanza/` |
| Sauvegardes | `/var/backups/mazanza/` |
| Site nginx | `/etc/nginx/sites-available/mazanza.conf` (régénéré à chaque déploiement) |
| Services | `mazanza.service`, `mazanza-backup.timer` (02:30), `mazanza-purge.timer` (03:15) |

### Cohabitation avec les autres applications

- Aucun port réservé : Gunicorn écoute sur un socket Unix.
- nginx : un seul fichier pour un seul domaine, sans `default_server` ; `nginx -t` est exécuté
  avant chaque rechargement et l'ancienne version est restaurée en cas d'erreur. Le script
  s'arrête si le domaine est déjà déclaré ailleurs, ou si le port 80 est tenu par un autre
  serveur web (Apache, Caddy…).
- PostgreSQL : seuls le rôle et la base `mazanza` sont créés ; les autres bases ne sont pas touchées.
- Node.js : si celui du système est absent ou antérieur à 20.19, un Node privé est installé dans
  `/var/lib/mazanza/node` ; celui du système n'est jamais modifié.
- Certificat : `certbot certonly --webroot`, qui ne modifie aucune configuration nginx.
- Pare-feu : si UFW est actif, seuls 80/443 sont ouverts (aucune règle existante modifiée).

## Prérequis

1. **DNS** : enregistrement `A  mazanza.daianapilot.com → 72.60.66.248` (et `AAAA` si le VPS a de l'IPv6).
2. Accès `sudo` au VPS ; Debian 11+ / Ubuntu 22.04+ (Python 3.10 minimum).

## Installation

```bash
sudo git clone <url-du-dépôt> /opt/mazanza
cd /opt/mazanza
sudo bash deploy/deploy.sh --email admin@daianapilot.com
sudo mazanza-manage createsuperuser        # compte PDG (administrateur général)
```

Le script installe uniquement les paquets manquants (nginx, PostgreSQL, python3-venv, certbot…),
crée l'utilisateur et la base, génère `/etc/mazanza/mazanza.env` avec des secrets aléatoires,
installe le backend, applique les migrations, construit le frontend, configure systemd et nginx,
demande le certificat HTTPS, puis vérifie que le site et l'API répondent.

Si le DNS ne pointe pas encore vers le VPS, le site est publié en HTTP et le script indique quoi
faire : relancez-le une fois le DNS propagé pour obtenir le certificat.

Pour un environnement de **formation** (base vide uniquement) : `--demo` charge l'université de
démonstration (comptes `<rôle>@demo.mazanza.cd`, mot de passe `Demo12345!`). Ne pas l'utiliser en production.

## Mise à jour

```bash
cd /opt/mazanza && sudo bash deploy/deploy.sh --pull
```

`git pull --ff-only`, sauvegarde de la base (`pre-deploy-*.dump`), migrations, nouveau build web
(basculé d'un bloc), puis rechargement **à chaud** de Gunicorn : aucune coupure de service.

## Exploitation

| Tâche | Commande |
|---|---|
| État du service | `sudo systemctl status mazanza` |
| Journaux de l'application | `sudo journalctl -u mazanza -f` |
| Journaux nginx | `/var/log/nginx/mazanza.access.log`, `mazanza.error.log` |
| Modifier la configuration | éditer `/etc/mazanza/mazanza.env` puis `sudo systemctl restart mazanza` |
| Commande Django | `sudo mazanza-manage <commande>` (ex. `createsuperuser`, `purge_trash`, `changepassword`) |
| Sauvegarde immédiate | `sudo systemctl start mazanza-backup` |
| Restauration | `sudo bash deploy/restore.sh /var/backups/mazanza/db-….dump [media-….tgz]` |
| Minuteurs | `systemctl list-timers 'mazanza*'` |

Sauvegardes : base au format `pg_dump -Fc` et archive des médias, chaque nuit, rotation 30 jours
(`BACKUP_KEEP_DAYS`). **Copiez `/var/backups/mazanza` hors du VPS** et testez une restauration
chaque trimestre. La restauration sauvegarde d'abord la base actuelle (`pre-restore-*.dump`).

## Paramétrage initial (dans l'application)

1. **PDG → Paramètres** : nom de l'institution, ville, recteur, SGA ; seuil de frais échus pour
   les examens ; résultats réservés aux étudiants en règle ; frais de dossier à l'admission.
2. **SGA** : année académique courante, sections / filières / groupes, **UE** et rattachement
   des cours, configuration des notes (catégories, pondérations, seuils, assiduité).
3. **SGAD** : **barèmes de frais** de l'année (montant, devise USD/CDF, échéance) ; fiches
   employés et paramètres de paie (taux à valider avec le comptable).
4. **Affectations** : chefs de filière / section, commission d'admission — datées.

## Sécurité — liste de contrôle

- [ ] `DEBUG=False` et `SECRET_KEY` unique (générés automatiquement dans `mazanza.env`).
- [ ] HTTPS actif ; HSTS est envoyé par nginx (une seule source).
- [ ] Courriel SMTP renseigné dans `mazanza.env` (sinon les messages restent dans le journal).
- [ ] Les dossiers privés (`inscriptions/`, `contracts/`, `deliberations/`, `documents/`,
      `receipts/`, copies et réponses d'étudiants, pièces jointes du chat) ne sont jamais
      servis par nginx : uniquement par lien signé valable `MEDIA_SIGNED_URL_MAX_AGE` secondes.
- [ ] Mobile Money : `MOBILE_MONEY_WEBHOOK_SECRET` partagé avec l'agrégateur ; URL de rappel
      `https://mazanza.daianapilot.com/api/payments/mobile-money/callback/` (HMAC-SHA256 du
      corps dans `X-Signature`). Sans secret, les paiements restent « en attente » et sont
      rapprochés à la main par la caisse.
- [ ] Pas de comptes de démonstration en production ; superutilisateur nominatif.
- [ ] Copie des sauvegardes hors du VPS.

## Application mobile (Expo)

Définir `EXPO_PUBLIC_API_URL=https://mazanza.daianapilot.com/api` avant `eas build`.

## Docker (alternative non utilisée sur ce VPS)

`docker-compose.yml`, `backend/Dockerfile` et `web/Dockerfile` restent disponibles pour un
serveur dédié ; les scripts `backup.sh` / `restore.sh` de ce dossier visent l'installation classique.
