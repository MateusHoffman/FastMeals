#!/usr/bin/env bash
set -euo pipefail

HOST="${PGHOST:-127.0.0.1}"
PORT="${PGPORT:-5433}"
USER="${PGUSER:-fastmeals}"
DB="${PGDATABASE:-fastmeals}"
MAX_ATTEMPTS="${1:-60}"
SLEEP_SEC="${2:-1}"

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; then
      echo "Postgres OK: ${HOST}:${PORT}/${DB} (attempt $i)"
      exit 0
    fi
  elif docker compose ps db 2>/dev/null | grep -q healthy; then
    echo "Postgres OK via compose health (attempt $i)"
    exit 0
  fi
  echo "Waiting for Postgres ${HOST}:${PORT} ($i/$MAX_ATTEMPTS)..."
  sleep "$SLEEP_SEC"
done

echo "Timeout waiting for Postgres ${HOST}:${PORT}"
exit 1
