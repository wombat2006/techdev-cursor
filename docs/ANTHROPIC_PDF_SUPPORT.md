# Anthropic PDF Support Integration

**Status**: Documented — `document` blocks not wired in `claude-adapter.ts` (Track B-0)  
**Platform**: [PDF support](https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support) · [Cookbook — PDF summarization](https://platform.claude.com/cookbook/misc-pdf-upload-summarization) · [Vision limitations](./ANTHROPIC_VISION.md#limitations-platform)  
**Related**: [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) · [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) · [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

Claude processes **PDFs** via `type: "document"` content blocks — text extraction plus per-page vision (charts, tables, layout).

**ZDR:** Eligible.

**Platforms:** Claude API, AWS, Bedrock, Vertex, Foundry — all active models (platform). **Fork AS-IS:** `claude-sonnet-4-6` (`modalities: document`, `documentUnderstanding`).

**This fork:** CLI `--print` text-only today; PDF agent paths are **API/SDK reference** until Messages API wiring.

---

## Requirements (platform)

| Limit | Value |
|-------|--------|
| Max request size | **32 MB** (whole payload; varies by platform) |
| Max pages | **600** (default context); **100** on 100k-context models |
| Format | Standard PDF — no password/encryption |

Dense PDFs may fill context before page cap — **chunk by section**. Embedded images are processed per-page (vision cost).

Vision [limitations](./ANTHROPIC_VISION.md#limitations-platform) apply.

---

## Document block sources

| Source | `source.type` | Fork notes |
|--------|---------------|------------|
| URL | `url` | Simplest for hosted PDFs |
| Inline | `base64` + `media_type: application/pdf` | Bedrock/Vertex: base64 only |
| Files API | `file` + `file_id` | Beta `files-api-2025-04-14`; smaller repeat payloads |

```json
{
  "type": "document",
  "source": {
    "type": "base64",
    "media_type": "application/pdf",
    "data": "..."
  }
}
```

Pair with a **text** block for the user question. Place **document before text** in `content`.

---

## How processing works

1. Each page → image + extracted text.
2. Claude reasons over **text + visuals** (charts, diagrams).
3. Combine with [prompt caching](./ANTHROPIC_PROMPT_CACHING.md), [batch](./ANTHROPIC_BATCH_API_RAG.md), and tool use for scale.

---

## Cost estimation

- **Text:** ~1,500–3,000 tokens/page (density-dependent); standard input pricing.
- **Images:** Per-page vision token math — see [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md#visual-token-math).
- Preflight: [`messages/count_tokens`](./ANTHROPIC_TOKEN_COUNTING.md).

No separate PDF surcharge.

---

## Optimization

| Practice | Why |
|----------|-----|
| Document block **before** question text | Platform recommendation |
| `cache_control` on document block | Multi-question analysis on same PDF |
| Shared PDF in batch requests | Offline RAG / bulk Q&A |
| Split large PDFs | Page + context limits |
| Logical page numbers in prompts | Matches PDF viewer numbering |
| [count_tokens](./ANTHROPIC_TOKEN_COUNTING.md) before send | Avoid context overflow |

---

## Amazon Bedrock (reference)

**Converse API:** Full visual PDF requires **citations enabled**; without citations → text extraction only (~1k tokens / 3 pages vs ~7k visual).

**InvokeModel API:** Full control without forced citations.

Not wired in fork — document for multi-cloud migration.

---

## Files API (beta)

Upload via `POST /v1/files` with `anthropic-beta: files-api-2025-04-14`, reference `file_id` in document block. **Not ZDR** for Files API storage semantics — see [capabilities overview](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) Files row.

---

## Fork use cases

| Scenario | Pattern |
|----------|---------|
| Report / contract Q&A | Sonnet + document block + Japanese user question |
| RAG ingest (batch) | Identical PDF prefix + 1h cache — [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) |
| Skills (Excel/PPT/PDF) | Document generation cookbook — [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) |
| Haiku / Opus paths | Escalate PDF work to Sonnet in catalog |

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `modalities` includes `document` | Sonnet AS-IS |
| `capabilities.documentUnderstanding` | `true` on Sonnet |
| `apiFeatures.pdfSupport` | Limits, sources, ZDR |
| `prompting.guidanceTopics[]` | See below |

| Topic slug | Focus |
|------------|-------|
| `pdf-document-blocks` | `type: document` + text question |
| `pdf-source-url-base64-file` | Three source types |
| `pdf-limits-chunking` | 32MB / 600p / chunking |
| `pdf-caching-batch` | cache_control + Message Batches |

---

## AS-IS gaps

- `claude-adapter.ts` does not send `document` blocks.
- Files API beta not integrated.
- Bedrock Converse citation requirement not in adapter routing.

---

## Backlog

- **B-0** — Messages API path with `document` blocks on Sonnet agent routes.
- **F-10** — Inject `pdf-limits-chunking` when attachment size threshold exceeded.

---

## References

- [PDF support (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support)
- [PDF support limitations](https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support#pdf-support-limitations)
- [Files API](https://platform.claude.com/docs/en/docs/build-with-claude/files)
- [Cookbook — misc/pdf-upload-summarization](https://platform.claude.com/cookbook/misc-pdf-upload-summarization)
- [Multimodal vision cookbook](https://platform.claude.com/cookbook/multimodal-getting-started-with-vision)
