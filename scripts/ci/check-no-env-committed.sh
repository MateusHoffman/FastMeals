#!/usr/bin/env bash
# Falha se arquivos de ambiente reais estiverem versionados (permitido: *.env.example).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

is_allowed_env_path() {
  local path="$1"
  case "$path" in
    */.env.example|.env.example) return 0 ;;
    *) return 1 ;;
  esac
}

audit_git_index() {
  local fail=0

  while IFS= read -r -d '' path; do
    if is_allowed_env_path "$path"; then
      continue
    fi
    case "$path" in
      .env|*/.env|*.env.local|*.env.production|*.env.development|*.env.test|.env.*|*/.env.*)
        echo "ERROR: tracked env file (must not be committed): $path"
        fail=1
        ;;
    esac
  done < <(git -C "$ROOT" ls-files -z)

  for candidate in .env backend/.env frontend/.env desafio/.env; do
    if git -C "$ROOT" ls-files --error-unmatch "$candidate" >/dev/null 2>&1; then
      echo "ERROR: tracked env file: $candidate"
      fail=1
    fi
  done

  return "$fail"
}

audit_filesystem() {
  local fail=0
  local gitignore="$ROOT/.gitignore"

  if [[ ! -f "$gitignore" ]]; then
    echo "ERROR: missing .gitignore at repo root"
    return 1
  fi

  for pattern in '^\.env$' '^\.env\.\*' '!\.env\.example'; do
    if ! grep -qE "$pattern" "$gitignore"; then
      echo "ERROR: .gitignore must contain pattern: $pattern"
      fail=1
    fi
  done

  while IFS= read -r -d '' file; do
    if is_allowed_env_path "$file"; then
      continue
    fi
    rel="${file#"$ROOT"/}"
    case "$rel" in
      .env)
        echo "NOTE: $rel exists locally (ok — must stay untracked)"
        ;;
      *)
        echo "ERROR: env-like file in tree (remove or gitignore): $rel"
        fail=1
        ;;
    esac
  done < <(find "$ROOT" -name '.env*' -not -path '*/node_modules/*' -print0 2>/dev/null)

  return "$fail"
}

fail=0

if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  audit_git_index || fail=1
else
  echo "check-no-env-committed: no git repo — filesystem + .gitignore audit only"
fi

audit_filesystem || fail=1

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Use apenas .env.example no repositório. Copie localmente: cp .env.example .env"
  exit 1
fi

echo "OK: nenhum segredo .env indevido (git + filesystem)"
