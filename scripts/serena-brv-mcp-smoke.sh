#!/usr/bin/env bash
# Smoke-test Serena + ByteRover (brv) MCP launchers (stdio init; does not call tools).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.local/bin:${PATH}"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

command -v uvx >/dev/null 2>&1 || fail "uvx not found — run: npm run setup-mcp-prereqs"

echo "=== Serena (8s init probe) ==="
timeout 8 uvx --from git+https://github.com/oraios/serena serena start-mcp-server \
  --transport stdio \
  --context claude-code \
  --project "$REPO_ROOT" </dev/null 2>&1 | head -5 || true
pass "Serena launcher invoked (see log above for errors)"

echo ""
echo "=== ByteRover brv mcp (8s init probe) ==="
if [[ ! -x "$REPO_ROOT/node_modules/.bin/brv" ]]; then
  fail "byterover-cli not installed — run: npm install"
fi
timeout 8 "$REPO_ROOT/scripts/start-brv-mcp.sh" </dev/null 2>&1 | head -10 || true
pass "brv mcp launcher invoked"

echo ""
echo "Provider setup (once per machine): brv providers list && brv providers connect <id>"
