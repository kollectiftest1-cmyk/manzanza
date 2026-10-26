#!/usr/bin/env bash
# Université MAZANZA — restauration d'une sauvegarde.
#   sudo bash deploy/restore.sh /var/backups/mazanza/db-AAAAMMJJ-HHMM.dump [/var/backups/mazanza/media-AAAAMMJJ-HHMM.tgz]
# La base actuelle est d'abord sauvegardée (pre-restore-*.dump), le service est arrêté pendant l'opération.
set -Eeuo pipefail
ENV_FILE="${ENV_FILE:-/etc/mazanza/mazanza.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mazanza}"
MEDIA_DIR="${MEDIA_DIR:-/var/lib/mazanza/media}"
APP=mazanza

[[ $EUID -eq 0 ]] || { echo "À lancer en root (sudo)." >&2; exit 1; }
DUMP="${1:-}"; MEDIA="${2:-}"
[[ -f "$DUMP" ]] || { echo "Usage : sudo bash deploy/restore.sh <fichier.dump> [media.tgz]" >&2; exit 1; }
[[ -z "$MEDIA" || -f "$MEDIA" ]] || { echo "Archive des médias introuvable : $MEDIA" >&2; exit 1; }
set -a
# shellcheck source=/dev/null
. "$ENV_FILE"
set +a
export PGPASSWORD="$DB_PASSWORD"
PG=(-h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "$DB_USER")

echo "Restauration de $(basename "$DUMP")${MEDIA:+ et $(basename "$MEDIA")} dans la base « $DB_NAME »."
echo "Les données actuelles seront REMPLACÉES (une sauvegarde de sécurité est faite avant)."
read -r -p "Tapez RESTAURER pour confirmer : " answer
[[ "$answer" == "RESTAURER" ]] || { echo "Annulé."; exit 1; }

install -d -m 0700 "$BACKUP_DIR"
SAFE="$BACKUP_DIR/pre-restore-$(date +%Y%m%d-%H%M%S).dump"
pg_dump "${PG[@]}" -Fc "$DB_NAME" > "$SAFE"; chmod 0600 "$SAFE"
echo "Sauvegarde de sécurité : $SAFE"

systemctl stop "$APP"
trap 'systemctl start "$APP"' EXIT
pg_restore "${PG[@]}" -d "$DB_NAME" --clean --if-exists --no-owner --role="$DB_USER" "$DUMP"
if [[ -n "$MEDIA" ]]; then
  OLD="${MEDIA_DIR}.avant-restauration-$(date +%Y%m%d-%H%M%S)"
  mv "$MEDIA_DIR" "$OLD"
  install -d -m 2750 -o "$APP" -g "$APP" "$MEDIA_DIR"
  tar -xzf "$MEDIA" -C "$MEDIA_DIR"
  chown -R "$APP:$APP" "$MEDIA_DIR"
  echo "Anciens fichiers conservés dans $OLD (à supprimer après vérification)."
fi
/usr/local/bin/${APP}-manage migrate --noinput
echo "Restauration terminée."
