# 🏓 TechSapo - Enhanced MCP Orchestration with Wall-Bounce Analysis

> **PRIMARY REPO — `techdev-cursor`**  
> **What is this repo?** An **integrated Cursor IDE development-environment project** — forked from upstream [wombat2006/techdev](https://github.com/wombat2006/techdev) (Wall-Bounce platform). **Goals:** improve **coding accuracy** and **reduce coding workload** via multi-LLM Wall-Bounce, subscription CLIs (`claude` / `codex` / `agy`), and unified MCP. **Not** an IT incident/troubleshooting analysis project (that is the upstream InfraOps fork line).  
> Upstream reference: [wombat2006/techdev](https://github.com/wombat2006/techdev) · Bootstrap: [docs/FORK_CURSOR.md](./docs/FORK_CURSOR.md) · Runbook: [docs/CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) · Backlog: [docs/PROVIDER_INTEGRATION_BACKLOG.md](./docs/PROVIDER_INTEGRATION_BACKLOG.md)

[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](./tests/)
[![MCP Services](https://img.shields.io/badge/MCP%20services-7+-blue.svg)](#mcp-services)
[![Security](https://img.shields.io/badge/security-enterprise-red.svg)](#security)
[![Wall-Bounce](https://img.shields.io/badge/wall--bounce-enabled-green.svg)](#wall-bounce)

**Wall-Bounce 多 LLM 協調**と **Cursor 統合開発環境** — コーディング精度向上・負荷軽減を目的とした DevAssist フォーク（[`techdev-cursor`](./docs/FORK_CURSOR.md)）

## 🎯 Enhanced MCP Architecture

### 🏓 Wall-Bounce Analysis with MCP Integration
Model Context Protocol基盤の協調分析システム
- **必須MCP壁打ち**: 複数MCPサーバー経由での分析実行
- **品質統合**: ハルシネーション検証とコンセンサス評価
- **リファレンス強化**: Context7/Stash経由での最新ドキュメント参照

### Multi-LLM MCP Orchestration

> OpenAI model IDs: [OPENAI_MODEL_MATRIX.md](./docs/OPENAI_MODEL_MATRIX.md). Multi-vendor traits: [config/llm-model-catalog.json](./config/llm-model-catalog.json) ([TS-21](./docs/decisions/TECH_STACK_LLM_MODEL_CATALOG.md)), enriched from [OpenAI Cookbook](./docs/OPENAI_COOKBOOK_INTEGRATION.md) and [platform prompt guidance](./docs/OPENAI_PROMPT_GUIDANCE.md) (`prompting.guidanceTopics`, `promptGuidanceIndex`). **Invocation policy (Context7-verified):** catalog = transport channel + capabilities + `nativeModelFlag`; adapters (`src/adapters/*`) = concrete CLI/API calls — see [TS-21 §5](./docs/decisions/TECH_STACK_LLM_MODEL_CATALOG.md). **AS-IS code** may still show legacy names until backlog migration.

- **Tier 0**: Stash/Context7 — reference / documentation layer (non-LLM)
- **Tier 1**: Claude Code CLI — dev routing · unified MCP (`analyze_claude`)
- **Tier 2**: Antigravity CLI (`agy`, Gemini) + **GPT-5.4 mini / nano** — high-volume / fast tasks (To-Be; Codex CLI today)
- **Tier 3**: Claude Sonnet 4.5 + OpenRouter — complex analysis
- **Tier 4**: **GPT-5.5** — Responses API preferred · Codex CLI for codex-family models (API catalog To-Be)
- **Tier 5**: **GPT-5.5 Pro** + Claude Opus 4.1 — aggregation / hardest critique

### LLM Model Catalog (TS-21)

Three-layer split — do not conflate catalog with per-request knobs or adapter argv:

| Layer | Artifact | Role |
|-------|----------|------|
| **LlmModelCatalog** | `config/llm-model-catalog.json` | **WHAT:** vendor/model traits, limits, transport channel, Cookbook refs |
| **InferenceProfile** | `inference-profiles.json` ([TS-20](./docs/decisions/TECH_STACK_INFERENCE_PROFILES.md)) | **HOW:** effort, temperature, cot per request |
| **Provider adapters** | `src/adapters/{claude,codex,agy}-adapter.ts` | **BIND:** exact CLI spawn / API body (versioned in code) |

- JSON Schema: [config/schemas/llm-model-catalog.schema.json](./config/schemas/llm-model-catalog.schema.json)
- Optional `transport.invocationBindingRef` (e.g. `openai:responses-v1`) — pointer only; no `spawnArgs` in catalog
- **Models (OpenAI slice):** GPT-5.5 / 5.4 / 5.4-pro / mini / nano / **gpt-5.3-codex** — see [OPENAI_MODEL_MATRIX.md](./docs/OPENAI_MODEL_MATRIX.md)
- **Per-model prompt guidance**: [OPENAI_PROMPT_GUIDANCE.md](./docs/OPENAI_PROMPT_GUIDANCE.md) — GPT-5.5 / 5.4 / 5.3-Codex via `platformGuideModel` + `promptGuidanceIndex`
- **`apiPricing`**: standard / batch / flex / priority (USD per 1M tokens) for cost-aware routing (F-12)
- **`apiFeatures.batchApi`**: flag only for optional RAG ingest enrichment — [OPENAI_BATCH_API_RAG.md](./docs/OPENAI_BATCH_API_RAG.md) (gated; Phase 0 not implemented)
- Cookbook ↔ catalog sync: Track F-7 · Codex MCP command alignment: Track F-8 · RAG Batch enrichment: Track F-13

### 🔗 MCP Services Infrastructure {#mcp-services}
- **techsapo-providers** (Unified): Cursor 向け stdio MCP — `analyze_claude` / `analyze_codex` / `analyze_agy`
- **Wall-Bounce MCP**: 複数LLM協調処理オーケストレーター
- **Vault MCP**: AES-256-GCM暗号化環境変数管理
- **Stash MCP**: セマンティックコード検索・コンテキスト管理
- **OpenRouter MCP**: 200+モデルAPIゲートウェイ
- **Context7 MCP**: リアルタイムライブラリドキュメント統合
- **Cipher MCP**: 高度暗号化・セキュリティサービス
- **Monitoring MCP**: システム監視・メトリクス収集

## 🔄 処理フロー（Processing Flow）

本フォーク（`techdev-cursor`）における **コーディング支援** の End-to-End 経路。実装状況は **AS-IS**（現行）と **To-Be**（P5 / Track C 計画）を併記。

### 全体像

```mermaid
flowchart TB
  subgraph cursor [Cursor IDE — 主経路]
    U[開発者プロンプト]
    U --> MCP{単一 LLM で足りる?}
    MCP -->|Yes| UP[techsapo-providers MCP]
    UP --> AC[analyze_claude]
    UP --> AX[analyze_codex]
    UP --> AG[analyze_agy]
    AC & AX & AG --> CR[コード提案 / 修正 / 説明]
  end

  subgraph ingress [リクエスト入口 — API / 本番分析]
    U2[ユーザープロンプト]
    U2 --> PA{{PromptAnalyzer<br/>形態素解析 To-Be}}
    PA --> TR[TaskRouter + InferenceProfile]
    TR --> RAGQ{RAG / Grounding<br/>必要?}
  end

  subgraph grounding [Grounding / RAG]
    RAGQ -->|Yes| GQ[RAG 検索クエリ生成<br/>parse 結果 + 辞書 v0]
    GQ --> VS[(Vector Store<br/>Google Drive 同期)]
    GQ --> C7[Context7 / 独自 DB 等 To-Be]
    GQ --> GB[Grounding Bundle]
    RAGQ -->|No| WBIN[Wall-Bounce 入力]
    GB --> WBIN
  end

  subgraph wallbounce [Wall-Bounce — 2〜5 ラウンド]
    WBIN --> P1[Provider 1..N 並列/逐次]
    P1 --> CE[Consensus Engine]
    CE --> HG{Hard Gate<br/>confidence ≥0.7<br/>consensus ≥0.6}
    HG -->|未達| P1
    HG -->|達成| AGG[Aggregator<br/>Sonnet / Opus]
  end

  AGG --> OUT[日本語回答 / SSE]
  CR --> OUT2[Cursor エディタ反映]

  U -.->|複雑・多 LLM 合意| U2
```

### A. Cursor 開発支援フロー（本フォークの主経路）

| Step | 処理 | 実装 |
|------|------|------|
| 1 | 開発者が Cursor でタスク入力（実装・リファクタ・デバッグ等） | Cursor IDE |
| 2 | 単一モデルで十分なら `techsapo-providers` MCP を Cursor が stdio spawn | `src/services/techsapo-providers-mcp-server.ts` |
| 3 | MCP tool 呼び出し → CLI アダプタ経由で subscription quota 実行 | `src/adapters/{claude,codex,agy}-adapter.ts` |
| 4 | 結果を Cursor チャット / エディタに反映 | — |

```bash
# 内部経路の例（analyze_codex）
Cursor → MCP CallTool(analyze_codex) → codex-adapter → codex exec（非対話）
```

**PM2 管理外:** stdio MCP は Cursor が都度 spawn（daemon 化しない）。

### B. Wall-Bounce 多 LLM 分析フロー

憲法: **2〜5 ラウンド** · **2+ LLM** · confidence ≥ 0.7 · consensus ≥ 0.6 · `wall-bounce-analyzer.ts` 経由のみ。

| Step | 処理 | AS-IS | To-Be |
|------|------|-------|-------|
| 1 | プロンプト受信 | API / SSE | + **PromptAnalyzer（形態素解析）** |
| 2 | タスク種別・複雑度判定 | regex + ヒューリスティック | parse 特徴量 + 辞書 v0 + TaskRouter |
| 3 | InferenceProfile 解決 | ハードコード preset | `inference-profiles.json`（Track A-2） |
| 4 | Provider 順序決定 | `getProviderOrder(taskType)` | Orchestrator + `devassist-task-router.json` |
| 5 | 2+ LLM 分析（agy / codex / claude SDK 等） | ✅ | adapter 統一（Track B） |
| 6 | コンセンサス・Hard Gate | 部分実装 | 憲法ラウンド enforce（Track C） |
| 7 | Aggregator 合成 → 日本語出力 | ✅ | — |

### C. RAG / Grounding フロー

#### C-1. ドキュメント取り込み（インデックス）

| Step | 処理 | 実装 |
|------|------|------|
| 1 | Google Drive 変更検知 | Webhook / Push notification |
| 2 | ファイル DL → Vector Store 投入 | `googledrive-webhook-handler.ts` → `googledrive-connector.ts` |
| 3 | メタデータ記録 | Redis / mapping |

**AS-IS:** 生テキストをそのまま Embedding。**形態素解析はこのフェーズでは行わない**（後述）。  
**To-Be (optional, gated):** 大量 ingest 時のみ [OpenAI Batch API](./docs/OPENAI_BATCH_API_RAG.md) でチャンク要約・タグ付け — **Phase 0 では実装しない**（`batch_size` は並列数のみ）。

#### C-2. 検索・回答（クエリ時）

| Step | 処理 | AS-IS | To-Be |
|------|------|-------|-------|
| 1 | ユーザークエリ受信 | `/api/v1/rag/search` 等 | — |
| 2 | **形態素解析 + 辞書照合** | ❌ regex 主体 | ✅ **PromptAnalyzer**（RAG 判定後・検索クエリ生成前） |
| 3 | RAG 検索クエリ生成 | 生クエリ / 簡易プロンプト | parse 結果 + 専門語展開 → hybrid search term |
| 4 | Vector Store / MCP 検索 | `file_search` + Google Drive MCP | + hybrid RAG（Phase 2） |
| 5 | Grounding Bundle 構築 | 部分 | GroundingOrchestrator（Phase 1） |
| 6 | Wall-Bounce で根拠付き回答 | ✅（経路分離あり B2） | Orchestrator 統合 |

### D. 形態素解析（PromptAnalyzer）の位置づけ

RAG が必要なリクエストでは、**RAG 検索クエリ生成の前**および**ユーザープロンプト認識（routing）**の精度向上のため、形態素解析による前処理を行う（**Track C-2 / P5 Phase 0 — 計画中**）。

| 項目 | 内容 |
|------|------|
| **タイミング** | プロンプト受信後 **1 回** — Grounding / RAG クエリ生成 **前** |
| **用途** | クエリ正規化 · 専門辞書（`config/fork/devassist-dictionary-v0.json`）照合 · TaskRouter 入力 · hybrid search 用 term 抽出 |
| **共有** | 同一 parse 結果を PromptAnalyzer → TaskRouter / GroundingOrchestrator / RAG term 抽出で再利用 |
| **非用途** | LLM プロンプト本体の形態素「置換」（意味改変リスク）· consensus 計算単体 |

#### 設計上の投入フェーズ（より確からしい位置）

README 上「RAG 投入前の前処理」と読める場合、次の **2 層** に分けて理解する（[P5 §7](./docs/decisions/WALL_BOUNCE_P5_ARCHITECTURE.md#7-形態素解析の位置づけ) 採択）:

| フェーズ | 形態素解析 | 評価 |
|----------|------------|------|
| **① リクエスト入口 — PromptAnalyzer**（RAG **検索クエリ**生成前） | ✅ **第一推奨** | ユーザープロンプト認識・routing・RAG term 抽出を **1 parse で共有**。本リポジトリの To-Be 正規位置。 |
| **② ドキュメント Embedding 前（Vector Store 投入時）** | ⚠️ 一律適用は **非推奨** | Embedding 空間への機械的前処理は意味劣化リスク。Phase 2 hybrid RAG で **索引メタデータのみ**条件付き検討。 |
| **③ LLM へのプロンプト置換** | ❌ **非採用** | 形態素単位の置換は回答品質を損なう。parse は **特徴量・検索語** にのみ使う。 |

> **要点:** 「RAG が必要なときの前処理」= **② の ingest 前ではなく ① のクエリ時 PromptAnalyzer** が主戦場。② は補助的・条件付き。現行 AS-IS では `wall-bounce-analyzer.ts` の regex ベース複雑度判定が代替している。

詳細: [WALL_BOUNCE_SYSTEM.md § Prompt Analysis](./docs/WALL_BOUNCE_SYSTEM.md) · [CURSOR_MCP_TODO § C-2](./docs/CURSOR_MCP_TODO.md) · [P5 §7](./docs/decisions/WALL_BOUNCE_P5_ARCHITECTURE.md#7-形態素解析の位置づけ)

## 🚀 主要機能

> **Fork scope:** This repo (`techdev-cursor`) targets **coding assistance and developer productivity**. Platform capabilities inherited from upstream (e.g. log/incident-style analysis) are **not the primary goal** of this fork — see InfraOps fork line in upstream P5 docs.

### 🤖 Enhanced AI Analysis
- **MCP Wall-Bounce**: Model Context Protocol経由の協調分析
- **Environment Security**: Vault MCP暗号化環境変数管理
- **Code Intelligence**: Stash MCP + cursor-mcp統合コード理解
- **Reference Integration**: Context7必須参照でドキュメント品質向上
- **Multi-Model Gateway**: OpenRouter 200+モデル統合

### 🔐 Advanced Security Features {#security}
- **Vault MCP**: AES-256-GCM暗号化 + JWT認証
- **Redis+File Hybrid**: 高可用性環境変数ストレージ
- **自動ローテーション**: 90日サイクル暗号キー更新
- **監査ログ**: 全アクセスパターン完全追跡
- **RBAC**: ロールベースアクセス制御
- **GDPR/HIPAA準拠**: 機密情報マスキング対応

### 📊 MCP Monitoring & Observability
- **Monitoring MCP**: 専用MCPサーバーによる統合監視
- **Wall-Bounce Metrics**: 品質スコア・コンセンサス・実行時間追跡
- **Vault Security Metrics**: 暗号化操作・認証・アクセス監視  
- **Multi-Service Health**: 全MCPサービス稼働状況統合管理
- **Cost Optimization**: $70/月予算でのリアルタイム最適化

### 🧪 Comprehensive Testing Strategy {#wall-bounce}
- **Property-Based Testing**: fast-check活用の体系的テスト
- **Wall-Bounce Quality Assurance**: 複数LLM品質検証
- **Security Testing**: ReDOS・暗号化・認証脆弱性検出
- **E2E MCP Integration**: 全サービス統合テスト
- **Performance Validation**: 負荷耐性・応答時間検証

### ⚡ Enhanced Performance
- **MCP Protocol Efficiency**: 標準化通信による最適化
- **Concurrent Processing**: 並列MCPサービス実行
- **Reference Caching**: Context7/Stash結果キャッシュ  
- **Quality Thresholds**: 信頼度0.7・コンセンサス0.6自動保証
- **Property-Test Coverage**: 包括的品質保証システム

### 🏗️ 本番環境インフラ
- **Docker完全対応**: フルコンテナ化
- **SSL証明書自動更新**: 90日サイクル
- **ゼロダウンタイム**: Nginx + PM2
- **高可用性**: Prometheus HA + Grafana クラスタリング

## 📋 前提条件

- Node.js 18.0.0 以上
- Docker & Docker Compose（またはPodman）
- **Claude Code CLI**（`claude`）— Anthropic MAX / OAuth（WSL ネイティブ必須。`ANTHROPIC_API_KEY` は MCP/CLI 経路では使わない）
- **Codex CLI**（`codex`）— OpenAI subscription codegen（モデル ID は [OPENAI_MODEL_MATRIX.md](./docs/OPENAI_MODEL_MATRIX.md) へ移行予定）
- **Antigravity CLI**（`agy`）— Google Tier 1（Gemini 2.5 Pro/Flash）。WSL ネイティブ必須
- APIキー: Hugging Face（埋め込み等）、OpenRouter 等（Google Gemini / Anthropic API キー直埋めは禁止）
- （オプション）本番環境用 Redis、MySQL

> 3 つの subscription CLI（`claude` / `codex` / `agy`）は WSL ネイティブでインストール・認証 — 詳細手順: [docs/CURSOR_MCP_TODO.md § A-0](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication)  
> Google Tier 1 / Wall-Bounce: `agy --print` — [docs/ANTIGRAVITY_CLI_MIGRATION.md](docs/ANTIGRAVITY_CLI_MIGRATION.md)

### Claude Code CLI（Anthropic MAX / OAuth）

Cursor MCP の `analyze_claude` およびターミナルからの単発呼び出しに使用。**API キーではなく OAuth サブスクリプション**（MAX 等）を利用します。

```bash
# インストール（WSL — Windows npm の claude.exe ではない）
npm install -g @anthropic-ai/claude-code
which claude   # MUST NOT be /mnt/c/.../npm/claude

# 認証（いずれか）
claude login
# または Windows 資格情報を WSL に symlink:
# ln -sf /mnt/c/Users/<YOU>/.claude/.credentials.json ~/.claude/.credentials.json

# API キーで課金されないよう無効化
unset ANTHROPIC_API_KEY

# 動作確認（MCP アダプタと同じ --print 経路）
claude --print --model sonnet --effort low "Reply with only: ok"
```

| 用途 | コマンド |
|------|----------|
| 対話セッション | `claude` |
| Cursor MCP / スクリプト | `claude --print --model sonnet "…"` |

### Codex CLI（OpenAI subscription）

Non-interactive path used by `analyze_codex`: `codex exec --model <id> …` ([`codex-adapter.ts`](./src/adapters/codex-adapter.ts)). PM2 daemon for Codex MCP: verify CLI subcommand (`codex mcp-server` vs legacy `codex mcp serve`) — [Track F-8](./docs/PROVIDER_INTEGRATION_BACKLOG.md).

```bash
npm install -g @openai/codex
which codex      # WSL ネイティブパスであること
codex login
test -f ~/.codex/auth.json && echo "codex auth ok"

# 動作確認（非対話 — MCP アダプタと同系）
codex exec "Reply with only: ok"
```

### Antigravity CLI（Google Tier 1）

```bash
# インストール（WSL）
curl -fsSL https://antigravity.google/cli/install.sh | bash
which agy   # ~/.local/bin/agy であること（Windows npm の gemini ではない）

# 認証（対話 UI — 初回またはトークン更新時）
agy auth login

# 動作確認（Wall-Bounce と同じ経路: stdin + --print）
echo "Reply with only: ok" | agy --print --model gemini-2.5-flash
echo "Reply with only: ok" | agy --print --model gemini-2.5-pro
```

| 用途 | コマンド |
|------|----------|
| 対話で試す | `agy auth login` |
| Wall-Bounce / スクリプト | `echo "…" \| agy --print --model gemini-2.5-flash` |

オプション: `ANTIGRAVITY_CLI_BIN` でバイナリパスを上書き可能。

### Unified Provider MCP（Cursor — Track A-1）

単一 stdio サーバー `techsapo-providers` が CLI アダプタ経由で各 LLM を直接呼び出します（subscription quota）。Wall-Bounce 本番分析は引き続き API 経由。

| Tool | Provider | Transport |
|------|----------|-----------|
| `analyze_claude` | Claude Code | `claude --print`（OAuth） |
| `analyze_codex` | Codex | `codex exec`（非対話） |
| `analyze_agy` | Antigravity | `agy --print`（stdin） |

```bash
npm run build

# stdio サーバー起動確認（Cursor は自動 spawn — npm run codex-mcp は使わない）
npm run techsapo-providers-mcp
```

Cursor 登録: [config/cursor-mcp.template.json](./config/cursor-mcp.template.json) を Settings → MCP にコピー（`node dist/services/techsapo-providers-mcp-server.js`）。

実装: `src/adapters/*` · `src/services/techsapo-providers-mcp-server.ts` · 将来拡張: [docs/PROVIDER_INTEGRATION_BACKLOG.md](./docs/PROVIDER_INTEGRATION_BACKLOG.md)

## 🛠 クイックスタート

### 1. リポジトリセットアップ
```bash
git clone git@github.com:wombat2006/techdev-cursor.git
cd techdev-cursor
npm install
```

### 2. 環境設定
```bash
cp .env.example .env
# .envファイルにAPIキーを設定
```

### 3. ビルドと起動
```bash
# .env に HUGGINGFACE_API_KEY 等を設定（pm2-start が起動前に検証）
npm run build              # TypeScript ビルド + dist/config/*.json コピー
npm run pm2:start          # techsapo + codex-mcp（= npm start）
# npm run pm2:start:all    # + production-monitor
# npm run pm2:status       # プロセス一覧

# legacy nohup + PID ファイル
# npm run start:legacy
```

### 4. Cursor MCP 登録（オプション）
```bash
# A-0: WSL ネイティブ claude / codex / agy + 認証 — docs/CURSOR_MCP_TODO.md
npm run build
# config/cursor-mcp.template.json を Cursor Settings → MCP に反映
```

## 🎯 MCP エンドポイント

### Wall-Bounce MCP Analysis
```bash
# MCP Wall-Bounce 基本分析
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "wall-bounce-analyze",
      "arguments": {
        "query": "Dockerコンテナ起動問題の解決方法",
        "priority": "standard"
      }
    }
  }'

# 高品質分析（Context7参照付き）
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "wall-bounce-analyze",
      "arguments": {
        "query": "Kubernetes最新ベストプラクティス分析",
        "priority": "high",
        "context": {"useContext7": true}
      }
    }
  }'

# 緊急時対応（全MCPサービス統合）
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "wall-bounce-analyze",
      "arguments": {
        "query": "本番データベース全停止の緊急復旧",
        "priority": "critical"
      }
    }
  }'
```

### Vault MCP 環境変数管理
```bash
# 暗号化環境変数設定
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "vault-set-secret",
      "arguments": {
        "key": "DATABASE_URL",
        "value": "postgresql://user:pass@host:5432/db",
        "environment": "production"
      }
    }
  }'

# 暗号化環境変数取得
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "vault-get-secret",
      "arguments": {
        "key": "DATABASE_URL",
        "environment": "production"
      }
    }
  }'
```

### Context7 MCP ドキュメント参照
```bash
# ライブラリドキュメント取得
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "context7-get-docs",
      "arguments": {
        "libraryId": "/microsoft/typescript",
        "topic": "advanced types",
        "maxTokens": 2000
      }
    }
  }'
```

### ログ解析
```bash
curl -X POST http://localhost:4000/api/v1/analyze-logs \
  -H "Content-Type: application/json" \
  -d '{
    "user_command": "systemctl start mysql",
    "error_output": "Job for mysql.service failed. Connection refused on port 3306",
    "system_context": "Ubuntu 20.04, MySQL 8.0"
  }'
```

### RAG検索
```bash
curl -X POST http://localhost:4000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "過去のサーバー移行手順書を検索",
    "user_drive_folder_id": "1BxYz..."
  }'
```

## 📊 監視とオブザーバビリティ

### アクセス先
- **アプリケーション**: http://localhost:4000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000（admin/techsapo2024!）
- **AlertManager**: http://localhost:9093
- **メトリクス**: http://localhost:4000/metrics

### 主要メトリクス
```prometheus
# 壁打ち分析成功率
techsapo:wallbounce_success_rate

# 平均信頼度スコア（5分間）
techsapo:wallbounce_avg_confidence_5m

# LLMプロバイダー性能
techsapo:llm_success_rate_by_provider{provider="Gemini"}

# 日次コスト追跡
sum(increase(techsapo_wallbounce_cost_usd[24h]))

# HTTP P95応答時間
techsapo:http_p95_response_time
```

### アラート例
- **クリティカル**: 壁打ち合意信頼度 < 0.7（5分間）
- **警告**: 平均応答時間 > 5秒（5分間）
- **情報**: 日次リクエスト数 > 平常時150%

## 🏗️ アーキテクチャ概要

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
│ │Gemini (agy) │ │    └──────────────┘    └─────────────┘
│ │GPT-5.5 fam. │ │
│ │Claude       │ │         ┌──────────────┐
│ │OpenRouter   │ │         │ Redisキャッシュ│
│ └─────────────┘ │         │（ポート 6379）│
└─────────────────┘         └──────────────┘
```

## 📈 デプロイメントオプション

### Docker本番スタック
```bash
# 完全監視環境
docker-compose -f docker/docker-compose.monitoring.yml up -d

# 本番環境デプロイメント
docker-compose -f docker/production/docker-compose.prod.yml up -d
```

### SSL証明書管理
```bash
# 自動更新インストール（90日サイクル）
./scripts/install-renewal-cron.sh

# 手動更新
./scripts/renew-certificates.sh
```

### PM2 プロセス管理（daemon）

長時間稼働プロセスは [ecosystem.config.cjs](./ecosystem.config.cjs) で PM2 管理します。詳細は [MONITORING_OPERATIONS.md](./docs/MONITORING_OPERATIONS.md) を参照。

| PM2 name | 役割 |
|----------|------|
| `techsapo` | メイン API (`dist/index.js`) |
| `codex-mcp` | Codex MCP serve（ops / Wall-Bounce 連携） |
| `production-monitor` | ヘルスポーリング（`pm2:start:all` のみ） |

**stdio MCP は PM2 対象外**（Cursor が spawn）: `techsapo-providers`, `claude-code-mcp`, `codex-mcp-server.js`

| npm script | 内容 |
|------------|------|
| `npm start` / `pm2:start` | techsapo + codex-mcp 起動 |
| `npm stop` / `pm2:stop` | PM2 daemon 停止 |
| `pm2:start:all` | production-monitor も起動 |
| `pm2:status` / `pm2:logs` / `pm2:monit` | 監視 |
| `start:legacy` / `stop:legacy` | nohup + PID ファイル方式 |

```bash
npm run pm2:start
npm run pm2:status
npm run pm2:logs

# 本番 env
PM2_ENV=production npm run pm2:start
```

## 🔐 セキュリティ機能

- **認証**: OpenAI APIキー検証ミドルウェア
- **入力サニタイゼーション**: XSS/SQLインジェクション保護
- **レート制限**: エンドポイント別設定可能制限
- **データプライバシー**: PII マスキングとGDPR準拠
- **監査ログ**: 完全な活動追跡
- **SSL/TLS**: 自動更新証明書

## 💰 コスト管理

- **月次予算**: $70（設定可能）
- **リアルタイム追跡**: リクエスト毎のコスト監視
- **自動アラート**: 予算80%閾値
- **プロバイダー最適化**: コスト効率分析
- **使用量予測**: ML ベース予測

## 🧪 テストと品質保証

```bash
# 包括的テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage  

# Punycode置換テスト
npm test tests/punycode-replacement.test.ts

# 統合テスト
npm run test:integration
```

## 📚 ドキュメント

- **[監視セットアップ](./MONITORING_SETUP.md)**: 完全なPrometheus監視ガイド
- **[Prometheus設計](./docs/prometheus-monitoring-design.md)**: 詳細なメトリクスアーキテクチャ
- **[RAGセットアップガイド](./docs/RAG_SETUP_GUIDE.md)**: GoogleDrive統合
- **[OpenAI Prompt Guidance](./docs/OPENAI_PROMPT_GUIDANCE.md)**: GPT-5.5 / 5.4 / 5.3-Codex 公式ガイダンス統合
- **[OpenAI Model Matrix](./docs/OPENAI_MODEL_MATRIX.md)**: モデル ID・pricing・preset マッピング
- **[OpenAI Batch API for RAG ingest](./docs/OPENAI_BATCH_API_RAG.md)**: 任意の取り込み enrichment（ゲート付き・Phase 0 未実装）
- **[AGENTS.md](./AGENTS.md)**: エージェント共通ナビ（中立 top）
- **[CLAUDE.md](./CLAUDE.md)**: Claude Code 向け shim → AGENTS.md

## 🔧 設定ファイル

```
├── docker/
│   ├── docker-compose.monitoring.yml    # 完全監視スタック
│   ├── prometheus/                       # Prometheus設定
│   ├── grafana/                         # Grafanaダッシュボード
│   └── production/                      # 本番環境デプロイメント
├── src/
│   ├── services/wall-bounce-analyzer.ts # コア分析エンジン
│   ├── metrics/prometheus-client.ts     # カスタムメトリクス
│   └── wall-bounce-server.ts           # メインアプリケーションサーバー
└── scripts/
    ├── start-monitoring.sh              # 監視スタック起動
    └── renew-certificates.sh            # SSL証明書管理
```

## 🌟 本番環境機能

### 高可用性
- **マルチインスタンス**: PM2クラスタモード
- **負荷分散**: Nginxアップストリーム設定
- **ヘルスチェック**: 自動フェイルオーバー
- **グレースフルシャットダウン**: ゼロダウンタイム再起動

### 監視とアラート
- **マルチチャネル通知**: Email、Slack、SMS
- **エスカレーションポリシー**: P0/P1/P2優先度処理
- **SLA監視**: 99.9%稼働率追跡
- **性能最適化**: 自動スケーリング判定

### データ管理
- **バックアップ戦略**: 自動日次バックアップ
- **災害復旧**: リージョン間レプリケーション
- **データ保持**: 15日詳細、90日集約
- **プライバシー準拠**: GDPR/HIPAA対応

## 🤝 貢献方法

1. リポジトリをフォーク
2. 機能ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 壁打ち分析パターンに従う
4. 包括的監視メトリクスを追加
5. テストとドキュメントを含める
6. プルリクエストを送信

## 📄 ライセンス

MITライセンス - エンタープライズ利用可。詳細は[LICENSE](LICENSE)を参照。

## 📞 サポート

- **ドキュメント**: 完全なセットアップガイド付属
- **問題報告**: [GitHub Issues](https://github.com/wombat2006/techsapo/issues)
- **監視**: 組み込みヘルスチェックとアラート
- **コミュニティ**: 日本語サポート

---

**🎯 Cursor 統合開発環境 — techdev-cursor（DevAssist）**
**壁打ち分析システム - 本番環境対応完了！**

*マルチLLMオーケストレーションと包括的Prometheus監視による強力な支援*