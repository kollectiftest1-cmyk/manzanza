#!/usr/bin/env bash
# Université MAZANZA — sauvegarde : base PostgreSQL (pg_dump -Fc) + fichiers (médias), rotation.
# Lancée chaque nuit par le minuteur systemd « mazanza-backup.timer » (installé par deploy.sh).
# Manuellement :  sudo systemctl start mazanza-backup   (ou)   sudo bash deploy/backup.sh
set -Eeuo pipefail
ENV_FILE="${ENV_FILE:-/etc/mazanza/mazanza.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mazanza}"
MEDIA_DIR="${MEDIA_DIR:-/var/lib/mazanza/media}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"

[[ $EUID -eq 0 ]] || { echo "À lancer en root (sudo)." >&2; exit 1; }
[[ -r "$ENV_FILE" ]] || { echo "Configuration introuvable : $ENV_FILE" >&2; exit 1; }
set -a
# shellcheck source=/dev/null
. "$ENV_FILE"
set +a
install -d -m 0700 "$BACKUP_DIR"
umask 077
STAMP="$(date +%Y%m%d-%H%M)"

PGPASSWORD="$DB_PASSWORD" pg_dump -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "$DB_USER" -Fc "$DB_NAME" \
  > "$BACKUP_DIR/db-$STAMP.dump.part"
mv "$BACKUP_DIR/db-$STAMP.dump.part" "$BACKUP_DIR/db-$STAMP.dump"
tar -czf "$BACKUP_DIR/media-$STAMP.tgz" -C "$MEDIA_DIR" .

# Rotation (sauvegardes nocturnes et sauvegardes « pre-deploy » faites avant chaque migration)
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'media-*.tgz' -o -name 'pre-deploy-*.dump' \) \
  -mtime +"$KEEP_DAYS" -delete
echo "$(date -Iseconds) sauvegarde OK : db-$STAMP.dump ($(du -h "$BACKUP_DIR/db-$STAMP.dump" | cut -f1)), media-$STAMP.tgz ($(du -h "$BACKUP_DIR/media-$STAMP.tgz" | cut -f1))"
echo "Rappel : copiez régulièrement $BACKUP_DIR hors du serveur (autre machine ou stockage distant)."
