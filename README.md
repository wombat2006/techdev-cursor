# TechSapo — DevAssist Fork (`techdev-cursor`)

> **PRIMARY REPO** — Cursor-integrated development environment for **coding accuracy** and **workload reduction**.  
> Fork of [wombat2006/techdev](https://github.com/wombat2006/techdev) (Wall-Bounce multi-LLM platform).  
> **Not** IT incident / InfraOps analysis (upstream fork line).

Multi-LLM orchestration for daily Cursor coding via unified MCP (`analyze_claude` / `analyze_codex` / `analyze_agy`).

---

## What & why

| | |
|---|---|
| **What** | DevAssist fork — Wall-Bounce + unified provider MCP + subscription CLIs |
| **Why** | Build software **accurately, efficiently, at subscription-scale cost** |
| **Not** | IT incident platform · single-vendor chat wrapper |

---

## Where to go next

| Need | Document |
|------|----------|
| **Current status & Gates** | [FORK_STATUS.md](./docs/FORK_STATUS.md) |
| **Execute tasks / Tracks** | [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) |
| Fork identity & layout | [FORK_CURSOR.md](./docs/FORK_CURSOR.md) |
| Design depth & maturity | [FORK_ONBOARDING.md](./docs/FORK_ONBOARDING.md) |
| AI agents | [AGENTS.md](./AGENTS.md) |
| Full doc map | [DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| Documentation rules | [DOCUMENTATION_POLICY.md](./docs/DOCUMENTATION_POLICY.md) |

---

## Quick start (developers)

1. [FORK_CURSOR.md](./docs/FORK_CURSOR.md) — scope and directory layout  
2. [CURSOR_MCP_TODO.md § A-0](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication) — WSL CLI auth (`claude` / `codex` / `agy`)  
3. `npm run cursor-mcp:config` — register unified MCP in Cursor  

---

## Constitution (summary)

Wall-Bounce: **at least 2 rounds, at most 5**; confidence ≥ 0.7; consensus ≥ 0.6; implementation via `wall-bounce-analyzer.ts` only.

Details: [AGENTS.md](./AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)

---

## License & support

MIT — see [LICENSE](./LICENSE). Issues: [GitHub](https://github.com/wombat2006/techdev-cursor/issues).

*[日本語](README_ja.md)*
