# techdev-cursor

Multi-LLM platform for daily Cursor coding via unified MCP (`analyze_claude` / `analyze_codex` / `analyze_agy`).

> **Not** IT incident / InfraOps analysis — see [FORK_CURSOR.md](./docs/FORK_CURSOR.md) for repo identity.

*[English](README_en.md) | [日本語（GitHub トップ）](README.md)*

---

## What & why

| | |
|---|---|
| **What** | **Multi-LLM wall-bounce** coding platform for Cursor — daily work via unified MCP (`analyze_claude` / `codex` / `agy`); hard analysis via **Wall-Bounce** (2–5 coordinated rounds + consensus gates) |
| **Why** | Improve coding-assist **accuracy and reliability through multi-LLM coordination**, within subscription CLI cost |
| **Not** | IT incident platform · multi-model picker only (no orchestration) |

---

## Why Wall-Bounce (not just multi-model access)

Tools like [Antigravity](https://antigravity.google/docs/models) consolidate **access to Claude, GPT, and Gemini** in one harness. You can **pick a model**, but they do **not** run **multiple LLMs in coordinated rounds on the same prompt** with consensus and quality gates.

| | Multi-model harness (e.g. Antigravity) | Wall-Bounce |
|---|---|---|
| Access to several model families | ✅ | ✅ (`agy` / `codex` / `claude`) |
| Multi-LLM coordination on one prompt | ❌ | ✅ **2–5 rounds** + consensus gates |
| Output | One model → one answer | 2+ providers → structured agreement |

**This repo’s value is not “which LLM” but “how LLMs cooperate.”** Daily Cursor: single MCP per call; hard analysis: Wall-Bounce API.

---

## Architecture (overview)

**Track A (daily):** Cursor → unified MCP → adapters → subscription CLIs. **Track B (hard):** multiple LLMs **wall-bounce the same prompt in 2–5 rounds** with consensus and quality gates (`wall-bounce-analyzer.ts`). RAG prep details live in sibling [term-prep-platform](https://github.com/wombat2006/term-prep-platform).

```mermaid
flowchart TB
  subgraph trackA["Daily Cursor (Track A)"]
    U1[User]
    CUR[Cursor IDE]
    MCP[techsapo-providers MCP<br/>analyze_claude / codex / agy]
  end

  subgraph adapters["Adapter layer"]
    AD1[claude-adapter]
    AD2[codex-adapter]
    AD3[agy-adapter]
  end

  subgraph cli["WSL subscription CLIs"]
    CL[claude]
    CX[codex]
    AG[agy]
  end

  subgraph wb["Wall-Bounce (hard multi-LLM)"]
    API[Wall-Bounce API]
    WBA[wall-bounce-analyzer]
    PEER[Peer LLM ×2–5 rounds]
    AGG[Aggregator]
  end

  subgraph mem["Layer A (To-Be · TS-22)"]
    REDIS[(OrchestrationSession<br/>Redis)]
  end

  subgraph mon["Monitoring & user alerts"]
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
  U1 --> API --> WBA --> PEER --> AGG
  WBA -.-> REDIS
  WBA --> PROM --> AM --> LN --> U2
```

| Path | Role |
|------|------|
| **Cursor → techsapo-providers → adapters → CLIs** | Daily coding (single MCP invoke) |
| **Wall-Bounce API → analyzer → peer LLMs** | Hard multi-LLM coordination + consensus (**2–5 rounds**) |
| **Prometheus → line-notification** | **LINE Webhook** alerts on anomalies (implemented) |

Details: [ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md) · [MONITORING_OPERATIONS.md](./docs/MONITORING_OPERATIONS.md)

---

## Where to go next

| Need | Document |
|------|----------|
| **Current status & Gates** | [FORK_STATUS.md](./docs/FORK_STATUS.md) · [日本語](./docs/ja/FORK_STATUS.md) |
| **Execute tasks / Tracks** | [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) · [要約（日本語）](./docs/ja/CURSOR_MCP_TODO_ja.md) |
| Fork identity & layout | [FORK_CURSOR.md](./docs/FORK_CURSOR.md) · [日本語](./docs/ja/FORK_CURSOR.md) |
| Design depth & maturity | [FORK_ONBOARDING.md](./docs/FORK_ONBOARDING.md) · [日本語](./docs/ja/FORK_ONBOARDING.md) |
| RAG prep (sibling · optional) | [term-prep-platform](https://github.com/wombat2006/term-prep-platform) · consumer in this repo: [RAG_SETUP_GUIDE.md](./docs/RAG_SETUP_GUIDE.md) |
| AI agents | [AGENTS.md](./AGENTS.md) |
| Full doc map | [DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| Documentation rules | [DOCUMENTATION_POLICY.md](./docs/DOCUMENTATION_POLICY.md) |

---

## Quick start (developers)

**Prerequisite:** Node.js ≥20 (`package.json` `engines`)

1. [FORK_CURSOR.md](./docs/FORK_CURSOR.md) — scope and directory layout  
2. [CURSOR_MCP_TODO.md § A-0](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication) — WSL CLI auth (`claude` / `codex` / `agy`)  
3. `npm run cursor-mcp:config` — register unified MCP in Cursor

---

## Constitution (summary)

Wall-Bounce: **at least 2 rounds, at most 5**; confidence ≥ 0.7; consensus ≥ 0.6; implementation via `wall-bounce-analyzer.ts` only.

**To-Be UX:** Post-Aggregator session continuation and negative-feedback retry (upward temperature jitter) — [TS-24 ADR](./docs/decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) (Track B implementation).

Details: [AGENTS.md](./AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)

---

## License & support

MIT — see `license` in [package.json](./package.json). Issues: [GitHub](https://github.com/wombat2006/techdev-cursor/issues).
