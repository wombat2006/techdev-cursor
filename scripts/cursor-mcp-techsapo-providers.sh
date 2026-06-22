#!/usr/bin/env bash
# Portable Cursor MCP launcher — techsapo-providers (no absolute paths in mcp.json).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
export PATH="${HOME}/.nvm/versions/node/$(ls "${HOME}/.nvm/versions/node" 2>/dev/null | tail -1)/bin:${HOME}/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"

NODE="$(command -v node || true)"
SERVER="${REPO_ROOT}/dist/services/techsapo-providers-mcp-server.js"
if [[ -z "$NODE" ]]; then
  echo "error: node not found in PATH" >&2
  exit 1
fi
if [[ ! -f "$SERVER" ]]; then
  echo "error: ${SERVER} missing — run: npm run build" >&2
  exit 1
fi
exec "$NODE" "$SERVER"
