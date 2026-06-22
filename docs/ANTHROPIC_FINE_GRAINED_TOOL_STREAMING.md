# Anthropic Fine-Grained Tool Streaming Integration

**Status**: Documented — Messages API streaming / tool def wiring pending (Track B-0 / F-10)  
**Platform**: [Fine-grained tool streaming](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/fine-grained-tool-streaming) · [Streaming messages](https://platform.claude.com/docs/en/docs/build-with-claude/streaming) — fork hub: [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) · [Handle tool calls](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/handle-tool-calls)  
**Related**: [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Fine-grained tool streaming** streams `tool_use` **input parameter values** without server-side JSON buffering or validation. Large parameters (long files, big arrays) start arriving sooner — lower time-to-first-chunk for latency-sensitive apps.

**ZDR:** Eligible (same as extended thinking).

**Availability:** All Claude models and platforms (API, Bedrock, Vertex, Foundry, AWS Claude Platform).

**This fork:** Catalog ids are Sonnet 4.6 / Opus 4.8 / Haiku 4.5. Platform samples use Opus 4.8 — map ids when copying.

---

## Enabling

Per **user-defined tool** + request streaming:

```json
{
  "stream": true,
  "tools": [
    {
      "name": "make_file",
      "description": "Write text to a file",
      "eager_input_streaming": true,
      "input_schema": { "...": "..." }
    }
  ]
}
```

| Requirement | Detail |
|-------------|--------|
| `eager_input_streaming` | `true` on the tool definition |
| `stream` | `true` on the Messages request |
| JSON validity | **Not guaranteed** until block closes — handle partial/invalid input |

**CLI:**

```bash
ant messages create --stream --format jsonl <<'YAML'
model: claude-sonnet-4-6
max_tokens: 65536
tools:
  - name: make_file
    description: Write text to a file
    eager_input_streaming: true
    input_schema: { ... }
messages:
  - role: user
    content: Write a long poem to poem.txt
YAML
```

Prefer SDK accumulators (`stream.get_final_message()` / `finalMessage()` / `MessageAccumulator`) when full input at block close is enough.

---

## Stream events (`input_json_delta`)

On `tool_use` blocks:

1. **`content_block_start`** — `input: {}` placeholder (object slot marker)
2. **`content_block_delta`** — `type: "input_json_delta"`, `partial_json` string fragments
3. **`content_block_stop`** — concatenate fragments, then `JSON.parse` / `json.loads`

Manual accumulation:

```typescript
// index -> accumulated JSON string
const toolInputs = new Map<number, string>();

for await (const event of stream) {
  if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
    toolInputs.set(event.index, "");
  } else if (event.type === "content_block_delta" && event.delta.type === "input_json_delta") {
    toolInputs.set(event.index, (toolInputs.get(event.index) ?? "") + event.delta.partial_json);
  } else if (event.type === "content_block_stop" && toolInputs.has(event.index)) {
    const parsed = JSON.parse(toolInputs.get(event.index)!);
    // dispatch tool with parsed input
  }
}
```

**Design note:** `input: {}` at start vs `partial_json` strings is intentional — object marks the slot; deltas build the value.

**Progress UI:** Use manual accumulation to react **before** `content_block_stop` (e.g. render growing file content).

**Side effect:** Chunks often arrive **longer** and less mid-token split than non-eager streaming.

---

## Edge cases (implementers)

| Case | Behavior | Mitigation |
|------|----------|------------|
| Partial JSON mid-stream | Expected with eager streaming | Do not parse until block close unless doing incremental UI |
| `stop_reason: max_tokens` | Stream may end **mid-parameter** | Treat as incomplete; retry or return wrapped error to model |
| Invalid JSON at block close | Possible | See invalid-JSON wrap below |
| Parallel tool_use | Multiple indices — accumulate **per index** | Same as [parallel tool use](./ANTHROPIC_PARALLEL_TOOL_USE.md) batching for results |

### Returning invalid JSON to the model

Wrap for `tool_result` when echoing bad input back:

```json
{
  "INVALID_JSON": "<escaped invalid json string>"
}
```

Escape quotes/special chars so the wrapper stays valid JSON.

---

## When to use (catalog-aligned)

| Model | Typical use |
|-------|-------------|
| `claude-sonnet-4-6` | Long agent writes (Skills, file tools, large `lines_of_text` arrays) |
| `claude-opus-4-8` | Large structured aggregate payloads via tools |
| `claude-haiku-4-5` | Usually small tool inputs — enable only when latency-critical + large params |

**Donts:** Enable on every tool by default — adds client complexity. Skip when inputs are tiny schemas (Haiku extractors).

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.fineGrainedToolStreaming` | `supported`, `toolFlag: eager_input_streaming`, `requiresStream: true` |
| `prompting.guidanceTopics[]` | `fine-grained-tool-streaming`, `tool-input-json-delta` |
| `references[]` | Platform fine-grained-tool-streaming doc |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | CLI `--print` only — no SSE tool stream or `eager_input_streaming` on tool defs |
| Tool registry | No catalog-driven `eager_input_streaming` on MCP-exposed tools |
| F-10 | Guidance topics not injected at runtime |

---

## Backlog

- **B-0** — Streaming Messages API path for Sonnet agent-edit with per-tool `eager_input_streaming` on large-payload tools only.
- **F-10** — Inject `fine-grained-tool-streaming` when `apiFeatures.fineGrainedToolStreaming.supported` and preset is agentic.
- **Session replay** — Store final parsed `tool_use.input`, not raw delta fragments (TS-22).

---

## References

- [Fine-grained tool streaming (platform)](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/fine-grained-tool-streaming)
- [Streaming messages](https://platform.claude.com/docs/en/docs/build-with-claude/streaming)
- [Handling stop reasons](https://platform.claude.com/docs/en/docs/build-with-claude/handling-stop-reasons)
- [Tool reference](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-reference)
- [Parallel tool use](./ANTHROPIC_PARALLEL_TOOL_USE.md)
