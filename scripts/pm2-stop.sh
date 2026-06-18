#!/usr/bin/env bash
# Stop TechSapo PM2-managed daemons.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

PM2_CMD="pm2"
if ! command -v pm2 &>/dev/null; then
  PM2_CMD="npx pm2"
fi

APPS="${PM2_STOP_APPS:-techsapo,codex-mcp,production-monitor}"

if ! $PM2_CMD jlist 2>/dev/null | grep -q '"name"'; then
  echo "No PM2 processes registered."
  exit 0
fi

echo "Stopping PM2 apps: ${APPS}"
IFS=',' read -ra NAMES <<< "$APPS"
for name in "${NAMES[@]}"; do
  $PM2_CMD stop "$name" 2>/dev/null || true
  $PM2_CMD delete "$name" 2>/dev/null || true
done

$PM2_CMD status || true
echo "PM2 daemons stopped."
