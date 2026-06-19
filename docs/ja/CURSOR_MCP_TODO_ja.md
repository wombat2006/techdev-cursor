# Cursor MCP 実行 Runbook — 日本語要約

*[English](../CURSOR_MCP_TODO.md) | **日本語***

**正本は英語** — 手順・チェックボックス・Gate メモは [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) を参照。このファイルは **Track / Gate の地図**と入口リンクのみ。

**最終更新:** 2026-06-19  
**関連:** [FORK_STATUS.md](./FORK_STATUS.md) · [FORK_CURSOR.md](./FORK_CURSOR.md)

---

## Gate 順（固定）

**A → B → C** — スキップ不可。

| Gate | 条件 | 状態 |
|------|------|------|
| **G-MEM** | TS-22 設計採択 | ✅ 2026/06/18 |
| **Gate A→B** | G1–G7 + G-MEM | ✅ **Pass** 2026/06/18 |
| **Gate B→C** | Track B（B-0…B-3, M1–M3 最低） | `[ ]` |
| **Gate C** | P5 Phase 0 | `[ ]` |

詳細基準: [Gate A→B セクション](../CURSOR_MCP_TODO.md#gate-a-b-review-devassist)（英語）

---

## Track 優先度

| 優先 | Track | 焦点 | 状態 |
|------|-------|------|------|
| **P0** | **A** | Cursor MCP · WSL CLI · G7 | 尾（A-2/A-3）のみ |
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
| 3 | `npm run build` · MCP 登録 | [§ A-1](../CURSOR_MCP_TODO.md#a-1-unified-mcp--adapters-track-a-1) |
| 4 | G7: Cursor Agent から `analyze_*` ×3 | [§ G7](../CURSOR_MCP_TODO.md#g7-smoke-from-cursor-agent) |
| 5 | Track B: M1 → B-0 → B-1 | [Track B](../CURSOR_MCP_TODO.md#track-b--inferenceprofile-adapters-memory-substrate) |

**Portable MCP 設定:** `npm run cursor-mcp:config`

---

## Track B 直近（要約）

| ID | 成果物 |
|----|--------|
| **M1** | `OrchestrationSessionStore` + Redis `orch:session:*` |
| **B-0** | `inference-profiles.json` + TS-20（matrix+catalog resolver ✅；preset ファイル未） |
| **B-1** | `wall-bounce-analyzer.ts` / `rag-endpoint.ts` → `src/adapters/*` |

---

## 憲法（Wall-Bounce）

- **2–5 ラウンド**（1 ラウンドのみ禁止）
- confidence ≥ 0.7、consensus ≥ 0.6
- 実装経路: `wall-bounce-analyzer.ts` のみ
- **コード enforce** — Track C（To-Be）。日常 Cursor は単一 MCP で可。

[AGENTS.md](../../AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md)

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
| **完全手順（英語）** | [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) |
