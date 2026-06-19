# GoogleDrive RAG統合セットアップガイド（日本語版）

TechSapo壁打ち分析システムにGoogleDriveベースのRAG（Retrieval-Augmented Generation）機能を統合するための完全設定ガイド

*[English](../RAG_SETUP_GUIDE.md) | 日本語*

## 🎯 概要

### RAGシステム構成
- **GoogleDrive**: ドキュメント保存・管理
- **OpenAI Vector Store**: 文書ベクトル化・検索エンジン
- **TechSapo壁打ち分析**: マルチLLMによる高品質回答生成
- **Prometheus監視**: RAGパフォーマンス・コスト追跡

### 対応ファイル形式
- **PDF**: `application/pdf`
- **Google Docs**: `application/vnd.google-apps.document`
- **Word文書**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **プレーンテキスト**: `text/plain`
- **CSV**: `text/csv`

## 🔧 事前準備

### Google Cloud Platform設定
```bash
# 1. Google Cloud Consoleにアクセス
# https://console.cloud.google.com

# 2. 新規プロジェクト作成または既存プロジェクト選択
# プロジェクト名例: "techsapo-rag-integration"

# 3. 必要なAPIの有効化
# - Google Drive API
# - Google Docs API (Google Docs使用時)
```

### OAuth 2.0認証情報作成
```bash
# Google Cloud Console > APIs & Services > Credentials

# 1. OAuth 2.0 Client IDを作成
#    - Application type: Desktop application
#    - Name: TechSapo RAG Connector

# 2. Client IDとClient Secretをダウンロード
#    - credentials.jsonファイルを保存

# 3. OAuth同意画面設定
#    - User Type: Internal (組織内) または External
#    - Scopes: ../auth/drive.readonly
```

### OpenAI API設定
```bash
# OpenAI Platform にアクセス
# https://platform.openai.com/api-keys

# 1. API Keyを生成
# 2. Organizationを確認（複数組織所属時）
# 3. 課金設定を確認（Vector Store使用料金）
```

## ⚙️ 環境変数設定

### 基本設定
```bash
# .envファイルに追加
cat >> .env << 'EOF'

# GoogleDrive RAG設定
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
GOOGLE_REFRESH_TOKEN=1//your-refresh-token

# OpenAI Vector Store設定  
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=org-your-organization-id

# RAG運用設定
RAG_FOLDER_ID=1BxYzCdEfGhIjKlMnOpQrStUvWxYz123456
RAG_VECTOR_STORE_NAME=techsapo-documents
RAG_BATCH_SIZE=5
RAG_SYNC_SCHEDULE=0 2 * * *

# RAG監視設定
RAG_METRICS_ENABLED=true
RAG_COST_TRACKING_ENABLED=true
RAG_PERFORMANCE_LOGGING=true

EOF
```

## 🔐 OAuth認証フロー

### リフレッシュトークン取得
```bash
# 1. 認証URL生成スクリプト作成
cat > scripts/generate-oauth-url.js << 'EOF'
const { OAuth2Client } = require('google-auth-library');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('🔗 以下のURLにブラウザでアクセスして認証を行ってください:');
console.log(authUrl);
console.log('\n📋 認証後、認証コードを取得して次のコマンドを実行:');
console.log('GOOGLE_AUTH_CODE="認証コード" node scripts/get-refresh-token.js');
EOF

# 2. リフレッシュトークン取得スクリプト作成
cat > scripts/get-refresh-token.js << 'EOF'
const { OAuth2Client } = require('google-auth-library');

if (!process.env.GOOGLE_AUTH_CODE) {
  console.error('❌ GOOGLE_AUTH_CODE環境変数が設定されていません');
  process.exit(1);
}

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.getToken(process.env.GOOGLE_AUTH_CODE)
  .then(({ tokens }) => {
    console.log('✅ OAuth認証成功！');
    console.log('📝 以下のリフレッシュトークンを.envファイルに追加してください:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n🔄 トークン有効期限: なし（リフレッシュトークン）');
    
    if (tokens.access_token) {
      console.log('\n🔑 アクセストークン（テスト用）:');
      console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
      console.log(`トークン期限: ${new Date(Date.now() + 3600000).toISOString()}`);
    }
  })
  .catch(error => {
    console.error('❌ トークン取得エラー:', error.message);
    console.log('💡 トラブルシューティング:');
    console.log('1. 認証コードが正しいか確認');
    console.log('2. Client ID/Secretが正しいか確認');
    console.log('3. OAuth同意画面設定が完了しているか確認');
  });
EOF

chmod +x scripts/generate-oauth-url.js scripts/get-refresh-token.js
```

### 認証フロー実行
```bash
# 1. OAuth URL生成
node scripts/generate-oauth-url.js

# 2. ブラウザで認証URL にアクセス
# 3. Googleアカウントでログイン・権限許可
# 4. 認証コードを取得

# 5. リフレッシュトークン取得
GOOGLE_AUTH_CODE="4/0AdQt8qh...取得した認証コード" node scripts/get-refresh-token.js

# 6. 出力されたリフレッシュトークンを.envに追加
echo "GOOGLE_REFRESH_TOKEN=1//04...リフレッシュトークン" >> .env
```

## 📁 GoogleDriveフォルダ設定

### フォルダID取得
```bash
# GoogleDriveフォルダURLからID抽出
# URL例: https://drive.google.com/drive/folders/1BxYzCdEfGhIjKlMnOpQrStUvWxYz123456
# フォルダID: 1BxYzCdEfGhIjKlMnOpQrStUvWxYz123456

# 環境変数設定
echo "RAG_FOLDER_ID=1BxYzCdEfGhIjKlMnOpQrStUvWxYz123456" >> .env

# フォルダアクセステスト
node << 'EOF'
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

drive.files.get({
  fileId: process.env.RAG_FOLDER_ID,
  fields: 'id,name,mimeType,permissions'
}).then(response => {
  console.log('✅ フォルダアクセス成功:');
  console.log(`フォルダ名: ${response.data.name}`);
  console.log(`フォルダID: ${response.data.id}`);
  console.log(`MIMEタイプ: ${response.data.mimeType}`);
}).catch(error => {
  console.error('❌ フォルダアクセスエラー:', error.message);
  console.log('💡 確認事項:');
  console.log('1. フォルダIDが正しいか');
  console.log('2. フォルダが共有されているか');
  console.log('3. OAuth権限にDrive ReadOnlyが含まれているか');
});
EOF
```

### フォルダ構造例
```
📁 TechSapo Knowledge Base (RAG_FOLDER_ID)
├── 📄 サーバー運用手順書.pdf
├── 📄 障害対応マニュアル.docx
├── 📁 Kubernetes
│   ├── 📄 クラスター構築ガイド.md
│   └── 📄 ポッド監視設定.yaml
├── 📁 データベース
│   ├── 📄 MySQL最適化ガイド.pdf
│   └── 📄 バックアップ手順.txt
└── 📁 ネットワーク
    ├── 📄 ファイアウォール設定.conf
    └── 📄 VPN設定手順.md
```

## 🚀 RAGシステム初期化

### アプリケーション起動確認
```bash
# TechSapoアプリケーション起動
npm run build
npm start

# ヘルスチェック
curl http://localhost:4000/health

# RAGエンドポイント確認
curl http://localhost:4000/api/v1/rag/health
```

### GoogleDriveフォルダ同期
```bash
# フォルダ内ドキュメント一覧取得
curl -X GET http://localhost:4000/api/v1/rag/list-documents \
  -H "Content-Type: application/json" \
  -d '{
    "folder_id": "1BxYzCdEfGhIjKlMnOpQrStUvWxYz123456",
    "mime_types": [
      "application/pdf",
      "application/vnd.google-apps.document",
      "text/plain"
    ]
  }'

# RAGシステムに同期
curl -X POST http://localhost:4000/api/v1/rag/sync-folder \
  -H "Content-Type: application/json" \
  -d '{
    "folder_id": "1BxYzCdEfGhIjKlMnOpQrStUvWxYz123456",
    "vector_store_name": "techsapo-documents",
    "batch_size": 5
  }'
```

> **`batch_size` ≠ OpenAI Batch API.** コネクタ内の**並列ドキュメント処理数**（既定 5）。取り込み時の LLM 一括 enrichment 用 [OpenAI Batch API](https://github.com/openai/openai-cookbook/blob/main/examples/batch_processing.ipynb) は**任意・未実装**。導入はコスト/件数ゲート通過後のみ — [OPENAI_BATCH_API_RAG.md](../OPENAI_BATCH_API_RAG.md)（英語）参照。

### 同期結果確認
```bash
# 同期ステータス確認
curl -X GET http://localhost:4000/api/v1/rag/sync-status \
  -H "Content-Type: application/json" \
  -d '{"vector_store_name": "techsapo-documents"}'

# Vector Store一覧取得
curl -X GET http://localhost:4000/api/v1/rag/vector-stores
```

## 🔍 RAG検索テスト

### 基本検索
```bash
# 日本語クエリによるRAG検索
curl -X POST http://localhost:4000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "MySQLの性能を最適化する方法を教えて",
    "vector_store_name": "techsapo-documents",
    "max_results": 5
  }'
```

### 壁打ち分析と統合検索
```bash
# RAG情報を含む壁打ち分析
curl -X POST http://localhost:4000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Kubernetesポッドが起動しない問題を解決したい",
    "task_type": "premium",
    "use_rag": true,
    "rag_vector_store": "techsapo-documents",
    "user_id": "engineer-001"
  }'
```

### 検索結果分析
```bash
# RAG検索パフォーマンス確認
curl -X GET http://localhost:4000/api/v1/rag/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "vector_store_name": "techsapo-documents",
    "time_range": "24h"
  }'
```

## 📊 監視・メトリクス設定

### Prometheusメトリクス確認
```bash
# RAG関連メトリクス取得
curl http://localhost:4000/metrics | grep -E "(rag|googledrive)"

# 主要メトリクス:
# - techsapo_rag_sync_requests_total
# - techsapo_rag_search_duration_seconds
# - techsapo_googledrive_api_requests_total
# - techsapo_rag_cost_usd
```

### Grafanaダッシュボード設定
```bash
# RAG専用ダッシュボードインポート
# Grafana > Import Dashboard > Upload JSON

# ダッシュボード設定例:
# - GoogleDrive同期状況
# - RAG検索パフォーマンス
# - Vector Store使用統計
# - OpenAI API使用量・コスト
```

## 🔄 運用・メンテナンス

### 日次同期スケジュール
```bash
# 自動同期スクリプト作成
cat > scripts/daily-rag-sync.sh << 'EOF'
#!/bin/bash
# GoogleDriveフォルダ日次同期

set -euo pipefail

LOG_FILE="/var/log/techsapo/rag-sync.log"
FOLDER_ID="${RAG_FOLDER_ID}"
VECTOR_STORE="${RAG_VECTOR_STORE_NAME:-techsapo-documents}"

# ログディレクトリ作成
mkdir -p "$(dirname "$LOG_FILE")"

echo "$(date): RAG同期開始 - フォルダID: $FOLDER_ID" >> "$LOG_FILE"

# 同期実行
SYNC_RESULT=$(curl -s -X POST http://localhost:4000/api/v1/rag/sync-folder \
  -H "Content-Type: application/json" \
  -d "{
    \"folder_id\": \"$FOLDER_ID\",
    \"vector_store_name\": \"$VECTOR_STORE\",
    \"batch_size\": 5
  }")

# 結果ログ出力
echo "$(date): 同期結果: $SYNC_RESULT" >> "$LOG_FILE"

# エラーチェック
if echo "$SYNC_RESULT" | grep -q '"success":true'; then
  echo "$(date): RAG同期成功完了" >> "$LOG_FILE"
  
  # Prometheus成功メトリクス送信
  curl -s -X POST http://localhost:4000/metrics/rag/sync/success
else
  echo "$(date): RAG同期エラー発生" >> "$LOG_FILE"
  
  # Prometheus失敗メトリクス送信
  curl -s -X POST http://localhost:4000/metrics/rag/sync/failure
  
  # エラー通知（オプション）
  # sendmail -t < alert-email.txt
fi

echo "$(date): RAG同期処理完了" >> "$LOG_FILE"
EOF

chmod +x scripts/daily-rag-sync.sh
```

### Cron設定
```bash
# 毎日深夜2時に同期実行
echo "0 2 * * * /ai/prj/techsapo/scripts/daily-rag-sync.sh" | crontab -

# Cron設定確認
crontab -l | grep rag-sync
```

### ログローテーション
```bash
# Logrotate設定
sudo tee /etc/logrotate.d/techsapo-rag << 'EOF'
/var/log/techsapo/rag-sync.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
```

## 🔧 トラブルシューティング

### よくある問題と解決法

#### Google Drive API認証エラー
```bash
# エラー: "Invalid credentials"
# 解決手順:
# 1. リフレッシュトークン再取得
GOOGLE_AUTH_CODE="新しい認証コード" node scripts/get-refresh-token.js

# 2. OAuth同意画面設定確認
# 3. APIキー制限設定確認

# 認証テスト
curl -X GET http://localhost:4000/api/v1/rag/test-auth
```

#### OpenAI Vector Store接続エラー
```bash
# エラー: "Vector store not found"
# 解決手順:
# 1. APIキー確認
echo $OPENAI_API_KEY | wc -c  # 51文字（sk-含む）であることを確認

# 2. Organization ID確認
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/organizations

# 3. Vector Store再作成
curl -X POST http://localhost:4000/api/v1/rag/create-vector-store \
  -H "Content-Type: application/json" \
  -d '{"name": "techsapo-documents-backup"}'
```

#### 同期処理タイムアウト
```bash
# エラー: "Sync timeout"
# 解決手順:
# 1. バッチサイズ削減
# 2. タイムアウト値調整
# 3. ネットワーク接続確認

# 手動同期（小バッチ）
curl -X POST http://localhost:4000/api/v1/rag/sync-folder \
  -H "Content-Type: application/json" \
  -d '{
    "folder_id": "フォルダID",
    "vector_store_name": "techsapo-documents",
    "batch_size": 2
  }'
```

#### 検索精度が低い
```bash
# 問題: RAG検索結果の関連性が低い
# 改善手順:
# 1. クエリ最適化
# 2. ドキュメント前処理改善
# 3. Vector Store設定調整

# 検索テスト（詳細ログ付き）
curl -X POST http://localhost:4000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "具体的で詳細なクエリ",
    "vector_store_name": "techsapo-documents",
    "max_results": 10,
    "debug": true
  }'
```

### ログ分析
```bash
# RAGシステムログ確認
docker logs techsapo-app --tail 100 | grep -E "(RAG|GoogleDrive|Vector Store)"

# エラーログフィルタ
docker logs techsapo-app 2>&1 | grep -E "(ERROR|WARN)" | grep -i rag

# パフォーマンスログ分析
grep "RAG search duration" /var/log/techsapo/rag-sync.log | \
  awk '{print $NF}' | sort -n
```

## 📈 パフォーマンス最適化

### 同期性能最適化
```bash
# 大量ドキュメント用設定
cat >> .env << 'EOF'
# RAG性能最適化設定
RAG_BATCH_SIZE=10                    # バッチサイズ増加
RAG_CONCURRENT_UPLOADS=3             # 並列アップロード数
RAG_MAX_FILE_SIZE_MB=10              # ファイルサイズ制限
RAG_RETRY_MAX_ATTEMPTS=3             # リトライ回数
RAG_RETRY_DELAY_MS=2000              # リトライ間隔

# OpenAI API最適化
OPENAI_MAX_TOKENS_PER_REQUEST=8000   # リクエスト最大トークン数
OPENAI_EMBEDDING_BATCH_SIZE=20       # 埋め込みバッチサイズ
EOF
```

### 検索性能最適化
```bash
# Vector Store設定最適化
curl -X POST http://localhost:4000/api/v1/rag/optimize-vector-store \
  -H "Content-Type: application/json" \
  -d '{
    "vector_store_name": "techsapo-documents",
    "optimization_level": "performance"
  }'

# インデックス再構築
curl -X POST http://localhost:4000/api/v1/rag/rebuild-index \
  -H "Content-Type: application/json" \
  -d '{"vector_store_name": "techsapo-documents"}'
```

### キャッシュ戦略
```bash
# Redis RAGキャッシュ設定
cat >> .env << 'EOF'
# RAGキャッシュ設定
RAG_CACHE_ENABLED=true
RAG_CACHE_TTL_SECONDS=3600           # 1時間キャッシュ
RAG_CACHE_MAX_RESULTS=100            # 最大キャッシュ結果数
RAG_CACHE_KEY_PREFIX=techsapo:rag:   # キャッシュキープレフィックス
EOF

# キャッシュ状況確認
curl -X GET http://localhost:4000/api/v1/rag/cache-stats
```

## 💰 コスト監視・最適化

### OpenAI API コスト追跡
```bash
# 月次コスト確認
curl -X GET http://localhost:4000/api/v1/rag/cost-analysis \
  -H "Content-Type: application/json" \
  -d '{"period": "monthly"}'

# Vector Store使用量確認
curl -X GET http://localhost:4000/api/v1/rag/usage-stats \
  -H "Content-Type: application/json" \
  -d '{"vector_store_name": "techsapo-documents"}'
```

### コスト最適化設定
```bash
# コスト制限設定
cat >> .env << 'EOF'
# RAGコスト管理
RAG_MONTHLY_BUDGET_USD=50            # 月次予算制限
RAG_DAILY_BUDGET_USD=2               # 日次予算制限
RAG_COST_ALERT_THRESHOLD=0.8         # アラート閾値（80%）
RAG_AUTO_PAUSE_ON_BUDGET_EXCEED=true # 予算超過時自動停止
EOF

# 予算監視アラート設定
curl -X POST http://localhost:4000/api/v1/rag/set-budget-alert \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_limit": 50,
    "alert_threshold": 0.8,
    "notification_channels": ["email", "slack"]
  }'
```

## 🔒 セキュリティ・プライバシー

### データプライバシー設定
```bash
# PII情報マスキング設定
cat >> .env << 'EOF'
# RAGセキュリティ設定
RAG_PII_MASKING_ENABLED=true         # 個人情報マスキング有効
RAG_SENSITIVE_DATA_FILTER=true       # 機密情報フィルタ有効
RAG_ACCESS_LOG_ENABLED=true          # アクセスログ記録
RAG_GDPR_COMPLIANCE_MODE=true        # GDPR準拠モード
EOF

# セキュリティスキャン実行
curl -X POST http://localhost:4000/api/v1/rag/security-scan \
  -H "Content-Type: application/json" \
  -d '{"vector_store_name": "techsapo-documents"}'
```

### アクセス制御
```bash
# ユーザー別アクセス制限
curl -X POST http://localhost:4000/api/v1/rag/set-access-policy \
  -H "Content-Type: application/json" \
  -d '{
    "vector_store_name": "techsapo-documents",
    "access_policy": {
      "allowed_users": ["engineer-001", "admin-001"],
      "allowed_roles": ["sre", "devops"],
      "rate_limit": "100/hour"
    }
  }'
```

---

**セットアップ完了日**: 2025-08-27  
**対象システム**: TechSapo + GoogleDrive RAG統合  
**実装機能**: フル機能RAGシステム + 包括的監視

**🎯 GoogleDrive RAG統合セットアップ（日本語版） - 完成！**

*エンタープライズグレードRAGシステムによる知識活用の実現*

---
🌐 **言語**: [English](../RAG_SETUP_GUIDE.md) | **日本語**