# Anthropic Extended Thinking Integration

**Status**: Documented — adapter / `InferenceProfile.cot` wiring pending (Track B-0 / F-10)  
**Platform**: [Extended thinking](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking) · [Adaptive thinking](https://platform.claude.com/docs/en/docs/build-with-claude/adaptive-thinking)  
**Cookbook**: [Extended thinking with tool use](https://platform.claude.com/cookbook/extended-thinking-extended-thinking-with-tool-use)  
**Related**: [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [TS-20](./decisions/TECH_STACK_INFERENCE_PROFILE.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Extended thinking** exposes Claude's internal reasoning as `thinking` content blocks (with `signature`) before `text` output. It improves multi-step math, coding, and tool-planning tasks. Responses bill **full internal thinking tokens** even when the API returns **summarized** or **omitted** display text.

**ZDR:** Extended thinking **is** Zero Data Retention eligible (unlike [Message Batches](./ANTHROPIC_BATCH_API_RAG.md)).

**This fork:** Catalog targets **Claude Sonnet 4.6** and **Opus 4.6 / 4.8** (manual `thinking: {type: "enabled"}`). For **4.6+ adaptive thinking** (recommended migration path), see [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md).

---

## Catalog model matrix (AS-IS ids)

| Catalog id | Thinking mode (platform) | Interleaved thinking | Block preservation | Max output (platform) |
|------------|--------------------------|----------------------|--------------------|------------------------|
| `claude-sonnet-4-6` | Manual `enabled` + `budget_tokens` (min 1024) | Beta header `interleaved-thinking-2025-05-14` for tool loops | **Last assistant turn only** (pre-4.6 Sonnet) | 64k |
| `claude-opus-4-6` | Manual `enabled` | Same beta header | **Last assistant turn only** | 128k (Opus family) |
| `claude-opus-4-8` | Manual `enabled` | Same beta header | **Last assistant turn only** | 128k (Opus family) |
| `claude-haiku-4-5` | Manual `enabled` (use sparingly — fast tier) | Same beta header when using tools | **Last turn only** | 64k |

**Newer models (reference only, not in catalog):**

| Platform model | Mode | Notes |
|----------------|------|-------|
| Opus 4.8 / 4.7 | `thinking: {type: "adaptive"}` + `effort` only | Manual `enabled` → **400** |
| Opus 4.6 / Sonnet 4.6 | Adaptive **recommended**; manual deprecated | Interleaved automatic with adaptive; preservation **all turns** |
| Fable 5 / Mythos 5 | Adaptive always on; `disabled` → error | No manual budget |

When catalog upgrades to 4.6+, switch `apiFeatures.extendedThinking.preferredMode` to `adaptive` — full checklist in [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md).

---

## API shape (manual — Sonnet 4.6 / Opus 4.8)

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 16000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000,
    "display": "summarized"
  },
  "messages": [{ "role": "user", "content": "..." }]
}
```

| Field | Guidance |
|-------|----------|
| `budget_tokens` | Target, not hard cap; min **1024**; must be `< max_tokens` (except interleaved tool loops — see platform) |
| `display: "summarized"` | Default for Sonnet 4.6 — shows summary; billed on **full** thinking tokens |
| `display: "omitted"` | Empty `thinking` text, keeps `signature`; **lower latency** to first text token; same billing |
| `stream` | Use for long runs; SDK may require streaming when `max_tokens` > 21333 |

**CLI (subscription path):**

```bash
ant messages create \
  --model claude-sonnet-4-6 \
  --max-tokens 16000 \
  --thinking '{type: enabled, budget_tokens: 10000}' \
  --message '{role: user, content: "..."}'
```

Map to `InferenceProfile.cot` / effort in [inference-profile-resolver.ts](../src/adapters/inference-profile-resolver.ts) — **not wired in adapters today**.

---

## Tool use + thinking (Wall-Bounce relevant)

### Rules

1. **`tool_choice`**: only `auto` (default) or `none` — not `any` / forced tool name.
2. **Preserve blocks**: return **unchanged** `thinking` (+ `redacted_thinking` if present) with `tool_use` when continuing after `tool_result`. Include `signature` verbatim.
3. **No new thinking after `tool_result`** until the next non-tool **user** turn (cookbook); **interleaved** mode (beta header) allows thinking between tool steps on Claude 4 models.
4. **Single assistant turn**: tool loop = one assistant turn — do not toggle thinking on/off mid-loop (graceful degradation disables thinking instead of error).
5. **Assistant prefill**: incompatible with thinking enabled.

**Parallel tool use:** Multiple `tool_use` blocks per turn are allowed with `tool_choice: auto`. Return all `tool_result` blocks in **one** user message. See [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md).

### Interleaved thinking (Sonnet 4.6 / Opus 4.8)

Add beta header on API requests:

```http
anthropic-beta: interleaved-thinking-2025-05-14
```

Enables thinking **after** each `tool_result` within the same assistant turn. `budget_tokens` spans **all** thinking blocks in that turn and may exceed `max_tokens` ceiling per platform rules.

**AS-IS gap:** `claude-adapter.ts` does not pass thinking params or preserve blocks on replay.

---

## Billing and observability

- Billed output includes **full internal reasoning**, not displayed summary length.
- Read `usage.output_tokens_details.thinking_tokens` for reasoning portion.
- `display: "omitted"` saves **latency**, not cost.
- Prompt cache: changing `budget_tokens` or enable/disable **invalidates message cache**; system + tools stay cached. See [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) and platform § prompt caching + thinking.

---

## Prompting dos / donts (catalog-aligned)

### Sonnet 4.6

**Dos:** Enable thinking for multi-step tools; use `display: "omitted"` for automation pipelines; add interleaved beta for long tool chains; preserve thinking blocks on tool replay; plan thinking mode **per assistant turn** before starting.

**Donts:** Expect thinking after every `tool_result` without interleaved beta; filter out `redacted_thinking`; modify or reorder thinking blocks; use forced `tool_choice`; toggle thinking inside a tool loop.

### Opus 4.8

**Dos:** Same as Sonnet for aggregate rounds that use tools; larger budgets (16k+) for hard synthesis; consider batch API for >32k thinking budgets (offline only).

**Donts:** JSON assistant prefill when reasoning must be visible before output.

### Haiku 4.5

**Dos:** Avoid extended thinking by default — prefer tool-schema extraction for structured output.

**Donts:** Large `budget_tokens`; interleaved long agent loops (use Sonnet).

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.extendedThinking` | Mode, beta header, preservation policy |
| `prompting.guidanceTopics[]` | `extended-thinking-tool-use`, `preserve-thinking-blocks`, `interleaved-thinking-beta`, `thinking-display-omitted` |
| `references[]` | Platform extended-thinking doc + cookbook |

---

## Backlog

- **B-0** — Wire `cot` / thinking budget from `InferenceProfile` → Claude adapter / CLI flags.
- **F-10** — Inject `guidanceTopics` into Wall-Bounce round prompts when Sonnet/Opus selected.
- **Migration** — When adopting Sonnet 4.6 / Opus 4.8 catalog rows, move presets to `thinking: {type: "adaptive"}` + `effort` per [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md).

---

## References

- [Extended thinking (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking)
- [Adaptive thinking](https://platform.claude.com/docs/en/docs/build-with-claude/adaptive-thinking)
- [Effort parameter](https://platform.claude.com/docs/en/docs/build-with-claude/effort)
- [Cookbook — extended thinking + tools](https://platform.claude.com/cookbook/extended-thinking-extended-thinking-with-tool-use)
- [API — thinking blocks cannot be modified](https://platform.claude.com/docs/en/api/errors#thinking-blocks-cannot-be-modified)
