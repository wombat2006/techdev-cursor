# Tech Stack Decision: Session Continuation and Negative-Feedback Retry

**Document type**: Architecture Decision Record (ADR)  
**ID**: TS-24  
**Version**: 1.0  
**Date**: 2026-06-19  
**Status**: **Accepted (direction)** — Layer A store (M1) and orchestrator wiring pending

**Related:** [TECH_STACK_MEMORY_SUBSTRATE.md](./TECH_STACK_MEMORY_SUBSTRATE.md) (TS-22) · [TECH_STACK_INFERENCE_PROFILES.md](./TECH_STACK_INFERENCE_PROFILES.md) (TS-20) · [TECH_STACK_LLM_MODEL_CATALOG.md](./TECH_STACK_LLM_MODEL_CATALOG.md) (TS-21) · [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md)

---

## 1. Context

After the **Aggregator** presents a final answer, users must be able to:

1. **Continue the conversation** with a follow-up prompt on the same orchestration thread.
2. **Reject an answer** with clear negative feedback and trigger a **controlled retry** that explores alternative outputs without repeating the same failure mode.

Today:

- Wall-Bounce API and unified MCP `analyze_*` are largely **stateless** (`sessionId` ignored — TS-22 M2 pending).
- Legacy **`codex-session-manager`** + **`multi-llm-session-handler`** prototype turn-2+ flow exists but is **Codex-only** and not Layer A–authoritative.
- **InferenceProfile** presets define `temperature`, `effort`, and `cot` (TS-20) but there is no **retry policy** after user rejection.

**Product requirement:** Multi-turn UX with auditability; retries must stay within Wall-Bounce constitution (2+ peers, 2–5 rounds) and remain reproducible in Layer A.

---

## 2. Decision

### 2.1 Session continuation (Layer A)

1. Orchestrator **issues `sessionId`** on first request; every response returns the same id.
2. Follow-up requests **must** pass `sessionId`; orchestrator loads Layer A transcript and appends `user_prompt` before the next Wall-Bounce run.
3. Context injection uses Layer A events (`user_prompt`, `round_consensus`, `aggregator`) — not provider-only silos.
4. **`codex-session-manager`** remains legacy until B-M3; new code MUST NOT add parallel `*-session-manager` transcripts (TS-22).

```typescript
interface OrchestrationRequest {
  prompt: string;
  sessionId?: string;           // omit → create new session
  clientTimezone?: string;      // optional IANA, session-scoped (TS-22)
  profile?: InferencePreset;
  inference?: Partial<Record<string, InferenceProfile>>;
}
```

### 2.2 Negative feedback detection

**Phase 0 (explicit only):** Retry triggers when the client sends a structured signal — not implicit sentiment alone.

| Signal | Example |
|--------|---------|
| `user_feedback.sentiment === 'negative'` | UI thumbs-down, explicit 「違う」「もう一度」 |
| Optional `targetEventId` | Points at prior `aggregator` event |
| Optional `note` | User correction hint |

**Phase 1 (Track C, optional):** PromptAnalyzer may classify implicit negative follow-ups; explicit signal always wins.

### 2.3 Retry policy — **upward jitter** (chosen)

**Rejected options:**

| Option | Why rejected |
|--------|----------------|
| Fixed `temperature += Δ` | Same sampling path every retry; weak exploration |
| Random `temperature ± Δ` | Can **decrease** temperature when exploration is desired; non-deterministic direction |

**Chosen:** **Upward-only jitter** on supported knobs, with **clamp** and **audit trail**.

```typescript
interface RetryPolicy {
  /** Max automatic retries per user negative signal (default 1) */
  maxAutoRetries: number;
  temperature: {
    mode: 'upward_jitter';
    /** Add uniform random in [minDelta, maxDelta] to base temperature */
    minDelta: number;   // e.g. 0.05
    maxDelta: number;   // e.g. 0.25
    clampMin: number;   // e.g. 0.0
    clampMax: number;   // e.g. 1.0 — or model catalog cap when TS-21 exposes it
  };
  /** Alternative to continuous jitter: pick one preset from list */
  presetLottery?: InferencePreset[];  // e.g. ['deep', 'balanced'] — used when temperature unsupported
  /** Fallback when catalog marks temperature fixed (GPT-5 / reasoning) */
  fallback: {
    effortBump?: 'one_step';          // low→medium→high where supported
    cot?: 'brief' | 'full';
    injectPrompt: 'regenerate_alternate_angle';
  };
}
```

**Default (B-0 target in `config/inference-profiles.json`):**

```json
{
  "retryOnNegative": {
    "maxAutoRetries": 1,
    "temperature": {
      "mode": "upward_jitter",
      "minDelta": 0.05,
      "maxDelta": 0.25,
      "clampMin": 0.0,
      "clampMax": 1.0
    },
    "presetLottery": ["deep", "balanced"],
    "fallback": {
      "effortBump": "one_step",
      "cot": "brief",
      "injectPrompt": "regenerate_alternate_angle"
    }
  }
}
```

**Temperature semantics (correct direction):**

- **Lower** temperature → more deterministic, conservative outputs.
- **Higher** temperature → more diverse / creative sampling (where the provider supports it).
- Negative retry seeks **exploration** → jitter **increases** temperature only, never decreases.

**Per-peer independence:** Each peer provider MAY draw an independent jitter sample in the same retry round (logged separately) to preserve Wall-Bounce diversity.

### 2.4 Model-specific knob routing

| Provider class | Primary retry lever | Temperature jitter |
|----------------|--------------------|--------------------|
| Claude, agy (supported) | `upward_jitter` on `temperature` | ✅ |
| GPT-5 / Codex reasoning (fixed temp) | `fallback.effortBump` + `cot` + prompt inject | ❌ — use `presetLottery` or fallback |
| Aggregator (Tier 4) | Pinned `critical` preset; optional single upward jitter if supported | Profile-specific |

Adapters MUST log when a requested knob is **ignored** (catalog `inferenceKnobs` — TS-21 future field) and include `appliedProfile` vs `requestedProfile` in Layer A.

### 2.5 Layer A audit events (schema v1.2 target)

Add to [orchestration-session.ts](../../src/types/orchestration-session.ts) / [orchestration-session.schema.json](../../config/schemas/orchestration-session.schema.json):

```typescript
| (OrchestrationEventBase & {
    type: 'user_feedback';
    sentiment: 'negative' | 'positive' | 'neutral';
    targetEventId?: string;
    note?: string;
  })
| (OrchestrationEventBase & {
    type: 'profile_retry';
    reason: 'user_negative';
    baseProfile: InferenceProfile;
    appliedProfile: InferenceProfile;
    jitter?: { temperatureDelta?: number; seed: number };
    presetChosen?: InferencePreset;
    retryIndex: number;  // 1..maxAutoRetries
  })
```

**Reproducibility:** Store `jitter.seed` (PRNG seed used for upward draw) on every `profile_retry` so audits can replay the exact delta.

### 2.6 Constitution and cost guards

- Retries count as **new Wall-Bounce round(s)** within the 2–5 band — not a bypass.
- **`maxAutoRetries: 1`** by default; further attempts require explicit user confirmation.
- Retries MUST NOT drop below **2 peer providers**.
- Prompt inject for retry MUST include prior aggregator output + user `note` when present.

---

## 3. AS-IS → To-Be

| | AS-IS | To-Be |
|---|--------|--------|
| Post-aggregator continuation | Codex-only prototype | Layer A `sessionId` on API + MCP (M1–M2) |
| Negative → retry | None | TS-24 policy + Layer A events |
| Temperature on retry | N/A | Upward jitter (Claude/agy); fallback for GPT-5 |
| Audit | Partial Codex Redis | Full `user_feedback` + `profile_retry` + seed |

---

## 4. Implementation phases

| Phase | Scope | Track |
|-------|--------|-------|
| **0** | This ADR; `retryOnNegative` stub in B-0 `inference-profiles.json` | B-0 |
| **1** | `OrchestrationSessionStore`; `sessionId` on API/MCP; continuation reads transcript | M1–M2 |
| **2** | `user_feedback` + `profile_retry` events; upward jitter resolver in TaskRouter | B-0 + orchestrator |
| **3** | Catalog `inferenceKnobs.temperature: fixed \| supported`; adapter ignore logging | F + Contract Layer |
| **4** | PromptAnalyzer implicit negative (optional) | Track C |

---

## 5. Consequences

### Positive

- Natural multi-turn UX after Aggregator output without Codex-only bias.
- Retries explore solution space without fixed-repeat failures.
- Upward-only jitter aligns with “more creative alternate answer” intent.
- Full audit via seed + profile delta in Layer A.

### Trade-offs

- Slightly higher token cost on retry (expected; capped by `maxAutoRetries`).
- GPT-5 paths need fallback levers — temperature jitter alone is insufficient.
- Schema v1.2 event additions require M1 store before enforcement.

---

## 6. Related

- [TECH_STACK_MEMORY_SUBSTRATE.md](./TECH_STACK_MEMORY_SUBSTRATE.md) (TS-22 — Layer A)
- [TECH_STACK_INFERENCE_PROFILES.md](./TECH_STACK_INFERENCE_PROFILES.md) (TS-20 — presets)
- [CURSOR_MCP_TODO.md § Track B](../CURSOR_MCP_TODO.md#track-b--inferenceprofile-adapters-memory-substrate)
- [WALL_BOUNCE_SYSTEM.md § Memory](../WALL_BOUNCE_SYSTEM.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — Accepted: session continuation + upward-jitter negative retry |
