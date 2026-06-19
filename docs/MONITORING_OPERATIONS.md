# Monitoring & Operations Guide

## 📊 Monitoring Stack Overview

TechSapoは包括的な監視スタックを提供し、リアルタイムでのシステム状態監視と性能分析を実現します。

## 🚀 Quick Start Commands

### 完全監視スタック起動
```bash
./scripts/start-monitoring.sh
```

### 個別サービス管理
```bash
# PM2 daemon 管理（推奨 — ecosystem.config.cjs）
npm run pm2:start              # techsapo + codex-mcp
npm run pm2:start:all          # + production-monitor
npm run pm2:status
npm run pm2:logs
npm run pm2:stop
npm run pm2:monit

# 直接 PM2（上級者向け）
pm2 start ecosystem.config.cjs --env development --only techsapo,codex-mcp
pm2 restart techsapo

# stdio MCP は PM2 対象外（Cursor spawn）:
#   techsapo-providers-mcp-server, claude-code-mcp-server, codex-mcp-server.js

# Legacy nohup + PID ファイル
npm run start:legacy
npm run stop:legacy

# Docker監視スタック
docker-compose -f docker/docker-compose.monitoring.yml up -d
docker-compose -f docker/production/docker-compose.prod.yml up -d
```

## 🔧 Monitoring Endpoints

### アクセス先
- **アプリケーション**: http://localhost:4000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/techsapo2024!)
- **AlertManager**: http://localhost:9093
- **メトリクス**: http://localhost:4000/metrics

### Health Check Endpoints
- `GET /health` - 基本ヘルスチェック
- `GET /api/v1/health` - 詳細サービス状態
- `GET /ping` - ロードバランサー用ヘルスチェック

## 📈 Key Metrics

### Wall-Bounce Analysis Metrics
```prometheus
# 壁打ち分析成功率
techsapo_wallbounce_success_rate

# 平均信頼度スコア（5分間）
techsapo_wallbounce_avg_confidence_5m

# LLMプロバイダー性能
techsapo_llm_success_rate_by_provider{provider="Gemini"}

# コンセンサス品質
techsapo_wallbounce_consensus_score
```

### System Performance Metrics
```prometheus
# HTTP P95応答時間
techsapo_http_p95_response_time

# アクティブ接続数
techsapo_active_connections

# メモリ使用率
techsapo_memory_usage_percent

# CPU使用率
techsapo_cpu_usage_percent
```

### Cost Management Metrics
```prometheus
# 日次コスト追跡
sum(increase(techsapo_wallbounce_cost_usd[24h]))

# プロバイダー別コスト
techsapo_provider_cost_usd{provider="openai"}
techsapo_provider_cost_usd{provider="google"}

# 予算使用率
techsapo_budget_utilization_percent
```

## 🚨 Alerting Configuration

### ユーザー異常通知（LINE）

クリティカル / 警告アラートの **エンドユーザー向け通知** には **LINE** を使用します（**実装済み**）。

```text
Prometheus alert → Alertmanager → line-notification (Webhook) → LINE Messaging API → ユーザー
```

| 要素 | 説明 |
|------|------|
| **line-notification** | Alertmanager / 監視スクリプトからの Webhook を受け、LINE へプッシュ |
| **用途** | 壁打ち信頼度低下、プロバイダー障害、予算超過などの異常 |
| **設定** | `LINE_CHANNEL_ACCESS_TOKEN` 等 — 詳細は運用環境の line-notification 設定を参照 |

Grafana / Alertmanager の receiver に **line-notification Webhook URL** を登録してください。

### Critical Alerts
- **壁打ち合意信頼度 < 0.7** (5分間継続)
- **システム応答時間 > 10秒** (3分間継続)
- **メモリ使用率 > 90%** (5分間継続)
- **プロバイダー障害** (即座)

### Warning Alerts
- **平均応答時間 > 5秒** (5分間継続)
- **コスト予算使用率 > 80%** (1時間継続)
- **Redis接続エラー** (3回連続)

### Info Alerts
- **日次リクエスト数 > 平常時150%**
- **新規プロバイダー追加**
- **設定変更通知**

## 📊 Dashboard Configuration

### Grafana Dashboards

#### Main System Dashboard
- **システム概要**: CPU、メモリ、ネットワーク使用率
- **アプリケーション性能**: 応答時間、スループット、エラー率
- **Wall-Bounce分析**: 成功率、信頼度、コンセンサススコア

#### Cost Management Dashboard
- **リアルタイムコスト**: プロバイダー別コスト追跡
- **予算管理**: 月次・日次予算使用状況
- **コスト最適化**: 推奨プロバイダー選択

#### LLM Provider Dashboard
- **プロバイダー性能**: 応答時間、成功率、品質スコア
- **利用統計**: 使用頻度、コスト効率
- **エラー追跡**: プロバイダー別エラー分析

## 🔍 Log Management

### ログレベル
```typescript
const logLevels = {
  error: 'システムエラー、プロバイダー障害',
  warn: '警告、品質閾値未満',
  info: '通常操作、リクエスト追跡',
  debug: '詳細デバッグ情報'
};
```

### 構造化ログ
```typescript
logger.info('Wall-bounce analysis completed', {
  requestId: 'req_12345',
  userId: 'user_abc',
  providers: ['gpt-5', 'gemini'],
  confidence: 0.85,
  consensus: 0.92,
  processingTime: 2341,
  cost: 0.05
});
```

### ログローテーション
```bash
# PM2による自動ログローテーション
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 🔒 Security Monitoring

### セキュリティメトリクス
```prometheus
# 認証失敗数
techsapo_auth_failures_total

# レート制限発動
techsapo_rate_limit_hits_total

# 異常リクエスト検出
techsapo_anomaly_requests_total
```

### セキュリティアラート
- **認証失敗 > 10回/分**
- **異常なトラフィックパターン**
- **機密情報アクセス試行**
- **APIキー不正使用**

## 🏗️ Production Monitoring Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   TechSapoアプリ │───▶│ Prometheus   │───▶│  Grafana    │
│  （ポート 4000） │    │（ポート 9090）│    │（ポート 3000）│
│   壁打ち分析    │    │   メトリクス  │    │ ダッシュボード│
└─────────────────┘    └──────────────┘    └─────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│ マルチLLM       │    │AlertManager  │    │ Node        │
│ オーケストレータ │    │（ポート 9093）│    │ Exporter    │
│ ┌─────────────┐ │    │ 通知管理     │    │（ポート 9100）│
│ │GPT-5        │ │    └──────────────┘    └─────────────┘
│ │Gemini 2.5   │ │
│ │Claude (SDK) │ │         ┌──────────────┐
│ │OpenRouter   │ │         │ Redisキャッシュ│
│ └─────────────┘ │         │（ポート 6379）│
└─────────────────┘         └──────────────┘
```

## 📱 Real-time Monitoring

### Server-Sent Events (SSE)
```javascript
// リアルタイムメトリクス接続
const eventSource = new EventSource('/api/v1/metrics/stream');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'metrics') {
    updateDashboard(data.data);
  }
};
```

### WebSocket監視
```typescript
// WebSocket接続でリアルタイム更新
const wsConnection = {
  url: 'ws://localhost:4000/ws/metrics',
  reconnect: true,
  heartbeat: 30000
};
```

## 🔧 SSL/TLS Certificate Management

### 自動更新設定
```bash
# 自動更新インストール（90日サイクル）
./scripts/install-renewal-cron.sh

# 手動更新
./scripts/renew-certificates.sh

# 証明書状態確認
openssl x509 -in /etc/ssl/certs/techsapo.crt -text -noout
```

## 🏥 High Availability Setup

### 負荷分散設定
```nginx
upstream techsapo_backend {
  server 127.0.0.1:4000 weight=3;
  server 127.0.0.1:4001 weight=2;
  server 127.0.0.1:4002 weight=1 backup;
}
```

### ヘルスチェック設定
```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 📦 Backup & Recovery

### データバックアップ戦略
```bash
# Redis データバックアップ
redis-cli --rdb /backup/redis-$(date +%Y%m%d).rdb

# MySQL監査ログバックアップ
mysqldump --single-transaction techsapo_audit > /backup/audit-$(date +%Y%m%d).sql

# 設定ファイルバックアップ
tar -czf /backup/config-$(date +%Y%m%d).tar.gz /app/config/
```

### 災害復旧計画
1. **自動フェイルオーバー**: 30秒以内
2. **データ復旧**: 15分以内
3. **完全サービス復旧**: 60分以内
4. **バックアップ検証**: 日次自動実行