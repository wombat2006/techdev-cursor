# techdev-cursor

Multi-LLM platform for daily Cursor coding via unified MCP (`analyze_claude` / `analyze_codex` / `analyze_agy`).

> **Not** IT incident / InfraOps analysis — see [FORK_CURSOR.md](./docs/FORK_CURSOR.md).

*[English](README_en.md) | [日本語（GitHub top）](README.md)*

---

## Goal (To-Be)

**What this repo is building toward** — full spec: [WALL_BOUNCE_TO_BE.md](./docs/WALL_BOUNCE_TO_BE.md) · ADR [TS-25](./docs/decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md)

| Area | To-Be |
|------|-------|
| **Daily Cursor (Track A)** | Unified MCP single-LLM invokes (`analyze_*`) |
| **Hard multi-LLM (Track B)** | **Default:** parallel peers → **aggregator consensus** → if below thresholds, **auto wall-bounce mode** (constitution **2–5 rounds**) |
| **Mode overrides** | Prompt keywords (e.g. force wall-bounce) and MCP config; **serial chain** mode with **no consensus gate** |
| **Observability** | Follow peer outputs, deliberation, and branch decisions via **SSE** (persisted to Layer A) |
| **Objections** | Challenge aggregator reasoning → re-query → **user picks next behavior** |
| **Upfront difficulty scoring** | **None** — replaced by post-aggregate threshold branch |

**Value:** not “which LLM” but “how LLMs cooperate” — see [Why Wall-Bounce](#why-wall-bounce).

---

## Where we are (AS-IS)

> **Running code matches [AS-IS](./docs/WALL_BOUNCE_AS_IS.md).** Gaps vs To-Be are documented; **repair and implementation are in progress** on Track B / C. README goal text describes To-Be; for behavior guarantees use the AS-IS doc and `src/`.

| Area | Works today | Main gap vs To-Be |
|------|-------------|-------------------|
| **Track A — MCP** | `analyze_*` single-shot via adapters — **G7 Pass** | No mode-keyword routing yet |
| **Track B — Wall-Bounce API** | `wall-bounce-analyzer.ts`: **one** parallel or sequential pass + one aggregation | No threshold branch, no 2–5 round loop, no objection UX |
| **Thresholds** | Warn in logs; **no retry/branch** on low scores | Auto wall-bounce on miss |
| **Transport** | MCP uses adapters; analyzer uses **legacy spawn** | Unify in B-1 |
| **Legacy MCP product layer** | AS-IS: `codex-mcp-integration.ts` (**historical name**, pseudo-WB); not on prod API | **TS-28 P0** → `mcp-product-integration` + constitution WB |
| **Memory (Layer A)** | Types + ADR only; **no Redis store** | M1–M3 |
| **SSE** | Partial (e.g. 500-char truncate) | Extend in B-5 |
| **Genspark Add-on (TS-30 idea)** | **Not implemented** | Hybrid A; **AI Drive required** when built; after TS-28 P0 + Track B; corpus/RAG stays on term-prep-platform ([idea §3.2](./docs/ideas/GENSPARK_CONNECTOR_IDEA.md#32-term-prep-platform-boundary--conflict-review)) |

**Progress & Gates:** [FORK_STATUS.md](./docs/FORK_STATUS.md) · **Code truth:** [WALL_BOUNCE_AS_IS.md](./docs/WALL_BOUNCE_AS_IS.md)

---

## What we need to get there

Work packages toward To-Be (suggested order) — per-file tasks: [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./docs/WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) · checklist: [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md)

| Priority | Work | Track | Gate |
|----------|------|-------|------|
| 1 | Layer A persistence (`OrchestrationSessionStore` / Redis) | **M1** | B→C prerequisite |
| 2 | Wire Wall-Bounce to `src/adapters/*` | **B-1** | B→C |
| 2a | **MCP product layer** — vendor-neutral rename; constitution WB (NAME-VN) | **TS-28 P0** | Before SRP #8 |
| 2b | **usage / stop_reason / session_id** from CLI (TS-26) | **B-6** | B→C |
| 3 | Parallel → aggregate → **threshold branch**; keyword modes (TS-25) | **B-4** | B→C G7 |
| 4 | SSE + Layer A event stream | **B-5** | B→C |
| 5 | `inference-profiles.json` · TS-24 retry | **B-0** | B→C |
| 6 | **2–5 round enforce** in wall-bounce mode | **C-4** | Gate C |
| 7 | **Hard gate** (this repo) | **C-1** | Gate C |
| 7b | **PromptAnalyzer · dictionary v0** — implemented on **[term-prep-platform](https://github.com/wombat2006/term-prep-platform)**; this repo **connects via MCP** (`glossary-knowledge`) | platform + MCP | Gate C (C-2/C-3) |
| 8 | Objection workflow | **C-7** | Gate C G7 |
| 9 | Analyzer / Orchestrator merge | **C-5** | Gate C |

**PromptAnalyzer / dictionary v0:** Morphological parsing and dictionary lookup are **implemented on term-prep-platform**, not in this consumer repo. Wire them in by calling the sibling clone over MCP **`glossary-knowledge`** ([`.cursor/mcp.json`](./.cursor/mcp.json) already registered · [RAG_SETUP_GUIDE.md](./docs/RAG_SETUP_GUIDE.md) · [TO-BE-GLOSSARY-PIPELINE.md](./meta/TO-BE-GLOSSARY-PIPELINE.md)). Escalate to the user when platform changes are required ([AGENTS.md](./AGENTS.md)).

**Current focus:** Track **B** (Gate A→B Pass) — [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md)

---

## What & why

| | |
|---|---|
| **What** | Multi-LLM coding platform for Cursor — daily MCP, hard analysis via Wall-Bounce API |
| **Why** | Better accuracy through multi-LLM coordination within subscription CLI cost |
| **Not** | IT incident platform · model picker only |

---

## Why Wall-Bounce

Tools like [Antigravity](https://antigravity.google/docs/models) bundle model access but do **not** coordinate multiple LLMs on one prompt with consensus.

| | Multi-model harness | This repo (To-Be) |
|---|---|---|
| Multi-family access | ✅ | ✅ |
| Coordination on one prompt | ❌ | ✅ parallel → consensus → wall-bounce if needed |
| Output | One model → one answer | 2+ providers → structured agreement |

---

## Architecture (overview)

Code-derived paths (`src/` audit 2026-06-22). **Dashed = To-Be / not wired**.

```mermaid
flowchart TB
  subgraph trackA["Track A — daily Cursor MCP (AS-IS ✅)"]
    CUR[Cursor Agent] --> CFG[".cursor/mcp.json"]
    CFG --> MCP[techsapo-providers MCP]
    MCP --> RESOLVE[inference-profile-resolver]
    RESOLVE --> AD[src/adapters/*]
    AD --> CLI[claude · codex · agy CLI]
  end

  subgraph trackB["Track B — Wall-Bounce API (AS-IS: 1-pass + aggregator)"]
    IDX["index.ts — npm run start:app"] --> ROUTES[wall-bounce-api.ts]
    ROUTES -->|"GET /api/v1/wall-bounce/analyze"| SSE[SSE: thinking · provider_response · consensus · final_answer]
    ROUTES -->|"POST …/analyze-simple"| WBA[WallBounceAnalyzer]
    SSE --> WBA
    WBA -->|"legacy spawn — no adapters"| PEER[invokeGemini · invokeGPT5 · invokeClaude]
    WBA --> AGG[Aggregator LLM]
    WBA -.->|"To-Be TS-25"| LOOP[threshold branch → 2–5 rounds]
  end

  subgraph altSRP["Separate process wall-bounce-server.ts (optional legacy)"]
    WBS["POST /api/v1/generate"] --> FLAG{USE_SRP_WALL_BOUNCE?}
    FLAG -->|"default: no"| WBA
    FLAG -->|yes| ADP[WallBounceAdapter]
    ADP --> ORCH[WallBounceOrchestrator]
    ORCH --> CE[ConsensusEngine — Jaccard]
  end

  subgraph legacyProduct["MCP product layer (TS-28 · AS-IS file still codex-*)"]
    MPI["mcp-product-integration\n(To-Be)"] --> CMS[codex-mcp/ plugin]
    MPI -.->|"enable_wall_bounce"| WBA
  end

  subgraph platform["Sibling platform (this repo: MCP consumer only)"]
    GK[glossary-knowledge MCP] --> TPP[term-prep-platform]
  end

  subgraph mem["Layer A (To-Be · M1)"]
    TYPES[types/orchestration-session.ts]
    STORE[(OrchestrationSessionStore — not implemented)]
    TYPES -.-> STORE
  end

  WBA -.->|"session_id metadata only · no Redis"| TYPES
```

| Path | AS-IS today (code) | To-Be |
|------|-------------------|-------|
| Cursor → MCP → adapters → CLI | ✅ single `analyze_*` (no aggregate / rounds) | Same + mode keywords |
| `index.ts` → `server/` | ✅ `TechSapoServer`; modular split (SRP) | unchanged |
| `wall-bounce-analyzer.ts` | ✅ shim → `services/wall-bounce/` (constitution path) | B-1 adapters · threshold branch (B-4) |
| `codex-mcp-integration.ts` | AS-IS filename only (**TS-28 NAME-VN** → `mcp-product-integration`) | Constitution WB via analyzer (canonical) |
| `wall-bounce-server.ts` | shim → `wall-bounce-server/`; default analyzer path | merge (C-5) |
| MCP monitoring / config (SRP) | ✅ `mcp-config-manager/` · `mcp-performance-monitor/` · `ultra-conservative-monitor/` · `srp-safety-monitor/` | unchanged |
| Layer A / SSE | Types only · partial SSE (500-char truncate) · `session_id` not persisted | M1–M3 · B-5 |
| term-prep-platform | `glossary-knowledge` in `.cursor/mcp.json` | PromptAnalyzer · dictionary v0 on **platform** |

Details: [ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)

---

## Implementation ownership (techdev-cursor vs term-prep-platform)

Plan table for **which repo implements what**. Layer diagram & examples: [GENSPARK_CONNECTOR_IDEA.md §3.3](./docs/ideas/GENSPARK_CONNECTOR_IDEA.md#33-ai-drive-vs-openai-vector-store--layers-decision-flow-examples) · platform read pack: [meta/platform-integration/README.md](./meta/platform-integration/README.md)

| Capability | techdev-cursor | term-prep-platform | Status |
|------------|----------------|-------------------|--------|
| **Wall-Bounce · `analyze_*` MCP** | ✅ Implement | — | Track B in progress |
| **Layer A orchestration memory** | ✅ Planned (M1) | — | ADR done; Redis pending |
| **Glossary consumer config** (`meta/glossary-*`) | ✅ Edit here | Schema mirror only | Phase 0 ✅ |
| **`glossary_extractor` · registry** | Invoke via npm | ✅ Own | Phase 0 ✅ |
| **`glossary-knowledge` MCP** | `.cursor/mcp.json` register | ✅ Own | stub |
| **Google Drive corpus mirror** | Legacy `googledrive-connector.ts` | ✅ **Delegation target** (Phase 0.5) | Planned |
| **OpenAI Vector Store ingest** | AS-IS legacy | ✅ **Unification target** (Phase 4.5) | Planned |
| **S3 / OneDrive mirror** | ❌ Do not add | ✅ Planned | Proposed |
| **Genspark AI Drive (`aidrive`)** | ✅ **Required** (TS-30 idea) | ❌ Do not implement | Not built |
| **Genspark search / crawl / media** | ✅ Add-on MCP | ❌ Do not implement | Not built |
| **PromptAnalyzer · dictionary v0** | MCP connect only | ✅ Implement | Gate C |

**Retrieval split:** internal semantic search = **OpenAI Vector Store** (ingest via platform). Genspark tool files = **aidrive** (not Vector canonical source).

**Prompt for platform work:** [meta/platform-integration/PROMPT_START.md](./meta/platform-integration/PROMPT_START.md) · [read pack](./meta/platform-integration/README.md)

---

## Wall-Bounce documentation (required reading)

| Document | Role |
|----------|------|
| **[WALL_BOUNCE_TO_BE.md](./docs/WALL_BOUNCE_TO_BE.md)** | Target behavior · gap matrix |
| **[WALL_BOUNCE_AS_IS.md](./docs/WALL_BOUNCE_AS_IS.md)** | **Code-derived current state** |
| [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./docs/WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) | Modification checklist |
| [TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md](./docs/decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) | TS-25 ADR |
| [TECH_STACK_CODEX_MCP_INTEGRATION_REFACTOR.md](./docs/decisions/TECH_STACK_CODEX_MCP_INTEGRATION_REFACTOR.md) | **TS-28 v1.2** — MCP product refactor; **no vendor names before routing** (NAME-VN) |

---

## Where to go next

| Need | Document |
|------|----------|
| **Gates & progress** | [FORK_STATUS.md](./docs/FORK_STATUS.md) · [日本語](./docs/ja/FORK_STATUS.md) |
| **Code layout (SRP splits)** | [SRP_MONOLITH_REFACTOR.md](./docs/SRP_MONOLITH_REFACTOR.md) · [dependency order](./docs/SRP_REFACTOR_DEPENDENCY_ORDER.md) |
| **Execution runbook** | [CURSOR_MCP_TODO.md](./docs/CURSOR_MCP_TODO.md) · [ja summary](./docs/ja/CURSOR_MCP_TODO_ja.md) |
| Fork identity | [FORK_CURSOR.md](./docs/FORK_CURSOR.md) |
| Design depth | [FORK_ONBOARDING.md](./docs/FORK_ONBOARDING.md) |
| AI agents | [AGENTS.md](./AGENTS.md) |
| Full index | [DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| **Repo split (consumer vs platform)** | [Implementation ownership](#implementation-ownership-techdev-cursor-vs-term-prep-platform) · [platform prompt](./meta/platform-integration/PROMPT_START.md) |
| **Under consideration (not adopted; out of backlog)** | [NestJS strangler (TS-29 Idea)](./docs/ideas/NESTJS_STRANGLER_MIGRATION_IDEA.md) — HTTP layer only; evaluate effectiveness & low-cost implementability; **not planned** |
| **Under consideration (direction memo; out of backlog)** | [Genspark Add-on (TS-30 Idea)](./docs/ideas/GENSPARK_CONNECTOR_IDEA.md) — Hybrid A (`gsk` + HTTP D1–D7); TS-18 add-on; **implementation after TS-28 P0 + Track B** |

---

## Naming (TS-28 NAME-VN)

**Constitution Wall-Bounce is multi-provider.** No vendor proper names (`codex`, `claude`, `agy`, …) in modules or public APIs **before** the routing boundary (`enable_wall_bounce`, execution mode). Codex-specific names belong under the **`codex-mcp/` plugin** only. See [TS-28 §4.11](./docs/decisions/TECH_STACK_CODEX_MCP_INTEGRATION_REFACTOR.md#411-vendor-neutral-naming-name-vn).

---

## Quick start (developers)

**Prerequisite:** Node.js ≥20

1. [FORK_CURSOR.md](./docs/FORK_CURSOR.md)  
2. [CURSOR_MCP_TODO § A-0](./docs/CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication)  
3. `npm run setup-mcp-prereqs` · `npm install`  
4. `cp .env.brv.local.example .env.brv.local` → `npm run setup-brv-provider`  
5. `npm run build` — after pull only when `src/` changed  
6. `.cursor/mcp.json` tracked (**no routine MCP Reload after pull** — [rule](./.cursor/rules/cursor-mcp-post-pull.mdc))

---

## Constitution (target contract)

Wall-Bounce **target:** **2–5 rounds** in wall-bounce mode · confidence ≥ 0.7 · consensus ≥ 0.6 · via `wall-bounce-analyzer.ts`.

> Constitution describes To-Be contract. **Current code does not fully enforce it** — [AS-IS](./docs/WALL_BOUNCE_AS_IS.md) §14 · Track C planned.

Details: [AGENTS.md](./AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./docs/WALL_BOUNCE_SYSTEM.md)

---

## License & support

MIT — [package.json](./package.json). Issues: [GitHub](https://github.com/wombat2006/techdev-cursor/issues).
