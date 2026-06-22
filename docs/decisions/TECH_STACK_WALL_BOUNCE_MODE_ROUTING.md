# TS-25: Wall-Bounce Execution Mode Routing

**Status:** Accepted (direction) — 2026-06-22  
**Supersedes:** Implicit “always multi-round on entry” reading of constitution for API path  
**Related:** [WALL_BOUNCE_AS_IS.md](../WALL_BOUNCE_AS_IS.md) · [WALL_BOUNCE_TO_BE.md](../WALL_BOUNCE_TO_BE.md) · [TECH_STACK_MEMORY_SUBSTRATE.md](./TECH_STACK_MEMORY_SUBSTRATE.md) (TS-22) · [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) (TS-24) · [WALL_BOUNCE_P5_ARCHITECTURE.md](./WALL_BOUNCE_P5_ARCHITECTURE.md)

---

## Context

The constitution requires **2–5 wall-bounce rounds**, **2+ providers**, and **quality thresholds** (confidence ≥ 0.7, consensus ≥ 0.6). AS-IS code runs **one parallel or sequential chain + aggregation** per request with **no threshold branch** and **no round loop** ([WALL_BOUNCE_AS_IS.md](../WALL_BOUNCE_AS_IS.md)).

Product direction (owner, 2026-06-22):

- Do **not** score query difficulty on first turn (too heavy).
- **Default:** parallel peers → aggregate → **auto-enter wall-bounce mode** only if below threshold.
- **Overrides:** prompt keywords and MCP/config for forced wall-bounce, parallel-only, or serial chain.
- **Serial mode:** no consensus gate.
- **Observability:** stream process (SSE + Layer A).
- **Objections:** user challenges aggregator; system re-queries and offers choices.

---

## Decision

### 1. Execution mode enum

```typescript
type ExecutionMode =
  | 'parallel-then-maybe-wall-bounce'  // DEFAULT
  | 'wall-bounce'                      // forced multi-round (2–5)
  | 'parallel-only'                    // no auto branch
  | 'serial';                          // sequential chain, no consensus gate
```

**Resolution order:**

1. Explicit API / request flag  
2. MCP or fork config default  
3. `PromptAnalyzer` keyword match (ja/en table in config)  
4. Fallback: **`parallel-then-maybe-wall-bounce`**

### 2. Default path (`parallel-then-maybe-wall-bounce`)

| Phase | Behavior |
|-------|----------|
| **A — Parallel peers** | ≥2 providers via adapters; same prompt |
| **B — Aggregate** | Aggregator synthesis + `confidence` + `consensus` metrics |
| **C — Threshold** | Compare to user/config mins (defaults 0.7 / 0.6) |
| **D — Branch** | If below → enter **wall-bounce mode** (2–5 rounds); else return |

Phase A–B is **not** a constitution “round” — it is the **fast path**. Constitution rounds apply in Phase D (and forced `wall-bounce` mode).

### 3. Forced wall-bounce mode

Skips or shortens Phase A–B when user signals immediate deep analysis:

- Keywords: 「壁打ちで」「壁打ちモード」 (configurable list)
- Config: `execution.defaultMode: wall-bounce`
- API: `mode=wall-bounce`

Runs **minimum 2, maximum 5** constitution rounds before final return (unless hard gate escalates).

### 4. Serial mode

- Keywords: 「シリアルで」「直列で」; API: `mode=serial`
- Peers execute in chain (depth 3–5)
- **No consensus threshold enforcement** — metrics informational
- Aggregator still produces final answer

### 5. Threshold configuration

```json
{
  "thresholds": {
    "confidenceMin": 0.7,
    "consensusMin": 0.6
  }
}
```

Sources (merge): constitution defaults ← fork config ← MCP env ← per-request API override.

### 6. Observability

- HTTP: extend SSE event set ([TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md))
- Every phase appends to **Layer A** `OrchestrationSession` (mandatory for branch + objection)

### 7. Objection flow (coordination with TS-24)

Post-answer user objection triggers:

1. Focused re-query to peers on disputed claims  
2. Aggregator summary of objection handling  
3. **User choice menu** (accept revision, another round, parallel re-run, tier escalate, keep prior)

TS-24 `retryOnNegative` applies to **implicit** negative feedback; TS-25 adds **explicit objection** with structured options.

---

## Consequences

### Positive

- Aligns constitution with **cost-aware** default (parallel-first).
- Clear override story for power users (keywords + MCP).
- Unblocks Gate B tasks (B-4, B-5) with testable spec.

### Negative / risks

- Two-phase mental model — docs must distinguish “fast parallel phase” vs “wall-bounce rounds”.
- Keyword false positives — `PromptAnalyzer` must strip keywords from LLM prompts.
- MCP Track A remains single-shot unless separate API invoke is added.

### Forbidden

- Silent single-LLM bypass on strict analysis path  
- Returning sub-threshold final answer **without** branch when mode is default (after Gate C-1)  
- Codex-only Redis as session source of truth (TS-22)

---

## Implementation phases

| Phase | Deliverable | Track |
|-------|-------------|-------|
| **1** | Mode enum + config schema + keyword table | B-4 |
| **2** | Threshold branch in `wall-bounce-analyzer.ts` | B-4 |
| **3** | Layer A events for phases A–D | M1–M3 |
| **4** | SSE event extensions | B-5 |
| **5** | Round loop 2–5 enforce | C-4 |
| **6** | Hard gate before return | C-1 |
| **7** | Objection API + user choice | C-7 |
| **8** | Orchestrator merge | C-5 |

---

## Compliance matrix (target)

| Constitution rule | TS-25 interpretation |
|-------------------|----------------------|
| 2–5 rounds | In wall-bounce mode (branch or forced) |
| 2+ providers | Parallel phase + all rounds |
| confidence / consensus | Gate after aggregate; configurable mins |
| `wall-bounce-analyzer.ts` only | All modes in one canonical class after C-5 |
| Japanese output | Unchanged — user-facing templates |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-22 | v1.0 — Accepted direction from code audit + owner To-Be |
