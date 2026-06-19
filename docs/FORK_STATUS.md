# Fork Status — `techdev-cursor`

**Rolling snapshot for human readers** (maintainers, teammates, reviewers).  
**Last updated:** 2026/06/19 11:22:09 JST  
**Execute from:** [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) · **Policy:** [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md)

> Update this file at **Gate reviews** and **major Track milestones** (P0). Do not duplicate progress in README body.  
> **Timestamps:** `YYYY/MM/DD HH:mm:ss JST` (Asia/Tokyo). Milestone times follow sign-off / merge commit when recorded.

---

## Snapshot

| Field | Value |
|-------|-------|
| **Repo** | `wombat2006/techdev-cursor` (DevAssist fork) |
| **Current focus** | **Track B** — Layer A memory (M1) · InferenceProfile file (B-0) · adapter wiring (B-1) |
| **Last Gate** | **Gate A→B Pass** — 2026/06/18 17:22:09 JST · G1–G7 + G-MEM |
| **Next Gate** | Gate B→C (after Track B complete) |
| **North star** | Daily Cursor coding via **one MCP** (`analyze_*`); hard multi-LLM via **Wall-Bounce API** + same adapters + Layer A |

---

## Gate progress

| Gate | Status | Timestamp (JST) | Notes |
|------|--------|-----------------|-------|
| **G-MEM** (TS-22 design) | ✅ Closed | 2026/06/18 16:49:20 | ADR v1.3 accepted; M1 Redis store = Track B |
| **Gate A→B** | ✅ **Pass** | 2026/06/18 17:22:09 | G1–G7 + G-MEM all Yes |
| **Gate B→C** | `[ ]` Open | — | After B-0…B-3 + memory M1–M3 minimum |
| **Gate C** (P5 Phase 0) | `[ ]` Open | — | After Gate B→C Pass |

Gate order **A → B → C** is fixed — see [CURSOR_MCP_TODO § Track priority](./CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review).

---

## Track status

| Track | Priority | Status | Summary |
|-------|----------|--------|---------|
| **A** — Cursor MCP | P0 | `[~]` Tail only | A-0/A-1/G7 ✅; **A-2** MCP schemas · **A-3** team registration open — **do not block B** |
| **B** — InferenceProfile + adapters + memory | P1 | `[ ]` **Active** | B-0 partial (hardcoded resolver); M1 store pending; B-1 WB wiring pending |
| **C** — P5 Phase 0 platform | P3 | `[ ]` Blocked | Hard gate · PromptAnalyzer · constitution rounds · orchestrator merge |
| **E / F** — catalog / cost routing | P2 | `[ ]` Optional | After Gate A→B for F-1/F-2; F-12 with B |
| **D / P5+** — cache · Batch RAG · grounding | P4 | `[ ]` Optional | After Track C |

---

## Immediate goals (Track B)

| # | Goal | Deliverable | Status |
|---|------|-------------|--------|
| **M1** | Durable orchestration transcript (Layer A) | `OrchestrationSessionStore` + Redis `orch:session:*` | `[ ]` Types/schema/config ✅; Redis pending |
| **B-0** | Request-level model / effort / CoT presets | `inference-profiles.json` + TS-20 | `[~]` Resolver hardcoded; file pending |
| **B-1** | One transport for Cursor + Wall-Bounce | `wall-bounce-analyzer.ts` + `rag-endpoint.ts` → `src/adapters/*` | `[ ]` |
| **M2–M6** | Session continuity + legacy migration | `sessionId` · round events in Layer A · TS-22 codex-session fold | `[ ]` |

**Suggested order:** M1 → B-0 → B-1 (see [Codex review crosswalk](./CURSOR_MCP_TODO.md#codex-review-crosswalk-2026-06-18)).

---

## Completed (fork)

| Area | Timestamp (JST) | Notes |
|------|-----------------|-------|
| Fork Day 0 | 2026/06/18 08:14:02 | `forkProfile.yaml`, `config/fork/*`, adapter layout |
| **A-0** WSL CLI auth | 2026/06/18 14:39:15 | `claude` / `codex` / `agy` probes pass |
| **A-1** Unified MCP + adapters | 2026/06/18 14:50:36 | `techsapo-providers-mcp-server.ts`, `src/adapters/*`, resolver tests |
| **A-1 ops** + **G7** | 2026/06/18 17:22:09 | Cursor Connected; Cursor Agent `analyze_*` ×3 OK |
| Portable MCP config | 2026/06/18 17:15:53 | `npm run cursor-mcp:config` (Linux / WSL Remote / Windows+WSL) |
| Codex adapter (MCP cwd) | 2026/06/18 17:22:09 | `--skip-git-repo-check` for non-repo cwd |
| **TS-21** model catalog | 2026/06/18 09:37:54 | `config/llm-model-catalog.json` + schema; runtime loader = Track F |
| **TS-22** memory substrate | 2026/06/18 16:49:20 | ADR v1.3, session schema/types, `orchestration-memory.json`; G-MEM closed |
| README AS-IS/To-Be flow | 2026/06/18 17:36:22 | Processing flow clarified (README slim migration pending) |
| Codex review crosswalk | 2026/06/19 10:54:25 | Runbook mapping only ([techsapo PR #3](https://github.com/wombat2006/techsapo/pull/3)) |
| **DOCUMENTATION_POLICY** v0.1 | 2026/06/19 11:13:24 | Thin README plan; P0/P1/P2 sync tiers |

---

## Not done yet (explicit)

| Item | Track | Notes |
|------|-------|-------|
| Redis `OrchestrationSessionStore` | M1 | Layer A mandatory for production sessions |
| Wall-Bounce → adapter wiring | B-1 | Legacy spawn in `wall-bounce-analyzer.ts` remains |
| RAG `/search` legacy MCP parallel | B-1 | `rag-endpoint.ts` not via unified adapters |
| Constitution enforce (2–5 rounds, Hard Gate loop) | C | AS-IS: single pass + aggregator |
| `inference-profiles.json` on disk | B-0 | |
| A-2 InferenceProfile in MCP schemas | A | Non-blocking |
| A-3 team MCP registration | A | Non-blocking |
| README slim (A1 + B2) | docs migration | **Last** — after legacy / INDEX trim |
| `docs/legacy/` quarantine | docs migration | Phase 1 not started |

---

## AS-IS vs To-Be (summary)

| Area | AS-IS (today) | To-Be (planned) |
|------|---------------|-----------------|
| **Cursor daily dev** | Single MCP (`analyze_*`) via subscription CLI | Same — by design |
| **Unified MCP + adapters** | Implemented + G7 pass | A-2/A-3 tail; daily smoke |
| **Wall-Bounce API** | Legacy spawn; 1-pass; no Hard Gate loop | B-1 adapters · C constitution enforce |
| **Orchestration memory** | Design + schema only | M1 Redis + M2–M6 wiring |
| **InferenceProfile** | Hardcoded resolver presets | B-0 `inference-profiles.json` |
| **Model catalog (TS-21)** | Rich JSON + schema | F loader + cost-aware routing |
| **Docs entry** | Long README (865 lines) | Thin README → links here + runbook |
| **Legacy platform docs** | Mixed in `docs/` | `docs/legacy/` quarantine |

Details: [README § Processing Flow](../README.md) (until README slim) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Track A remainder (non-blocking)

| Task | Status |
|------|--------|
| **A-2** — InferenceProfile fields in unified MCP tool schemas | `[ ]` |
| **A-3** — At least one teammate registered from generated MCP config | `[ ]` |

---

## Later tracks (reference)

| Track | Scope |
|-------|--------|
| **C** | Hard gate · PromptAnalyzer · dictionary v0 · 2–5 round enforce · orchestrator merge |
| **E / F** | OpenAI model ID migration · catalog loader · cost-aware TaskRouter |
| **D / P5+** | Tokenizer · response cache · Batch RAG · Grounding |

---

## Related documents

| Need | Document |
|------|----------|
| **How to execute** | [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) |
| **Fork identity** | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| **Doc rules** | [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md) |
| **Architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Memory ADR** | [decisions/TECH_STACK_MEMORY_SUBSTRATE.md](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |

---

**Changelog**

| Timestamp (JST) | Change |
|-----------------|--------|
| 2026/06/19 11:22:09 | Timestamps → `YYYY/MM/DD HH:mm:ss JST`; milestone times from sign-off commits |
| 2026/06/19 11:22:09 | JST date convention for Snapshot, Gate progress, Completed, Changelog |
| 2026/06/19 11:22:09 | Initial FORK_STATUS — migrated from README “Current goals & completed work” snapshot |
