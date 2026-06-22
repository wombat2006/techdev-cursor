# Anthropic Mid-Conversation System Messages Integration

**Status**: Documented — `role: system` in `messages[]` not wired in adapters  
**Platform**: [Mid-conversation system messages](https://platform.claude.com/docs/en/docs/build-with-claude/mid-conversation-system-messages) · [Prompt caching](./ANTHROPIC_PROMPT_CACHING.md) · [Orchestration effort example](https://platform.claude.com/docs/en/docs/build-with-claude/mid-conversation-effort-example)  
**Related**: [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

Append **`{"role": "system", "content": "..."}`** inside `messages` to inject operator-level instructions **mid-session** without editing the top-level `system` field.

**Why:** Prefix hash order is `tools` → `system` → `messages`. Changing top-level `system` invalidates the entire cached prefix. Mid-conversation system messages append at the **tail** of history — prior turns stay byte-identical → **cache hits preserved**.

**ZDR:** Eligible.

**Model:** **Claude Opus 4.8 only** (no beta header). Not Sonnet 4.6 catalog id.

**Platforms:** Claude API, Claude Platform on AWS — **not** Bedrock, Vertex, Microsoft Foundry.

**This fork:** Escalation aggregate `claude-opus-4-8` paths — document as **Opus 4.8+ feature**; adapter does not emit `role: system` in `messages`.

---

## Catalog AS-IS

| Catalog id | Platform support | AS-IS workaround |
|------------|------------------|------------------|
| `claude-opus-4-8` | **No** (requires Opus 4.8) | Edit top-level `system` → cache miss; or `user` turn (lower operator priority) |
| `claude-sonnet-4-6` | **No** | Same |
| `claude-haiku-4-5` | **No** | Same |

---

## When to use

| Scenario | Example |
|----------|---------|
| Mid-session policy / persona | “From now on, parameterize all SQL” after 50 cached turns |
| Turn-scoped operator context | Freshness notes, session expiry, tool availability |
| App-observed state | File changed on disk, auto-approve toggled, token budget threshold |
| User input during agent loop | Relay new user text after `tool_result` without restarting turn |
| Persistent consent modes | Orchestration / high-cost feature reminders ([effort example](https://platform.claude.com/docs/en/docs/build-with-claude/mid-conversation-effort-example)) |

**`system` vs `user`:** Both can carry instructions; **`system` wins on conflict** (operator vs end-user). Use `system` for constraints that must hold even if the user asks otherwise.

---

## How it works

- Later `system` messages override earlier ones for subsequent turns.
- Mid-conversation `system` overrides top-level `system` **for turns after it**.
- Keep session-wide stable instructions in top-level `system`; use mid-conversation for late-arriving operator facts.

```json
{
  "model": "claude-opus-4-8",
  "cache_control": { "type": "ephemeral" },
  "system": "You are a code review assistant. Be concise.",
  "messages": [
    { "role": "user", "content": "Review process() in utils.py..." },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "Now review the calling code..." },
    {
      "role": "system",
      "content": "From now on, every suggestion must include explicit type annotations."
    }
  ]
}
```

---

## Placement rules

| Rule | Detail |
|------|--------|
| **Not first** | Cannot be first entry in `messages` — use top-level `system` for initial instructions |
| **Valid position** | Immediately after a `user` turn (incl. `tool_result` user) or after `assistant` ending in server tool use; must be last entry **or** followed only by `assistant` |
| **Invalid** | Between `tool_use` and its `tool_result` → **400** |
| **No consecutive** | Do not place two `system` messages back-to-back — merge or wait for next user turn |
| **Do not edit** | Changing a prior mid-conversation `system` invalidates cache from that point — append a new one instead |

### After tool results (agent loop)

```json
[
  { "role": "user", "content": "Run the test suite and fix any failures." },
  { "role": "assistant", "content": [{ "type": "tool_use", "id": "toolu_01", "name": "run_tests", "input": {} }] },
  { "role": "user", "content": [{ "type": "tool_result", "tool_use_id": "toolu_01", "content": "12 passed, 0 failed" }] },
  {
    "role": "system",
    "content": "The user sent the following message while you were working: also update the changelog before you finish."
  }
]
```

Frame as **context** (“user sent: X”), not adversarial overrides (“ignore the user”). Do **not** put tool output, RAG docs, or web content in `system` — keep in `tool_result` ([jailbreak mitigation](https://platform.claude.com/docs/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)).

---

## Combining with prompt caching

1. **Opt in** — `cache_control` required (automatic or explicit breakpoints); mid-conversation `system` alone does not create cache entries.
2. **Cache stable prefix** — breakpoint on unchanged tail (top-level `system`, tools, stable history).
3. **Append system after breakpoint** — prefix hash unchanged → cache read on prior turns.
4. **Once in history** — the system message becomes part of stable history; next turn caches through it (automatic or moved breakpoint).

Short early conversations may show `cache_* = 0` until [min cache tokens](./ANTHROPIC_PROMPT_CACHING.md#catalog-as-is--minimum-cacheable-tokens) are met.

---

## Fork use cases (Opus 4.8 migration)

| Wall-Bounce / agent pattern | Application |
|-----------------------------|-------------|
| Long aggregate session with cached constitution | Inject round-specific synthesis rules without busting cache |
| Operator policy mid-orchestration | Subagent spawn consent, Japanese output reminder |
| User message during tool loop | Relay via `system` after `tool_result` on Sonnet/Opus agent paths (when on 4.8) |

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.midConversationSystemMessages` | `supported`, `platformModelMin`, `zdrEligible` |
| `prompting.guidanceTopics[]` | See below |

| Topic slug | Focus |
|------------|-------|
| `mid-conversation-system-message` | `role: system` in messages vs top-level edit |
| `mid-conversation-placement` | After user / tool_result; not between tool_use and result |
| `mid-conversation-prompt-caching` | Append after cache breakpoint |
| `mid-conversation-tool-relay` | User input during agent loop |

---

## AS-IS gaps

- No `messages[].role === "system"` in adapter or session replay.
- Opus 4.8 aggregate paths must choose cache miss (edit top-level `system`) or lower-priority `user` injection.

---

## Backlog

- **B-0** — Session layer: validate placement; append mid-conversation `system` on Opus 4.8+ Messages API path.
- **Catalog migration** — Add `claude-opus-4-8` row with `midConversationSystemMessages.supported: true`.

---

## References

- [Mid-conversation system messages (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/mid-conversation-system-messages)
- [Prompt caching](./ANTHROPIC_PROMPT_CACHING.md)
- [Cache diagnostics (beta)](https://platform.claude.com/docs/en/docs/build-with-claude/cache-diagnostics)
- [Working with messages](https://platform.claude.com/docs/en/docs/build-with-claude/working-with-messages)
