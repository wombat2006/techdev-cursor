# Anthropic Message Batches API for RAG Ingest (Optional Path)

**Status**: Documented only — **not implemented** (AS-IS ingest uses sync Drive → Vector Store)  
**Platform**: [Message Batches API](https://platform.claude.com/docs/en/docs/build-with-claude/batch-processing) · [API reference](https://platform.claude.com/docs/en/api/creating-message-batches)  
**Cookbook**: [misc-batch-processing](https://platform.claude.com/cookbook/misc-batch-processing)  
**Related**: [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [OPENAI_BATCH_API_RAG.md](./OPENAI_BATCH_API_RAG.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is (one paragraph)

The **Message Batches API** runs many Messages requests **asynchronously** (up to **24h** processing window; most batches finish within **~1 hour**) at **50% of standard token rates**. Each line is a `custom_id` + Messages `params` object; results are **JSONL** and **not order-preserving** — join on `custom_id`. Supports vision, tools, server tools, extended thinking, and most beta features. For RAG, it fits **offline enrichment** (summaries, tags, structured metadata) during ingest — **not** interactive search or Wall-Bounce.

---

## Security and data retention (this fork)

| Topic | Policy |
|-------|--------|
| **Default runtime** | Subscription CLI (`claude` / Claude Code) per [SECURITY.md](./SECURITY.md) — not API-key-first |
| **Batch transport** | Platform docs show `ant messages:batches create` (CLI) **or** REST with `x-api-key` — treat API examples as **reference** until an explicit approved path exists |
| **Zero Data Retention** | Message Batches are **not** ZDR-eligible; data follows standard retention (results up to **29 days**) |
| **Wall-Bounce / Cursor** | **Out of scope** — wrong latency class (hours vs seconds) |

---

## Anti-over-engineering guardrails (read first)

Same gates as [OPENAI_BATCH_API_RAG.md](./OPENAI_BATCH_API_RAG.md):

| Do not (yet) | Why |
|--------------|-----|
| Dedicated batch worker before volume proof | AS-IS sync ingest works |
| Batch for every document on every sync | Small folders rarely justify ops cost |
| Replace Wall-Bounce with batch | Interactive multi-LLM path needs sync latency |
| Assume prompt-cache hits in batch | Cache is **best-effort** (typical 30–98%); parallel workers expire 5m cache entries |

### Adopt gates (all must be true)

1. **Volume** — e.g. >500 enrichment calls per sync or recurring bulk re-index  
2. **Latency OK** — completion can wait hours  
3. **Cost** — measured spend exceeds team threshold  
4. **Repeat** — not a one-off (otherwise run cookbook / CLI manually)

---

## Platform limits (summary)

| Limit | Value |
|-------|-------|
| Requests per batch | 100,000 **or** 256 MB (whichever first) |
| Processing window | Up to 24h; then unprocessed requests **expire** (not billed) |
| Results availability | 29 days after batch `created_at` |
| `custom_id` | `^[a-zA-Z0-9_-]{1,64}$`, unique per batch |
| Pricing | **50%** of standard input/output token rates |

### Unsupported in batch `params`

| Parameter | Reason |
|-----------|--------|
| `stream: true` | Results returned as JSONL file, not stream |
| `speed` (Fast mode) | Sync latency tuning only |
| `store` / `previous_thread_event_id` | Threads are stateful; batch requests are not |
| `cache_hint` / `context_hint` | Sync scheduling hints only |
| `max_tokens: 0` | No cache pre-warming in batch |
| `research_preview_2026_02` | Not on batch path |

### Supported highlights

- Vision, system messages, multi-turn, extended thinking  
- **All server tools** (web search, web fetch, code execution, MCP, etc.) — batch worker runs the same agent loop as sync; may return `pause_turn` for continuation  
- **Prompt caching** in batch — stack with 50% batch discount; use identical `cache_control` blocks across requests; consider **1-hour TTL** for long-running batches — [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md); PDF document blocks — [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md)  
- **Extended output beta** (`output-300k-2026-03-24`) — **batches only**; Opus 4.8 / 4.7 / 4.6, Sonnet 4.6 up to 300k `max_tokens`

---

## RAG ingest fit (To-Be sketch)

```text
Phase 0 (today):
  Drive file → download → embed (HF) → Vector Store

Phase 1+ (optional enrichment):
  Drive file → chunk → batch requests with custom_id = "{fileId}:{chunkIdx}"
            → Message Batches API (Haiku / Sonnet) → summary/tags JSON
            → attach as Vector Store metadata
            → embed (unchanged)
```

**Good batch tasks:** chunk summary, NER/tags via tool schemas ([extracting structured JSON](https://platform.claude.com/cookbook/tool-use-extracting-structured-json)), classification.  
**Bad batch tasks:** query-time answer generation, Wall-Bounce rounds, live MCP analyze.

---

## Model choice (catalog-aligned)

Batch rates are **50% of standard** API pricing. Catalog stores batch tier explicitly.

| Catalog id | Batch input / output (USD per 1M tok) | Why for ingest |
|------------|----------------------------------------|----------------|
| **claude-haiku-4-5** | $0.50 / $2.50 | Cheapest; structured JSON tool extraction |
| **claude-sonnet-4-6** | $1.50 / $7.50 | Richer summaries; PDF document blocks if needed |
| **claude-opus-4-8** | $7.50 / $37.50 | Overkill for bulk ingest; aggregator tier only |

Use **Haiku tool-schema** or **Sonnet long-horizon** prompting patterns — not Opus orchestration stacks. See [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md).

---

## Workflow (reference)

### 1. Dry-run on Messages API (sync)

Validate each `params` body on the Messages API before batching — batch validation is async; errors surface at `ended`.

### 2. Create batch

```bash
# CLI (subscription path — see platform docs)
ant messages:batches create <<'YAML'
requests:
  - custom_id: doc-001-chunk-0
    params:
      model: claude-haiku-4-5
      max_tokens: 1024
      messages:
        - role: user
          content: "Summarize this chunk for search metadata: ..."
YAML
```

REST equivalent: `POST /v1/messages/batches` with `{ "requests": [ { "custom_id", "params" } ] }`.

### 3. Poll until `processing_status: ended`

`GET /v1/messages/batches/{id}` or `ant messages:batches retrieve`.

### 4. Stream results

`results_url` → JSONL lines; each row has `custom_id` and `result.type`:

| `result.type` | Action |
|---------------|--------|
| `succeeded` | Parse `result.message`; billable |
| `errored` | `invalid_request_error` → fix body; else retry |
| `canceled` | User canceled batch; not billed |
| `expired` | Hit 24h window; not billed |

### 5. `pause_turn` (server tools)

If `stop_reason: pause_turn`, continue by sending paused assistant content in a **follow-up** request (batch or sync) per [server-side loop docs](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/server-tools).

---

## Catalog fields (minimal)

| Field | Purpose |
|-------|---------|
| `apiPricing.batch` | Offline cost estimate |
| `apiFeatures.batchApi.supported` | Eligible for gated ingest |
| `references[]` | `misc-batch-processing` cookbook + platform batch-processing doc |
| `promptGuidanceIndex.batch-api-offline` | All Claude catalog rows |

Do **not** add: poll intervals, JSONL parsers, or job templates to catalog JSON.

---

## Backlog

**F-14** — RAG ingest Anthropic Message Batches enrichment (optional, gated): Phase 1 CLI/script only; same volume gates as OpenAI **F-13**. See [PROVIDER_INTEGRATION_BACKLOG.md](./PROVIDER_INTEGRATION_BACKLOG.md).

**Non-goals:** Batch for Wall-Bounce, interactive `analyze_claude` MCP, or real-time RAG search.

---

## References

- [Batch processing guide (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/batch-processing)
- [Creating message batches (API)](https://platform.claude.com/docs/en/api/creating-message-batches)
- [Cookbook — misc batch processing](https://platform.claude.com/cookbook/misc-batch-processing)
- [API and data retention (ZDR scope)](https://platform.claude.com/docs/en/docs/build-with-claude/api-and-data-retention)
