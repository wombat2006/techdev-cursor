#!/usr/bin/env bash
# Start TechSapo daemons via PM2 (replaces nohup/PID-file startup for core services).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_err() { echo -e "${RED}[ERROR]${NC} $1"; }

PM2_CMD="pm2"
if ! command -v pm2 &>/dev/null; then
  PM2_CMD="npx pm2"
fi

ENV_NAME="${PM2_ENV:-}"
ONLY="${PM2_ONLY:-techsapo,codex-mcp}"

mkdir -p logs/pm2

if [ ! -f ".env" ]; then
  log_err ".env not found — copy .env.example and set required vars (e.g. HUGGINGFACE_API_KEY)"
  exit 1
fi

log_info "Building project..."
npm run build --silent

log_info "Starting PM2 apps (only=${ONLY}${ENV_NAME:+, env=${ENV_NAME}})..."
if [ "$ENV_NAME" = "production" ]; then
  $PM2_CMD start ecosystem.config.cjs --env production --only "$ONLY"
else
  $PM2_CMD start ecosystem.config.cjs --only "$ONLY"
fi

log_ok "PM2 daemons started"
$PM2_CMD status

echo ""
echo "Commands:"
echo "  npm run pm2:status   — process list"
echo "  npm run pm2:logs     — tail logs"
echo "  npm run pm2:stop     — stop daemons"
echo "  npm run pm2:start:all — include production-monitor"
