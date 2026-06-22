#!/usr/bin/env bash
# Install MCP prerequisites for Serena (uv/uvx) on WSL/Linux.
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

if command -v uv >/dev/null 2>&1 && command -v uvx >/dev/null 2>&1; then
  echo "ok: uv $(uv --version)"
  echo "ok: uvx at $(command -v uvx)"
  exit 0
fi

echo "Installing uv (provides uvx for Serena MCP)..."
if command -v pip3 >/dev/null 2>&1; then
  pip3 install --user uv
elif command -v curl >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
else
  echo "error: need pip3 or curl to install uv" >&2
  exit 1
fi

export PATH="${HOME}/.local/bin:${PATH}"
if ! command -v uv >/dev/null 2>&1; then
  echo "error: uv not on PATH after install — add ~/.local/bin to PATH" >&2
  exit 1
fi

echo "ok: uv $(uv --version)"
echo "ok: uvx at $(command -v uvx)"
echo ""
echo "Next:"
echo "  1. Optional: cp .env.brv.local.example → .env.brv.local (provider API keys)"
echo "  2. npm install && npm run build && npm run cursor-mcp:config"
echo "  3. brv providers connect <id>  # once per machine, for brv-query/curate"
echo "  4. Cursor Settings → MCP → Reload"
