# Fork Onboarding — Design Depth & Maturity

*[English](FORK_ONBOARDING.md) | [日本語](./ja/FORK_ONBOARDING.md)*

**Purpose:** Design philosophy and honest AS-IS / To-Be for human readers (recruiters, reviewers, new teammates).  
**Not:** An execution checklist — use [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md).  
**Status:** Active · **Last updated:** 2026/06/21 19:59:15 JST  
**Related:** [FORK_CURSOR.md](./FORK_CURSOR.md) · [FORK_STATUS.md](./FORK_STATUS.md) · [TO-BE-GLOSSARY-PIPELINE.md](../meta/TO-BE-GLOSSARY-PIPELINE.md) · [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md)

---

## Design philosophy (summary)

### What this is

A **Cursor-integrated development platform** that helps teams **build software solutions** for real problems — **accurately, efficiently, and at subscription-scale cost** — by orchestrating multiple LLMs (Claude, Codex, Gemini via Antigravity) instead of betting on a single model.

### Problem it targets

| Pain | How this repo addresses it |
|------|----------------------------|
| Single-LLM coding is fast but error-prone | **Wall-Bounce** — multi-LLM consensus with quality thresholds (when analysis must be trustworthy) |
| Ad-hoc model usage → cost blow-ups | **TS-21 catalog** — model traits, pricing tiers, and routing rules in structured JSON |
| Tool sprawl (Claude / Codex / Gemini each different) | **Unified MCP** (`techsapo-providers`) — one Cursor integration, peer provider adapters |
| RAG / domain terminology drift before ingest | **Glossary consumer** (Phase 0) — extract → adopt/hold JSON; platform CLI read-only ([TO-BE-GLOSSARY-PIPELINE.md](../meta/TO-BE-GLOSSARY-PIPELINE.md)) |
| Secrets in repos | **CLI/OAuth only** — no API keys in code ([SECURITY.md](./SECURITY.md)) |

### What makes the engineering thoughtful

- **Separation of concerns:** catalog (WHAT) · InferenceProfile (HOW per request) · adapters (BIND to CLI)
- **Architecture Decision Records** in `docs/decisions/` — stack choices are documented, not tribal knowledge
- **Fork with a clear scope:** coding assistance in Cursor — **not** an IT incident-analysis product line
- **Agent docs (Plan A):** neutral [AGENTS.md](../AGENTS.md) + tool-specific shims — maintainable AI-agent instructions

### What this is not

- Not a no-code “build any business system” generator — it **accelerates professional software development**
- Not an InfraOps / on-call incident platform (upstream fork line)
- Not “ChatGPT with extra steps” — explicit governance, ADRs, and multi-vendor integration discipline

---

## Honest maturity (AS-IS vs To-Be)

For **rolling Gate timestamps**, see [FORK_STATUS.md](./FORK_STATUS.md). Summary:

| Area | AS-IS (today) | To-Be (planned) |
|------|---------------|-----------------|
| Unified MCP + adapters | **Implemented** + G7 pass | A-2/A-3 remainder; continue MCP/adapter operational checks |
| Daily Cursor coding | Single-provider MCP path | Same — by design |
| Hard multi-LLM analysis | Wall-Bounce API exists | Constitution enforced in code (Track C) |
| Model catalog (TS-21) | Rich JSON + schema | Loader + cost-aware TaskRouter in runtime (Track F) |
| Memory substrate (TS-22) | ADR + schema + types; G-MEM closed | `OrchestrationSessionStore` + `sessionId` (Track B M1) |
| Session continuation (TS-24) | ADR — post-Aggregator follow-up + negative retry policy | Track B wiring with Layer A |
| Glossary prep (RAG) | **Phase 0** — consumer config, first extract, adopt/hold JSON; `npm run glossary:extract` | Phase 2.5 knowledge filter · Phase 4 `googledrive-connector` hook |
| OpenAI vendor depth | Cookbook / prompt guidance in catalog | Anthropic / Google same pattern next |

---

## Multi-vendor integration maturity (in progress)

Official **Cookbook / platform docs** are ingested into [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) (`config/llm-model-catalog.json`). **OpenAI is ahead**; Anthropic and Google follow the same pattern.

```text
OpenAI     ████████░░  In progress (Cookbook · prompt guidance · pricing in catalog)
Anthropic  ██░░░░░░░░  Planned (Claude official docs → TS-21)
Google     ██░░░░░░░░  Foundation only (agy ops; catalog enrich next)
```

| Provider | TS-21 catalog | Official docs integration | Status |
|----------|---------------|---------------------------|--------|
| **OpenAI** | GPT-5.x / Codex detail | [Cookbook](./OPENAI_COOKBOOK_INTEGRATION.md) · [prompt guidance](./OPENAI_PROMPT_GUIDANCE.md) · [model matrix](./OPENAI_MODEL_MATRIX.md) | **Leading** — `cookbookIndex` / `promptGuidanceIndex` |
| **Anthropic** | Claude entries (summary) | Claude Cookbook / docs → TS-21 (planned) | **Planned** — Tier 3 / Claude Code CLI AS-IS |
| **Google** | Gemini entries (summary) | [Antigravity CLI](./ANTIGRAVITY_CLI_MIGRATION.md) · [Gemini guides](./gemini-api-migration-guide.md) | **Foundation** — Tier 1 `agy`; enrich next |

> Bar = catalog ingestion of official vendor knowledge (not production code completeness).

---

## Design themes (pointers)

| Theme | Design choice (summary) | Detail |
|-------|-------------------------|--------|
| **Wall-Bounce constitution** | No single-LLM bypass · 2–5 rounds · confidence ≥ 0.7 / consensus ≥ 0.6 | [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md) · [AGENTS.md](../AGENTS.md) |
| **LLM catalog (TS-21)** | Model traits · transport · pricing in JSON; adapters = HOW | [TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) |
| **InferenceProfile (TS-20)** | Per-request effort / CoT / temperature separate from catalog | [TECH_STACK_INFERENCE_PROFILES.md](./decisions/TECH_STACK_INFERENCE_PROFILES.md) |
| **Memory (TS-22)** | Layer A transcript · UTC events · idle 7d / max 30d · single store | [TECH_STACK_MEMORY_SUBSTRATE.md](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |
| **Session continuation (TS-24)** | Post-Aggregator follow-up · upward-jitter negative retry | [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| **Glossary consumer** | Consumer-only edits · sibling platform invoke · adopt/hold outputs | [TO-BE-GLOSSARY-PIPELINE.md](../meta/TO-BE-GLOSSARY-PIPELINE.md) · [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md) |
| **Fork scope** | Cursor coding assist — not IT incident line | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| **Security** | Subscription CLI / SDK only — no API keys in repo | [SECURITY.md](./SECURITY.md) |
| **OpenAI (leading)** | Prompt guidance · Cookbook · cost tiers · gated Batch RAG | [OPENAI_COOKBOOK_INTEGRATION.md](./OPENAI_COOKBOOK_INTEGRATION.md) |
| **ADR discipline** | Stack decisions in `docs/decisions/` | [decisions/README.md](./decisions/README.md) |

---

## Execution priority (roadmap summary)

Detail: [CURSOR_MCP_TODO § Track priority](./CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review). Gate order **A → B → C** is fixed.

| Priority | Focus | Track |
|----------|-------|-------|
| **P0** | Cursor AI tools usable from IDE | A — **Gate A→B Pass** |
| **P1** | Same adapters for analysis API · presets · Layer A memory | **B** ← **current** |
| **P2** | Cost-aware routing · runtime catalog loader | E / F |
| **P3** | Constitution enforce in code · orchestrator merge | C |
| **P4** | Cache · Batch RAG · grounding (optional) | D / P5+ |

Daily Cursor coding: **one MCP**. Hard multi-LLM analysis: **Wall-Bounce API** (2–5 rounds). Code enforcement: Track C (To-Be).
