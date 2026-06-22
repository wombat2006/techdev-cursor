# Cursor MCP 実行 Runbook — 日本語要約

*[English](../CURSOR_MCP_TODO.md) | **日本語***

**正本は英語** — 手順・チェックボックス・Gate メモは [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) を参照。このファイルは **Track / Gate の地図**と入口リンクのみ。

**リポジトリ入口（ゴール / 現在地 / 必要なこと）:** [README.md](../../README.md) · Wall-Bounce 詳細 [TO-BE](../WALL_BOUNCE_TO_BE.md) · [AS-IS](../WALL_BOUNCE_AS_IS.md)

**最終更新:** 2026-06-22  
**関連:** [FORK_STATUS.md](./FORK_STATUS.md) · [FORK_CURSOR.md](./FORK_CURSOR.md)

---

## Gate 順（固定）

**A → B → C** — スキップ不可。

| Gate | 条件 | 状態 |
|------|------|------|
| **G-MEM** | TS-22 設計採択 | ✅ 2026/06/18 |
| **Gate A→B** | G1–G7 + G-MEM | ✅ **Pass** 2026/06/18 |
| **Gate B→C** | Track B（B-0…B-3, **B-4**, **B-5**, **B-6**, M1–M3 最低） | `[ ]` |
| **Gate C** | P5 Phase 0 | `[ ]` |

詳細基準: [Gate A→B セクション](../CURSOR_MCP_TODO.md#gate-a-b-review-devassist)（英語）

---

## Track 優先度

| 優先 | Track | 焦点 | 状態 |
|------|-------|------|------|
| **P0** | **A** | Cursor MCP · WSL CLI · G7 | 残タスク（A-2/A-3）のみ |
| **P1** | **B** | InferenceProfile · adapter 配線 · Layer A | **← 現在** |
| **P2** | **E/F** | catalog loader · cost routing | 部分（F-1 ✅ · F-2 部分） |
| **P3** | **C** | 憲法 enforce · orchestrator | Gate B→C 後 |
| **P4** | **D/P5+** | cache · Batch RAG · grounding | 任意 |

---

## クイックスタート（開発者）

| Step | 内容 | 英語 runbook |
|------|------|--------------|
| 1 | フォーク identity · layout | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| 2 | WSL CLI 認証（`claude` / `codex` / `agy`） | [§ A-0](../CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication) |
| 3 | `npm run build` · MCP（`.cursor/mcp.json` 同梱） | [§ A-1](../CURSOR_MCP_TODO.md#a-1-cursor-mcp-registration-unified--in-fork) · [CURSOR_MCP_TEMPLATE](../CURSOR_MCP_TEMPLATE.md) |
| 4 | G7: Cursor Agent から `analyze_*` ×3 | [§ G7](../CURSOR_MCP_TODO.md#g7-smoke-from-cursor-agent) |
| 5 | Track B: M1 → B-1 → B-4 → B-5 → B-0 | [Track B](../CURSOR_MCP_TODO.md#track-b--inferenceprofile-implementation-ts-20) |

**Portable MCP:** `.cursor/mcp.json` はリポジトリ同梱 — routine pull 後の `cursor-mcp:config` / Reload 不要（[ルール](../../.cursor/rules/cursor-mcp-post-pull.mdc)）

---

## Track B 直近（要約）

| ID | 成果物 |
|----|--------|
| **M1** | `OrchestrationSessionStore` + Redis `orch:session:*` |
| **B-0** | `inference-profiles.json` + TS-20 + TS-24 `retryOnNegative`（matrix+catalog resolver ✅；preset ファイル未） |
| **M2–M3** | `sessionId` 継続 · Layer A イベント · negative 再試行（TS-24） |
| **B-1** | `wall-bounce-analyzer.ts` / `rag-endpoint.ts` → `src/adapters/*` |
| **B-6** | CLI invoke metadata（TS-26）— `usage` / `stop_reason` / `session_id` |
| **B-4** | 実行モードルーティング（TS-25）— 並列→閾値分岐 |
| **B-5** | SSE + Layer A 可観測性 |

**改修一覧:** [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](../WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md)

---

## 憲法（Wall-Bounce · 目標契約）

- 壁打ちモードで **2–5 ラウンド**（1 ラウンドのみ禁止）
- confidence ≥ 0.7、consensus ≥ 0.6
- 実装経路: `wall-bounce-analyzer.ts` のみ

**現行コード:** [AS-IS](../WALL_BOUNCE_AS_IS.md) — **enforce は Track C**。日常 Cursor は単一 MCP で可。

[AGENTS.md](../../AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md) · [TS-25](../decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) · [TS-26](../decisions/TECH_STACK_CLI_INVOKE_METADATA.md)

---

## トラブルシュート入口

| 症状 | 英語 runbook |
|------|--------------|
| MCP smoke 失敗 | [§ MCP smoke failures](../CURSOR_MCP_TODO.md#mcp-smoke-test-failures-recorded-2026-06-18) |
| Codex trusted directory | [§ analyze_codex](../CURSOR_MCP_TODO.md#a-1-unified-mcp--adapters-track-a-1) |
| Token / quota | [§ Token & Quota](../CURSOR_MCP_TODO.md#token--quota-operations-guide) |

---

## 関連

| 目的 | ドキュメント |
|------|-------------|
| **進捗・Gate 時刻** | [FORK_STATUS.md](./FORK_STATUS.md) |
| **設計思想** | [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) |
| **Wall-Bounce To-Be / AS-IS** | [WALL_BOUNCE_TO_BE.md](../WALL_BOUNCE_TO_BE.md) · [WALL_BOUNCE_AS_IS.md](../WALL_BOUNCE_AS_IS.md) |
| **完全手順（英語）** | [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) |
