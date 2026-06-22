# Anthropic Message Streaming Integration

**Status**: Documented — adapter uses non-streaming CLI `--print` today (Track B-0)  
**Platform**: [Streaming messages](https://platform.claude.com/docs/en/docs/build-with-claude/streaming)  
**Related**: [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) · [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

Set `"stream": true` on Messages API requests to receive **server-sent events (SSE)** incrementally instead of one blocking JSON body.

**ZDR:** Streaming uses the same Messages API — ZDR eligible under standard contract.

**This fork:** `claude-adapter.ts` invokes `claude --print` (buffered stdout). API/SDK streaming is **reference only** until Track B-0 approves an API path or CLI `--stream` wiring.

---

## Enabling

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "stream": true,
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

**CLI (`ant`):**

```bash
ant messages create --stream --format jsonl \
  --model claude-sonnet-4-6 \
  --max-tokens 1024 \
  --message '{role: user, content: Hello}'
```

`ant --stream` emits **one JSONL event per line** — it does **not** aggregate to a final `Message`; accumulate events yourself or use SDK helpers.

---

## SDK patterns

| Pattern | When |
|---------|------|
| `stream.text_stream` / per-event loop | UX needs incremental text |
| `stream.get_final_message()` (Python) / `finalMessage()` (TS) | Large `max_tokens`; SDK streams internally to avoid HTTP timeout |
| `message.Accumulate(event)` (Go) / `MessageAccumulator` (Java) | Build full `Message` from events |

Use **final-message helpers** when you do not need per-token UI but `max_tokens` is high (e.g. 128k).

---

## Event flow (SSE)

1. `message_start` — empty `content` on `Message`
2. Per content block: `content_block_start` → `content_block_delta` (×N) → `content_block_stop`
3. `message_delta` — top-level changes; **`usage` is cumulative**
4. `message_stop`

Also: arbitrary `ping` events; inline `error` events (e.g. `overloaded_error` ≈ HTTP 529). **Handle unknown event types** per versioning policy.

### Error event example

```json
{"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}}
```

---

## Content block delta types

| Delta | Block | Accumulation |
|-------|-------|----------------|
| `text_delta` | `text` | Concatenate `text` |
| `input_json_delta` | `tool_use` | Concatenate `partial_json`; parse at `content_block_stop` — see [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) |
| `thinking_delta` | `thinking` | Concatenate `thinking` — [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) |
| `signature_delta` | `thinking` | Arrives before `content_block_stop`; opaque — pass through on replay |

**`display: "omitted"` thinking:** No `thinking_delta` events — block opens, single `signature_delta`, closes ([adaptive thinking](./ANTHROPIC_ADAPTIVE_THINKING.md)).

**Server-side fallback:** `fallback` blocks arrive as start/stop pairs without deltas.

---

## Streaming + tools

- `tool_use` blocks stream `input_json_delta` (partial JSON strings).
- Enable **fine-grained** streaming per tool: `eager_input_streaming: true` + `stream: true`.
- `tool_choice: any` in platform samples — with **extended thinking enabled**, use `auto` only ([ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md)).

**Web search (server tool):** Streams `server_tool_use` + `web_search_tool_result` blocks — not wired in fork adapters.

---

## Streaming + thinking

```json
{
  "stream": true,
  "thinking": { "type": "adaptive", "display": "summarized" }
}
```

Process `thinking_delta` and `text_delta` on separate block indices. Adaptive + streaming: [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md).

**Catalog 4.5 AS-IS:** Manual `thinking: {type: "enabled"}` — same delta types; SDK may require streaming when `max_tokens` > 21333.

---

## Error recovery (interrupted streams)

| Catalog era | Strategy |
|-------------|----------|
| **4.5 and earlier** (Sonnet 4.6, Opus 4.8) | Capture partial assistant content; **prepend as new assistant message**; resume stream |
| **4.6+** (migration) | Capture partial text; send **user** message: “Your previous response was interrupted and ended with […]. Continue from where you left off.” |

**Limits:** `tool_use` and `thinking` blocks **cannot** be partially recovered — resume from latest **complete text** block only. Prefer SDK accumulation helpers.

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.messageStreaming` | `supported`, `protocol: "sse"` |
| `apiFeatures.fineGrainedToolStreaming` | Requires `stream: true` on request |
| `prompting.guidanceTopics[]` | `message-streaming-sse`, `streaming-thinking-delta`, `streaming-error-recovery`, `streaming-final-message` |

---

## AS-IS gaps

| Path | Today |
|------|-------|
| `claude-adapter.ts` | `claude --print` — no SSE, no delta handling |
| Wall-Bounce rounds | Buffered adapter results only |
| Fine-grained tool streaming | Catalog documented; not wired |

---

## Backlog

- **B-0** — Optional API `messages.stream` path or `ant --stream` for long outputs / tool loops.
- **F-10** — Inject streaming guidance when `fineGrainedToolStreaming` tools present.

---

## References

- [Streaming messages (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/streaming)
- [Fine-grained tool streaming](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md)
- [Extended thinking — streaming](./ANTHROPIC_EXTENDED_THINKING.md)
- [Adaptive thinking — streaming](./ANTHROPIC_ADAPTIVE_THINKING.md)
