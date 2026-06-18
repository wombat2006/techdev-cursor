# OpenAI Model Matrix (Catalog)

**Status**: Documented — **logic/config migration pending** (see [PROVIDER_INTEGRATION_BACKLOG.md](./PROVIDER_INTEGRATION_BACKLOG.md#openai-model-catalog-migration))  
**Owner**: TechSapo Development Team  
**Last updated**: 2026-06-18

Target catalog for OpenAI models used in TechSapo / `techdev-cursor`. **AS-IS code** still references legacy IDs (`gpt-5-codex`, `gpt-5`, etc.) until backlog items are implemented.

**Machine-readable catalog**: multi-vendor entries live in [config/llm-model-catalog.json](../config/llm-model-catalog.json) (TS-21). OpenAI traits sourced from [OpenAI Cookbook](https://github.com/openai/openai-cookbook) and [platform prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance). Human summaries: this doc · [OPENAI_PROMPT_GUIDANCE.md](./OPENAI_PROMPT_GUIDANCE.md).

Related: [TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [OPENAI_COOKBOOK_INTEGRATION.md](./OPENAI_COOKBOOK_INTEGRATION.md) · [OPENAI_PROMPT_GUIDANCE.md](./OPENAI_PROMPT_GUIDANCE.md)

---

## Model catalog

| Model | Role / when to use | Standard API price (input / cached / output per 1M) | Prompt guide | Notes |
|-------|-------------------|-----------------------------------------------------|--------------|-------|
| **GPT-5.5** | Flagship; complex work | $5 / $0.5 / $30 | [gpt-5.5.md](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.5.md) | Outcome-first; Responses API |
| **GPT-5.5 Pro** | Hardest problems | $30 / — / $180 | gpt-5.5.md (shared) | Critical preset |
| **GPT-5.4** | Cost-efficient agents | $2.5 / $0.25 / $15 | [gpt-5.4.md](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.4.md) | Output contracts; downgrade from 5.5 |
| **GPT-5.4 Pro** | Hard synthesis | $30 / — / $180 | gpt-5.4.md | Between 5.4 and 5.5 Pro |
| **GPT-5.4 mini** | High-volume + tools | $0.75 / $0.075 / $4.5 | gpt-5.4.md (mini section) | Preset `balanced` |
| **GPT-5.4 nano** | Lightest QPS | $0.2 / $0.02 / $1.25 | gpt-5.4.md (nano section) | Preset `fast`; no tool search |
| **GPT-5.3 Codex** | Agentic codegen (target) | CLI subscription (+ API) | [gpt-5.3-codex.md](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.3-codex.md) | No upfront preamble; phase required |

---

## Mapping to InferenceProfile presets (To-Be)

| Preset | Target model | Rationale |
|--------|--------------|-----------|
| `fast` | GPT-5.4 **nano** | Lowest API cost; simple tasks |
| `balanced` | GPT-5.4 **mini** or **gpt-5.4** | Cost vs capability tradeoff |
| `deep` | **GPT-5.5** or **GPT-5.4** | Complex work — prefer 5.4 if eval passes (cheaper) |
| `critical` | **GPT-5.5 Pro** | Hardest aggregation / cross-critique |
| `codegen` | **GPT-5.3 Codex** (CLI) | Codex prompt stack — not GPT-5.5 prompts |

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
