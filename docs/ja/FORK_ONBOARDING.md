# フォーク onboarding — 設計深度と成熟度

*[English](../FORK_ONBOARDING.md) | **日本語***

**目的:** 設計思想と正直な AS-IS / To-Be（採用候補、レビュア、新メンバー向け）。  
**ではない:** 実行チェックリスト — [CURSOR_MCP_TODO_ja.md](./CURSOR_MCP_TODO_ja.md) / [英語 runbook](../CURSOR_MCP_TODO.md) を使う。  
**関連:** [FORK_CURSOR.md](./FORK_CURSOR.md) · [FORK_STATUS.md](./FORK_STATUS.md) · [TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md) · [DOCUMENTATION_POLICY.md](../DOCUMENTATION_POLICY.md)

**最終更新:** 2026/06/21 19:59:15 JST

---

## 設計思想（要約）

**これは何か**  
**Cursor 統合開発プラットフォーム** — 単一モデルに依存せず、Claude / Codex / Gemini（Antigravity）を協調させ、**簡便・正確・サブスク規模のコスト**で実課題のソフトウェアを作る。

### 解く課題

| ペイン | 本 repo の方針 |
|------|----------------|
| 単一 LLM コーディングは速いが誤りやすい | **Wall-Bounce** — 信頼性が要る分析では多 LLM + 品質閾値 |
| モデル使い分けの場当たり → コスト膨張 | **TS-21 catalog** — 特性・pricing・routing を JSON で構造化 |
| Claude / Codex / Gemini でツールがバラバラ | **統一 MCP**（`techsapo-providers`）— Cursor 1 入口 |
| RAG 前の用語ドリフト | **Glossary consumer**（Phase 0）— extract → adopt/hold；platform CLI は read-only（[TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md)） |
| リポジトリにシークレット | **CLI/OAuth のみ** — API key 禁止（[SECURITY.md](../SECURITY.md)） |

### エンジニアリングのこだわり

- **関心の分離:** catalog（WHAT）· InferenceProfile（HOW）· adapter（CLI への BIND）
- **ADR** — `docs/decisions/` にスタック判断を記録
- **フォークスコープ明確化** — Cursor コーディング支援。**IT 障害解析ラインではない**
- **Plan A エージェント doc** — 中立 [AGENTS.md](../../AGENTS.md) + ツール別 shim

### これは何ではないか

- ノーコードで「任意の業務システム」を生成するツール **ではない** — プロの開発を加速
- InfraOps / オンコール障害プラットフォーム **ではない**
- 「ChatGPT の冗長版」**ではない** — 憲法・ADR・マルチベンダー規律あり

---

## 正直な成熟度（AS-IS vs To-Be）

**Gate の JST タイムスタンプ**は [FORK_STATUS.md](./FORK_STATUS.md)。要約:

| 領域 | AS-IS | To-Be |
|------|-------|-------|
| 統一 MCP + adapter | **実装済** + G7 | daily smoke + A-2/A-3 |
| Cursor 日常コーディング | 単一 MCP パス | 同左 |
| 厳密マルチ LLM 分析 | Wall-Bounce API あり | Track C で憲法 enforce |
| Model catalog（TS-21） | JSON + schema | runtime loader + TaskRouter（F） |
| Memory（TS-22） | ADR + schema；G-MEM 済 | M1 store + `sessionId`（B） |
| Session continuation（TS-24） | ADR — Aggregator 後フォロー + negative retry | Track B で Layer A と配線 |
| Glossary prep（RAG） | **Phase 0** — consumer config・初回 extract・adopt/hold；`npm run glossary:extract` | Phase 2.5 knowledge filter · Phase 4 connector hook |
| OpenAI 深掘り | Cookbook / prompt guidance 反映済 | Anthropic / Google へ横展開 |

---

## マルチベンダー統合成熟度（進行中）

公式 Cookbook / platform docs を [TS-21](../decisions/TECH_STACK_LLM_MODEL_CATALOG.md)（`config/llm-model-catalog.json`）へ取込。**OpenAI 先行**。

```text
OpenAI     ████████░░  深掘り中（Cookbook · prompt guidance · pricing）
Anthropic  ██░░░░░░░░  計画中（Claude 公式 docs → TS-21）
Google     ██░░░░░░░░  基盤のみ（agy 運用；catalog enrich はこれから）
```

| Provider | TS-21 | 公式 docs 統合 | 状態 |
|----------|-------|----------------|------|
| **OpenAI** | GPT-5.x / Codex | [Cookbook](../OPENAI_COOKBOOK_INTEGRATION.md) 等 | **先行** |
| **Anthropic** | Claude 要約 | 順次 TS-21 へ | **計画中** |
| **Google** | Gemini 要約 | [Antigravity CLI](../ANTIGRAVITY_CLI_MIGRATION.md) 等 | **基盤** |

> バー = 公式知見のカタログ取込み度（本番コード完成度とは別軸）。

---

## 設計テーマ（リンク）

| テーマ | 要約 | 詳細 |
|--------|------|------|
| **Wall-Bounce 憲法** | 単一 LLM 禁止 · 2–5 ラウンド · confidence ≥ 0.7 / consensus ≥ 0.6 | [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md) · [AGENTS.md](../../AGENTS.md) |
| **TS-21 catalog** | モデル特性 · transport · pricing | [TECH_STACK_LLM_MODEL_CATALOG.md](../decisions/TECH_STACK_LLM_MODEL_CATALOG.md) |
| **TS-20 InferenceProfile** | リクエスト単位 effort / CoT / temperature | [TECH_STACK_INFERENCE_PROFILES.md](../decisions/TECH_STACK_INFERENCE_PROFILES.md) |
| **TS-22 Memory** | Layer A transcript · UTC · TTL | [TECH_STACK_MEMORY_SUBSTRATE.md](../decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |
| **TS-24 Session continuation** | Aggregator 後フォロー · upward-jitter negative retry | [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](../decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| **Glossary consumer** | consumer のみ編集 · sibling platform invoke · adopt/hold | [TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md) · [RAG_SETUP_GUIDE.md](../RAG_SETUP_GUIDE.md) |
| **フォークスコープ** | Cursor コーディング支援 | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| **セキュリティ** | subscription CLI / SDK のみ | [SECURITY.md](../SECURITY.md) |
| **OpenAI（先行）** | prompt guidance · Cookbook · cost tiers | [OPENAI_COOKBOOK_INTEGRATION.md](../OPENAI_COOKBOOK_INTEGRATION.md) |

---

## 実行優先度（ロードマップ要約）

詳細: [CURSOR_MCP_TODO § Track priority](../CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review)（英語）。Gate 順 **A → B → C** 固定。

| 優先 | 焦点 | Track |
|------|------|-------|
| **P0** | Cursor から AI ツールを使える | A — **Gate A→B Pass** |
| **P1** | 分析 API も同一 adapter · preset · Layer A | **B** ← **現在** |
| **P2** | コスト aware routing · catalog loader | E / F |
| **P3** | 憲法のコード enforce | C |
| **P4** | cache · Batch RAG · grounding（任意） | D / P5+ |

日常: **単一 MCP**。厳密分析: **Wall-Bounce API**（2–5 ラウンド）。コード enforce: Track C（To-Be）。
