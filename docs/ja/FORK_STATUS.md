# フォーク状況 — `techdev-cursor`

*[English](../FORK_STATUS.md) | **日本語***

**人間向けローリングスナップショット**（メンテナ、チーム、レビュア）。  
**最終更新:** 2026/06/23 04:10:38 JST  
**実行手順:** [CURSOR_MCP_TODO_ja.md](./CURSOR_MCP_TODO_ja.md)（要約）· [英語 runbook](../CURSOR_MCP_TODO.md) · **方針:** [DOCUMENTATION_POLICY.md](../DOCUMENTATION_POLICY.md)

> **Gate レビュー**と**主要 Track マイルストーン**で更新（P0）。README 本文に進捗を重複しない。  
> **タイムスタンプ:** `YYYY/MM/DD HH:mm:ss JST`（Asia/Tokyo）。マイルストーン時刻は sign-off / merge commit を基準 — **推測・未来時刻は禁止**。取得: `node scripts/fork-status-timestamp.mjs <commit>`

---

## スナップショット

| 項目 | 値 |
|------|-----|
| **リポジトリ** | `wombat2006/techdev-cursor`（DevAssist フォーク） |
| **現在のフォーカス** | **Track B** — Layer A 記憶（M1）· InferenceProfile ファイル（B-0）· adapter 配線（B-1） |
| **直近 Gate** | **Gate A→B Pass** — 2026/06/18 17:22:09 JST · G1–G7 + G-MEM |
| **次 Gate** | Gate B→C（Track B 完了後） |
| **到達像** | 日常 Cursor コーディングは **単一 MCP**（`analyze_*`）；厳密マルチ LLM は **Wall-Bounce API** + 同一 adapter + Layer A |

---

## Gate 進捗

| Gate | 状態 | タイムスタンプ (JST) | メモ |
|------|------|---------------------|------|
| **G-MEM**（TS-22 設計） | ✅ クローズ | 2026/06/18 16:49:20 | ADR v1.3 採択；M1 Redis store = Track B |
| **Gate A→B** | ✅ **Pass** | 2026/06/18 17:22:09 | G1–G7 + G-MEM すべて Yes |
| **Gate B→C** | `[ ]` 未了 | — | B-0…B-3 + memory M1–M3 最低限後 |
| **Gate C**（P5 Phase 0） | `[ ]` 未了 | — | Gate B→C Pass 後 |

Gate 順 **A → B → C** 固定 — [CURSOR_MCP_TODO § Track priority](../CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review)（英語）

---

## Track 状況

| Track | 優先度 | 状態 | 概要 |
|-------|--------|------|------|
| **A** — Cursor MCP | P0 | `[~]` 残タスクのみ | A-0/A-1/G7 ✅；**A-2** MCP スキーマ · **A-3** チーム登録 — **B をブロックしない** |
| **B** — InferenceProfile + adapter + memory | P1 | `[ ]` **アクティブ** | B-0 部分（matrix+catalog resolver ✅）；M1 store 未；B-1 WB 配線未 |
| **C** — P5 Phase 0 | P3 | `[ ]` ブロック | Hard gate · PromptAnalyzer · 憲法ラウンド · orchestrator 統合 |
| **E / F** — catalog / cost routing | P2 | `[~]` 部分 | F-1 ✅ · F-2 loader 部分 · F-3+ 未 |
| **D / P5+** — cache · Batch RAG · grounding | P4 | `[~]` 部分 | Glossary consumer **Phase 0** ✅（RAG prep）；platform ストレージ/Vector コネクタ · Batch RAG · grounding 未 |

---

## 直近ゴール（Track B）

| # | ゴール | 成果物 | 状態 |
|---|--------|--------|------|
| **M1** | Layer A オーケストレーション transcript 永続化 | `OrchestrationSessionStore` + Redis `orch:session:*` | `[ ]` 型/schema/config ✅；Redis 未 |
| **B-0** | リクエスト単位 model / effort / CoT preset | `inference-profiles.json` + TS-20 + TS-24 `retryOnNegative` | `[~]` matrix+catalog resolver ✅；preset JSON ファイル未 |
| **B-4** | 実行モードルーティング（TS-25） | 並列→合議→閾値分岐；キーワード/MCP 上書き | `[ ]` |
| **B-5** | SSE + Layer A 可観測性 | SSE イベント拡張；ラウンドストリーム | `[ ]` |
| **B-6** | CLI invoke metadata（TS-26） | adapter 境界で `usage` / `stop_reason` / `session_id` | `[~]` ADR + wire/正規化 schema ✅；adapter パース未 |
| **B-1** | Cursor + Wall-Bounce で同一 transport | `wall-bounce-analyzer.ts` + `rag-endpoint.ts` → `src/adapters/*` | `[ ]` |
| **M2–M6** | セッション継続 + legacy 統合 | `sessionId` · Layer A ラウンドイベント · TS-22 codex-session 統合 | `[ ]` |

**推奨順:** M1 → B-0 → B-1（[Codex review crosswalk](../CURSOR_MCP_TODO.md#codex-review-crosswalk-2026-06-18)）

---

## 完了済み（フォーク）

| 領域 | タイムスタンプ (JST) | メモ |
|------|---------------------|------|
| Fork Day 0 | 2026/06/18 08:14:02 | `forkProfile.yaml`、`config/fork/*`、adapter 配置 |
| **A-0** WSL CLI 認証 | 2026/06/18 14:39:15 | `claude` / `codex` / `agy` プローブ通過 |
| **A-1** 統一 MCP + adapter | 2026/06/18 14:50:36 | `techsapo-providers-mcp-server.ts`、`src/adapters/*`、resolver テスト |
| **A-1 ops** + **G7** | 2026/06/18 17:22:09 | Cursor Connected；Agent `analyze_*` ×3 OK |
| Portable MCP config | 2026/06/18 17:15:53 | `npm run cursor-mcp:config` |
| Codex adapter（MCP cwd） | 2026/06/18 17:22:09 | `--skip-git-repo-check` |
| **TS-21** model catalog | 2026/06/18 09:37:54 | JSON + schema；runtime loader = Track F |
| **TS-22** memory substrate | 2026/06/18 16:49:20 | ADR v1.3；G-MEM クローズ |
| README AS-IS/To-Be | 2026/06/18 17:36:22 | → [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) |
| Codex review crosswalk | 2026/06/19 10:54:25 | runbook マッピングのみ |
| **DOCUMENTATION_POLICY** v0.1 | 2026/06/19 11:13:24 | README slim · P0/P1/P2 |
| **Doc migration** §10 | 2026/06/19 11:31:42 | README slim · legacy phase 1 · INDEX trim |
| **Human docs ja pairs** (B2b) | 2026/06/19 11:47:05 | `docs/ja/` FORK_STATUS · ONBOARDING · CURSOR · runbook summary |
| **Contract Layer** | 2026/06/19 13:22:54 | F-1 validate:config · catalog loader · adapter-preset-matrix · contract tests · simulate guard |
| **TS-23** user-extensible LLM | 2026/06/19 13:30:04 | ADR L1–L2 — [TECH_STACK_USER_EXTENSIBLE_LLM.md](../decisions/TECH_STACK_USER_EXTENSIBLE_LLM.md) |
| **TS-24** session continuation + retry | 2026/06/19 13:46:26 | Layer A 継続 + upward jitter 再試行 — [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](../decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| **Glossary-knowledge MCP**（初回） | 2026/06/21 18:26:39 | `.cursor/mcp.json` — `glossary-knowledge` 登録（絶対パス） |
| **Glossary consumer Phase 0**（config） | 2026/06/21 18:59:51 | `meta/glossary-config.json`、adopt/hold 分割 — [TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md) |
| **Glossary Phase 0 docs sync** | 2026/06/21 19:12:00 | README、MCP_SERVICES、RAG_SETUP_GUIDE、mcp-rules、TO-BE 検証節 |
| **Glossary-knowledge MCP**（tracked） | 2026/06/21 19:20:43 | `.cursor/mcp.json` sibling `../term-prep-platform` 相対パス |
| **Glossary 初回 extract** | 2026/06/21 19:28:52 | interim corpus（11 md）；`npm run glossary:extract` |
| **Glossary consumer boundary** | 2026/06/21 19:48:06 | consumer のみ編集；platform read-only；escalation 方針 |
| **Glossary portable output paths** | 2026/06/21 19:59:15 | `normalize-glossary-output.py`；adopt/hold の相対パス |
| **ByteRover CLI**（Cipher 移行） | 2026/06/22 18:57:50 JST | `byterover-cli`；`brv` MCP；`setup-brv-provider` |
| **Portable MCP wrappers**（tracked） | 2026/06/22 19:17:51 JST | `.cursor/mcp.json` + `scripts/cursor-mcp-*.sh`；通常 pull 後の regen/Reload 不要 |
| **Wall-Bounce AS-IS / To-Be 文書** | 2026/06/22 19:47:16 JST | コード監査 → AS-IS/To-BE/BACKLOG + TS-25；README ゴール·現在地·ロードマップ |
| **TS-26 CLI metadata + README 図** | 2026/06/22 22:05:40 JST | TS-26 ADR；B-6 runbook/backlog；README コード準拠 mermaid（index.ts · legacy spawn · SRP 分岐） |
| **TS-26 wire schema + Codex 検証** | 2026/06/22 22:41:19 JST | provider 別 JSON Schema；正規化 metadata；Codex JSONL fixture・契約テスト |
| **TS-27 Ollama gateway ADR** | 2026/06/22 22:50:56 JST | 草案：ローカル HTTP adapter・cloud（`:cloud`）+ ローカルモデル；WB-19 |
| **Anthropic catalog + docs** | 2026/06/23 02:59:52 JST | Sonnet 4.6；Opus 4.6 集約デフォルト + 4.8 エスカレーション；プラットフォーム統合ガイド |
| **SRP monolith refactor（Phase 0–2）** | 2026/06/23 04:09:50 JST | 11 monolith → module dir + shim；70 module tests；`mcp-config-manager/` 含む；[SRP_MONOLITH_REFACTOR.md](../SRP_MONOLITH_REFACTOR.md) · [SRP_REFACTOR_DEPENDENCY_ORDER.md](../SRP_REFACTOR_DEPENDENCY_ORDER.md) |

---

## 未完了（明示）

| 項目 | Track | メモ |
|------|-------|------|
| Redis `OrchestrationSessionStore` | M1 | Layer A 本番必須 |
| Wall-Bounce → adapter 配線 | B-1 | `wall-bounce-analyzer.ts` legacy spawn 残存 |
| RAG `/search` legacy MCP 並行 | B-1 | `rag-endpoint.ts` 未統合 |
| 憲法 enforce（2–5 ラウンド） | C | AS-IS: 1-pass；To-Be 壁打ちモード時のみ（[TS-25](../decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md)） |
| `inference-profiles.json` 実ファイル | B-0 | effort/cot preset JSON 未 |
| simulate / legacy MCP 経路 | B-1 | `mcp-clients` ガード済；rag-endpoint は adapter 統合まで simulate |
| A-2 InferenceProfile in MCP | A | 非ブロック |
| A-3 チーム MCP 登録 | A | 非ブロック |
| Glossary Phase 2.5 knowledge filter | RAG prep | MCP classify（NullProvider 超）— **platform 変更**（ユーザーへ通知） |
| Glossary Phase 4 ストレージ / Vector コネクタ | RAG prep | レガシー `googledrive-connector/` シムは本 repo → **term-prep-platform** へ委譲（Drive、S3、OneDrive、RAG Vector） |
| Google Drive ローカルミラー corpus | RAG prep | interim `corpus.files` 差替え |
| `filter.max_candidates_output` cap | RAG prep | config あり；platform extractor 未対応 — **platform 変更** |
| `docs/legacy/` phase 2 | docs | `mcp-*.md` クラスタ（任意） |
| Ollama gateway adapter | TS-27 L3 | [TS-27](../decisions/TECH_STACK_OLLAMA_GATEWAY.md) 草案 — `ollama signin` + `localhost:11434` |

---

## AS-IS vs To-Be（要約）

| 領域 | AS-IS（現状） | To-Be（計画） |
|------|---------------|---------------|
| **Cursor 日常 dev** | 単一 MCP（`analyze_*`）+ サブスク CLI | 同左（設計どおり） |
| **統一 MCP + adapter** | 実装済 + G7 Pass | A-2 / A-3 の残タスク；MCP・adapter の動作確認を継続 |
| **Wall-Bounce API** | legacy spawn；1-pass 並列/逐次；閾値分岐なし | B-4 TS-25 · B-1 adapter · Track C で壁打ちモード時 2–5 ラウンド |
| **オーケストレーション記憶** | ADR + schema・型のみ（Redis 未） | M1 Redis + M2–M6 配線；TS-24 継続・再試行 |
| **InferenceProfile** | matrix + catalog resolver（Contract Layer） | B-0 `inference-profiles.json` |
| **Model catalog（TS-21）** | JSON + schema；F-1 validate；F-2 loader 部分 | F-3 TaskRouter + コスト routing |
| **Glossary prep（RAG）** | Phase 0 — config・extract・adopt/hold；`googledrive-connector/` モジュール shim（レガシー） | Phase 2.5 filter · platform ストレージ + RAG Vector コネクタ |
| **ドキュメント入口** | 薄い README → 本 doc + ONBOARDING | 現状維持（進捗は本 doc） |
| **Legacy platform docs** | `docs/legacy/` 隔離済（phase 1） | phase 2 任意（残クラスタ整理） |

詳細: [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)（英語）

---

## Track A 残（非ブロック）

| タスク | 状態 |
|--------|------|
| **A-2** — 統一 MCP スキーマへ InferenceProfile | `[ ]` |
| **A-3** — チームメイト 1 名以上 MCP 登録 | `[ ]` |

---

## 関連ドキュメント

| 目的 | ドキュメント |
|------|-------------|
| **実行（要約）** | [CURSOR_MCP_TODO_ja.md](./CURSOR_MCP_TODO_ja.md) |
| **実行（正本・英語）** | [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) |
| **フォーク identity** | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| **設計深度** | [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) |
| **Glossary consumer** | [TO-BE-GLOSSARY-PIPELINE.md](../../meta/TO-BE-GLOSSARY-PIPELINE.md) · [RAG_SETUP_GUIDE.md](../RAG_SETUP_GUIDE.md) |
| **方針** | [DOCUMENTATION_POLICY.md](../DOCUMENTATION_POLICY.md) |

---

**変更履歴**

| タイムスタンプ (JST) | 変更 |
|---------------------|------|
| 2026/06/23 04:09:50 JST | SRP monolith refactor Phase 0–2 — 11 分割（mcp-config-manager 含む）・70 module tests・SRP_* docs + README 同期 |
| 2026/06/23 03:00:14 JST | SRP monolith refactor Phase 0–1 — 10 分割・module tests・SRP_* docs；README / DEVELOPMENT_GUIDE 同期 |
| 2026/06/22 22:50:56 JST | TS-27 Ollama gateway ADR（草案）；TO-BE gap + WB-19 backlog |
| 2026/06/22 22:41:19 JST | TS-26 provider 別 wire JSON Schema + 正規化 metadata；Codex JSONL 検証；契約テスト |
| 2026/06/22 22:05:40 JST | TS-26 CLI metadata ADR；B-6 Track B；README コード準拠アーキテクチャ図；関連 doc 同期 |
| 2026/06/22 19:47:16 | Wall-Bounce コード監査 — AS-IS/To-BE/BACKLOG + TS-25；README ゴール/現在地/ロードマップ；Track B-4/B-5・Gate 整合 |
| 2026/06/22 19:17:51 | Portable MCP — tracked `.cursor/mcp.json` + bash wrappers；通常 pull 後の `cursor-mcp:config`/Reload 不要（007e0f90 方針を撤回） |
| 2026/06/21 23:26:30 | コネクタ委譲を記載（Drive / S3 / OneDrive / RAG Vector → term-prep-platform）；googledrive-connector は AS-IS レガシー |
| 2026/06/21 21:28:26 | 「daily smoke」を MCP・adapter の動作確認継続と明記（FORK_STATUS・ONBOARDING en/ja） |
| 2026/06/21 21:24:03 | Track A の「尾/tail」を残タスク/remainder に置換（FORK_STATUS・ONBOARDING・runbook 要約） |
| 2026/06/21 21:18:49 | AS-IS vs To-Be 要約を修正 — legacy phase 1 を AS-IS に、Wall-Bounce/記憶行を整合；en/ja 同期 |
| 2026/06/21 19:59:15 | Glossary Phase 0 — extract・consumer boundary・相対パス；FORK_ONBOARDING 同期 — 英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期 |
| 2026/06/19 13:46:26 | TS-24 — 英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期 |
| 2026/06/19 13:30:04 | Contract Layer + TS-23 — 英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期 |
| 2026/06/19 11:47:05 | 初版 — B2b 日本語ペア（英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期） |
