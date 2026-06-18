# Tech Stack Decision: LLM Model Catalog Schema

**Document type**: Architecture Decision Record (ADR)  
**ID**: TS-21  
**Version**: 1.0  
**Date**: 2026-06-18  
**Status**: **Accepted (direction)** — schema + stub only; resolver / TaskRouter wiring pending

---

## 1. Context

TechSapo coordinates **multiple vendors** (OpenAI, Anthropic, Google, OpenRouter) and **multiple models** per vendor. Each model differs in:

- Context window, tool/computer-use support, reasoning tier
- Transport (Codex CLI, Claude Code CLI, `agy`, Responses API, SDK)
- Cost / latency class and suitable task kinds (`llm_codegen`, `llm_aggregate`, …)
- Lifecycle (`active`, `deprecated`, `planned`)

Today this knowledge is fragmented:

| Location | What it stores | Gap |
|----------|----------------|-----|
| `llm-providers.json` | Wall-Bounce runtime registry + loose `capabilities[]` | No structured traits; mixed with routing |
| `InferenceProfile` (TS-20) | Per-invocation knobs (model, effort, cot, temperature) | Not a capability catalog |
| `OPENAI_MODEL_MATRIX.md` | OpenAI-only markdown table | Not machine-readable; not multi-vendor |
| Adapters / docs | Hardcoded defaults | Drift when vendors ship new models |

**Recommendation: yes — design a dedicated LLM Model Catalog schema.**

---

## 2. Decision

Introduce **`LlmModelCatalog`** — a versioned, vendor-neutral JSON document validated by **`config/schemas/llm-model-catalog.schema.json`**.

### 2.1 Separation of concerns

```text
LlmModelCatalog     WHAT models exist + static traits (capabilities, limits, transport)
        ↓ model id / alias
InferenceProfile    HOW to invoke for this request (effort, cot, temperature)
        ↓ preset name
inference-profiles  WHICH preset defaults apply (fast / balanced / deep / critical)
        ↓
TaskRouter          WHO runs which child task (kind → provider + preset)
        ↓
ProviderAdapter     Native CLI/MCP flags
```

Do **not** overload `InferenceProfile` with catalog fields (context window, pricing, tool flags). Do **not** embed full catalogs inside `llm-providers.json` — that file should **reference** catalog model IDs once Track B/F lands.

### 2.2 Catalog entry (summary)

Each **`models[]`** entry includes:

| Field group | Purpose |
|-------------|---------|
| **Identity** | `id`, `vendor`, `displayName`, `status`, optional `replaces` / `deprecatedBy` |
| **Routing** | `tier`, `roles[]` (align with P5 `ChildTaskKind`), `presetDefault` |
| **Capabilities** | Structured flags: reasoning tier, toolUse, computerUse, compaction, multimodal, japaneseQuality |
| **Limits** | `contextTokens`, optional `maxOutputTokens` |
| **Transport** | `invocationTypes[]`, `preferredInvocation`, optional `apiSurface` (`responses_api`, …) |
| **Notes** | Free text (e.g. "prompt caching 24h only") |

Vendors are defined once in **`vendors{}`** (display name, subscription vs API-key policy).

### 2.3 Aliases

**`aliases`** map short names (`sonnet`, `gpt-5.5`, legacy `gpt-5-codex`) → canonical `models[].id`. Adapters and presets resolve aliases through the catalog loader (To-Be), not ad hoc strings in code.

### 2.4 Relationship to existing artifacts

| Artifact | Role after catalog |
|----------|-------------------|
| [OPENAI_MODEL_MATRIX.md](../OPENAI_MODEL_MATRIX.md) | Human-readable OpenAI slice; **source for catalog entries** until single doc is enough |
| `config/llm-model-catalog.json` | **Canonical machine-readable** multi-vendor catalog (stub ships with schema) |
| `llm-providers.json` | Runtime Wall-Bounce registry; migrate to `{ "catalogId": "gpt-5.5", … }` (Track F) |
| `inference-profiles.json` | Presets reference catalog model ids / aliases |

---

## 3. AS-IS → To-Be

| | AS-IS | To-Be |
|---|--------|--------|
| Model traits | Markdown + loose JSON arrays | `llm-model-catalog.json` + JSON Schema |
| Validation | None | `npm run validate:config` (ajv) |
| TaskRouter | Hardcoded / markdown | Reads catalog for eligibility (tool required → filter models) |
| New vendor model | Edit code + multiple docs | Add catalog entry + alias; update matrix doc optional |

---

## 4. Non-goals (this ADR)

- Pricing API sync or live quota — `costHint` enum only
- Embedding model catalog — separate future schema if needed
- Implementing catalog loader in TypeScript — backlog Track F

---

## 5. References

- [TECH_STACK_INFERENCE_PROFILES.md](./TECH_STACK_INFERENCE_PROFILES.md) (TS-20)
- [OPENAI_MODEL_MATRIX.md](../OPENAI_MODEL_MATRIX.md)
- [FORK_CURSOR.md § Fork schemas](../FORK_CURSOR.md#fork-schemas)
- Schema: [config/schemas/llm-model-catalog.schema.json](../../config/schemas/llm-model-catalog.schema.json)
- Stub: [config/llm-model-catalog.json](../../config/llm-model-catalog.json)
