#!/usr/bin/env bash
# Start all PM2 apps including production-monitor.

set -euo pipefail
export PM2_ONLY="techsapo,codex-mcp,production-monitor"
exec "$(dirname "$0")/pm2-start.sh" "$@"
