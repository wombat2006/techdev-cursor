# フォーク状況 — `techdev-cursor`

*[English](../FORK_STATUS.md) | **日本語***

**人間向けローリングスナップショット**（メンテナ、チーム、レビュア）。  
**最終更新:** 2026/06/21 21:24:03 JST  
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
| **D / P5+** — cache · Batch RAG · grounding | P4 | `[~]` 部分 | Glossary consumer **Phase 0** ✅（RAG prep）；connector hook · Batch RAG · grounding 未 |

---

## 直近ゴール（Track B）

| # | ゴール | 成果物 | 状態 |
|---|--------|--------|------|
| **M1** | Layer A オーケストレーション transcript 永続化 | `OrchestrationSessionStore` + Redis `orch:session:*` | `[ ]` 型/schema/config ✅；Redis 未 |
| **B-0** | リクエスト単位 model / effort / CoT preset | `inference-profiles.json` + TS-20 + TS-24 `retryOnNegative` | `[~]` matrix+catalog resolver ✅；preset JSON ファイル未 |
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

---

## 未完了（明示）

| 項目 | Track | メモ |
|------|-------|------|
| Redis `OrchestrationSessionStore` | M1 | Layer A 本番必須 |
| Wall-Bounce → adapter 配線 | B-1 | `wall-bounce-analyzer.ts` legacy spawn 残存 |
| RAG `/search` legacy MCP 並行 | B-1 | `rag-endpoint.ts` 未統合 |
| 憲法 enforce（2–5 ラウンド） | C | AS-IS: 単 pass + aggregator |
| `inference-profiles.json` 実ファイル | B-0 | effort/cot preset JSON 未 |
| simulate / legacy MCP 経路 | B-1 | `mcp-clients` ガード済；rag-endpoint は adapter 統合まで simulate |
| A-2 InferenceProfile in MCP | A | 非ブロック |
| A-3 チーム MCP 登録 | A | 非ブロック |
| Glossary Phase 2.5 knowledge filter | RAG prep | MCP classify（NullProvider 超）— **platform 変更**（ユーザーへ通知） |
| Glossary Phase 4 connector hook | RAG prep | `googledrive-connector.ts` 未配線 |
| Google Drive ローカルミラー corpus | RAG prep | interim `corpus.files` 差替え |
| `filter.max_candidates_output` cap | RAG prep | config あり；platform extractor 未対応 — **platform 変更** |
| `docs/legacy/` phase 2 | docs | `mcp-*.md` クラスタ（任意） |

---

## AS-IS vs To-Be（要約）

| 領域 | AS-IS（現状） | To-Be（計画） |
|------|---------------|---------------|
| **Cursor 日常 dev** | 単一 MCP（`analyze_*`）+ サブスク CLI | 同左（設計どおり） |
| **統一 MCP + adapter** | 実装済 + G7 Pass | A-2 / A-3 の残タスク；日常スモーク |
| **Wall-Bounce API** | legacy spawn；1-pass；Hard Gate loop なし | B-1 で adapter 統合 · Track C で憲法 enforce（2–5 ラウンド） |
| **オーケストレーション記憶** | ADR + schema・型のみ（Redis 未） | M1 Redis + M2–M6 配線；TS-24 継続・再試行 |
| **InferenceProfile** | matrix + catalog resolver（Contract Layer） | B-0 `inference-profiles.json` |
| **Model catalog（TS-21）** | JSON + schema；F-1 validate；F-2 loader 部分 | F-3 TaskRouter + コスト routing |
| **Glossary prep（RAG）** | Phase 0 — config・extract・adopt/hold；npm scripts | Phase 2.5 filter · Phase 4 connector · Drive mirror |
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
| 2026/06/21 21:24:03 | Track A の「尾/tail」を残タスク/remainder に置換（FORK_STATUS・ONBOARDING・runbook 要約） |
| 2026/06/21 21:18:49 | AS-IS vs To-Be 要約を修正 — legacy phase 1 を AS-IS に、Wall-Bounce/記憶行を整合；en/ja 同期 |
| 2026/06/21 19:59:15 | Glossary Phase 0 — extract・consumer boundary・相対パス；FORK_ONBOARDING 同期 — 英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期 |
| 2026/06/19 13:46:26 | TS-24 — 英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期 |
| 2026/06/19 13:30:04 | Contract Layer + TS-23 — 英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期 |
| 2026/06/19 11:47:05 | 初版 — B2b 日本語ペア（英語 [FORK_STATUS.md](../FORK_STATUS.md) と同期） |
