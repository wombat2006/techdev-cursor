# GoogleDrive + OpenAI RAG システム セットアップガイド

## 🎯 概要

TechSapoシステムにGoogleDrive連携とOpenAI RAG機能を統合し、壁打ち分析と組み合わせて高品質な技術支援を実現します。

## 🔧 必要な設定

### 1. GoogleDrive API設定

#### Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト作成または既存プロジェクト選択
3. APIs & Services → Library → Google Drive API を有効化
4. 認証情報 → 認証情報を作成 → OAuth 2.0 クライアントID
5. アプリケーション種類: デスクトップアプリケーション
6. `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` を取得

#### リフレッシュトークン取得
```bash
# OAuth playground または以下のコマンドでリフレッシュトークン取得
curl -X POST \
  https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"
```

### 2. OpenAI API設定

1. [OpenAI Platform](https://platform.openai.com/) でAPIキー作成
2. 組織ID取得（オプション）
3. 使用制限と課金設定確認

### 3. 環境変数設定

`.env` ファイルに以下を追加:

```env
# GoogleDrive設定
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_REFRESH_TOKEN=your_actual_refresh_token

# OpenAI設定
OPENAI_API_KEY=sk-your_actual_api_key
OPENAI_ORGANIZATION=org-your_actual_org_id

# RAG設定
DEFAULT_VECTOR_STORE_NAME=techsapo-docs
ENABLE_WALL_BOUNCE_BY_DEFAULT=true
DEFAULT_WALL_BOUNCE_MODELS=o3-high,gemini
```

## 🚀 使用方法

### APIエンドポイント一覧

#### 1. システム状態確認
```bash
GET /api/v1/rag/status
```

レスポンス例:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "config_status": {
      "google_drive": {
        "client_id_set": true,
        "client_secret_set": true,
        "refresh_token_set": true
      },
      "openai": {
        "api_key_set": true,
        "organization_set": true
      }
    }
  }
}
```

#### 2. ドキュメント一覧取得
```bash
GET /api/v1/rag/documents?folder_id=GOOGLE_DRIVE_FOLDER_ID
```

#### 3. フォルダをRAGに同期
```bash
POST /api/v1/rag/sync-folder
Content-Type: application/json

{
  "folder_id": "1ABC123XYZ789_GoogleDriveFolderId",
  "vector_store_name": "my-knowledge-base",
  "batch_size": 5
}
```

> **`batch_size` ≠ OpenAI Batch API.** This parameter controls **parallel document processing** in the connector (default 5). The async [OpenAI Batch API](https://github.com/openai/openai-cookbook/blob/main/examples/batch_processing.ipynb) for bulk LLM enrichment during ingest is **optional, not implemented**, and should only be adopted after cost/volume gates — see [OPENAI_BATCH_API_RAG.md](./OPENAI_BATCH_API_RAG.md).

レスポンス例:
```json
{
  "success": true,
  "data": {
    "vector_store_id": "vs_abc123xyz789",
    "processed_documents": 15,
    "failed_documents": 2,
    "processed_files": [
      {
        "id": "doc1",
        "name": "技術仕様書.pdf",
        "vector_store_file_id": "file_abc123"
      }
    ]
  }
}
```

#### 4. RAG検索 + 壁打ち分析
```bash
POST /api/v1/rag/search
Content-Type: application/json

{
  "query": "MySQLのレプリケーション設定手順を教えて",
  "vector_store_id": "vs_abc123xyz789",
  "max_results": 5,
  "enable_wall_bounce": true,
  "wall_bounce_models": ["o3-high", "gemini"]
}
```

レスポンス例:
```json
{
  "success": true,
  "data": {
    "query": "MySQLのレプリケーション設定手順を教えて",
    "final_answer": "【RAG + 壁打ち分析統合回答】\\n\\n== 基本RAG回答 ==\\nMySQLレプリケーションの設定は...\\n\\n== 壁打ち分析結果 ==\\n【o3-high分析】\\n詳細な手順と注意点...\\n【gemini分析】\\n追加の最適化提案...",
    "wall_bounce_enabled": true,
    "usage": {
      "prompt_tokens": 1250,
      "completion_tokens": 850,
      "total_tokens": 2100
    }
  }
}
```

## 🔄 壁打ち分析連携

### 壁打ち分析の仕組み
1. **基本RAG検索**: OpenAI Assistant + Vector Storeで関連文書検索
2. **o3-high分析**: 技術的詳細と追加情報の提供
3. **Gemini分析**: 回答品質評価と改善提案
4. **統合回答**: 複数の分析結果を統合した最終回答

### 壁打ち設定オプション
```json
{
  "enable_wall_bounce": true,
  "wall_bounce_models": ["o3-high", "gemini"],
  "wall_bounce_timeout": 30000
}
```

## 🛡️ セキュリティ考慮事項

### データ保護
- **OAuth 2.0**: GoogleDrive API安全アクセス
- **API Key管理**: 環境変数による秘密情報保護
- **Vector Store**: 90日間自動削除設定
- **ログマスキング**: 機密情報の自動マスク処理

### アクセス制御
- フォルダ単位でのアクセス制御
- ユーザー毎のVector Store分離
- レート制限とクォータ管理

## 📊 監視とコスト管理

### コスト監視
```bash
# 月次予算: $70（CLAUDE.mdに基づく）
MONTHLY_BUDGET_USD=70
COST_ALERT_THRESHOLD=0.8
```

### 使用量追跡
- OpenAI API使用量
- Google Drive API呼び出し数
- Vector Store操作回数
- 壁打ち分析実行数

## 🚨 トラブルシューティング

### よくある問題

#### 1. 認証エラー
```
Error: 403 Permission denied
```
**解決策**: 
- リフレッシュトークンの再取得
- Google Drive APIスコープ確認
- OAuth 2.0同意画面の再設定

#### 2. Vector Store エラー
```
Error: Vector store creation failed
```
**解決策**:
- OpenAI API key確認
- 組織ID設定確認
- 使用制限とクレジット残高確認

#### 3. 壁打ち分析エラー
```
Error: MCP client connection failed
```
**解決策**:
- MCP serverの起動確認
- エンドポイントURL確認
- ネットワーク接続確認

### ログ確認
```bash
# アプリケーションログ
tail -f /ai/prj/techsapo/logs/app.log

# RAG専用ログ
tail -f /ai/prj/techsapo/logs/rag.log
```

## 🔄 アップデート手順

### システム更新
```bash
# 依存関係更新
npm install googleapis google-auth-library openai

# TypeScriptコンパイル
npm run build

# サービス再起動
npm start
```

### Vector Store管理
```bash
# Vector Store一覧
GET /api/v1/rag/vector-stores

# Vector Store削除
DELETE /api/v1/rag/vector-stores/{id}
```

## 📚 参考資料

- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)
- [TechSapo AGENTS.md](../AGENTS.md) - 壁打ち分析アーキテクチャ（憲法）
- [Multi-LLM Architecture Guide](./docs/multi-llm-guide.md)