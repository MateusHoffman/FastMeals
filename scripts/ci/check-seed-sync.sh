#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CANON="$ROOT/seed/data.json"
MIRROR="$ROOT/desafio/seed/data.json"

if [[ ! -f "$CANON" ]]; then
  echo "ERROR: seed canônico ausente: seed/data.json"
  exit 1
fi

if [[ ! -f "$MIRROR" ]]; then
  echo "ERROR: espelho ausente: desafio/seed/data.json"
  exit 1
fi

if ! diff -q "$CANON" "$MIRROR" >/dev/null; then
  echo "ERROR: seed/data.json e desafio/seed/data.json divergem."
  echo "  Edite seed/data.json (canônico) e copie: cp seed/data.json desafio/seed/data.json"
  exit 1
fi

echo "OK: seed canônico e desafio/seed/data.json idênticos"
