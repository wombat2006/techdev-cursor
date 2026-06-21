# フォーク オンボーディング — 設計の概要と成熟度

*[English](../FORK_ONBOARDING.md) | **日本語***

**目的:** 設計思想と、現状（AS-IS）・計画（To-Be）を正直に示す（採用候補、レビュア、新メンバー向け）。  
**ではない:** 実行チェックリスト — [CURSOR_MCP_TODO_ja.md](./CURSOR_MCP_TODO_ja.md)（要約）· [英語 runbook](../CURSOR_MCP_TODO.md) を使う。  
**状態:** 有効 · **最終更新:** 2026/06/21 19:59:15 JST  
**関連:** [FORK_CURSOR.md](./FORK_CURSOR.md) · [FORK_STATUS.md](./FORK_STATUS.md) · [TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md) · [DOCUMENTATION_POLICY.md](../DOCUMENTATION_POLICY.md)

---

## 設計思想（要約）

### 目指すもの

**Cursor 統合の開発基盤**です。Claude / Codex / Gemini（Antigravity）を単一モデルに頼らず協調させ、**手早く・正確に・サブスクの範囲で**、実務のソフトウェア開発を進められるようにします。

### 課題と方針

| 課題 | 本リポジトリの方針 |
|------|-------------------|
| 単一 LLM のコーディングは速いが誤りやすい | **Wall-Bounce** — 信頼性が要る分析では複数 LLM と品質閾値で合意 |
| モデル使い分けの場当たりでコストが膨らむ | **TS-21 カタログ** — 特性・料金・ルーティングを JSON で構造化 |
| Claude / Codex / Gemini でツールがバラバラ | **統一 MCP**（`techsapo-providers`）— Cursor からの入口を一本化 |
| RAG 取り込み前の用語のブレ | **Glossary consumer**（Phase 0）— extract → adopt/hold；platform CLI は read-only（[TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md)） |
| リポジトリへのシークレット混入 | **CLI / OAuth のみ** — API キー禁止（[SECURITY.md](../SECURITY.md)） |

### 設計のポイント

- **関心の分離:** カタログ（WHAT）· InferenceProfile（HOW）· adapter（CLI への接続）
- **ADR** — スタック判断は `docs/decisions/` に記録（属人知識にしない）
- **フォークのスコープを明確化** — Cursor 上のコーディング支援。**IT 障害解析ラインではない**
- **Plan A のエージェント文書** — 中立な [AGENTS.md](../../AGENTS.md) とツール別 shim

### 対象外

- ノーコードで「任意の業務システム」を生成するツール **ではない** — プロの開発を加速する
- InfraOps / オンコール障害対応プラットフォーム **ではない**
- 「ChatGPT の冗長版」**ではない** — 憲法・ADR・マルチベンダー運用の規律がある

---

## 成熟度の整理（AS-IS と To-Be）

**Gate の JST タイムスタンプ**は [FORK_STATUS.md](./FORK_STATUS.md)。要約:

| 領域 | AS-IS（現状） | To-Be（計画） |
|------|---------------|---------------|
| 統一 MCP + adapter | **実装済** + G7 Pass | 日常 smoke + A-2 / A-3 |
| Cursor 日常コーディング | 単一 MCP パス | 同左（設計どおり） |
| 厳密なマルチ LLM 分析 | Wall-Bounce API あり | Track C で憲法をコード enforce |
| モデルカタログ（TS-21） | JSON + schema | runtime loader + TaskRouter（Track F） |
| メモリ（TS-22） | ADR + schema；G-MEM 済 | M1 store + `sessionId`（Track B） |
| セッション継続（TS-24） | ADR — Aggregator 後フォロー + negative retry | Track B で Layer A と配線 |
| Glossary prep（RAG） | **Phase 0** — consumer config・初回 extract・adopt/hold；`npm run glossary:extract` | Phase 2.5 knowledge filter · Phase 4 connector hook |
| OpenAI の深掘り | Cookbook / prompt guidance 反映済 | Anthropic / Google へ同パターンで展開 |

---

## マルチベンダー統合の進捗

公式 Cookbook / 各社 platform docs を [TS-21](../decisions/TECH_STACK_LLM_MODEL_CATALOG.md)（`config/llm-model-catalog.json`）へ取り込む。**OpenAI が先行**。

```text
OpenAI     ████████░░  取り込み中（Cookbook · prompt guidance · pricing）
Anthropic  ██░░░░░░░░  計画中（Claude 公式 docs → TS-21）
Google     ██░░░░░░░░  基盤のみ（agy 運用；catalog enrich はこれから）
```

| Provider | TS-21 | 公式 docs の統合 | 状態 |
|----------|-------|------------------|------|
| **OpenAI** | GPT-5.x / Codex | [Cookbook](../OPENAI_COOKBOOK_INTEGRATION.md) 等 | **先行** |
| **Anthropic** | Claude 要約 | 順次 TS-21 へ | **計画中** |
| **Google** | Gemini 要約 | [Antigravity CLI](../ANTIGRAVITY_CLI_MIGRATION.md) 等 | **基盤** |

> バーは公式知見のカタログ取込み度（本番コードの完成度とは別軸）。

---

## 設計テーマ（詳細へのリンク）

| テーマ | 要約 | 詳細 |
|--------|------|------|
| **Wall-Bounce 憲法** | 単一 LLM 禁止 · 2–5 ラウンド · confidence ≥ 0.7 / consensus ≥ 0.6 | [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md) · [AGENTS.md](../../AGENTS.md) |
| **TS-21 カタログ** | モデル特性 · transport · pricing | [TECH_STACK_LLM_MODEL_CATALOG.md](../decisions/TECH_STACK_LLM_MODEL_CATALOG.md) |
| **TS-20 InferenceProfile** | リクエスト単位の effort / CoT / temperature | [TECH_STACK_INFERENCE_PROFILES.md](../decisions/TECH_STACK_INFERENCE_PROFILES.md) |
| **TS-22 メモリ** | Layer A transcript · UTC · TTL | [TECH_STACK_MEMORY_SUBSTRATE.md](../decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |
| **TS-24 セッション継続** | Aggregator 後フォロー · upward-jitter negative retry | [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](../decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| **Glossary consumer** | consumer のみ編集 · sibling platform invoke · adopt/hold | [TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md) · [RAG_SETUP_GUIDE.md](../RAG_SETUP_GUIDE.md) |
| **フォークのスコープ** | Cursor コーディング支援 | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| **セキュリティ** | subscription CLI / SDK のみ | [SECURITY.md](../SECURITY.md) |
| **OpenAI（先行）** | prompt guidance · Cookbook · cost tiers | [OPENAI_COOKBOOK_INTEGRATION.md](../OPENAI_COOKBOOK_INTEGRATION.md) |
| **ADR** | スタック判断は `docs/decisions/` | [decisions/README.md](../decisions/README.md) |

---

## 実行の優先度（ロードマップ要約）

詳細: [CURSOR_MCP_TODO § Track priority](../CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review)（英語）。Gate 順は **A → B → C** 固定。

| 優先度 | 焦点 | Track |
|--------|------|-------|
| **P0** | Cursor から AI ツールを使える | A — **Gate A→B Pass** |
| **P1** | 分析 API も同一 adapter · preset · Layer A | **B** ← **現在** |
| **P2** | コスト aware routing · catalog loader | E / F |
| **P3** | 憲法のコード enforce | C |
| **P4** | cache · Batch RAG · grounding（任意） | D / P5+ |

日常コーディング: **単一 MCP**。厳密分析: **Wall-Bounce API**（2–5 ラウンド）。コード enforce: Track C（To-Be）。
