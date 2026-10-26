#!/usr/bin/env bash
# =============================================================================
#  Université MAZANZA — déploiement classique (sans Docker) sur un VPS partagé
# =============================================================================
#  Installation ET mise à jour (le script est idempotent) :
#
#      git clone <dépôt> /opt/mazanza && cd /opt/mazanza
#      sudo bash deploy/deploy.sh --email admin@daianapilot.com
#
#  Mise à jour ultérieure (git pull + sauvegarde + migrations + build + rechargement) :
#
#      cd /opt/mazanza && sudo bash deploy/deploy.sh --pull
#
#  Cohabitation avec les autres applications du serveur :
#    * utilisateur système dédié « mazanza », données dans /var/lib/mazanza ;
#    * Gunicorn écoute sur un socket Unix (/run/mazanza/gunicorn.sock) : aucun port réservé ;
#    * nginx : UN seul fichier (mazanza.conf) pour UN seul domaine, jamais de default_server,
#      configuration testée (nginx -t) avant tout rechargement, ancienne version restaurée en cas d'erreur ;
#    * PostgreSQL : rôle et base dédiés, les autres bases ne sont jamais touchées ;
#    * Node.js privé dans /var/lib/mazanza/node si celui du système est absent ou trop ancien ;
#    * certificat Let's Encrypt obtenu en « webroot » : certbot ne modifie aucun fichier nginx.
#
#  Options :
#    --domain <nom>      domaine (défaut : mazanza.daianapilot.com)
#    --email <adresse>   adresse pour Let's Encrypt (alertes d'expiration)
#    --pull              git pull --ff-only avant de déployer
#    --no-ssl            ne pas demander de certificat (HTTP seulement)
#    --demo              charger l'université de démonstration (base vide uniquement)
#    --workers <n>       nombre de workers Gunicorn (défaut : 3)
#    -h, --help          afficher cette aide
# =============================================================================
set -Eeuo pipefail

# ----------------------------------------------------------------- paramètres
DOMAIN="${DOMAIN:-mazanza.daianapilot.com}"
SERVER_IP="${SERVER_IP:-72.60.66.248}"
APP="mazanza"
APP_USER="mazanza"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="/var/lib/${APP}"
VENV="${DATA_DIR}/venv"
NODE_DIR="${DATA_DIR}/node"
WWW_DIR="${DATA_DIR}/www"
MEDIA_DIR="${DATA_DIR}/media"
STATIC_DIR="${DATA_DIR}/static"
ACME_DIR="${DATA_DIR}/acme"
ENV_DIR="/etc/${APP}"
ENV_FILE="${ENV_DIR}/${APP}.env"
BACKUP_DIR="/var/backups/${APP}"
RUN_DIR="/run/${APP}"
SOCKET="${RUN_DIR}/gunicorn.sock"
NGINX_SNIPPET="/etc/nginx/snippets/${APP}-security.conf"
GUNICORN_WORKERS="${GUNICORN_WORKERS:-3}"
NODE_MAJOR=22
EMAIL="${LETSENCRYPT_EMAIL:-}"
DO_PULL=0; DO_SSL=1; DO_DEMO=0

# ------------------------------------------------------------------- affichage
if [[ -t 1 ]]; then B=$'\e[1m'; G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; C=$'\e[36m'; N=$'\e[0m'; else B='' G='' Y='' R='' C='' N=''; fi
step() { echo; echo "${B}${C}==> $*${N}"; }
ok()   { echo "  ${G}✔${N} $*"; }
warn() { echo "  ${Y}!${N} $*"; }
die()  { echo; echo "${R}${B}✖ $*${N}" >&2; exit 1; }
on_error() {
  local rc=$? line=$1
  echo; echo "${R}${B}✖ Échec à la ligne ${line} (code ${rc}) : ${BASH_COMMAND}${N}" >&2
  echo "  La configuration des autres sites n'a pas été modifiée." >&2
}
trap 'on_error $LINENO' ERR

usage() { sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --pull) DO_PULL=1; shift ;;
    --no-ssl) DO_SSL=0; shift ;;
    --demo) DO_DEMO=1; shift ;;
    --workers) GUNICORN_WORKERS="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) die "Option inconnue : $1 (voir --help)" ;;
  esac
done

as_app() { runuser -u "$APP_USER" -- "$@"; }
manage() { runuser -u "$APP_USER" -- env -i PATH="${VENV}/bin:/usr/bin:/bin" HOME="$DATA_DIR" \
           bash -c 'set -a; . "$0"; set +a; cd "$1/backend"; exec "$2/bin/python" manage.py "${@:3}"' \
           "$ENV_FILE" "$SRC_DIR" "$VENV" "$@"; }
pkg_installed() { dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q "install ok installed"; }
rand() { python3 -c "import secrets; print(secrets.token_urlsafe($1))"; }
version_ge() { [[ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" == "$2" ]]; }

# =========================================================== 1. vérifications
preflight() {
  step "Vérifications préalables"
  [[ $EUID -eq 0 ]] || die "Lancez le script avec sudo : sudo bash deploy/deploy.sh"
  command -v apt-get >/dev/null || die "Ce script cible Debian / Ubuntu (apt-get introuvable)."
  [[ -f "$SRC_DIR/backend/manage.py" && -f "$SRC_DIR/web/package.json" ]] || die "Dépôt incomplet dans $SRC_DIR."
  case "$SRC_DIR" in
    /root*|/home/*) die "Le dépôt est dans $SRC_DIR : l'utilisateur de service ne pourra pas le lire.
    Clonez-le plutôt dans /opt/mazanza :  git clone <dépôt> /opt/mazanza" ;;
  esac
  if grep -rqs $'\r' "$SRC_DIR/deploy/deploy.sh"; then
    die "Fins de ligne Windows (CRLF) détectées. Sur le serveur : git config core.autocrlf false && git checkout -- deploy"
  fi
  ok "Dépôt : $SRC_DIR"
  ok "Domaine : $DOMAIN"

  # Un autre serveur web (Apache, Caddy…) occupe-t-il déjà le port 80 ?
  if command -v ss >/dev/null; then
    local holder
    holder="$(ss -ltnpH 'sport = :80' 2>/dev/null | grep -o 'users:(("[^"]*' | head -n1 | sed 's/users:(("//' || true)"
    if [[ -n "$holder" && "$holder" != "nginx" ]]; then
      die "Le port 80 est utilisé par « $holder », pas par nginx. Ce script s'intègre à nginx uniquement :
    configurez votre frontal ($holder) pour relayer $DOMAIN vers le socket $SOCKET, ou contactez l'administrateur."
    fi
  fi
  # Le domaine est-il déjà déclaré par une autre configuration nginx ?
  if [[ -d /etc/nginx ]]; then
    local other
    other="$(grep -RlsE "server_name[^;]*[[:space:]]${DOMAIN//./\\.}([[:space:];]|$)" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null \
            | xargs -r -n1 readlink -f | grep -v "/${APP}.conf$" | sort -u || true)"
    [[ -z "$other" ]] || die "Le domaine $DOMAIN est déjà déclaré dans : $other
    Retirez-le de ce fichier (ou supprimez ce site) avant de relancer, pour éviter un conflit."
  fi
}

# ============================================================== 2. paquets
install_packages() {
  step "Paquets système (seuls les paquets manquants sont installés)"
  local need=(git curl ca-certificates xz-utils python3 python3-venv nginx postgresql)
  (( DO_SSL )) && need+=(certbot)
  local missing=()
  for p in "${need[@]}"; do pkg_installed "$p" || missing+=("$p"); done
  if (( ${#missing[@]} )); then
    warn "Installation : ${missing[*]}"
    DEBIAN_FRONTEND=noninteractive apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends "${missing[@]}" >/dev/null
  fi
  local pyv; pyv="$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
  version_ge "$pyv" "3.10" || die "Python $pyv trouvé : 3.10 minimum est requis (Django 4.2, Pillow 12)."
  systemctl enable --now postgresql >/dev/null 2>&1 || true
  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl is-active --quiet nginx || systemctl start nginx
  ok "Python $pyv, nginx $(nginx -v 2>&1 | sed 's#.*/##'), PostgreSQL $(runuser -u postgres -- psql -tAc 'show server_version' | cut -d' ' -f1)"
}

# ============================================== 3. utilisateur et dossiers
setup_user_dirs() {
  step "Utilisateur de service et dossiers"
  if ! id "$APP_USER" >/dev/null 2>&1; then
    useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin --user-group "$APP_USER"
    ok "Utilisateur système « $APP_USER » créé"
  fi
  NGINX_USER="$(awk '/^[[:space:]]*user[[:space:]]/ {gsub(";","",$2); print $2; exit}' /etc/nginx/nginx.conf 2>/dev/null || true)"
  NGINX_USER="${NGINX_USER:-www-data}"
  # nginx doit lire les fichiers publics et joindre le socket : on l'ajoute au groupe mazanza (ajout seulement).
  id -nG "$NGINX_USER" | tr ' ' '\n' | grep -qx "$APP_USER" || usermod -aG "$APP_USER" "$NGINX_USER"
  install -d -m 0755 -o root -g root "$DATA_DIR"
  install -d -m 2750 -o "$APP_USER" -g "$APP_USER" "$MEDIA_DIR" "$STATIC_DIR"
  install -d -m 0755 -o root -g root "$WWW_DIR" "$ACME_DIR"
  install -d -m 0750 -o root -g "$APP_USER" "$ENV_DIR"
  install -d -m 0700 -o root -g root "$BACKUP_DIR"
  as_app test -r "$SRC_DIR/backend/manage.py" || die "L'utilisateur $APP_USER ne peut pas lire $SRC_DIR (droits du dossier parent ?)."
  ok "Données : $DATA_DIR · configuration : $ENV_FILE · sauvegardes : $BACKUP_DIR"
}

# ================================================================ 4. PostgreSQL
pg_port() { runuser -u postgres -- psql -tAc "show port" | tr -d '[:space:]'; }
setup_env_and_db() {
  step "Base PostgreSQL dédiée et fichier de configuration"
  local port; port="$(pg_port)"
  local first=0
  if [[ ! -f "$ENV_FILE" ]]; then
    first=1
    cat > "$ENV_FILE" <<EOF
# Université MAZANZA — configuration de production (générée le $(date -Iseconds)).
# Ce fichier n'est jamais écrasé par deploy.sh : modifiez-le puis « sudo systemctl restart ${APP} ».
DEBUG=False
SECRET_KEY=$(rand 50)
ALLOWED_HOSTS=${DOMAIN},127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}
# HSTS est envoyé par nginx (une seule source) : laisser 0 ici.
SECURE_HSTS_SECONDS=0

DB_ENGINE=django.db.backends.postgresql
DB_NAME=${APP}
DB_USER=${APP}
DB_PASSWORD=$(rand 24)
DB_HOST=127.0.0.1
DB_PORT=${port}
DB_CONN_MAX_AGE=60

MEDIA_ROOT=${MEDIA_DIR}
STATIC_ROOT=${STATIC_DIR}
MEDIA_SIGNED_URL_MAX_AGE=7200
TRASH_RETENTION_DAYS=60

# Courriel (console = les messages sont écrits dans le journal, rien n'est envoyé)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=no-reply@${DOMAIN}

# Mobile Money : secret HMAC partagé avec l'agrégateur (vide = paiements rapprochés à la main)
MOBILE_MONEY_WEBHOOK_SECRET=
EOF
    ok "Configuration générée avec des secrets aléatoires : $ENV_FILE"
  else
    ok "Configuration existante conservée : $ENV_FILE"
  fi
  chown root:"$APP_USER" "$ENV_FILE"; chmod 0640 "$ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  . "$ENV_FILE"
  set +a
  [[ "${DB_PORT:-$port}" == "$port" ]] || warn "DB_PORT=${DB_PORT} dans $ENV_FILE alors que PostgreSQL écoute sur $port."

  local q_user q_pass
  q_user="$DB_USER"; q_pass="${DB_PASSWORD//\'/\'\'}"
  if runuser -u postgres -- psql -tAc "select 1 from pg_roles where rolname='${q_user}'" | grep -q 1; then
    runuser -u postgres -- psql -q -c "alter role \"${q_user}\" with login password '${q_pass}'" >/dev/null
  else
    runuser -u postgres -- psql -q -c "create role \"${q_user}\" with login password '${q_pass}'" >/dev/null
    ok "Rôle PostgreSQL « ${q_user} » créé"
  fi
  if ! runuser -u postgres -- psql -tAc "select 1 from pg_database where datname='${DB_NAME}'" | grep -q 1; then
    runuser -u postgres -- psql -q -c "create database \"${DB_NAME}\" owner \"${q_user}\" encoding 'UTF8' template template0 lc_collate 'C.UTF-8' lc_ctype 'C.UTF-8'" >/dev/null 2>&1 \
      || runuser -u postgres -- psql -q -c "create database \"${DB_NAME}\" owner \"${q_user}\" encoding 'UTF8' template template0" >/dev/null
    ok "Base « ${DB_NAME} » créée"
  fi
  PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -p "$port" -U "$DB_USER" -d "$DB_NAME" -tAc 'select 1' >/dev/null \
    || die "Connexion à PostgreSQL impossible avec $DB_USER@127.0.0.1:$port (vérifiez pg_hba.conf : méthode scram/md5 pour host 127.0.0.1)."
  ok "Connexion PostgreSQL vérifiée (127.0.0.1:$port, base ${DB_NAME})"
  FIRST_INSTALL=$first
}

# ================================================================= 5. code
update_code() {
  (( DO_PULL )) || return 0
  step "Récupération du code (git pull)"
  git config --global --get-all safe.directory | grep -qx "$SRC_DIR" || git config --global --add safe.directory "$SRC_DIR"
  git -C "$SRC_DIR" pull --ff-only
  ok "Version : $(git -C "$SRC_DIR" log -1 --format='%h %s (%cr)')"
}

# ============================================================== 6. backend
setup_backend() {
  step "Backend Django (environnement Python isolé)"
  [[ -x "$VENV/bin/python" ]] || python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip wheel
  "$VENV/bin/pip" install -q -r "$SRC_DIR/backend/requirements.txt"
  ok "Dépendances installées dans $VENV"
  # Commande d'administration pratique : sudo mazanza-manage <commande>
  cat > /usr/local/bin/${APP}-manage <<EOF
#!/usr/bin/env bash
# Exécute une commande Django de l'Université MAZANZA avec la configuration de production.
exec runuser -u ${APP_USER} -- env -i PATH="${VENV}/bin:/usr/bin:/bin" HOME="${DATA_DIR}" \\
  bash -c 'set -a; . "${ENV_FILE}"; set +a; cd "${SRC_DIR}/backend"; exec "${VENV}/bin/python" manage.py "\$@"' _ "\$@"
EOF
  chmod 0755 /usr/local/bin/${APP}-manage
}

backup_before_migrate() {
  (( FIRST_INSTALL )) && return 0
  local n; n="$(PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
       "select count(*) from information_schema.tables where table_schema='public'")"
  (( n > 0 )) || return 0
  step "Sauvegarde de sécurité avant migration"
  local f; f="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).dump"
  PGPASSWORD="$DB_PASSWORD" pg_dump -h 127.0.0.1 -p "$DB_PORT" -U "$DB_USER" -Fc "$DB_NAME" > "$f"
  chmod 0600 "$f"
  ok "Base sauvegardée : $f"
}

migrate_backend() {
  step "Migrations et fichiers statiques"
  manage migrate --noinput -v 1 | grep -E "Applying|No migrations" | sed 's/^/    /' || true
  manage collectstatic --noinput -v 0
  manage check --deploy --fail-level ERROR >/tmp/${APP}-check.log 2>&1 && ok "Contrôles de sécurité Django : OK" \
    || { cat /tmp/${APP}-check.log >&2; die "Contrôles Django en erreur."; }
  if (( DO_DEMO )); then
    if [[ "$(manage shell -c 'from apps.users.models import User; print(User.objects.exists())' | tail -n1)" == "True" ]]; then
      warn "--demo ignoré : la base contient déjà des utilisateurs."
    else
      manage seed_demo && ok "Université de démonstration chargée (mot de passe des comptes : Demo12345!)"
    fi
  fi
}

# ============================================================= 7. frontend
ensure_node() {
  local v=""
  if command -v node >/dev/null; then v="$(node -v | tr -d v)"; fi
  if [[ -n "$v" ]] && version_ge "$v" "20.19.0" && command -v npm >/dev/null; then
    NODE_BIN="$(dirname "$(command -v node)")"; ok "Node.js $v du système"; return
  fi
  if [[ ! -x "$NODE_DIR/bin/node" ]] || ! version_ge "$("$NODE_DIR/bin/node" -v | tr -d v)" "20.19.0"; then
    local arch; case "$(uname -m)" in x86_64) arch=x64 ;; aarch64|arm64) arch=arm64 ;; *) die "Architecture $(uname -m) non prise en charge pour Node.js." ;; esac
    local base="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x" tmp; tmp="$(mktemp -d)"
    local file; file="$(curl -fsSL "$base/SHASUMS256.txt" | awk -v a="linux-${arch}.tar.xz" '$2 ~ a"$" {print $2; exit}')"
    [[ -n "$file" ]] || die "Impossible de déterminer la version de Node.js à télécharger."
    curl -fsSL "$base/$file" -o "$tmp/$file"
    (cd "$tmp" && curl -fsSL "$base/SHASUMS256.txt" | grep " $file\$" | sha256sum -c - >/dev/null) || die "Somme de contrôle Node.js invalide."
    rm -rf "$NODE_DIR"; install -d "$NODE_DIR"
    tar -xJf "$tmp/$file" -C "$NODE_DIR" --strip-components=1; rm -rf "$tmp"
    ok "Node.js privé installé : $("$NODE_DIR/bin/node" -v) (le Node du système n'est pas modifié)"
  fi
  NODE_BIN="$NODE_DIR/bin"
}

build_frontend() {
  step "Frontend React (build Vite)"
  ensure_node
  local web="$SRC_DIR/web" out="${WWW_DIR}.new"
  rm -rf "$out"
  (cd "$web" && PATH="$NODE_BIN:$PATH" npm ci --no-audit --no-fund --loglevel=error)
  (cd "$web" && PATH="$NODE_BIN:$PATH" VITE_API_URL=/api npx vite build --outDir "$out" --emptyOutDir --logLevel warn)
  [[ -f "$out/index.html" ]] || die "Le build du frontend n'a pas produit index.html."
  # Bascule quasi atomique : l'ancienne version reste servie jusqu'au dernier moment.
  rm -rf "${WWW_DIR}.old"; [[ -d "$WWW_DIR" ]] && mv "$WWW_DIR" "${WWW_DIR}.old"
  mv "$out" "$WWW_DIR"; rm -rf "${WWW_DIR}.old"
  chmod -R a+rX "$WWW_DIR"
  ok "Application web publiée dans $WWW_DIR"
}

# ============================================================== 8. systemd
setup_systemd() {
  step "Services systemd (application, purge de la corbeille, sauvegardes)"
  cat > /etc/systemd/system/${APP}.service <<EOF
[Unit]
Description=Université MAZANZA — API Django (Gunicorn)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
NotifyAccess=main
User=${APP_USER}
Group=${APP_USER}
UMask=0027
EnvironmentFile=${ENV_FILE}
WorkingDirectory=${SRC_DIR}/backend
RuntimeDirectory=${APP}
RuntimeDirectoryMode=0750
ExecStart=${VENV}/bin/gunicorn config.wsgi:application \\
    --bind unix:${SOCKET} --umask 0007 \\
    --workers ${GUNICORN_WORKERS} --timeout 120 --graceful-timeout 30 \\
    --max-requests 1000 --max-requests-jitter 100 \\
    --access-logfile - --error-logfile -
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
Restart=on-failure
RestartSec=5
# Durcissement : le service ne peut écrire que dans ses propres dossiers.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${MEDIA_DIR} ${STATIC_DIR}
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictSUIDSGID=true

[Install]
WantedBy=multi-user.target
EOF
  cat > /etc/systemd/system/${APP}-purge.service <<EOF
[Unit]
Description=Université MAZANZA — purge de la corbeille (rétention configurable)
After=postgresql.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/${APP}-manage purge_trash
EOF
  cat > /etc/systemd/system/${APP}-purge.timer <<EOF
[Unit]
Description=Purge quotidienne de la corbeille MAZANZA

[Timer]
OnCalendar=*-*-* 03:15:00
RandomizedDelaySec=10min
Persistent=true

[Install]
WantedBy=timers.target
EOF
  cat > /etc/systemd/system/${APP}-backup.service <<EOF
[Unit]
Description=Université MAZANZA — sauvegarde (base + fichiers)
After=postgresql.service

[Service]
Type=oneshot
Environment=BACKUP_DIR=${BACKUP_DIR} ENV_FILE=${ENV_FILE} MEDIA_DIR=${MEDIA_DIR}
ExecStart=/bin/bash ${SRC_DIR}/deploy/backup.sh
EOF
  cat > /etc/systemd/system/${APP}-backup.timer <<EOF
[Unit]
Description=Sauvegarde quotidienne MAZANZA

[Timer]
OnCalendar=*-*-* 02:30:00
RandomizedDelaySec=15min
Persistent=true

[Install]
WantedBy=timers.target
EOF
  systemctl daemon-reload
  systemctl enable --quiet ${APP}.service ${APP}-purge.timer ${APP}-backup.timer
  systemctl start ${APP}-purge.timer ${APP}-backup.timer
  if systemctl is-active --quiet ${APP}; then
    systemctl reload ${APP} && ok "Gunicorn rechargé à chaud (aucune coupure)"
  else
    systemctl start ${APP} && ok "Gunicorn démarré"
  fi
  for _ in $(seq 1 20); do [[ -S "$SOCKET" ]] && break; sleep 0.5; done
  [[ -S "$SOCKET" ]] || die "Le socket $SOCKET n'est pas apparu : journalctl -u ${APP} -n 80"
}

# ================================================================= 9. nginx
write_nginx() {
  local mode="$1" conf
  if [[ -d /etc/nginx/sites-available ]]; then conf="/etc/nginx/sites-available/${APP}.conf"; else conf="/etc/nginx/conf.d/${APP}.conf"; fi
  install -d /etc/nginx/snippets
  cat > "$NGINX_SNIPPET" <<'EOF'
# En-têtes de sécurité de l'Université MAZANZA (inclus dans chaque bloc qui ajoute des en-têtes)
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
EOF
  [[ "$mode" == "https" ]] && echo 'add_header Strict-Transport-Security "max-age=31536000" always;' >> "$NGINX_SNIPPET"
  local private='inscriptions|contracts|deliberations|documents|receipts|assignments/submissions|quiz/answers|chat_attachments'
  local app_locations
  app_locations="$(cat <<EOF
    client_max_body_size 35m;
    access_log /var/log/nginx/${APP}.access.log;
    error_log  /var/log/nginx/${APP}.error.log warn;
    include ${NGINX_SNIPPET};

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain;

    root ${WWW_DIR};
    index index.html;

    # API et administration Django
    location /api/ {
        proxy_pass http://${APP}_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_redirect off;
    }
    location /admin/ {
        proxy_pass http://${APP}_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /static/ {
        alias ${STATIC_DIR}/;
        expires 30d;
        access_log off;
    }
    # Fichiers PRIVÉS : jamais servis par nginx, uniquement par Django après contrôle du lien signé
    location ~ ^/media/(${private})/ {
        proxy_pass http://${APP}_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    # Fichiers publics (avatars, supports de cours, couvertures)
    location /media/ {
        alias ${MEDIA_DIR}/;
        expires 1d;
    }
    # Fichiers du build Vite : noms versionnés, cache long
    location /assets/ {
        expires 1y;
        include ${NGINX_SNIPPET};
        add_header Cache-Control "public, immutable" always;
        try_files \$uri =404;
    }
    location = /index.html {
        include ${NGINX_SNIPPET};
        add_header Cache-Control "no-cache" always;
    }
    # Application monopage (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
EOF
)"
  local backup="" l80="    listen 80;" l443="    listen 443 ssl http2;"
  # IPv6 seulement si l'hôte le prend en charge (sinon nginx -t échouerait)
  if [[ -f /proc/net/if_inet6 ]]; then l80+=$'\n    listen [::]:80;'; l443+=$'\n    listen [::]:443 ssl http2;'; fi
  [[ -f "$conf" ]] && { backup="$(mktemp)"; cp "$conf" "$backup"; }
  {
    echo "# Université MAZANZA — ${DOMAIN}"
    echo "# Fichier GÉRÉ par deploy/deploy.sh : il est régénéré à chaque déploiement."
    echo "upstream ${APP}_app { server unix:${SOCKET} fail_timeout=0; }"
    echo
    if [[ "$mode" == "https" ]]; then
      cat <<EOF
server {
${l80}
    server_name ${DOMAIN};
    location ^~ /.well-known/acme-challenge/ { root ${ACME_DIR}; default_type text/plain; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
${l443}
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
EOF
      if [[ -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
        echo "    include /etc/letsencrypt/options-ssl-nginx.conf;"
      else
        echo "    ssl_protocols TLSv1.2 TLSv1.3;"
        echo "    ssl_session_cache shared:${APP}_ssl:10m;"
        echo "    ssl_session_timeout 1d;"
      fi
      [[ -f /etc/letsencrypt/ssl-dhparams.pem ]] && echo "    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
      echo "$app_locations"
      echo "}"
    else
      cat <<EOF
server {
${l80}
    server_name ${DOMAIN};
    location ^~ /.well-known/acme-challenge/ { root ${ACME_DIR}; default_type text/plain; }
EOF
      echo "$app_locations"
      echo "}"
    fi
  } > "$conf"
  if [[ -d /etc/nginx/sites-enabled ]]; then ln -sfn "$conf" "/etc/nginx/sites-enabled/${APP}.conf"; fi
  if ! nginx -t >/tmp/${APP}-nginx-test.log 2>&1; then
    if [[ -n "$backup" ]]; then cp "$backup" "$conf"; else rm -f "$conf" "/etc/nginx/sites-enabled/${APP}.conf"; fi
    cat /tmp/${APP}-nginx-test.log >&2
    die "Configuration nginx invalide : l'ancienne version a été restaurée, nginx n'a pas été rechargé."
  fi
  systemctl reload nginx
  sleep 2   # le rechargement de nginx est asynchrone
  [[ -n "$backup" ]] && rm -f "$backup"
  ok "nginx ($mode) : $conf"
}

setup_nginx_and_tls() {
  step "nginx et certificat HTTPS"
  local cert="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  if [[ -f "$cert" ]]; then write_nginx https; return; fi
  write_nginx http
  (( DO_SSL )) || { warn "HTTPS désactivé (--no-ssl)"; return; }
  local resolved; resolved="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1 {print $1}' || true)"
  if [[ "$resolved" != "$SERVER_IP" ]]; then
    warn "$DOMAIN pointe vers « ${resolved:-rien} » au lieu de $SERVER_IP : certificat reporté."
    warn "Créez l'enregistrement DNS A  ${DOMAIN} → ${SERVER_IP}, puis relancez le script."
    return
  fi
  local mail=(--register-unsafely-without-email)
  [[ -n "$EMAIL" ]] && mail=(--email "$EMAIL")
  if certbot certonly --webroot -w "$ACME_DIR" -d "$DOMAIN" --non-interactive --agree-tos "${mail[@]}" \
       --deploy-hook "systemctl reload nginx" >/tmp/${APP}-certbot.log 2>&1; then
    ok "Certificat Let's Encrypt obtenu (renouvellement automatique par le minuteur certbot)"
    write_nginx https
  else
    tail -n 15 /tmp/${APP}-certbot.log >&2
    warn "Échec de certbot : le site reste en HTTP. Corrigez puis relancez le script."
  fi
}

firewall() {
  if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    ufw status | grep -qE '^(80|80/tcp|Nginx Full|Nginx HTTP)[[:space:]]' || ufw allow 80/tcp >/dev/null
    ufw status | grep -qE '^(443|443/tcp|Nginx Full|Nginx HTTPS)[[:space:]]' || ufw allow 443/tcp >/dev/null
    ok "Pare-feu UFW : ports 80 et 443 ouverts (aucune autre règle modifiée)"
  fi
}

# ============================================================ 10. contrôles
health() {
  step "Contrôle de bon fonctionnement"
  local scheme=http; [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]] && scheme=https
  local code="" page=""
  for _ in $(seq 1 15); do
    page="$(curl -sk --noproxy '*' --resolve "${DOMAIN}:443:127.0.0.1" --resolve "${DOMAIN}:80:127.0.0.1" "${scheme}://${DOMAIN}/" || true)"
    code="$(curl -sk --noproxy '*' -o /dev/null -w '%{http_code}' --resolve "${DOMAIN}:443:127.0.0.1" --resolve "${DOMAIN}:80:127.0.0.1" "${scheme}://${DOMAIN}/api/" || true)"
    [[ "$page" == *'id="root"'* && "$code" =~ ^(401|403)$ ]] && break
    sleep 1
  done
  [[ "$page" == *'id="root"'* ]] && ok "Application web : ${scheme}://${DOMAIN}/" || warn "Application web : réponse inattendue (vérifiez /var/log/nginx/${APP}.error.log)"
  [[ "$code" =~ ^(401|403)$ ]] && ok "API : répond et exige l'authentification ($code)" || warn "API : code inattendu $code (journalctl -u ${APP} -n 80)"
  if [[ "$(manage shell -c 'from apps.users.models import User; print(User.objects.filter(role="pdg", is_active=True).exists())' | tail -n1)" != "True" ]]; then
    echo
    warn "Aucun compte PDG : créez l'administrateur général avec"
    echo "      sudo ${APP}-manage createsuperuser"
  fi
}

summary() {
  local scheme=http; [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]] && scheme=https
  echo
  echo "${G}${B}✔ Université MAZANZA déployée : ${scheme}://${DOMAIN}${N}"
  cat <<EOF

  Configuration     ${ENV_FILE}   (puis : sudo systemctl restart ${APP})
  Journaux          sudo journalctl -u ${APP} -f      ·  /var/log/nginx/${APP}.*.log
  Commandes Django  sudo ${APP}-manage <commande>     (ex. createsuperuser, purge_trash)
  Sauvegardes       ${BACKUP_DIR}  (chaque nuit à 02:30, 30 jours)  ·  sudo systemctl start ${APP}-backup
  Restauration      sudo bash ${SRC_DIR}/deploy/restore.sh <fichier.dump> [media.tgz]
  Mise à jour       cd ${SRC_DIR} && sudo bash deploy/deploy.sh --pull
  Application mobile  EXPO_PUBLIC_API_URL=${scheme}://${DOMAIN}/api
EOF
}

# =================================================================== main
main() {
  cd /
  echo "${B}Université MAZANZA — déploiement sur $(hostname) ($(date '+%d/%m/%Y %H:%M'))${N}"
  preflight
  install_packages
  setup_user_dirs
  update_code
  setup_env_and_db
  setup_backend
  backup_before_migrate
  migrate_backend
  build_frontend
  setup_systemd
  setup_nginx_and_tls
  firewall
  health
  summary
}
main
