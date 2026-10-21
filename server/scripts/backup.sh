#!/usr/bin/env bash
#
# backup.sh — Backup de la base de datos SQLite de Osito a la carta.
#
# Uso:
#   ./backup.sh                      # usa DATABASE_URL=.env o ./osito.db
#   DATABASE_URL=/ruta/a/db ./backup.sh
#
# Características:
# - Usa `sqlite3 .backup` para consistencia (no `cp` — ver gotcha en MEMORY.md).
# - Guarda backups en backups/osito-YYYY-MM-DD.db
# - Mantiene los 30 backups más recientes, borra los antiguos.
# - Fiable para crontab: 0 3 * * * /var/www/osito/server/scripts/backup.sh
#
# Requisitos: sqlite3 CLI instalado (`apt install sqlite3`).
#
set -euo pipefail

BACKUP_DIR="backups"
KEEP_DAYS=30

# Resolver ruta de la base de datos (.env → DATABASE_URL → default)
DB_PATH="${DATABASE_URL:-./osito.db}"

# Resolucion robusta: si la DB es relativa, relativa al directorio del script
# (no al cwd del crontab). Asi el backup funciona desde cualquier directorio.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "$DB_PATH" in
  /*) : ;;
  *)  DB_PATH="$SCRIPT_DIR/../$DB_PATH" ;;
esac

# Normalizar y verificar que la base existe
DB_PATH="$(readlink -f "$DB_PATH" 2>/dev/null || echo "$DB_PATH")"

if [ ! -f "$DB_PATH" ]; then
  echo "[backup] ERROR: Base de datos no encontrada: $DB_PATH" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "[backup] ERROR: sqlite3 CLI no instalado. Instalar con: sudo apt install sqlite3" >&2
  exit 1
fi

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y-%m-%d)"
BACKUP_FILE="$BACKUP_DIR/osito-${TIMESTAMP}.db"

echo "[backup] Iniciando backup de $DB_PATH → $BACKUP_FILE"

# Usar .backup (consistente, no copia cruda)
sqlite3 "$DB_PATH" ".backup \"$BACKUP_FILE\""

echo "[backup] Backup completado: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Limpiar backups antiguos (mantener últimos 30 días)
echo "[backup] Limpiando backups antiguos (más de $KEEP_DAYS días)..."

find "$BACKUP_DIR" -name 'osito-*.db' -type f -mtime +$KEEP_DAYS -delete

# Listar backups restantes
REMAINING=$(find "$BACKUP_DIR" -name 'osito-*.db' -type f | wc -l)
echo "[backup] Backups restantes: $REMAINING"

echo "[backup] OK"
