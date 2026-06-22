# Anthropic — Models Overview

**Status**: Reference — catalog pins Sonnet 4.6; Opus 4.6 aggregate default with 4.8 escalation  
**Platform**: [Models overview (en)](https://platform.claude.com/docs/en/about-claude/models/overview) · [モデルの概要 (ja)](https://platform.claude.com/docs/ja/about-claude/models/overview) · [Model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions) · [Models API](https://platform.claude.com/docs/en/api/models/list)  
**Related**: [ANTHROPIC_MODEL_SYSTEM_CARDS.md](./ANTHROPIC_MODEL_SYSTEM_CARDS.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md) · [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [decisions/TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

Anthropic publishes a **family** of Claude models across API, Claude Platform on AWS, Bedrock, Vertex AI, and Foundry. All current models support **text + image in**, **text out**, multilingual, and vision.

**Fork catalog** ([llm-model-catalog.json](../config/llm-model-catalog.json)) pins **Sonnet 4.6**, **Opus 4.6** (aggregate default), and **Opus 4.8** (escalation).

---

## Model lineup with pricing (USD / MTok)

Standard API rates; **cache hit** = 0.1× input; **batch** = 50% off input/output. Full multipliers: [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md). **Thinking** tokens bill as output.

### Sonnet

| Version | API ID | Fork role | Status | Input | Cache hit | Output | Batch in / out | Context |
|---------|--------|-----------|--------|-------|-----------|--------|----------------|---------|
| **Sonnet 4.6** | `claude-sonnet-4-6` | **Primary** analyze / agent | **Current** (catalog) | $3 | $0.30 | $15 | $1.50 / $7.50 | 1M |
| Sonnet 4.5 | `claude-sonnet-4-5-20250929` | — | Legacy GA | $3 | $0.30 | $15 | $1.50 / $7.50 | 200k |
| Sonnet 4 | `claude-sonnet-4-20250514` | — | Retire **2026-06-15** | $3 | $0.30 | $15 | $1.50 / $7.50 | 200k |

[System card](http://anthropic.com/claude-sonnet-4-6-system-card)

### Opus

| Version | API ID | Fork role | Status | Input | Cache hit | Output | Batch in / out | Context |
|---------|--------|-----------|--------|-------|-----------|--------|----------------|---------|
| **Opus 4.8** | `claude-opus-4-8` | Escalation / `critical` | Catalog (escalation tier) | $5 | $0.50 | $25 | $2.50 / $12.50 | 1M |
| Opus 4.7 | `claude-opus-4-7` | — | Legacy | $5 | $0.50 | $25 | $2.50 / $12.50 | 1M |
| **Opus 4.6** | `claude-opus-4-6` | **Aggregator** (default) | Catalog | $5 | $0.50 | $25 | $2.50 / $12.50 | 1M |
| Opus 4.1 | `claude-opus-4-1-20250805` | — | **Deprecated** — retire **2026-08-05** | $15 | $1.50 | $75 | $7.50 / $37.50 | 200k |
| Opus 4 | `claude-opus-4-20250514` | — | Retire **2026-06-15** | $15 | $1.50 | $75 | $7.50 / $37.50 | 200k |

[System card](https://anthropic.com/claude-opus-4-8-system-card). **List price** is identical for 4.6–4.8 ($5 / $25); **effective** cost differs — see [Opus tier — aggregator](#opus-tier-selection--aggregator).

### Haiku (fast tier)

| Version | API ID | Fork role | Status | Input | Cache hit | Output | Batch in / out | Context |
|---------|--------|-----------|--------|-------|-----------|--------|----------------|---------|
| **Haiku 4.5** | `claude-haiku-4-5-20251001` | Fast extract | **Current** | $1 | $0.10 | $5 | $0.50 / $2.50 | 200k |

### Fable / Mythos 5 (not in fork catalog)

| Model | API ID | Input | Output | Notes |
|-------|--------|-------|--------|-------|
| Fable 5 | `claude-fable-5` | $10 | $50 | GA; adaptive thinking always on |
| Mythos 5 | `claude-mythos-5` | $10 | $50 | Glasswing invitation only |

Details: [Introducing Fable 5 and Mythos 5](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5).

---

## Version policy — prefer latest within family

When standard API **list rates are equal** (or lower on the newer release), **use the latest platform id** — **except** where workload shape makes an older same-price tier cheaper at runtime (see [aggregator](#opus-tier-selection--aggregator)).

| Family | Default (target) | Avoid when avoidable | Standard $/MTok (in / out) | Rationale |
|--------|------------------|----------------------|----------------------------|-----------|
| **Sonnet** | `claude-sonnet-4-6` | 4.5, 4 | $3 / $15 | 1M context, adaptive thinking; same price as 4.5 |
| **Opus (analyze / hardest coding)** | `claude-opus-4-8` | 4.7, 4.6, 4.1, 4 | $5 / $25 (4.6–4.8) | Newest cutoff + capability |
| **Opus (aggregator — recommended)** | `claude-opus-4-6` | 4.1, 4 | $5 / $25 | Same list rate; **pre-4.7 tokenizer** → ~30% fewer billed tokens on large synthesis inputs |
| **Haiku** | `claude-haiku-4-5-20251001` | — | $1 / $5 | Current tier |

**Fork catalog today:** Sonnet **4.6** + Opus **4.6** (aggregate default) with **4.8** escalation — see [Opus tier — aggregator](#opus-tier-selection--aggregator).

---

## Opus tier selection — aggregator

Wall-Bounce **aggregator** (`llm_aggregate` / `critical` preset) synthesizes **already-produced** peer outputs. It is **input-heavy** (multi-provider transcripts, tool dumps, JSON blocks) and **not** the primary exploration step — Sonnet / Codex / Gemini analyze rounds do most reasoning first.

### Why list price alone misleads

Opus **4.6–4.8** share **$5 / $25** MTok. From **4.7 onward**, Anthropic ships a **new tokenizer** that counts **~30–35% more tokens** for the same UTF-8 text. Billing is per counted token, so **4.8 can cost ~1.3× per aggregate call** vs 4.6 on identical payloads — before thinking output.

| Factor | Opus 4.6 | Opus 4.8 |
|--------|----------|----------|
| List $/MTok (in / out) | $5 / $25 | $5 / $25 |
| Tokenizer | Pre-4.7 (fewer tokens / same text) | New (~+30–35% input on JP / code / JSON) |
| Knowledge cutoff | ~Aug 2025 class | Jan 2026 |
| `effort` default | Set explicitly | **`high`** on API + Claude Code |
| Adaptive thinking | Yes | Yes |
| Mid-conversation `role:system` | No | Yes (API + AWS) |
| Best for aggregator when… | **Default** — cost-sensitive synthesis | **Escalation** — peers disagree, architecture, compliance |

### Recommended fork posture

| Tier | Model | When |
|------|-------|------|
| **Default aggregate** | `claude-opus-4-6` | Routine Wall-Bounce synthesis; peers aligned; JSON / JP output contract |
| **Escalate aggregate** | `claude-opus-4-8` | `confidence < 0.7` or `consensus < 0.6` after first pass; `taskType: critical`; explicit architecture / safety synthesis |
| **Never for aggregate** | Opus 4.1 / 4 | Deprecated; 3× list price vs 4.6 |

**Operational habits (either Opus tier):**

1. **`count_tokens` preflight** on aggregate payload — [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md)
2. **`effort: medium`** on 4.8 aggregate unless escalation warrants `high` (default `high` inflates thinking output cost)
3. **Prompt caching** on static orchestrator system + tool defs across rounds
4. **Trim peer noise** before aggregate — aggregator needs disagreements + evidence, not full tool stderr

**Quality vs cost (illustrative):** 200k-token aggregate input at list rates ≈ **$1.00** (4.6) vs **~$1.30** (4.8 tokenizer uplift). Across constitution **2–5 rounds** × multiple peers, defaulting every aggregate to 4.8 compounds cost without guaranteed uplift — peers already ran frontier analysis on Sonnet / Codex.

**Catalog gap (AS-IS):** `claude-adapter.ts` has no aggregate retry — escalation runs in `wall-bounce-analyzer.ts` only.

---

## Choosing a model (platform guidance)

| Workload | Platform recommendation | $/MTok (in / out) |
|----------|-------------------------|-------------------|
| Hardest reasoning / long-horizon agentic coding | **Claude Opus 4.8** (`claude-opus-4-8`) | $5 / $25 |
| Peak capability (widely released) | **Claude Fable 5** (`claude-fable-5`) | $10 / $50 |
| Best speed + intelligence balance | **Claude Sonnet 4.6** (`claude-sonnet-4-6`) | $3 / $15 |
| Fastest / near-frontier | **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) | $1 / $5 |

**Fork routing:** Sonnet **4.6** for analyze/agent; Opus **4.6** default aggregate (escalate **4.8**) — [Opus tier — aggregator](#opus-tier-selection--aggregator).

---

## Current tier — capabilities (platform)

Feature comparison for **current** Sonnet / Opus / Haiku (pricing in [lineup table](#model-lineup-with-pricing-usd--mtok)):

| Feature | Opus 4.8 | Sonnet 4.6 | Haiku 4.5 |
|---------|----------|------------|-----------|
| API ID | `claude-opus-4-8` | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |
| Extended thinking | No | Yes | Yes |
| Adaptive thinking | Yes | Yes | No |
| Max output | 128k | 64k | 64k |
| Knowledge cutoff (reliable) | Jan 2026 | Aug 2025 | Feb 2025 |

**Opus 4.8:** `effort` defaults to **`high`** on API and Claude Code — set explicitly to change. Context **1M** (200k on Foundry). Batch extended output: up to **300k** tokens with `output-300k-2026-03-24` beta (Opus 4.6–4.8, Sonnet 4.6).

**Tokenizer:** Opus 4.7+ and Fable/Mythos 5 use a new tokenizer — budget accordingly when migrating (see Opus [lineup note](#opus)).

---

## Platform deprecations

| Model | API ID | Retire date | Migrate to |
|-------|--------|-------------|------------|
| Claude Opus 4.1 | `claude-opus-4-1-20250805` | **2026-08-05** | Opus 4.8 |
| Claude Sonnet 4 | `claude-sonnet-4-20250514` | **2026-06-15** | Sonnet 4.6 |
| Claude Opus 4 | `claude-opus-4-20250514` | **2026-06-15** | Opus 4.8 |

Full schedule: [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations).

> **Warning:** Opus 4.1 retires **2026-08-05**. Sonnet 4 / Opus 4 retire **2026-06-15** if still referenced externally.

---

## Prompt and output performance (Claude 4 family)

Platform highlights for Claude 4 models:

- **Performance:** Strong on reasoning, coding, multilingual, long context, honesty, vision — [Claude 4 blog](https://www.anthropic.com/news/claude-4).
- **Engaging responses:** Tune verbosity via [prompt engineering](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering) and [prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).
- **Migration uplift:** Larger quality gains vs pre-4 generations when upgrading pinned ids.

Fork: user-facing Wall-Bounce output remains **Japanese** per constitution; model tier choice is separate from response language.

---

## Model IDs and versioning

- **Dated IDs** (e.g. `20250929`) = pinned snapshot.
- **4.6+ dateless IDs** (e.g. `claude-sonnet-4-6`) = **also pinned**, not evergreen pointers.
- **Aliases** (pre-4.6) resolve to dated snapshots for convenience.
- **Claude Platform on AWS** uses API-style IDs, not Bedrock ARNs; lifecycle follows Anthropic deprecations.

Query limits programmatically: [Models API `list`](https://platform.claude.com/docs/en/api/models/list) → `max_input_tokens`, `max_tokens`, `capabilities`.

---

## Cloud platform notes

| Surface | ID style | Endpoint notes |
|---------|----------|----------------|
| Claude API | `claude-*` | Global default |
| Bedrock | `anthropic.claude-*` | Global vs regional (+10% for 4.5+) |
| Vertex AI | `claude-*@date` | Global / multi-region / regional |
| Foundry | API-style | Opus 4.8 context may be 200k |

Regional pricing: [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md#cloud-billing-models).

---

## Migration pointers (legacy → catalog)

Catalog already pins **4.6** / **4.8**. External integrations still on legacy ids:

| From (legacy) | To (catalog / recommended) | Why |
|---------------|----------------------------|-----|
| Sonnet 4.5 / 4 | `claude-sonnet-4-6` | Same $3/$15; 1M + adaptive thinking |
| Opus 4.1 / 4 | `claude-opus-4-6` or `4.8` | $5/$25; **4.6** default aggregate, **4.8** escalate |
| Opus 4.7 | `claude-opus-4-8` | Same list rate — use 4.8 only when capability > tokenizer cost |
| Manual thinking budgets | Adaptive + effort | [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) |

Platform guide: [Opus 4.7+ migration](https://platform.claude.com/docs/en/about-claude/models/migration-guide#migrating-from-claude-opus-47).

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `vendors.anthropic.docsUrl` | Models overview platform URL |
| `prompting.guidanceTopics[]` | `anthropic-models-overview-*` (incl. `lineup` for version + cost table) |
| `limits.contextTokens` / `maxOutputTokens` | Per pinned model |
| `references[]` | `anthropic-models-overview` platform_docs |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Catalog | No Fable 5 / Mythos 5; `claude-adapter` critical escalation retry not implemented |
| Adapter | `claude-adapter.ts` passes CLI alias (`sonnet`/`opus`) — resolves via catalog |
| F-10 | Models overview topics not injected at runtime |

---

## See also

- [Model system cards](./ANTHROPIC_MODEL_SYSTEM_CARDS.md)
- [Models overview (en)](https://platform.claude.com/docs/en/about-claude/models/overview) · [ja](https://platform.claude.com/docs/ja/about-claude/models/overview)
- [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- [Pricing](./ANTHROPIC_PRICING.md)
- [Capabilities hub](./ANTHROPIC_CAPABILITIES_OVERVIEW.md)
- [Get started — first API call](https://platform.claude.com/docs/en/get-started)
