#!/usr/bin/env bash
# Portable Cursor MCP launcher — Serena (no absolute paths in mcp.json).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
export PATH="${HOME}/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"

UVX="$(command -v uvx || true)"
if [[ -z "$UVX" ]]; then
  echo "error: uvx not found — run: npm run setup-mcp-prereqs" >&2
  exit 1
fi
exec "$UVX" --from git+https://github.com/oraios/serena serena start-mcp-server \
  --transport stdio \
  --context ide \
  --project "$REPO_ROOT"
