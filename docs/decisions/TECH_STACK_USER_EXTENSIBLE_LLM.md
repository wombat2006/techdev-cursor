# Tech Stack Decision: User-Extensible LLM Catalog (Bring Your Own Model)

**Document type**: Architecture Decision Record (ADR)  
**ID**: TS-23  
**Version**: 1.0  
**Date**: 2026-06-19  
**Status**: **Accepted (direction)** — Contract Layer implements L1–L2; runtime UI / L3 out of scope

**Related:** [TECH_STACK_LLM_MODEL_CATALOG.md](./TECH_STACK_LLM_MODEL_CATALOG.md) (TS-21) · [TECH_STACK_INFERENCE_PROFILES.md](./TECH_STACK_INFERENCE_PROFILES.md) (TS-20) · [SECURITY.md](../SECURITY.md) · [config/adapter-preset-matrix.json](../../config/adapter-preset-matrix.json)

---

## 1. Context

Teams using TechSapo may need **models beyond the default peer set** (Claude, Codex, Antigravity/Gemini): native Qwen, Grok, Llama, DeepSeek, Copilot CLI, OpenRouter-routed models, or future vendors.

**Product goal:** Allow **users (developers / operators)** to extend the model lineup **without forking core orchestration code**, while preserving:

- Wall-Bounce constitution (2+ peer LLMs, 2–5 rounds) — [AGENTS.md](../../AGENTS.md#constitution)
- Security policy (CLI / OAuth / subscription paths; no API keys in repo env) — [SECURITY.md](../SECURITY.md)
- Contract Layer validation (`validate:config`, drift tests) — no silent wrong-model passes

This ADR defines **what users may add in config (L1–L2)** vs **what requires platform code (L3)**.

---

## 2. Extension levels

| Level | User action | Platform work | Example |
|-------|-------------|---------------|---------|
| **L1 — Config model** | Add `models[]` entry + `aliases` in catalog | None (if adapter exists) | New OpenAI model id on existing `codex_cli` |
| **L2 — Config adapter row** | Add `adapters.<adapterId>` preset row in matrix | None (if adapter exists) | Route `qwen_native` presets to catalog ids |
| **L3 — New transport** | Cannot complete in JSON alone | New `src/adapters/<adapterId>-adapter.ts`, MCP tool optional, tests | First native Qwen CLI, Grok API, custom OpenRouter binding |

**Decision:** **L1 and L2 are the supported “user adds LLM” path.** L3 remains a **development / ADR** task, not end-user JSON.

---

## 3. Decision

### 3.1 Canonical extension workflow (L1–L2)

```text
1. config/llm-model-catalog.json
     → models[] (vendor, transport, nativeModelFlag, capabilities, …)
     → aliases (optional short names)

2. config/adapter-preset-matrix.json
     → adapters.<adapterId>.{fast,balanced,deep,critical} → catalog model id
     → do NOT add to constitutionPeerAdapters unless Wall-Bounce ADR approves

3. npm run validate:config && npm run test:contract
     → schema + catalog/matrix drift + spawn contract (when adapter exists)

4. (Optional) docs/proposals or team runbook — human notes only
```

**Adapter id** is the invocation implementation key (`claude`, `codex`, `agy`, future `qwen_native`, `openrouter`, …). It is **not** the same as vendor name (Qwen, Grok, Meta).

### 3.2 Constitution peers vs optional models

| Layer | Config | Who changes | Wall-Bounce role |
|-------|--------|-------------|------------------|
| **Peer adapters** | `constitutionPeerAdapters` in matrix | Platform / fork maintainer | Mandatory 2+ LLM rounds (Track C enforce) |
| **Optional adapters** | `adapters` rows **not** in peer list | User / team | Daily MCP, optional analysis, RAG enrich — not constitution substitutes unless promoted via ADR |

Users **may add optional models** without changing constitution peers. Promoting an optional adapter to a **peer** requires ADR + Track C updates.

### 3.3 Transport diversity (native vs routed)

Users may add models that are invoked **natively** (vendor CLI/SDK) or **via a router** (e.g. OpenRouter). The catalog records **transport**, not business relationship:

- Native Qwen → `transport.preferredInvocation` = vendor-specific channel; **new adapter (L3)** if none exists
- OpenRouter-hosted Qwen → `openrouter` adapter + catalog model id as router expects; still **one matrix row per adapterId**
- Ollama local + cloud → `ollama` adapter (TS-27) + catalog ids (`qwen3.5:cloud`, local tags); **L3** — HTTP to `localhost:11434`

**Do not** encode “always OpenRouter” in schema — adapterId + catalog transport fields are sufficient.

### 3.4 Security boundaries

| Allowed in user L1–L2 | Requires ADR + security review |
|------------------------|--------------------------------|
| Catalog/matrix edits for **existing** CLI/OAuth adapters | New API-key-in-env inference paths |
| `status: planned` models for forward planning | Storing user API keys in repo or `.env` |
| Optional adapters for non-constitution workflows | Bypassing `validate:config` / contract tests |

See [SECURITY.md](../SECURITY.md): subscription CLI and OAuth remain the default DevAssist path.

### 3.5 Validation contract (mandatory)

Any user extension **must** pass:

| Check | Command / test |
|-------|----------------|
| JSON Schema | `npm run validate:config` |
| Matrix → catalog ids exist + `nativeModelFlag` | `tests/adapters/catalog-resolver-drift.test.ts` |
| Spawn argv (when adapter shipped) | `tests/adapters/adapter-spawn-contract.test.ts` |
| Open matrix schema (future adapters) | `tests/adapters/adapter-preset-matrix-schema.test.ts` |

Failed validation **blocks merge** — extensions are not “best effort”.

---

## 4. AS-IS (2026-06-19)

| Item | State |
|------|--------|
| Catalog schema | TS-21 multi-vendor, open `models[]` |
| Adapter preset matrix | Open map — `adapters` keys not fixed to three providers |
| Loader | `llm-model-catalog-loader.ts` — alias + preset resolve |
| Resolver | Reads matrix + catalog (Contract Layer) |
| User runtime UI | **None** — config files in repo only |
| L3 plugin SDK | **None** |

---

## 5. To-Be (backlog)

| Item | Track | Notes |
|------|-------|-------|
| Team-local overlay file (`config/local/*.json` gitignored) | F | Optional; same schema, merged at startup |
| `analyze_*` MCP tool registration from matrix keys | A-2 / F | Only for shipped adapters |
| TaskRouter reads optional adapters for cost/capability routing | F-3 | Not constitution |
| Runtime “add model” UI | P5+ | Out of scope for DevAssist fork P0 |

---

## 6. Non-goals

- User-supplied **adapter plugins** (dynamic code load) in v1
- **API key** entry forms in product UI without SECURITY ADR amendment
- Automatic promotion of user models to **Wall-Bounce peer** without maintainer review
- Duplicating CLI argv templates in catalog JSON (TS-21 §5)

---

## 7. Consequences

**Positive**

- Teams can tailor model lineup (fork, customer deploy) without patching `inference-profile-resolver` hardcode
- Aligns with differentiation vs single-harness tools (Antigravity): **user-defined model set + orchestration**
- Contract Layer catches wrong-model drift early

**Negative / trade-offs**

- Users must understand adapterId vs vendor vs catalog id
- L3 still needs engineering — “any LLM with zero code” is not promised
- More catalog entries increase review burden — `validate:config` is necessary but not sufficient for quality

---

## 8. References

- [TECH_STACK_LLM_MODEL_CATALOG.md](./TECH_STACK_LLM_MODEL_CATALOG.md) (TS-21)
- [PROVIDER_INTEGRATION_BACKLOG.md](../PROVIDER_INTEGRATION_BACKLOG.md)
- [config/adapter-preset-matrix.json](../../config/adapter-preset-matrix.json)
- [config/schemas/adapter-preset-matrix.schema.json](../../config/schemas/adapter-preset-matrix.schema.json)
- [llm-model-catalog-loader.ts](../../src/services/llm-model-catalog-loader.ts)
