# OpenAI Model Matrix (Catalog)

**Status**: Documented — **logic/config migration pending** (see [PROVIDER_INTEGRATION_BACKLOG.md](./PROVIDER_INTEGRATION_BACKLOG.md#openai-model-catalog-migration))  
**Owner**: TechSapo Development Team  
**Last updated**: 2026-06-18

Target catalog for OpenAI models used in TechSapo / `techdev-cursor`. **AS-IS code** still references legacy IDs (`gpt-5-codex`, `gpt-5`, etc.) until backlog items are implemented.

**Machine-readable catalog**: multi-vendor entries live in [config/llm-model-catalog.json](../config/llm-model-catalog.json) (TS-21). This doc is the OpenAI-focused view; add entries there when models ship.

Related: [TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## Model catalog

| Model | Role / when to use | Capabilities (reference) | Context | Pricing | Notes |
|-------|-------------------|--------------------------|---------|---------|-------|
| **GPT-5.5** | Flagship general model; complex work | Strong reasoning, tool use, long-running workflows | 1M tokens | [Pricing page](https://openai.com/api/pricing/) | Optimized for **Responses API**; prompt caching **24h only** |
| **GPT-5.5 Pro** | Harder problems than GPT-5.5 | Higher-compute tier above GPT-5.5 | — | [Pricing page](https://openai.com/api/pricing/) | **Responses API** oriented |
| **GPT-5.4 mini** | Fast, low-cost, high volume | GPT-5.4-class; tool search, computer use, compaction | — | [Pricing page](https://openai.com/api/pricing/) | Suited for **chat / conversational** workloads |
| **GPT-5.4 nano** | Lightest, highest-frequency simple tasks | Compaction supported; **no** tool search / computer use | — | [Pricing page](https://openai.com/api/pricing/) | Simple high-QPS tasks |

---

## Mapping to InferenceProfile presets (To-Be)

| Preset | Target model | Rationale |
|--------|--------------|-----------|
| `fast` | GPT-5.4 **nano** | High-frequency, low-latency dev assists |
| `balanced` | GPT-5.4 **mini** | Default chat + tool-capable volume |
| `deep` | **GPT-5.5** | Complex multi-step analysis / codegen review |
| `critical` | **GPT-5.5 Pro** | Hardest aggregation / cross-critique |

Codex CLI (`codex` / `analyze_codex`) remains the **subscription** transport for OpenAI codegen until CLI model flags align with this catalog — see backlog.

---

## AS-IS vs To-Be

| Area | AS-IS (code today) | To-Be (this catalog) |
|------|-------------------|----------------------|
| Wall-Bounce provider key | `gpt-5-codex` | Route by preset → 5.4 mini / 5.5 / 5.5 Pro |
| Codex adapter default | legacy `gpt-5-codex` | CLI model flag + preset map |
| API path | Chat/completions patterns | **Responses API** for GPT-5.5 family |
| Prompt caching | ad hoc | 24h window only (GPT-5.5 constraint) |

**Do not change** `src/config/llm-providers.json` or adapters until backlog tasks are scheduled — documentation-only phase.

---

## Non-OpenAI providers (unchanged in this doc)

Google Tier 1 (Antigravity `agy`), Anthropic (Claude Code CLI / SDK), and OpenRouter tiers are documented separately. Claude model IDs in AS-IS config may also lag vendor releases — track under a future Anthropic catalog pass.
