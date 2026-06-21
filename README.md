# techdev-cursor

統一 MCP（`analyze_claude` / `analyze_codex` / `analyze_agy`）による日常の Cursor コーディング向けマルチ LLM 基盤。

> **IT 障害解析 / InfraOps ラインではない** — 位置づけは [FORK_CURSOR.md](./docs/ja/FORK_CURSOR.md)。

*[English](README_en.md) | **日本語***

---

## What & why

| | |
|---|---|
| **What** | Cursor 向けの統一 MCP と各社 CLI。社内ドキュメントと専門用語辞書を RAG に載せ、コーディングの文脈を業務に合わせる（前処理 MCP は [term-prep-platform](https://github.com/wombat2006/term-prep-platform) で実装中）。厳密分析は Wall-Bounce |
| **Why** | **手早く・正確に**、業務にフィットした成果物をサブスクの範囲で作るため |
| **Not** | IT 障害の解析・運用向けプラットフォーム。モデルを選べるだけのマルチモデルツール |

---

## なぜ Wall-Bounce か

[Antigravity](https://antigravity.google/docs/models) などは **Claude / GPT / Gemini へのアクセス** を1つの harness にまとめる。**モデル選択** はできても、**1 プロンプトに対して複数 LLM がラウンドを重ねて協調・合意する** 機能はない。

| | マルチモデル harness（例: Antigravity） | Wall-Bounce |
|---|---|---|
| 複数モデルへのアクセス | ✅ | ✅（`agy` / `codex` / `claude`） |
| 同一プロンプトへの多 LLM 協調 | ❌ | ✅ **2–5 ラウンド** + 合意・品質ゲート |
| 出力 | 1 モデル → 1 回答 | 2+ provider → 構造的合意 |

**価値は「どの LLM を使うか」ではなく「複数 LLM をどう協調させるか」。** 日常 Cursor は単一 MCP；厳密分析は Wall-Bounce API。

---

## アーキテクチャ（概要）

社内ドキュメントと専門用語辞書を RAG に取り込んでおくと、Cursor 上のコーディングで **ドメイン用語と根拠** が効き、**業務にフィットした成果物をより正確に、短期間** で出しやすくなります。用語抽出・RAG 前処理 MCP は [term-prep-platform](https://github.com/wombat2006/term-prep-platform) で実装中 — 本 repo 側は [RAG_SETUP_GUIDE.md](./docs/RAG_SETUP_GUIDE.md) · [TO-BE-GLOSSARY-PIPELINE.md](./meta/TO-BE-GLOSSARY-PIPELINE.md)。

```mermaid
flowchart TB
  subgraph trackA["日常 Cursor（Track A）"]
    U1[User]
    CUR[Cursor IDE]
    MCP[techsapo-providers MCP<br/>analyze_claude / codex / agy]
  end

  subgraph knowledge["ナレッジ（この repo）"]
    DOCS[社内ドキュメント]
    DICT[専門用語辞書]
    RAGIO[RAG 出し入れ MCP<br/>実装中]
    GD[googledrive-connector]
    VS[(RAG / Vector Store)]
  end

  subgraph adapters["Adapter 層"]
    AD1[claude-adapter]
    AD2[codex-adapter]
    AD3[agy-adapter]
  end

  subgraph cli["WSL サブスク CLI"]
    CL[claude]
    CX[codex]
    AG[agy]
  end

  subgraph wb["Wall-Bounce（厳密マルチ LLM）"]
    API[Wall-Bounce API]
    WBA[wall-bounce-analyzer]
    PEER[Peer LLM ×2–5 rounds]
    AGG[Aggregator]
  end

  subgraph mem["Layer A（To-Be · TS-22）"]
    REDIS[(OrchestrationSession<br/>Redis)]
  end

  subgraph mon["監視・異常通知"]
    PROM[Prometheus / Grafana]
    AM[Alertmanager]
    LN[line-notification]
    U2[User · LINE]
  end

  U1 --> CUR --> MCP
  MCP --> AD1 & AD2 & AD3
  AD1 --> CL
  AD2 --> CX
  AD3 --> AG
  DOCS --> RAGIO
  DICT --> RAGIO
  RAGIO --> GD --> VS
  VS -.-> CUR
  U1 --> API --> WBA --> PEER --> AGG
  WBA -.-> REDIS
  WBA --> PROM --> AM --> LN --> U2
```

| 経路 | 用途 |
|------|------|
| **Cursor → techsapo-providers → adapter → CLI** | 日常コーディング（単一 MCP 呼び出し） |
| **社内ドキュメント · 専門用語辞書 → RAG** | 業務ドメインに沿った文脈を Cursor コーディングへ（前処理: [term-prep-platform](https://github.com/wombat2006/term-prep-platform) 実装中） |
| **RAG index → Cursor** | 取り込んだナレッジを検索・参照して精度と速度を上げる |
| **Wall-Bounce API → analyzer** | 2+ LLM 協調・合意が必要な分析 |
| **Prometheus → line-notification** | 異常検知時の **LINE Webhook 通知**（実装済み） |

詳細: [ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [RAG_SETUP_GUIDE.md](./docs/RAG_SETUP_GUIDE.md) · [MONITORING_OPERATIONS.md](./docs/MONITORING_OPERATIONS.md)

---

## 次に読むもの

| 目的 | ドキュメント |
|------|-------------|
| **現状・Gate 進捗** | [FORK_STATUS.md](./docs/ja/FORK_STATUS.md) |
| **実行・Track（要約）** | [CURSOR_MCP_TODO_ja.md](./docs/ja/CURSOR_MCP_TODO_ja.md) |
| **実行・Track（正本・英語）** | [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) |
| フォークの位置づけ | [FORK_CURSOR.md](./docs/ja/FORK_CURSOR.md) |
| 設計思想・成熟度 | [FORK_ONBOARDING.md](./docs/ja/FORK_ONBOARDING.md) |
| RAG · 用語辞書（consumer） | [RAG_SETUP_GUIDE.md](./docs/RAG_SETUP_GUIDE.md) · [TO-BE-GLOSSARY-PIPELINE.md](./meta/TO-BE-GLOSSARY-PIPELINE.md) |
| RAG 前処理 MCP（実装中） | [term-prep-platform](https://github.com/wombat2006/term-prep-platform) |
| AI エージェント | [AGENTS.md](./AGENTS.md)（英語） |
| ドキュメント一覧 | [DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| ドキュメント方針 | [DOCUMENTATION_POLICY.md](./docs/DOCUMENTATION_POLICY.md) |

---

## クイックスタート（開発者）

**前提:** Node.js ≥20（`package.json` `engines`）

1. [FORK_CURSOR.md](./docs/ja/FORK_CURSOR.md) — スコープと構成  
2. [CURSOR_MCP_TODO_ja.md](./docs/ja/CURSOR_MCP_TODO_ja.md) — 実行要約 · [§ A-0 詳細（英語）](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication)  
3. `npm run cursor-mcp:config` — Cursor に統一 MCP を登録  
4. RAG / 用語辞書 — [RAG_SETUP_GUIDE.md](./docs/RAG_SETUP_GUIDE.md) · 前処理 MCP は [term-prep-platform](https://github.com/wombat2006/term-prep-platform)（実装中）

---

## 憲法（要約）

Wall-Bounce: **最低 2 ラウンド・最大 5**；confidence ≥ 0.7；consensus ≥ 0.6；実装は `wall-bounce-analyzer.ts` のみ。

**To-Be UX:** Aggregator 出力後の会話継続・negative 再試行（upward temperature jitter）— [TS-24 ADR](./docs/decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md)（実装は Track B）。

詳細: [AGENTS.md](./AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)（英語）

---

## ライセンス・サポート

MIT — [package.json](./package.json) の `license` フィールドを参照。Issue: [GitHub](https://github.com/wombat2006/techdev-cursor/issues)。
