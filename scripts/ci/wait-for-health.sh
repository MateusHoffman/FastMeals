#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://127.0.0.1:3000/api/health}"
MAX_ATTEMPTS="${2:-90}"
SLEEP_SEC="${3:-5}"

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  if curl -sf "$URL" >/dev/null; then
    echo "Health OK: $URL (attempt $i)"
    exit 0
  fi
  echo "Waiting for $URL ($i/$MAX_ATTEMPTS)..."
  sleep "$SLEEP_SEC"
done

echo "Timeout waiting for $URL"
exit 1
