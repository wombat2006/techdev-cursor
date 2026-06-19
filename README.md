# TechSapo — DevAssist フォーク (`techdev-cursor`)

> **PRIMARY REPO** — Cursor 統合開発環境。**コーディング精度向上**と**負荷軽減**が目的。  
> [wombat2006/techdev](https://github.com/wombat2006/techdev)（Wall-Bounce）のフォーク。  
> **IT 障害解析 / InfraOps ラインではない**（upstream 別フォーク）。

統一 MCP（`analyze_claude` / `analyze_codex` / `analyze_agy`）による日常の Cursor コーディング向けマルチ LLM 基盤。

*[English](README_en.md) | **日本語***

---

## 何を・なぜ

| | |
|---|---|
| **何** | DevAssist フォーク — Wall-Bounce + 統一 provider MCP + サブスク CLI |
| **なぜ** | **簡便・正確・低コスト**にソフトウェアを作る |
| **ではない** | IT 障害プラットフォーム · マルチモデル選択だけの harness |

---

## なぜ Wall-Bounce か

[Antigravity](https://antigravity.google/docs/models) などは **Claude / GPT / Gemini へのアクセス** を1つの harness にまとめる。**モデル選択** はできても、**1 プロンプトに対して複数 LLM がラウンドを重ねて協調・合意する** 機能はない。

| | マルチモデル harness（例: Antigravity） | TechSapo Wall-Bounce |
|---|---|---|
| 複数モデルへのアクセス | ✅ | ✅（`agy` / `codex` / `claude`） |
| 同一プロンプトへの多 LLM 協調 | ❌ | ✅ **2–5 ラウンド** + 合意・品質ゲート |
| 出力 | 1 モデル → 1 回答 | 2+ provider → 構造的合意 |

**価値は「どの LLM を使うか」ではなく「複数 LLM をどう協調させるか」。** 日常 Cursor は単一 MCP；厳密分析は Wall-Bounce API。

---

## 次に読むもの

| 目的 | ドキュメント |
|------|-------------|
| **現状・Gate 進捗** | [FORK_STATUS.md](./docs/ja/FORK_STATUS.md) |
| **実行・Track（要約）** | [CURSOR_MCP_TODO_ja.md](./docs/ja/CURSOR_MCP_TODO_ja.md) |
| **実行・Track（正本・英語）** | [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) |
| フォークの位置づけ | [FORK_CURSOR.md](./docs/ja/FORK_CURSOR.md) |
| 設計思想・成熟度 | [FORK_ONBOARDING.md](./docs/ja/FORK_ONBOARDING.md) |
| AI エージェント | [AGENTS.md](./AGENTS.md)（英語） |
| ドキュメント一覧 | [DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| ドキュメント方針 | [DOCUMENTATION_POLICY.md](./docs/DOCUMENTATION_POLICY.md) |

---

## クイックスタート（開発者）

1. [FORK_CURSOR.md](./docs/ja/FORK_CURSOR.md) — スコープと構成  
2. [CURSOR_MCP_TODO_ja.md](./docs/ja/CURSOR_MCP_TODO_ja.md) — 実行要約 · [§ A-0 詳細（英語）](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication)  
3. `npm run cursor-mcp:config` — Cursor に統一 MCP を登録  

---

## 憲法（要約）

Wall-Bounce: **最低 2 ラウンド・最大 5**；confidence ≥ 0.7；consensus ≥ 0.6；実装は `wall-bounce-analyzer.ts` のみ。

詳細: [AGENTS.md](./AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)（英語）

---

## ライセンス・サポート

MIT — [package.json](./package.json) の `license` フィールドを参照。Issue: [GitHub](https://github.com/wombat2006/techdev-cursor/issues)。
