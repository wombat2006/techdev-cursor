# Anthropic Programmatic Tool Calling Integration

**Status**: Documented — API-only; requires `code_execution_20260120` (not wired in fork adapters)  
**Platform**: [Programmatic tool calling](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/programmatic-tool-calling) · [Code execution tool](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool) · [Advanced tool use (engineering)](https://www.anthropic.com/engineering/advanced-tool-use)  
**Related**: [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) · [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

**Programmatic tool calling** lets Claude write Python in a **code execution** sandbox that invokes your tools via `await tool_name(...)` — without a model round-trip per tool call. Intermediate tool results stay **out of Claude's context**; only the final code execution output is billed into context.

**Reported gains (platform):** Agentic search benchmarks (BrowseComp, DeepSearchQA) saw ~**24% fewer input tokens** and ~**11% better performance** when adding programmatic calling to basic search tools ([blog](https://claude.com/blog/improved-web-search-with-dynamic-filtering)). Example: 20 employee budget lookups → one script filters in-sandbox instead of 20 model turns ingesting thousands of line items.

**Requires:** `code_execution_20260120` server tool + `allowed_callers` on client tools.

**ZDR:** **Not eligible** — container execution artifacts retained up to **30 days** ([data retention](https://platform.claude.com/docs/en/docs/manage-claude/api-and-data-retention)).

**Platforms:** Claude API, Claude Platform on AWS, Microsoft Foundry — **not** Bedrock or Vertex (AS-IS platform table).

**This fork:** `claude-adapter.ts` uses CLI `--print` with no code execution or programmatic tool loop. **Reference only** until an approved Messages API path (Track B-0).

---

## Catalog AS-IS model support

| Catalog id | Platform support | Notes |
|------------|------------------|-------|
| `claude-sonnet-4-6` | **Yes** | Primary AS-IS target |
| `claude-opus-4-8` | **No** | Platform lists Opus 4.5+ / 4.6+ / 4.8 — not this id |
| `claude-haiku-4-5` | **No** | Not in compatibility table |

Platform compatibility (requires `code_execution_20260120`): Fable 5, Mythos 5, Opus 4.5–4.8, Opus 4.6–4.7, Sonnet 4.6, Sonnet 4.6. See [code execution model matrix](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool#model-compatibility).

---

## Quick start shape

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096,
  "tools": [
    { "type": "code_execution_20260120", "name": "code_execution" },
    {
      "name": "query_database",
      "description": "Execute SQL. Returns JSON array of rows with customer_id, revenue, orders.",
      "input_schema": {
        "type": "object",
        "properties": { "sql": { "type": "string" } },
        "required": ["sql"]
      },
      "allowed_callers": ["code_execution_20260120"]
    }
  ],
  "messages": [{ "role": "user", "content": "..." }]
}
```

**Tip:** Document **output format** in tool `description` (JSON field types) so Claude deserializes correctly in code.

---

## How it works

1. Claude writes Python that calls tools (with `await` — tools are wrapped async).
2. Code runs in sandbox via `server_tool_use` (`code_execution`).
3. Sandbox pauses; API returns `tool_use` with `caller.type: code_execution_20260120` and `caller.tool_id` → parent `srvtoolu_*`.
4. You return `tool_result` — execution resumes; **intermediate results do not enter context**.
5. Repeat step 4 until code completes → `code_execution_tool_result` + final `text`.

---

## Five-step workflow (API replay)

| Step | Action |
|------|--------|
| 1 | Send `code_execution` + tools with `allowed_callers: ["code_execution_20260120"]` |
| 2 | Receive `server_tool_use` (code) + programmatic `tool_use` blocks + `container.id` / `expires_at` |
| 3 | Reply with **tool_result only** (see below); pass `container` ID to reuse state |
| 4 | Loop step 3 while sandbox awaits more tool results |
| 5 | Receive `code_execution_tool_result` (`stdout` / `stderr` / `return_code`) + assistant `text` |

**Step 2 response shape (abbreviated):**

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "..." },
    {
      "type": "server_tool_use",
      "id": "srvtoolu_abc123",
      "name": "code_execution",
      "input": { "code": "results = await query_database('...')\n..." }
    },
    {
      "type": "tool_use",
      "id": "toolu_def456",
      "name": "query_database",
      "input": { "sql": "..." },
      "caller": { "type": "code_execution_20260120", "tool_id": "srvtoolu_abc123" }
    }
  ],
  "container": { "id": "container_xyz789", "expires_at": "2026-01-20T14:30:00Z" },
  "stop_reason": "tool_use"
}
```

**Step 5 completion block:**

```json
{
  "type": "code_execution_tool_result",
  "tool_use_id": "srvtoolu_abc123",
  "content": {
    "type": "code_execution_result",
    "stdout": "Top 5 customers: [...]",
    "stderr": "",
    "return_code": 0,
    "content": []
  }
}
```

---

## `allowed_callers`

| Value | Meaning |
|-------|---------|
| `["direct"]` | Default — Claude calls tool directly |
| `["code_execution_20260120"]` | Programmatic only (recommended per tool) |
| `["direct", "code_execution_20260120"]` | Both — platform recommends **pick one** per tool |

**Not a security boundary** — still handle direct `tool_use` from Claude; do not rely on `allowed_callers` alone.

### `caller` on `tool_use`

```json
"caller": { "type": "code_execution_20260120", "tool_id": "srvtoolu_abc123" }
```

Direct calls use `"caller": { "type": "direct" }`.

---

## Container lifecycle

- New container per request unless `container` ID reused.
- **Idle timeout:** 4.5 minutes; **max lifetime:** 30 days.
- Response includes `container.id` and `container.expires_at` — respond before expiry when sandbox waits on `tool_result`.
- If tool handler is slow, sandbox may get `TimeoutError` in `stderr`; Claude may retry.

---

## Advanced patterns (in generated code)

| Pattern | Benefit |
|---------|---------|
| **Loop / fan-out** | N regions → one script, aggregate in Python |
| **Early termination** | Stop loop on first success |
| **Conditional tool pick** | `get_file_info` then full read vs summary by size |
| **Filter before print** | Return only errors / top-K rows to stdout |

Platform examples use `async def` wrappers; Claude auto-includes async glue — use `await` in generated snippets.

---

## Message format (critical)

When a **pending programmatic** tool call awaits results, the user message must contain **`tool_result` blocks only** — no trailing `text` in the same message.

Invalid: `tool_result` + `"What should I do next?"` text in same turn.

Valid: single or multiple `tool_result` blocks only.

*(Does not apply to normal direct `tool_use` — text after `tool_result` is allowed there.)*

---

## Error handling

| Error | Cause | Mitigation |
|-------|-------|------------|
| `invalid_tool_input` | Payload ≠ `input_schema` | Validate before handler |
| `invalid_request_error` (`tool_choice`) | `tool_choice` names tool without `"direct"` in `allowed_callers` | Add `"direct"` or remove from `tool_choice` |
| `TimeoutError` in `stderr` | Container waited too long for your `tool_result` | Watch `expires_at`; chunk work; fast handlers |
| Tool returns error string | Business failure | Claude code can branch on error text |

---

## When to use vs avoid

| Use programmatic | Avoid |
|------------------|-------|
| Fan-out (N endpoints, N records) | Strict sequential reasoning between each tool result |
| Filter/aggregate large tool payloads before context | Few small tool calls (container overhead) |
| Agentic search / multi-step fetch + filter | Need user feedback between calls |
| 10–49 tools in `tools` array (~20–40% token savings reported) | τ²-bench-style 1–2 sequential calls/turn (~8% cost increase, no score gain) |
| 75-tool agent workloads (~38% input token reduction, same accuracy) | First turn with tiny payloads |

Measure billed input tokens with/without `allowed_callers` on representative traffic before broad rollout.

---

## Incompatibilities

| Feature | Status |
|---------|--------|
| `strict: true` structured tool outputs | Not supported for programmatic calls |
| `tool_choice` forcing programmatic-only tools | Invalid — tool must allow `"direct"` or remove from `tool_choice` |
| `disable_parallel_tool_use: true` | Not supported |
| MCP connector tools | Cannot be called programmatically |

---

## Token / billing

- Programmatic **tool results are not counted** in input/output tokens — only final code `stdout` and Claude response.
- Code execution pricing applies — see [code execution pricing](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool#usage-and-pricing).
- Each programmatic tool invocation counts toward **tool rate limits** (same as direct calls).
- Rule of thumb: ~10× token cost vs programmatic+summary when calling 10 tools directly with full payloads in context.

---

## Security

- Tool results are **strings** — validate before execution in your handler.
- External/user-derived tool output may be code-injection risk if mishandled.
- Prefer Anthropic **managed** sandbox vs client-side arbitrary code execution.

### Alternative implementations

| Approach | Trade-off |
|----------|-----------|
| **Client-side direct** | Simple; runs untrusted code outside sandbox — injection risk |
| **Self-managed sandbox** | Full control; you own IPC + infra |
| **Anthropic managed** (this doc) | Default for API/AWS/Foundry — container + safe tool IPC |

---

## Relation to fork patterns

| Pattern | Layer |
|---------|-------|
| Wall-Bounce cross-vendor rounds | Different from intra-Claude programmatic loops |
| [Parallel tool use](./ANTHROPIC_PARALLEL_TOOL_USE.md) | Direct `tool_use` per turn — complementary, not replacement |
| [Fine-grained streaming](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) | Direct tool input streaming — orthogonal |
| [Prompt caching](./ANTHROPIC_PROMPT_CACHING.md) | Cache static `tools` + system; programmatic loops add dynamic `tool_result` turns |
| CLI `claude --print` | No sandbox tool loop today |

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.programmaticToolCalling` | `supported`, `codeExecutionType`, `zdrEligible: false` |
| `prompting.guidanceTopics[]` | See below |

| Topic slug | Focus |
|------------|-------|
| `programmatic-tool-calling` | Enable code_execution + allowed_callers |
| `allowed-callers-field` | direct vs code_execution per tool |
| `programmatic-container-lifecycle` | container ID, expires_at, 4.5m idle |
| `programmatic-tool-result-only` | tool_result-only user turns |
| `programmatic-async-await` | await in generated code |
| `programmatic-token-efficiency` | When fan-out/filter saves tokens |
| `programmatic-error-handling` | timeouts, invalid_tool_input, tool_choice |

---

## Backlog

- **B-0** — Messages API path: code execution + `allowed_callers` + container reuse + tool_result-only turns.
- **F-10** — Inject guidance when fan-out tool presets detected.

---

## References

- [Programmatic tool calling (platform)](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/programmatic-tool-calling)
- [Code execution tool](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool)
- [Define tools](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/define-tools)
- [API and data retention](https://platform.claude.com/docs/en/docs/manage-claude/api-and-data-retention)
- [Improved web search with dynamic filtering](https://claude.com/blog/improved-web-search-with-dynamic-filtering)
