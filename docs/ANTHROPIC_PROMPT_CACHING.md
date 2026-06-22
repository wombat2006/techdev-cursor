# Anthropic Prompt Caching Integration

**Status**: Documented — API `cache_control` not wired in `claude-adapter.ts` (Track B-0)  
**Platform**: [Prompt caching](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) · [Cookbook — prompt caching](https://platform.claude.com/cookbook/misc-prompt-caching)  
**Related**: [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md) · [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) · [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Prompt caching** reuses identical prompt prefixes across requests — lower latency and input cost for stable system prompts, tool definitions, RAG context, and growing multi-turn history.

**ZDR:** Eligible — no raw prompt/response retention; KV cache hashes only in memory ([data retention](https://platform.claude.com/docs/en/docs/manage-claude/api-and-data-retention)).

**This fork:** Catalog marks `apiFeatures.promptCaching.supported` on all Claude ids. CLI `--print` path does not pass `cache_control` today.

---

## Two modes

| Mode | Config | Best for |
|------|--------|----------|
| **Automatic** | Top-level `"cache_control": {"type": "ephemeral"}` | Multi-turn chats — breakpoint slides forward on last cacheable block |
| **Explicit** | Per-block `cache_control` on system / tools / messages | Static prefix + changing suffix; multiple TTLs; pre-warm |

Prefix order: `tools` → `system` → `messages` (hierarchical invalidation).

---

## Catalog AS-IS — minimum cacheable tokens

| Catalog id | Platform minimum | Notes |
|------------|------------------|-------|
| `claude-sonnet-4-6` | **1,024** | Primary agent + RAG cache target |
| `claude-opus-4-8` | **1,024** | Aggregate rounds with large static prefix |
| `claude-haiku-4-5` | **4,096** | Higher bar — cache only large stable prefixes |

Below minimum: request succeeds but **no cache** (`cache_*` usage fields = 0).

---

## Pricing multipliers (vs base input)

| Operation | Multiplier |
|-----------|------------|
| 5-minute cache **write** | **1.25×** base input |
| 1-hour cache **write** | **2×** base input |
| Cache **read** / refresh | **0.1×** base input |

**Sonnet 4.6 example ($/MTok):** base $3 · write 5m $3.75 · write 1h $6 · read $0.30.

Stacks with Batch API discount — see [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) (use **1h TTL** for long batches).

---

## Automatic caching

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "cache_control": { "type": "ephemeral" },
  "system": "Long stable system prompt...",
  "messages": [ "... growing conversation ..." ]
}
```

Each turn caches through the last cacheable block; prior prefix is read from cache.

**1-hour TTL:**

```json
"cache_control": { "type": "ephemeral", "ttl": "1h" }
```

**Platform note:** Automatic caching on Claude API / AWS / Foundry (beta). **Not** on Bedrock/Vertex automatic mode — use explicit breakpoints there.

---

## Explicit breakpoints

- Max **4** `cache_control` markers per request (automatic uses 1 slot when combined).
- Place breakpoint on the **last block that is identical across requests** — not on per-request timestamps/user text.
- **20-block lookback:** system finds prior writes only within 20 blocks behind each breakpoint.
- Breakpoints themselves add **no extra cost** — only write/read token pricing.

**Tools:** mark `cache_control` on the **last** tool — caches that tool and all preceding tools.

**Pre-warm (TTFT):** `max_tokens: 0` + explicit breakpoint on shared system (not placeholder user message):

```json
{
  "max_tokens": 0,
  "system": [{ "type": "text", "text": "...", "cache_control": {"type": "ephemeral"} }],
  "messages": [{"role": "user", "content": "warmup"}]
}
```

Rejected with `max_tokens: 0` when: `stream: true`, extended thinking, structured outputs, forced `tool_choice`, or Message Batches.

---

## Usage fields

```text
total_input_tokens = cache_read_input_tokens + cache_creation_input_tokens + input_tokens
```

- `input_tokens` = tokens **after** the last cache breakpoint only (often small).
- Monitor `usage` / streaming `message_start` for cache hit rate.

---

## Cache invalidation (summary)

| Change | Tools cache | System cache | Messages cache |
|--------|-------------|--------------|----------------|
| Tool definition edit | ✘ all | ✘ | ✘ |
| Web search / citations toggle | ✓ | ✘ | ✘ |
| `tool_choice` change | ✓ | ✓ | ✘ |
| Thinking enable/disable or `budget_tokens` change | ✓ | ✓ | ✘ |
| Switch `adaptive` ↔ `enabled`/`disabled` thinking | ✓ | ✓ | ✘ (messages) |

**Thinking + tools:** Tool-result-only user turns preserve cache. Non-tool user text may invalidate on older models — see [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).

**Opus 4.8+:** Mid-conversation `{"role": "system"}` in `messages` updates operator policy without invalidating the cached prefix; editing top-level `system` still invalidates. See [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md). Not on Opus 4.8 / Sonnet 4.6 catalog ids.

**Workspace isolation (2026-02-05+):** Cache scoped per **workspace** on Claude API / AWS / Foundry; org-level on Bedrock/Vertex.

**Token counting:** `count_tokens` does **not** simulate caching — use create `usage` for cache fields. See [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md).

---

## Fork use cases

| Scenario | Pattern |
|----------|---------|
| Wall-Bounce multi-round (same system + tools) | Explicit breakpoint on static system; or automatic for long Sonnet agent sessions |
| RAG ingest (batch) | Identical `cache_control` on document prefix + [1h TTL](./ANTHROPIC_BATCH_API_RAG.md) — [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) |
| Character sheets / catalog guidance | Cache stable English guidance block; Japanese user turn uncached suffix |
| Haiku fast extract | Only if prefix ≥ 4096 tokens (shared tool schemas) |

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.promptCaching.supported` | `true` on all Claude catalog ids |
| `apiFeatures.promptCaching.maxTtlHours` | `1` |
| `apiFeatures.promptCaching.minCacheTokens` | Per-model minimum (schema) |
| `apiFeatures.promptCaching.automaticCaching` | API path capability flag |
| `prompting.guidanceTopics[]` | See below |

---

## AS-IS gaps

- `claude-adapter.ts` does not send `cache_control`.
- No `usage.cache_*` observability in adapter results.
- F-10 does not inject caching placement guidance.

---

## Backlog

- **B-0** — Optional Messages API path with `cache_control` on Wall-Bounce static prefixes.
- **F-10** — Inject `prompt-caching-explicit-breakpoints` when tool definitions exceed min tokens.

---

## References

- [Prompt caching (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching)
- [Tool use with prompt caching](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-use-with-prompt-caching)
- [Cache diagnostics (beta)](https://platform.claude.com/docs/en/docs/build-with-claude/cache-diagnostics)
- [Cookbook — misc/prompt-caching](https://platform.claude.com/cookbook/misc-prompt-caching)
