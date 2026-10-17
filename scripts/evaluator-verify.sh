#!/usr/bin/env bash
# Sobe Postgres (Compose), migrate + seed e roda npm run verify na raiz.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Starting db service..."
docker compose up -d db
bash scripts/wait-for-postgres.sh 60 1

echo "Migrate + seed..."
(
  cd backend
  npm run migrate:deploy
  npm run seed
)

echo "Running npm run verify..."
npm run verify

echo "OK: verify passed (lint, typecheck, tests, build)"
