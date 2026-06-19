# TechSapo — DevAssist フォーク (`techdev-cursor`)

> **PRIMARY REPO** — Cursor 統合開発環境。**コーディング精度向上**と**負荷軽減**が目的。  
> [wombat2006/techdev](https://github.com/wombat2006/techdev)（Wall-Bounce）のフォーク。  
> **IT 障害解析 / InfraOps ラインではない**（upstream 別フォーク）。

統一 MCP（`analyze_claude` / `analyze_codex` / `analyze_agy`）による日常の Cursor コーディング向けマルチ LLM 基盤。

*[English](README.md) | 日本語*

---

## 何を・なぜ

| | |
|---|---|
| **何** | DevAssist フォーク — Wall-Bounce + 統一 provider MCP + サブスク CLI |
| **なぜ** | **簡便・正確・低コスト**にソフトウェアを作る |
| **ではない** | IT 障害プラットフォーム · 単一ベンダー chat ラッパー |

---

## 次に読むもの

| 目的 | ドキュメント |
|------|-------------|
| **現状・Gate 進捗** | [FORK_STATUS.md](./docs/FORK_STATUS.md) |
| **実行・Track** | [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) |
| フォークの位置づけ | [FORK_CURSOR.md](./docs/FORK_CURSOR.md) |
| 設計思想・成熟度 | [FORK_ONBOARDING.md](./docs/FORK_ONBOARDING.md) |
| AI エージェント | [AGENTS.md](./AGENTS.md) |
| ドキュメント一覧 | [DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| ドキュメント方針 | [DOCUMENTATION_POLICY.md](./docs/DOCUMENTATION_POLICY.md) |

---

## クイックスタート（開発者）

1. [FORK_CURSOR.md](./docs/FORK_CURSOR.md) — スコープと構成  
2. [CURSOR_MCP_TODO.md § A-0](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication) — WSL CLI 認証（`claude` / `codex` / `agy`）  
3. `npm run cursor-mcp:config` — Cursor に統一 MCP を登録  

---

## 憲法（要約）

Wall-Bounce: **最低 2 ラウンド・最大 5**；confidence ≥ 0.7；consensus ≥ 0.6；実装は `wall-bounce-analyzer.ts` のみ。

詳細: [AGENTS.md](./AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)

---

## ライセンス・サポート

MIT — [package.json](./package.json) の `license` フィールドを参照。Issue: [GitHub](https://github.com/wombat2006/techdev-cursor/issues)。
