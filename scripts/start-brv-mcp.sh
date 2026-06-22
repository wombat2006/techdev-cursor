#!/usr/bin/env bash
# ByteRover CLI MCP stdio (successor to legacy @byterover/cipher).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f "$REPO_ROOT/.env.brv.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env.brv.local"
  set +a
fi

BRV="${REPO_ROOT}/node_modules/.bin/brv"
if [[ ! -x "$BRV" ]]; then
  echo "error: byterover-cli not installed — run: npm install" >&2
  exit 1
fi

exec "$BRV" mcp
