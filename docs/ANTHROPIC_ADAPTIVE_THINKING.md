# Anthropic Adaptive Thinking Integration

**Status**: Documented — migration reference for 4.6+; AS-IS catalog uses manual extended thinking on 4.5  
**Platform**: [Adaptive thinking](https://platform.claude.com/docs/en/docs/build-with-claude/adaptive-thinking) · [Extended thinking](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking) · [Effort](https://platform.claude.com/docs/en/docs/build-with-claude/effort)  
**Related**: [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Adaptive thinking** lets Claude decide **when** and **how much** to use extended reasoning per request, instead of a fixed `budget_tokens`. Combine with the **`effort`** parameter (`output_config.effort` on API; `--effort` on CLI) as soft guidance for thinking depth.

**ZDR:** Adaptive thinking is Zero Data Retention eligible.

**No beta header** required (unlike manual interleaved thinking on Sonnet 4.6).

**This fork (AS-IS):** Catalog ids `claude-sonnet-4-6`, `claude-opus-4-6`, and `claude-opus-4-8` use **manual** `thinking: {type: "enabled", budget_tokens}` — see [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md). Adaptive is the **migration target** for runtime wiring.

---

## Model matrix (platform)

| Platform model | Adaptive behavior | Manual `enabled` + `budget_tokens` |
|----------------|-------------------|-------------------------------------|
| Fable 5 / Mythos 5 | Always on; `disabled` → error | **400** on 4.8 / 4.7 |
| Mythos Preview | Default when `thinking` unset | — |
| Opus 4.8 / 4.7 | **Only** mode; off unless `type: "adaptive"` set | **400** |
| Opus 4.6 / Sonnet 4.6 | **Recommended**; interleaved automatic | **Deprecated** (still works) |
| Sonnet 4.6 / Opus 4.8 (catalog) | **Not supported** | **Required** |

---

## API shape (migration target)

```json
{
  "model": "claude-opus-4-8",
  "max_tokens": 16000,
  "thinking": { "type": "adaptive" },
  "output_config": { "effort": "medium" },
  "messages": [{ "role": "user", "content": "..." }]
}
```

**CLI (`ant` / subscription path):**

```bash
ant messages create \
  --model claude-opus-4-8 \
  --max-tokens 16000 \
  --thinking '{type: adaptive}' \
  --message '{role: user, content: "..."}'
```

With effort:

```bash
ant messages create \
  --model claude-opus-4-8 \
  --max-tokens 16000 \
  --thinking '{type: adaptive}' \
  --output-config '{effort: medium}' \
  --message '{role: user, content: What is the capital of France?}'
```

**AS-IS:** `claude-adapter.ts` passes `--effort` from `InferenceProfile` but does **not** pass `--thinking` — adaptive wiring pending (Track B-0).

---

## Effort levels (thinking behavior)

| Effort | Thinking behavior |
|--------|-------------------|
| `max` | Always think; unconstrained depth (Fable 5, Mythos 5, Mythos Preview, Opus 4.8, 4.7, 4.6, Sonnet 4.6) |
| `xhigh` | Always think deeply; extended exploration (Fable 5, Mythos 5, Opus 4.8, 4.7) |
| `high` (default) | Almost always thinks on complex tasks |
| `medium` | Moderate thinking; may skip on very simple queries |
| `low` | Minimal thinking; skips when speed matters |

Prefer lowering **effort** before heavy prompt steering to reduce thinking frequency.

---

## Adaptive vs manual vs disabled

| Mode | Config | When to use |
|------|--------|-------------|
| **Adaptive** | `thinking: {type: "adaptive"}` + optional `effort` | Default for 4.6+ agent workflows; bimodal task latency |
| **Manual** | `thinking: {type: "enabled", budget_tokens: N}` | Predictable thinking cost (4.5 catalog); deprecated on 4.6 |
| **Disabled** | omit `thinking` or `{type: "disabled"}` | Lowest latency; not on Fable/Mythos 5 |

---

## Interleaved thinking

Adaptive mode **automatically enables interleaved thinking** on Fable 5, Mythos 5, Mythos Preview, Opus 4.8, 4.7, 4.6, and Sonnet 4.6 — no `interleaved-thinking-2025-05-14` header.

| Mode | Sonnet 4.6 | Opus 4.6 |
|------|------------|----------|
| Adaptive | Interleaved automatic | Interleaved automatic |
| Manual | Interleaved via beta header | **No** interleaved — use adaptive for agent loops |

Catalog 4.5 models still need the beta header for interleaved manual mode — [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).

---

## Streaming

Adaptive thinking streams via `thinking_delta` events (same as manual). Use `client.messages.stream` or `ant messages create --stream`.

---

## Validation differences (adaptive)

- Assistant turns **need not** start with a thinking block (more flexible than manual mode).
- Tool-use rules from extended thinking still apply — preserve blocks on replay; see [ANTHROPIC_EXTENDED_THINKING.md § Tool use](./ANTHROPIC_EXTENDED_THINKING.md#tool-use--thinking-wall-bounce-relevant).

---

## Prompt caching

- Consecutive requests with **`adaptive`** preserve message cache breakpoints.
- Switching between `adaptive` and `enabled`/`disabled` **invalidates** message cache breakpoints (system prompt + tools stay cached).

---

## Prompt steering (tuning when to think)

**Reduce thinking** (system prompt example):

```text
Extended thinking adds latency and should only be used when it
will meaningfully improve answer quality — typically for problems
that require multi-step reasoning. When in doubt, respond directly.
```

**Encourage thinking:**

```text
This task involves multi-step reasoning. Think carefully before responding.
```

Per-turn user steering also works: `"Please think hard before responding."` / `"Answer directly without deliberating."`

**Warning:** Steering down can hurt quality on tasks that need reasoning — measure on your workload; try lower `effort` first.

---

## Cost control

- `max_tokens` = hard cap on **total** output (thinking + text).
- `effort` = soft guidance on thinking allocation.
- `stop_reason: "max_tokens"` → raise `max_tokens` or lower `effort`.
- Billing: full internal thinking tokens — read `usage.output_tokens_details.thinking_tokens` (displayed summary/omitted text ≠ billed amount).

---

## Display (`thinking.display`)

| Value | Default on | Effect |
|-------|------------|--------|
| `summarized` | Sonnet 4.6, 4.5 and earlier | Readable summary in `thinking` field |
| `omitted` | Fable 5, Mythos 5, Opus 4.8, 4.7, Mythos Preview | Empty `thinking` text; keeps `signature`; **faster first text token** |

On omitted-default models, opt in to summaries:

```json
"thinking": { "type": "adaptive", "display": "summarized" }
```

`display: "omitted"` saves **latency**, not cost. Return blocks unchanged on multi-turn replay.

If adaptive skips thinking on a simple request, **no** thinking block is emitted regardless of `display`.

---

## Fable 5 / Mythos 5 notes

- Raw chain-of-thought never returned; use `thinking` blocks (not `redacted_thinking`).
- `reasoning_extraction` refusal category if prompting model to dump internal reasoning into response text.
- On model switch after fallback, strip prior model's `thinking` blocks (except fallback-credit retry rules).

---

## Catalog migration checklist

When adding `claude-sonnet-4-6` / `claude-opus-4-8` rows:

1. Set `apiFeatures.extendedThinking.preferredMode` → `"adaptive"`.
2. Set `blockPreservation` → `"all_turns"` (4.6+ default).
3. Set `displayDefault` → `"omitted"` for Opus 4.8+; `"summarized"` for Sonnet 4.6 unless latency-sensitive.
4. Remove `interleavedBetaHeader` from presets (automatic with adaptive).
5. Map `InferenceProfile.cot` → `thinking: {type: "adaptive"}` + `effort`, not `budget_tokens`.
6. Add `guidanceTopics`: `adaptive-thinking`, `adaptive-thinking-effort`.

---

## Backlog

- **B-0** — Wire adaptive thinking + effort on API/CLI path when catalog upgrades.
- **F-10** — Inject `adaptive-thinking-migration` guidance when Sonnet/Opus 4.5 selected with 4.6+ peers in round.

---

## References

- [Adaptive thinking (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/adaptive-thinking)
- [Extended thinking (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking)
- [Effort parameter](https://platform.claude.com/docs/en/docs/build-with-claude/effort)
- [Extended thinking integration (this fork)](./ANTHROPIC_EXTENDED_THINKING.md)
