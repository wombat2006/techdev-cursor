# Anthropic API — Pricing

**Status**: Reference — catalog models priced at platform current tier  
**Platform**: [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [claude.com/pricing](https://claude.com/pricing) (subscriptions)  
**Related**: [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) · [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

Anthropic bills API usage in **USD per million tokens (MTok)** plus **feature-specific** charges (web search, code execution hours, managed-agent session runtime). Subscription plans (Pro/Max/Team) bundle Claude Code differently — see [claude.com/pricing](https://claude.com/pricing).

**Fork AS-IS:** Wall-Bounce multiplies cost across 2–5 rounds and multiple providers. Catalog `apiPricing` on each model supports cost-aware routing documentation; runtime billing uses CLI provider accounts per [SECURITY.md](./SECURITY.md).

**Full Sonnet / Opus / Haiku lineup with versions and rates:** [ANTHROPIC_MODELS_OVERVIEW.md § Model lineup](./ANTHROPIC_MODELS_OVERVIEW.md#model-lineup-with-pricing-usd--mtok).

**Version policy:** Same list price within a family → **use the latest id** (Sonnet **4.6**). Opus aggregate: **4.6 default**, escalate **4.8** when gates miss or `taskType: critical` — see [Opus tier — aggregator](./ANTHROPIC_MODELS_OVERVIEW.md#opus-tier-selection--aggregator).

---

## Catalog model rates (standard API)

USD / MTok — `lastReviewed` in [llm-model-catalog.json](../config/llm-model-catalog.json).

| Model (catalog id) | Input | Cache hit | Output | Batch input | Batch output |
|--------------------|-------|-----------|--------|-------------|--------------|
| `claude-sonnet-4-6` | $3 | $0.30 | $15 | $1.50 | $7.50 |
| `claude-opus-4-6` | $5 | $0.50 | $25 | $2.50 | $12.50 |
| `claude-opus-4-8` | $5 | $0.50 | $25 | $2.50 | $12.50 |
| `claude-haiku-4-5` | $1 | $0.10 | $5 | $0.50 | $2.50 |

**Cache writes** (relative to base input): 5-minute **1.25×**, 1-hour **2×**. **Cache read** = **0.1×** base (matches `cachedInputUsd` in catalog).

**Thinking tokens** bill as **output**. Tool-use system prompt overhead: Sonnet 4.6 ~496 tokens (`auto`/`none`) or ~588 (`any`/`tool`) — see platform [tool use pricing](https://platform.claude.com/docs/en/about-claude/pricing#tool-use-pricing).

---

## Platform lineup (reference)

Canonical version + cost table: [models overview § lineup](./ANTHROPIC_MODELS_OVERVIEW.md#model-lineup-with-pricing-usd--mtok). Catalog pins Sonnet **4.6**; Opus **4.6** aggregate default with **4.8** escalation.

| Tier | Catalog id | Input | Output |
|------|------------|-------|--------|
| Sonnet | `claude-sonnet-4-6` | $3 | $15 |
| Opus (aggregate default) | `claude-opus-4-6` | $5 | $25 |
| Opus (escalation) | `claude-opus-4-8` | $5 | $25 |
| Haiku | `claude-haiku-4-5` | $1 | $5 |
| Fable 5 | `claude-fable-5` | $10 | $50 | Not in catalog |

Full platform table: [pricing](https://platform.claude.com/docs/en/about-claude/pricing#model-pricing).

---

## Prompt caching multipliers

| Operation | Multiplier | Duration |
|-----------|------------|----------|
| 5m cache write | 1.25× input | 5 minutes |
| 1h cache write | 2× input | 1 hour |
| Cache read (hit) | 0.1× input | Same as write TTL |

Stacks with Batch API and data residency multipliers. Implementation: [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md).

**Payoff:** One cache read recovers 5m write cost; two reads recover 1h write cost.

---

## Batch API

**50% discount** on input and output vs standard rates. Async only — see [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md). Catalog `apiPricing.batch` mirrors platform batch table.

---

## Feature-specific pricing (summary)

| Feature | Pricing |
|---------|---------|
| **Web search** | $10 / 1,000 searches + token cost of results |
| **Web fetch** | No extra charge — token cost of fetched content only |
| **Code execution** | Free with web search/fetch tools; else $0.05/hr/container after 1,550 free hrs/mo |
| **Bash tool** | +245 input tokens + stdout/stderr tokens |
| **Text editor** (`text_editor_20250429`) | +700 input tokens |
| **Computer use** | ~735 tokens/tool def + screenshot vision tokens |
| **Fast mode** (Opus 4.6–4.8 research preview) | Premium input/output — not on Claude Platform on AWS |
| **Data residency** (`inference_geo: us`) | 1.1× all token categories (4.6+) |
| **Managed Agents** | Model tokens + **$0.08/session-hour** runtime (replaces container-hour billing) |

Regional Bedrock/Vertex endpoints: **+10%** over global for 4.5+ models.

---

## Cloud billing models

| Surface | Billing |
|---------|---------|
| **Claude API (first-party)** | Per-token + features; Console usage page |
| **Claude Platform on AWS** | CCU at **$0.01/CCU** (= $1 per 100 CCU); token-rated then converted |
| **Bedrock / Vertex** | Provider invoices — see AWS/GCP pricing pages |
| **Claude Code `/usage`** | Local estimate — authoritative: Console or OTel `claude_code.cost.usage` |

Bedrock/Vertex/Foundry: attach identity via `OTEL_RESOURCE_ATTRIBUTES` for cost attribution — [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md).

---

## Cost optimization (API + agents)

1. **Model tier:** Haiku extract → Sonnet agent → Opus hard reasoning
2. **Prompt caching** on static system/tools/docs prefixes
3. **Batch API** for offline RAG and non-urgent workloads
4. **Preflight** with `messages/count_tokens` — [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md)
5. **Claude Code:** context discipline — [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md)

Wall-Bounce: constitution requires 2–5 rounds — budget Haiku for extract rounds where possible (backlog E-7).

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiPricing.standard` | inputUsd, cachedInputUsd (cache hit), outputUsd |
| `apiPricing.batch` | Batch-discounted rates |
| `apiPricing.pricingUrl` | Platform pricing page |
| `prompting.guidanceTopics[]` | `anthropic-pricing-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Runtime | No automatic cost routing from `apiPricing` in adapters |
| F-10 | Pricing topics not injected at runtime |

---

## References

- [Pricing (platform)](https://platform.claude.com/docs/en/about-claude/pricing)
- [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [Manage costs (Claude Code)](https://code.claude.com/docs/en/costs)
