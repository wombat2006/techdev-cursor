#!/usr/bin/env bash
# Smoke-test glossary-knowledge MCP stub (NullProvider → unknown). Read-only on platform clone.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM_ROOT="${TERM_PREP_PLATFORM_ROOT:-$REPO_ROOT/../term-prep-platform}"
PYTHON="${PLATFORM_ROOT}/.venv/bin/python"
MCP_DIR="${PLATFORM_ROOT}/mcp/glossary-knowledge"

if [[ ! -x "$PYTHON" ]]; then
  echo "error: platform venv not found: $PYTHON" >&2
  exit 1
fi

cd "$MCP_DIR"
export PYTHONPATH=.
exec "$PYTHON" -c "
from glossary_knowledge_mcp.server import classify_term, list_providers
print(list_providers())
r = classify_term('Wall-Bounce', domain='devassist-platform')
assert r['label'] == 'unknown' and r['provider_id'] == 'null', r
print('OK:', r)
"
