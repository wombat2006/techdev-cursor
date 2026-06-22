# Anthropic Context Window Integration

**Status**: Documented — compaction / context-editing wiring pending (Track B-0 / F-10)  
**Platform**: [Context windows](https://platform.claude.com/docs/en/docs/build-with-claude/context-windows) · [Compaction](https://platform.claude.com/docs/en/docs/build-with-claude/compaction) · [Context editing](https://platform.claude.com/docs/en/docs/build-with-claude/context-editing) · [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md)  
**Related**: [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [ANTHROPIC_COOKBOOK_INTEGRATION.md](./ANTHROPIC_COOKBOOK_INTEGRATION.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [TS-22](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md)

---

## What it is

The **context window** is Claude's working memory for a request: system prompt, tools, conversation history, and the current turn's output. It is not the training corpus. **Context rot** — recall/accuracy degradation as tokens grow — means *what* you include matters as much as *how much* fits.

**ZDR:** Context window usage is ZDR-eligible.

**Primary strategies (long agents):**

| Strategy | When | Catalog AS-IS |
|----------|------|---------------|
| [Server-side compaction](https://platform.claude.com/docs/en/docs/build-with-claude/compaction) | Conversation nears limit | **4.6+** platform beta — migration note only |
| Agent SDK `compaction_control` | Sonnet long tool sessions | Cookbook on **Sonnet 4.6** |
| [Context editing](https://platform.claude.com/docs/en/docs/build-with-claude/context-editing) | Clear stale tool results / thinking blocks | Cookbook + platform |
| Memory tool | Facts across sessions | Sonnet cookbook |

---

## Catalog model limits (AS-IS ids)

| Catalog id | Context window (platform) | Context awareness | Max output (typical) |
|------------|---------------------------|-------------------|----------------------|
| `claude-sonnet-4-6` | **200k** | Yes (`<budget:token_budget>`) | 64k |
| `claude-haiku-4-5` | **200k** | Yes | 64k |
| `claude-opus-4-8` | **200k** | No (4.6+ / 4.8 ref) | 128k (Opus family) |

**Reference (not in catalog):** Opus 4.8 / 4.7 / 4.6, Sonnet 4.6, Fable/Mythos 5 — up to **1M** context on API/Bedrock/Vertex.

---

## Standard turn accumulation

Each turn:

1. **Input** = all prior user/assistant messages + current user message (+ tools/system)
2. **Output** = assistant response → becomes part of next turn's input

Growth is **linear**; older turns stay in full unless you compact, clear, or edit.

Before large sends, use [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) (`messages/count_tokens`).

---

## Extended thinking + context

Thinking tokens count toward limits and bill as **output** once per generation.

**Subsequent turns (no active tool loop):** API **auto-strips** prior `thinking` blocks from context window calculation when you round-trip history — you do not need to delete them manually (safe to omit).

Effective window (simplified):

```text
context_window ≈ (input_tokens - previous_thinking_tokens) + current_turn_tokens
```

Details and model-version differences: [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).

### Thinking + tool use

| Turn | Thinking blocks |
|------|-----------------|
| After `tool_result` (same tool cycle) | **Must** return unchanged thinking + `tool_use` with matching `tool_result` |
| New user message after tool cycle completes | Prior thinking may be omitted; API strips if present |
| Interleaved thinking enabled | Thinking may appear between tool steps — see extended-thinking doc |

With tools + thinking:

```text
context_window ≈ input_tokens + current_turn_tokens
```

---

## Context awareness (Sonnet 4.6 / Haiku 4.5)

Models receive explicit budget signals:

```xml
<budget:token_budget>200000</budget:token_budget>
```

After tool calls:

```xml
<system_warning>Token usage: 35000/200000; 165000 remaining</system_warning>
```

**Implications for agents:**

- Design multi-session state artifacts for fast restore ([memory tool pattern](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/memory-tool))
- Do not fight the budget — prefer compaction/clearing before blind truncation
- After Claude Code **compaction**, re-inject critical rules via `SessionStart` hook (`matcher: compact`) — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md)
- Image tokens count toward budget

Prompt guidance: [Claude prompting best practices — context awareness](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices#context-awareness-and-multi-window-workflows).

---

## Overflow behavior (Claude 4.5+)

If `input_tokens + max_tokens` exceeds the window, the API **accepts** the request; generation stops with:

```json
{ "stop_reason": "model_context_window_exceeded" }
```

Older models return validation errors instead. Opt-in beta header: `model-context-window-exceeded-2025-08-26`.

**Handle:** Reduce input, compact, clear tool results, or lower `max_tokens`; preflight with token counting.

---

## TechSapo composition (Sonnet 4.6)

Diagnose before picking a primitive (context engineering cookbook):

| Symptom | Primitive |
|---------|-----------|
| Re-fetchable tool bloat | Tool-result **clearing** |
| Long chat, rot | **Compaction** (SDK today; server-side on 4.6+) |
| Cross-session facts | **Memory** tool + `/memories` paths |
| Huge tool catalog | [Manage tool context](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/manage-tool-context) / tool search |

Wall-Bounce: long analyze rounds should not assume unbounded history — align with [TS-22](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md) `OrchestrationSession` rather than ad-hoc transcript growth.

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `limits.contextTokens` | 200000 for catalog Claude ids |
| `apiFeatures.contextAwareness` | Sonnet 4.6, Haiku 4.5 |
| `apiFeatures.serverSideCompaction` | `supported: false` on 4.5 — migration pointer |
| `capabilities.compaction` | SDK/cookbook path on Sonnet |
| `prompting.guidanceTopics[]` | `context-window-management`, `context-awareness`, `context-window-overflow` (+ existing `context-compaction`, `tool-result-clearing`) |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | No token counting, compaction, or context-editing hooks |
| `OrchestrationSession` | Layer A mandatory (TS-22) but compaction not wired |
| F-10 | Context topics not injected at runtime |

---

## Backlog

- **B-0** — Token count preflight before long Wall-Bounce rounds.
- **F-10** — Inject `context-window-management` + `context-awareness` for Sonnet agent presets.
- **Migration** — When catalog adds Sonnet 4.6+, enable `serverSideCompaction` and 1M `contextTokens`.

---

## References

- [Context windows (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/context-windows)
- [Effective context engineering (Anthropic engineering)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Compaction](https://platform.claude.com/docs/en/docs/build-with-claude/compaction)
- [Context editing](https://platform.claude.com/docs/en/docs/build-with-claude/context-editing)
- [Handling stop reasons](https://platform.claude.com/docs/en/docs/build-with-claude/handling-stop-reasons)
- [Manage tool context](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/manage-tool-context)
- [Extended thinking](./ANTHROPIC_EXTENDED_THINKING.md)
