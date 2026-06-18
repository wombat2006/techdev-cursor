# OpenAI Prompt Guidance Integration

**Status**: Catalog + schema documented — runtime wiring pending (Track F-10 / F-12)  
**Source hub**: [Prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance) (model content-switcher)  
**Pricing**: [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)  
**Last reviewed**: 2026-06-18  
**Related**: [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [config/llm-model-catalog.json](../config/llm-model-catalog.json)

---

## Platform page structure

One URL hosts **multiple model-specific guides** via a content switcher (`?model=` query or segmented control):

| `platformGuideModel` | Per-model MD (sync target) |
|----------------------|----------------------------|
| `gpt-5.5` | [prompt-guidance/gpt-5.5.md](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.5.md) |
| `gpt-5.4` | [prompt-guidance/gpt-5.4.md](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.4.md) |
| `gpt-5.3-codex` | [prompt-guidance/gpt-5.3-codex.md](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.3-codex.md) |

Fetch **per-model `.md`**, not the default HTML (which SSRs GPT-5.5 first). Template: `data-page-copy-url-template="/api/docs/guides/prompt-guidance/:value.md"`.

Catalog fields: `prompting.platformGuideUrl`, `prompting.platformGuideModel`, `prompting.guidanceTopics[]`, `promptGuidanceIndex`.

---

## Per-model summary

### GPT-5.5 (flagship — outcome-first)

- **Approach**: `outcome_first` — shorter prompts, define success criteria, stop rules.
- **Use preambles** for streaming / tool-heavy workflows.
- **Do not** carry legacy process-heavy step stacks from GPT-5.4 era.
- **Effort**: re-evaluate `low` / `medium` before escalating.
- **Catalog**: `gpt-5.5`, `gpt-5.5-pro` · **Pricing (standard / 1M tok)**: input $5 · cached $0.5 · output $30 (pro: $30 / $180).

### GPT-5.4 family (cost-efficient — output contracts)

Applies to **`gpt-5.4`**, **`gpt-5.4-mini`**, **`gpt-5.4-nano`**, **`gpt-5.4-pro`**.

- **Approach**: `balanced` — explicit **output contracts**, follow-through policy, instruction priority.
- **Strengths**: long-running tasks, tool persistence, evidence synthesis, structured outputs.
- **Explicit prompting helps**: missing-context gating, research citations, irreversible-action checks.
- **`assistantPhase`**: preserve on replay (early-stop bugs if dropped).
- **Downgrade path**: use when eval passes at lower cost vs GPT-5.5.

| Model | Tier role | Standard pricing (input / cached / output per 1M) |
|-------|-----------|---------------------------------------------------|
| gpt-5.4 | Balanced agent / analyze | $2.5 / $0.25 / $15 |
| gpt-5.4-mini | High-volume chat + tools | $0.75 / $0.075 / $4.5 |
| gpt-5.4-nano | Extraction / simple QPS | $0.2 / $0.02 / $1.25 |
| gpt-5.4-pro | Hard synthesis (below 5.5 Pro) | $30 / — / $180 |

**GPT-5.4 core patterns** (from platform guide):

```xml
<output_contract>
- Return exactly the sections requested, in the requested order.
- Apply length limits only to the section they are intended for.
</output_contract>

<missing_context_gating>
- If required context is missing, do NOT guess.
- Prefer lookup tools when retrievable; minimal clarifying question only when not.
</missing_context_gating>
```

Also supports: `<default_follow_through_policy>`, `<instruction_priority>`, mid-conversation `<task_update>` blocks.

### GPT-5.3 Codex (agentic coding — minimal, no upfront preamble)

- **Approach**: `minimal` — Codex starter prompt (autonomy, batch reads, apply_patch).
- **Critical**: **Remove** upfront plan / preamble instructions (opposite of GPT-5.5).
- **`phase` required** on Responses API assistant-item replay — performance degrades if dropped.
- **Reasoning effort default**: `medium` (interactive); `high` / `xhigh` for hardest tasks.
- **Compaction**: first-class for multi-hour sessions.
- **Billing**: Codex CLI subscription primary; API path via `gpt-5.3-codex`.
- **Catalog**: `gpt-5.3-codex` replaces legacy `gpt-5-codex` (AS-IS adapter still on legacy id).

---

## Guidance topics → catalog mapping

| Topic slug | Primary models |
|------------|----------------|
| `outcome-first-stopping` | gpt-5.5 |
| `preamble-streaming` | gpt-5.5 ( **not** gpt-5.3-codex ) |
| `output-contract` | gpt-5.4 family |
| `follow-through-policy` | gpt-5.4, gpt-5.4-pro |
| `missing-context-gating` | gpt-5.4, gpt-5.4-mini |
| `assistant-phase` | gpt-5.5, gpt-5.4 family |
| `phase-required` | gpt-5.3-codex |
| `avoid-upfront-preamble` | gpt-5.3-codex |
| `codex-autonomy` | gpt-5.3-codex |
| `compaction-guidance` | gpt-5.3-codex, gpt-5.4-mini/nano |

Full reverse index: `promptGuidanceIndex` in catalog JSON.

---

## Pricing in catalog (`apiPricing`)

Machine-readable **USD per 1M tokens** for cost-aware routing (not live billing):

```json
"apiPricing": {
  "currency": "USD",
  "unit": "per_1m_tokens",
  "lastReviewed": "2026-06-18",
  "pricingUrl": "https://developers.openai.com/api/docs/pricing",
  "standard": { "inputUsd": 0.75, "cachedInputUsd": 0.075, "outputUsd": 4.5 },
  "batch": { "inputUsd": 0.375, "cachedInputUsd": 0.0375, "outputUsd": 2.25 },
  "flex": { "..." : "..." },
  "priority": { "..." : "..." }
}
```

Tiers: **standard**, **batch**, **flex**, **priority** (not all models have all tiers). Context pricing note: `<272K context length` on flagship rows.

**Do not** embed full pricing tables in logic docs — sync from platform pricing page (F-11).

---

## Implementation considerations (To-Be)

### 1. Cost-aware model selection (Track F-12)

```text
TaskRouter + InferenceProfile
  → load catalog candidates by role + required capabilities
  → filter by quality floor (reasoning tier, tool flags)
  → rank by apiPricing.standard estimated cost (input+output heuristic)
  → pick highest tier that fits budget / preset
```

Example downgrade ladder for `llm_analyze`:

`gpt-5.5` → `gpt-5.4` → `gpt-5.4-mini` → `gpt-5.4-nano`

For `llm_codegen` (Codex path):

`gpt-5.3-codex` (CLI) — not interchangeable with GPT-5.5 Responses prompts.

### 2. Prompt template builder (Track F-10)

| Input | Output |
|-------|--------|
| `catalog.models[].prompting` | System prompt blocks per model family |
| `InferenceProfile.preset` | reasoning.effort + text.verbosity |
| Task kind | Include/exclude topic blocks (e.g. skip preamble for Codex) |

**Never** merge GPT-5.5 and Codex guidance into one prompt — preamble rules conflict.

### 3. Adapter / CLI migration (Track E)

| AS-IS | To-Be |
|-------|-------|
| `codex exec --model gpt-5-codex` | `--model gpt-5.3-codex` |
| Generic system prompt | Load from catalog `guidanceTopics` + vendor MD mirror |
| No phase on replay | Preserve `assistantPhase` in Responses client |

### 4. Sync job (Track F-11)

```text
FOR model IN catalog.openai[].prompting.platformGuideModel:
  FETCH https://developers.openai.com/api/docs/guides/prompt-guidance/{model}.md
  WRITE docs/vendor/openai/prompt-guidance-{model}.md
  DIFF → update lastReviewed + alert on new H2 sections
```

### 5. Eval gates before downgrade

When routing to gpt-5.4-mini/nano instead of gpt-5.5:

- Tool use required? → exclude nano if `toolUse: false`
- Long workflow? → prefer mini+ with `compaction: true`
- Run wall-bounce sample on downgrade; revert if confidence/consensus drop

---

## References

- [Prompt guidance hub](https://developers.openai.com/api/docs/guides/prompt-guidance)
- [GPT-5.4 guide (.md)](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.4.md)
- [GPT-5.3 Codex guide (.md)](https://developers.openai.com/api/docs/guides/prompt-guidance/gpt-5.3-codex.md)
- [Pricing](https://developers.openai.com/api/docs/pricing)
- Cookbook: [codex-prompting-guide](https://cookbook.openai.com/examples/gpt-5/codex_prompting_guide)
