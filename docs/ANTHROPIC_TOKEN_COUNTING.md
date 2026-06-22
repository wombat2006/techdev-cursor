# Anthropic Token Counting Integration

**Status**: Documented — `messages/count_tokens` not wired in `claude-adapter.ts` (Track B-0)  
**Platform**: [Token counting](https://platform.claude.com/docs/en/docs/build-with-claude/token-counting) · [API — count tokens](https://platform.claude.com/docs/en/api/messages-count-tokens)  
**Related**: [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) · [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

**Token counting** estimates `input_tokens` for a Messages API payload **before** sending — same shape as `messages.create` (`system`, `tools`, `messages`, images, PDFs, `thinking`).

**ZDR:** Eligible.

**Cost:** API calls are **free**; separate **RPM** rate limits from `messages.create` (Tier 1: 100 RPM — see platform table).

**Estimates:** Count may differ slightly from billed tokens on create. System-added optimization tokens may appear in count but are **not billed**.

**This fork:** CLI `--print` has no preflight count — use SDK/API on Track B-0 or external budget checks via [context awareness](./ANTHROPIC_CONTEXT_WINDOW.md).

---

## Endpoint

```http
POST /v1/messages/count_tokens
```

```json
{
  "model": "claude-sonnet-4-6",
  "system": "You are a scientist",
  "messages": [{ "role": "user", "content": "Hello, Claude" }]
}
```

Response:

```json
{ "input_tokens": 14 }
```

SDK: `client.messages.count_tokens(...)` / `countTokens(...)`.

---

## Catalog AS-IS

| Catalog id | Supported | Notes |
|------------|-----------|-------|
| `claude-sonnet-4-6` | Yes | PDF + thinking preflight for agent paths |
| `claude-opus-4-8` | Yes | Aggregate round budget / model routing |
| `claude-haiku-4-5` | Yes | Fast extract payload sizing |

All active Claude models per platform. **Fable 5 / Mythos 5** (migration refs): new tokenizer ≈ **+30%** vs pre–Opus 4.7 — count with target `model` id, do not reuse legacy estimates.

---

## Input parity with Messages API

| Input | Counted |
|-------|---------|
| `system` (string or blocks) | Yes |
| `tools` (client tools) | Yes |
| Text / image / PDF `messages` | Yes |
| `thinking` config | Yes (see below) |
| `cache_control` | Accepted in request but **does not simulate cache** |

### Server tools

Token count for **server tools** applies on the **first sampling call only** (platform note).

### Extended thinking

Per [extended thinking context rules](./ANTHROPIC_EXTENDED_THINKING.md):

- **Prior** assistant `thinking` blocks → **ignored** (not in input count)
- **Current** assistant turn thinking → **counted**

Use same `thinking` params as the upcoming `create` call.

### PDF / images

Same limitations as Messages API PDF support — see [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md). Sonnet catalog: PDF document blocks — preflight before RAG/agent ingest.

---

## Prompt caching

**No.** Token counting does **not** apply caching logic. `cache_control` in count request is allowed but does not predict `cache_read_input_tokens` / `cache_creation_input_tokens`. Use [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) usage fields after real creates.

---

## Fork use cases

| Scenario | Pattern |
|----------|---------|
| Wall-Bounce round budget | Count static prefix + round prompt before adapter invoke |
| Model routing | Compare Sonnet vs Haiku count for same extract task |
| Context rot guard | Count before compaction decision ([context window](./ANTHROPIC_CONTEXT_WINDOW.md)) |
| PDF Skills / RAG | Count document block + question before Sonnet agent turn |

---

## Rate limits (platform)

Independent from `messages.create`. Higher tiers: up to 8,000 RPM (Tier 4). See [rate limits](https://platform.claude.com/docs/en/api/rate-limits).

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.tokenCounting.supported` | `true` on all Claude catalog ids |
| `apiFeatures.tokenCounting.endpoint` | `messages/count_tokens` |
| `apiFeatures.tokenCounting.zdrEligible` | `true` |
| `prompting.guidanceTopics[]` | See below |

| Topic slug | Focus |
|------------|-------|
| `token-counting-api` | count_tokens preflight |
| `token-counting-tools-modality` | tools, images, PDFs |
| `token-counting-extended-thinking` | prior vs current thinking blocks |
| `token-counting-vs-prompt-cache` | no cache simulation |
| `token-counting-rate-limits` | free, separate RPM |

---

## AS-IS gaps

- `claude-adapter.ts` does not call `count_tokens`.
- No integration with `OrchestrationSession` token budget fields yet.

---

## Backlog

- **B-0** — Optional preflight in session layer before large tool/PDF payloads.
- **F-10** — Inject `token-counting-api` when context near `limits.contextTokens`.

---

## References

- [Token counting (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/token-counting)
- [Messages count_tokens API](https://platform.claude.com/docs/en/api/messages-count-tokens)
- [Extended thinking — context calculation](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking#how-context-window-is-calculated-with-extended-thinking)
- [PDF support limitations](https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support#pdf-support-limitations)
