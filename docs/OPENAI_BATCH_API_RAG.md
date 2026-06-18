# OpenAI Batch API for RAG Ingest (Optional Path)

**Status**: Documented only — **not implemented** (AS-IS ingest uses sync Drive → Vector Store)  
**Cookbook**: [batch_processing.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/batch_processing.ipynb)  
**Pricing**: catalog `apiPricing.batch` · [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)  
**Related**: [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md) · [OPENAI_PROMPT_GUIDANCE.md](./OPENAI_PROMPT_GUIDANCE.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is (one paragraph)

The **OpenAI Batch API** runs many LLM requests **asynchronously** (up to ~24h SLA) at **~50% of standard token rates**. Input is a **JSONL** file (`custom_id` per line); output JSONL is **not order-preserving** — match results by `custom_id`. Same request bodies as Chat Completions / Responses API (see [OPENAI_NODE_SDK.md § Batch Processing](./OPENAI_NODE_SDK.md)). For RAG, it fits **offline enrichment** (summaries, tags, structured metadata) during ingest — **not** interactive search or Wall-Bounce.

---

## Anti-over-engineering guardrails (read first)

Do **not** build Batch infrastructure until a concrete trigger fires. Default remains AS-IS sync ingest.

| Do not (yet) | Why |
|--------------|-----|
| Dedicated Batch worker / queue / scheduler service | AS-IS `sync-folder` + Hugging Face embeddings works; Batch adds ops surface |
| Generic “Batch framework” in catalog schema | `apiPricing.batch` + `apiFeatures.batchApi.supported` is enough for routing hints |
| Batch for every document on every sync | Most folders are small; sync API cost may be negligible vs engineering |
| Replace Wall-Bounce or Cursor paths with Batch | Wrong latency class (hours vs seconds) |
| Conflate `batch_size` (API param) with Batch API | See [Naming](#naming-batch_size-vs-batch-api) below |
| Pre-build JSONL + poll + retry library before first use case | Start with a **one-off script** mirroring the Cookbook notebook |
| Multi-tier Batch orchestration (priority/flex/batch) in v1 | Use **standard Batch pricing tier** only until volume proves need |

### When Batch is worth it (adopt gates)

Adopt **only if all** are true:

1. **Volume** — e.g. >500 LLM enrichment calls per sync, or recurring bulk re-index
2. **Latency OK** — ingest completion can wait hours (not user-facing)
3. **Cost** — measured or estimated sync API spend exceeds a team-defined threshold
4. **Repeat** — not a one-time migration (otherwise run Cookbook notebook manually)

If any gate fails → stay on **sync** or skip LLM enrichment entirely (embed raw text only).

### Phased adoption (minimum viable)

| Phase | Scope | Stop if |
|-------|--------|---------|
| **0 (AS-IS)** | Drive → embed → Vector Store; optional local `batch_size` parallelism | — |
| **1 (manual)** | Cookbook-style script: JSONL → `batches.create` → merge by `custom_id` | One-off job done |
| **2 (hook)** | Call script from sync job **only when** doc count > threshold | <2 runs/month |
| **3 (product)** | Catalog-driven model pick (`gpt-5.4-nano` + `apiPricing.batch`) | Never required for MVP |

**Rule:** Do not skip Phase 1. No Phase 3 without measured Phase 2 usage.

---

## Naming: `batch_size` vs Batch API

| Term in repo | Meaning | OpenAI Batch API? |
|--------------|---------|-------------------|
| `batch_size` in `POST /api/v1/rag/sync-folder` | Parallel document processing in [`googledrive-connector.ts`](../src/services/googledrive-connector.ts) | **No** |
| `embedding-service` batches | Hugging Face request chunking | **No** |
| `codex-mcp` request batching | MCP client micro-batching | **No** |
| `client.batches.create` | Official async Batch API | **Yes** |

Document and code reviews must use **“OpenAI Batch API”** vs **“sync batch_size”** explicitly.

---

## RAG ingest fit (To-Be sketch)

```text
Phase 0 (today):
  Drive file → download → embed (HF) → Vector Store

Phase 1+ (optional enrichment):
  Drive file → chunk → JSONL lines with custom_id = "{fileId}:{chunkIdx}"
            → Batch API (gpt-5.4-nano / mini) → summary/tags JSON
            → attach as Vector Store metadata
            → embed (unchanged)
```

**Good Batch tasks:** chunk summary, category tags, structured fields for hybrid search.  
**Bad Batch tasks:** query-time answer generation, Wall-Bounce rounds, PromptAnalyzer.

### Model choice (catalog-aligned)

| Model | Why | Batch pricing (std / 1M tok in/out) |
|-------|-----|-------------------------------------|
| **gpt-5.4-nano** | Cheapest; extraction / short summaries | $0.2 / $0.02 / $1.25 |
| **gpt-5.4-mini** | Tools + richer metadata when needed | $0.75 / $0.075 / $4.5 |

Use **GPT-5.4** prompting patterns (`output-contract`, structured JSON) — not GPT-5.5 outcome-first stacks. See [OPENAI_PROMPT_GUIDANCE.md § GPT-5.4](./OPENAI_PROMPT_GUIDANCE.md).

### Cookbook workflow (reference)

1. Prototype one request on Chat Completions / Responses (sync).
2. Build JSONL: `{ "custom_id", "method", "url", "body" }` per line.
3. `files.create(..., purpose: "batch")`
4. `batches.create({ input_file_id, endpoint: "/v1/responses", completion_window: "24h" })`
5. Poll `batches.retrieve` until completed.
6. Download output JSONL; join on `custom_id`.

Details: [batch_processing.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/batch_processing.ipynb).

---

## Catalog fields (minimal)

No separate Batch schema file. Reuse TS-21:

| Field | Purpose |
|-------|---------|
| `apiPricing.batch` | Cost estimate for ingest jobs |
| `apiFeatures.batchApi.supported` | Eligible for offline bulk (nano/mini) |
| `references[]` / `cookbookIndex` | `batch-processing` slug |

Do **not** add: batch job templates, JSONL schemas, or poll intervals to catalog JSON.

---

## Backlog

**F-13** — RAG ingest Batch enrichment (optional, gated): Phase 1 script only; Phase 2 threshold hook. See [PROVIDER_INTEGRATION_BACKLOG.md](./PROVIDER_INTEGRATION_BACKLOG.md).

**Non-goals:** Batch for Wall-Bounce, Codex CLI, or real-time RAG search.

---

## References

- [OpenAI Cookbook — Batch processing](https://github.com/openai/openai-cookbook/blob/main/examples/batch_processing.ipynb)
- [OPENAI_NODE_SDK.md — Batch Processing](./OPENAI_NODE_SDK.md)
- [OpenAI Pricing — Batch tier](https://developers.openai.com/api/docs/pricing)
