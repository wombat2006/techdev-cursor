# Anthropic Parallel Tool Use Integration

**Status**: Documented — Messages API / tool-loop wiring pending (Track B-0 / F-10)  
**Platform**: [Parallel tool use](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/parallel-tool-use) · [Handle tool calls](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/handle-tool-calls) · [Tool Runner](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-runner)  
**Related**: [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

By default, Claude may emit **multiple `tool_use` blocks in one assistant turn** when independent operations answer the user. Calls in a batch have **no ordering guarantee** — execute with `Promise.all` / `asyncio.gather` or any order; Claude does not assume one finishes before another.

**Dependent calls** may still appear in the same batch. Dispatch all calls; on failure return a natural error with `is_error: true` in `tool_result`. Claude will retry after prerequisites complete — **do not** switch to sequential execution to hide the issue.

**This fork:** Catalog targets **Claude Sonnet 4.6**, **Opus 4.8**, **Haiku 4.5**. Platform examples use Opus 4.8 — behavior applies to all Claude 4 models; map catalog ids when copying samples.

---

## Disabling parallel tool use

Set on `tool_choice`:

| `tool_choice.type` | `disable_parallel_tool_use: true` effect |
|--------------------|------------------------------------------|
| `auto` (default) | At most **one** tool per turn |
| `any` or `tool` | **Exactly one** tool per turn |

```json
{
  "tool_choice": {
    "type": "auto",
    "disable_parallel_tool_use": true
  }
}
```

**Extended thinking:** Forced `tool_choice` (`any` / named `tool`) is **incompatible** with thinking enabled — use `auto` only. See [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).

---

## Message history (critical)

After parallel `tool_use` blocks, return **all** `tool_result` blocks in **one** user message:

```json
[
  { "role": "assistant", "content": [tool_use_1, tool_use_2] },
  { "role": "user", "content": [tool_result_1, tool_result_2] }
]
```

| Rule | Detail |
|------|--------|
| ✅ Single user message | All results for one assistant tool batch together |
| ❌ Split user messages | One result per message — trains Claude **away** from parallel use |
| ❌ Text before results | No user text before `tool_result` blocks in the content array |
| Thinking blocks | When thinking enabled, preserve full assistant `content` (thinking + tool_use) unchanged on replay |

**With extended thinking:**

```json
[
  { "role": "assistant", "content": [thinking_block, tool_use_1, tool_use_2] },
  { "role": "user", "content": [tool_result_1, tool_result_2] }
]
```

---

## Execution semantics (implementers)

1. Extract all `tool_use` blocks from one assistant message.
2. Run handlers **concurrently** when safe; order does not matter to the API.
3. Collect `tool_result` entries; set `is_error: true` + natural message on failure.
4. Append one user message with the full result array.
5. Prefer [Tool Runner](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-runner) for SDK paths — handles parallel dispatch with less boilerplate.

**CLI / subscription path:** `claude` CLI and Claude Code manage tool loops internally today. Custom Messages API integrations (future adapter) must implement batching explicitly.

---

## Maximizing parallel tool use (prompting)

### System prompt (Claude 4)

```text
For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
```

Stronger variant (when default is insufficient):

```text
<use_parallel_tool_calls>
For maximum efficiency, whenever you perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially. Prioritize calling tools in parallel whenever possible. For example, when reading 3 files, run 3 tool calls in parallel to read all 3 files into context at the same time. When running multiple read-only commands like ls or list_dir, always run all of the commands in parallel. Err on the side of maximizing parallel tool calls rather than running too many tools sequentially.
</use_parallel_tool_calls>
```

Add to reduce false dependency batching:

```text
Only batch tool calls that are truly independent of each other.
```

### User message phrasing

| Weaker | Stronger |
|--------|----------|
| "What's the weather in Paris? Also check London." | "Check the weather in Paris and London simultaneously." |
| Sequential implied | "Use parallel tool calls to get weather for Paris, London, and Tokyo at the same time." |

Catalog topic: `parallel-tool-prompting`. Runtime injection pending (F-10).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Only one tool per turn | Split `tool_result` across user messages | Batch results in one user message |
| Parallel rate drops over time | History formatting drift | Audit replay code; never strip `redacted_thinking` |
| Weak parallelism | Default prompt only | Add system / `<use_parallel_tool_calls>` block |
| Dependent call fails in batch | Expected — Claude may over-batch | Return `is_error: true`; let model re-issue; don't go sequential |

**Measure:** Average `tool_use` count per assistant tool message — values **> 1.0** indicate parallel use is working.

---

## Catalog alignment

| Catalog id | `apiFeatures.parallelToolCalls` | Primary use |
|------------|--------------------------------|-------------|
| `claude-sonnet-4-6` | `true` | Agent loops, multi-read, compaction/clearing batches |
| `claude-opus-4-8` | `true` | Multi-corpus ReAct, tool-heavy aggregate paths |
| `claude-haiku-4-5` | `true` | Parallel read-only fetches; single-schema extract usually one tool |

| `prompting.guidanceTopics[]` | Purpose |
|------------------------------|---------|
| `parallel-tool-use` | Default parallel behavior + disable flag |
| `parallel-tool-result-batching` | Single user message for all `tool_result` |
| `parallel-tool-prompting` | System / user phrasing to maximize parallelism |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | CLI `--print` only — no Messages API tool loop or result batching |
| `OrchestrationSession` replay | Must batch parallel `tool_result` when B-0 adds Anthropic tool protocol |
| F-10 | `guidanceTopics` not injected into Wall-Bounce prompts yet |

---

## Backlog

- **B-0** — Messages API tool runner or Tool Runner integration for Sonnet agent-edit paths.
- **F-10** — Inject `parallel-tool-prompting` for Sonnet when `apiFeatures.parallelToolCalls` is true.
- **Session store** — Document replay contract: never split parallel results across user turns (TS-22).

---

## References

- [Parallel tool use (platform)](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/parallel-tool-use)
- [Handle tool calls](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/handle-tool-calls)
- [Tool Runner](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-runner)
- [Define tools](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/define-tools)
- [Extended thinking + tools](./ANTHROPIC_EXTENDED_THINKING.md)
