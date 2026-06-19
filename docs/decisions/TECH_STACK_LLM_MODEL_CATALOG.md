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
| **Identity** | `id`, `vendor`, `modelFamily`, `displayName`, `status`, optional `replaces` / `deprecatedBy` |
| **Routing** | `tier`, `roles[]` (align with P5 `ChildTaskKind`), `presetDefault` |
| **Modalities** | `modalities[]` — text, vision, document, audio, multimodal |
| **Capabilities** | Structured flags: reasoning tier, toolUse, toolSearch, computerUse, compaction, spatial/document understanding |
| **API features** | `apiFeatures` — reasoningEffort, verbosity, structuredOutputs, promptCaching TTL, parallelToolCalls, CFG, Codex goals/adaptiveReasoning, **`batchApi.supported`** (flag only — no JSONL templates) |
| **Builtin tools** | `builtinTools` — mcp, computerUse, terminal, applyPatch, fileSearch, … |
| **Prompting** | `prompting.style`, `approach`, `guidanceTopics[]`, `platformGuideUrl` — see [OPENAI_PROMPT_GUIDANCE.md](../OPENAI_PROMPT_GUIDANCE.md) |
| **Limits** | `contextTokens`, optional `maxOutputTokens` |
| **Transport** | `invocationTypes[]`, `preferredInvocation`, `apiSurface`, optional `invocationBindingRef` |
| **Pricing** | `apiPricing` — USD per 1M tokens (standard/batch/flex/priority) for cost-aware routing |
| **References** | `references[]` — [OpenAI Cookbook](https://github.com/openai/openai-cookbook) slugs + URLs, platform docs, pricing |
| **Notes** | Free text (e.g. "prompt caching 24h only") |

Catalog root may include **`cookbookIndex`**: reverse map of Cookbook `registry.yaml` slug → model ids.

Catalog root may include **`promptGuidanceIndex`**: reverse map of [platform prompt-guidance](https://developers.openai.com/api/docs/guides/prompt-guidance) topic slug → model ids. Details: [OPENAI_PROMPT_GUIDANCE.md](../OPENAI_PROMPT_GUIDANCE.md).

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
- **Concrete invocation recipes** (CLI argv, HTTP body templates) — see §5

---

## 5. Invocation binding policy (Context7-verified, 2026-06-18)

### 5.1 What belongs in the catalog vs adapters

| Layer | Catalog (`llm-model-catalog.json`) | Adapter / binding code |
|-------|-----------------------------------|-------------------------|
| **Transport channel** | ✅ `transport.invocationTypes[]`, `preferredInvocation`, `apiSurface` | — |
| **API model id / CLI `-m` value** | ✅ `transport.nativeModelFlag` (string, vendor-defined) | Adapter reads catalog → passes flag |
| **Supported API params (capability)** | ✅ `apiFeatures.reasoningEffort.values`, `verbosity`, … | Adapter maps InferenceProfile → native params |
| **Optional binding pointer** | ✅ `invocationBindingRef` (e.g. `openai:responses-v1`, `openai:codex-exec-v1`) | Implementation in `src/adapters/*` |
| **CLI argv templates** | ❌ **Do not embed** | `codex-adapter.ts`, `claude-adapter.ts`, … |
| **HTTP request body shape** | ❌ **Do not embed** | SDK wrapper / future Responses client |
| **MCP spawn command** (`codex mcp-server` vs legacy `codex mcp serve`) | ❌ **Do not embed** | `ecosystem.config.cjs`, ops scripts; track CLI version |

**Rationale:** Vendor CLIs and API shapes change frequently (flag renames, subcommand aliases, new params). Duplicating argv/body in JSON causes **double maintenance** and false confidence when only adapters were updated. The catalog answers **“which channel and which model id?”**; adapters answer **“exactly how to call today?”**.

When invocation changes: update adapter + binding version bump; catalog changes only if transport channel or model id changes.

### 5.2 Context7 verification — current TechSapo paths

Sources: [OpenAI API docs](https://developers.openai.com/api/docs/guides/reasoning), [Codex CLI](https://developers.openai.com/codex/cli/features) via Context7 (`/websites/developers_openai_api`, `/websites/developers_openai`).

| Path | Our implementation | Context7 / official | Verdict |
|------|-------------------|---------------------|---------|
| **OpenAI Responses API** | Catalog To-Be; not in adapters yet | `client.responses.create({ model, input, reasoning: { effort }, text: { verbosity } })` | ✅ Catalog shape correct; implement in Track E-4 |
| **Reasoning effort values** | Catalog lists `minimal/low/medium/high` | API also supports `none`, `xhigh` (model-dependent) | ⚠️ Extend `apiFeatures.reasoningEffort.values` per model; avoid fixed global enum |
| **Codex non-interactive** | `codex exec --model X -c approval_policy="never"` ([`codex-adapter.ts`](../../src/adapters/codex-adapter.ts)) | `codex exec "…"`; sandbox/approval via `--ask-for-approval never` or config `approval_policy = "never"` | ✅ Semantically correct; flag spelling may differ by CLI version |
| **Codex model flag** | `--model gpt-5-codex` | `codex -m gpt-5.5`, `gpt-5.2-codex`, `gpt-5.1-codex-max` documented | ⚠️ Model ids evolve; keep in `nativeModelFlag`, not hardcoded adapter default long-term |
| **Codex MCP daemon (PM2)** | `codex mcp serve` ([`ecosystem.config.cjs`](../../ecosystem.config.cjs)) | Official docs: `codex mcp-server` | ⚠️ **Ops mismatch** — verify installed CLI; align command (backlog) |
| **Claude Code CLI** | `claude --print --model … --effort …` + stdin ([`claude-adapter.ts`](../../src/adapters/claude-adapter.ts)) | Non-interactive print pattern | ✅ Matches project README / Cursor MCP pattern |
| **Antigravity `agy`** | `agy --print` + stdin ([`agy-adapter.ts`](../../src/adapters/agy-adapter.ts)) | Project-specific CLI | ✅ (no Context7 entry; WSL OAuth path) |
| **GPT-5.4 mini via Codex CLI** | Catalog had `preferredInvocation: codex_cli` | Reasoning models: prefer **Responses API**; Codex CLI for codex-family models | ❌ Fixed → `responses_api` preferred |
| **Chat Completions + GPT-5.4+** | Catalog lists `chat_completions` as supported | Tool calling limited when `reasoning: none`; migration to Responses recommended | ⚠️ Treat as **legacy/compat** in `apiFeatures`, not equal to Responses |

### 5.3 Recommended schema fields (transport only)

Keep in catalog:

```json
"transport": {
  "invocationTypes": ["responses_api", "codex_cli"],
  "preferredInvocation": "responses_api",
  "apiSurface": "responses_api",
  "nativeModelFlag": "gpt-5.5",
  "invocationBindingRef": "openai:responses-v1"
}
```

Do **not** add to catalog: `spawnArgs`, `requestTemplate`, `curlRecipe`.

Future: optional **`config/invocation-bindings.json`** (separate schema, versioned per adapter) if multiple bindings per transport are needed — still not in model catalog.

---

## 6. User-extensible models (L1–L2)

Teams may **add models in config** without changing orchestrator code when an **adapter already exists**:

1. Add a **`models[]`** entry (and optional **`aliases`**) in [config/llm-model-catalog.json](../../config/llm-model-catalog.json)
2. Add or extend an **`adapters.<adapterId>`** row in [config/adapter-preset-matrix.json](../../config/adapter-preset-matrix.json)
3. Run **`npm run validate:config`** and **`npm run test:contract`**

**New transport** (native Qwen CLI, Grok API, first OpenRouter binding, etc.) requires a **new adapter implementation (L3)** — not JSON alone.

Full policy: **[TECH_STACK_USER_EXTENSIBLE_LLM.md](./TECH_STACK_USER_EXTENSIBLE_LLM.md) (TS-23)** — extension levels, constitution peers vs optional adapters, security boundaries.

---

## 7. References

- [TECH_STACK_INFERENCE_PROFILES.md](./TECH_STACK_INFERENCE_PROFILES.md) (TS-20)
- [OPENAI_MODEL_MATRIX.md](../OPENAI_MODEL_MATRIX.md)
- [OPENAI_PROMPT_GUIDANCE.md](../OPENAI_PROMPT_GUIDANCE.md)
- [FORK_CURSOR.md § Fork schemas](../FORK_CURSOR.md#fork-schemas)
- [TECH_STACK_USER_EXTENSIBLE_LLM.md](./TECH_STACK_USER_EXTENSIBLE_LLM.md) (TS-23 — user L1–L2 extensions)
- Schema: [config/schemas/llm-model-catalog.schema.json](../../config/schemas/llm-model-catalog.schema.json)
- Stub: [config/llm-model-catalog.json](../../config/llm-model-catalog.json)
