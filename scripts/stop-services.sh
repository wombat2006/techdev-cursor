#!/bin/bash

# TechSapo + Codex MCP Server Stop Script
# Gracefully stops TechSapo and Codex MCP services

set -e

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 設定変数
CODEX_MCP_PID_FILE="/tmp/techsapo-codex-mcp.pid"
APP_PID_FILE="/tmp/techsapo-app.pid"

echo "🛑 TechSapo + Codex MCP Server Stop"
echo "==================================="

# PM2-managed daemons (preferred)
if command -v pm2 &>/dev/null || [ -f "node_modules/.bin/pm2" ]; then
    PM2_CMD="pm2"
    command -v pm2 &>/dev/null || PM2_CMD="npx pm2"
    if $PM2_CMD jlist 2>/dev/null | grep -q '"name":"techsapo"'; then
        log_info "Stopping PM2-managed daemons..."
        bash "$(dirname "$0")/pm2-stop.sh"
        exit 0
    fi
fi

# Legacy PID-file shutdown (nohup path)

# TechSapo アプリケーション停止
if [[ -f "$APP_PID_FILE" ]]; then
    APP_PID=$(cat "$APP_PID_FILE")
    if kill -0 "$APP_PID" 2>/dev/null; then
        log_info "Stopping TechSapo application (PID: $APP_PID)"
        kill -TERM "$APP_PID" 2>/dev/null || true

        # グレースフル停止確認
        for i in {1..10}; do
            if ! kill -0 "$APP_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done

        # 強制停止が必要な場合
        if kill -0 "$APP_PID" 2>/dev/null; then
            log_warning "Forcefully stopping TechSapo application"
            kill -KILL "$APP_PID" 2>/dev/null || true
        fi

        log_success "TechSapo application stopped"
    else
        log_info "TechSapo application not running"
    fi
    rm -f "$APP_PID_FILE"
else
    log_info "No TechSapo PID file found"
fi

# Codex MCP サーバ停止
if [[ -f "$CODEX_MCP_PID_FILE" ]]; then
    CODEX_PID=$(cat "$CODEX_MCP_PID_FILE")
    if kill -0 "$CODEX_PID" 2>/dev/null; then
        log_info "Stopping Codex MCP server (PID: $CODEX_PID)"
        kill -TERM "$CODEX_PID" 2>/dev/null || true

        # グレースフル停止確認
        for i in {1..10}; do
            if ! kill -0 "$CODEX_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done

        # 強制停止が必要な場合
        if kill -0 "$CODEX_PID" 2>/dev/null; then
            log_warning "Forcefully stopping Codex MCP server"
            kill -KILL "$CODEX_PID" 2>/dev/null || true
        fi

        log_success "Codex MCP server stopped"
    else
        log_info "Codex MCP server not running"
    fi
    rm -f "$CODEX_MCP_PID_FILE"
else
    log_info "No Codex MCP PID file found"
fi

# その他のCodexプロセス確認
log_info "Checking for other Codex processes..."
OTHER_CODEX_PIDS=$(pgrep -f "codex mcp serve" 2>/dev/null || true)
if [[ -n "$OTHER_CODEX_PIDS" ]]; then
    log_warning "Found other Codex MCP processes: $OTHER_CODEX_PIDS"
    echo "$OTHER_CODEX_PIDS" | xargs -r kill -TERM
    sleep 2
    echo "$OTHER_CODEX_PIDS" | xargs -r kill -KILL 2>/dev/null || true
    log_success "Other Codex processes stopped"
fi

# ポート使用状況確認
log_info "Checking port usage..."
if netstat -tulpn 2>/dev/null | grep -q ":4000 "; then
    log_warning "Port 4000 still in use"
else
    log_success "Port 4000 is free"
fi

echo ""
echo "✅ Stop Complete!"
echo "================"
log_success "All TechSapo and Codex MCP services have been stopped"

exit 0