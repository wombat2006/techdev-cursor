# Tech Stack Decision: Memory Substrate (Orchestration Transcript + Provider Sessions + Long-Term)

**Document type**: Architecture Decision Record (ADR)  
**ID**: TS-22  
**Version**: 1.3  
**Date**: 2026-06-18  
**Status**: **Accepted** — G-MEM design sign-off **2026-06-18**; Redis store implementation starts Track B (M1)

---

## 1. Context

TechSapo coordinates **multiple LLM providers** (Wall-Bounce: 2–5 rounds, 2+ peers, consensus thresholds). Providers do not talk to each other directly; the **Orchestrator** fans out prompts, collects outputs, builds consensus, and injects prior context into subsequent rounds ([TS-17](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md)).

Without durable memory:

- Wall-Bounce rounds lose continuity (constitution 2–5 rounds become meaningless).
- Multi-turn user workflows cannot reference prior analysis.
- Cursor MCP `analyze_*` tools remain stateless one-shots — disconnected from orchestration.
- Cipher / RAG cannot be applied consistently (nothing to attach retrieval to).

**Product requirement:** Conversation history retention and reference is **mandatory** for production Wall-Bounce and multi-LLM workflows. Track B adapter wiring MUST NOT proceed without this decision accepted.

Related: [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md) · [MCP_SERVICES.md](../MCP_SERVICES.md) · [WALL_BOUNCE_P5_ARCHITECTURE.md](./WALL_BOUNCE_P5_ARCHITECTURE.md) (Cipher write policy)

---

## 1.1 AS-IS inventory (fragmented — not final design)

The repository does **not** implement a unified memory substrate today. Existing pieces are **historical increments**, not peer parity across providers.

| Module | Scope | Role today | Used by unified `analyze_*`? |
|--------|-------|------------|--------------------------------|
| [`session-manager.ts`](../../src/services/session-manager.ts) | App-generic | Redis user session + generic `conversationHistory` | No |
| [`codex-session-manager.ts`](../../src/services/codex-session-manager.ts) | **Codex only** | Legacy `codex` / `codex-reply` multi-turn; Redis messages | **No** |
| `claude-session-manager` | — | **Does not exist** | — |
| `agy-session-manager` | — | **Does not exist** | — |
| [`multi-llm-session-handler.ts`](../../src/services/multi-llm-session-handler.ts) | Misleading name | Uses **CodexSessionManager** as the only conversation store for Wall-Bounce turns | No |
| [`wall-bounce-analyzer.ts`](../../src/services/wall-bounce-analyzer.ts) | In-process | Round summaries (`accumulatedSummary`) only | N/A |
| [`inference-service.ts`](../../src/services/inference-service.ts) | In-memory | Up to 20 turns; not shared | No |
| Claude / agy CLIs | On-disk native | `~/.claude` (`--resume`), `~/.gemini/antigravity-cli/` (conversations) | Adapters do not persist handles |
| Cipher MCP | Long-term | `ask_cipher` retrieval | Manual; not wired to orchestration |
| A-1 [`analyze_*` adapters](../../src/adapters/) | None | Stateless one-shot (temporary) | Yes |

### Why only `codex-session-manager` exists

**Not intentional final architecture.** Legacy [Codex MCP](../../src/services/codex-mcp-server.ts) was the first path to need explicit **continue** semantics (`codex-reply` tool) and Redis-backed history ([CODEX_REDIS_SESSION_IMPLEMENTATION.md](../CODEX_REDIS_SESSION_IMPLEMENTATION.md)). Claude Code MCP and unified adapters were built as **spawn-per-request** without a TechSapo session wrapper. agy was never given a Redis layer.

**Do not interpret** “Codex has a session manager, others don't” as product policy. It is **technical debt** to be folded under Layer A (below).

---

## 2. Decision

Introduce a **Memory Substrate** with three layers. **Layer A is the single source of truth** for orchestration; Layers B and C are auxiliary.

```
┌─────────────────────────────────────────────────────────────┐
│ Layer C — Long-term knowledge (Cipher, RAG, fork dictionaries) │
│   retrieve before invoke; optional verified write (P5 policy)  │
└───────────────────────────────┬─────────────────────────────┘
                                │ context injection
┌───────────────────────────────▼─────────────────────────────┐
│ Layer A — OrchestrationSession (MANDATORY, append-only)         │
│   sessionId, events[], providerHandles{}, consensus per round     │
└───────────────────────────────┬─────────────────────────────┘
                                │ optional native CLI handles
┌───────────────────────────────▼─────────────────────────────┐
│ Layer B — Provider-native session (OPTIONAL, latency)          │
│   claude --resume | codex continue | agy conversation id       │
└─────────────────────────────────────────────────────────────┘
```

### 2.0 Anti-patterns (forbidden in Track B+)

| Anti-pattern | Why forbidden | Instead |
|--------------|---------------|---------|
| Add `claude-session-manager.ts` + `agy-session-manager.ts` as **parallel sources of truth** | Three silos; no cross-provider transcript | **One** `OrchestrationSessionStore` (Layer A) |
| Keep `codex-session-manager` as authoritative history for Wall-Bounce | Codex-only bias; breaks multi-LLM audit | Migrate Codex message list under Layer A; demote to Layer B adapter helper |
| Use Cursor Agent chat as system memory | Not durable; not multi-provider | Layer A events |
| Cipher write on every provider output without verification | Memory pollution (P5 B4) | Layer C verified-write policy |

**Allowed:** Provider-specific **thin helpers** (e.g. `CodexSessionAdapter`) that read/write **only** `OrchestrationSession.providerHandles.codex` and append Layer A events — not standalone history stores.

### 2.1 Layer A — OrchestrationSession (source of truth)

**Purpose:** Durable record of a workflow: user intent, every Wall-Bounce round, every peer provider request/response, aggregator output, consensus scores, and injected context for the next round.

**Rules:**

1. **Single issuer:** Orchestrator creates `sessionId`; clients pass it on subsequent calls.
2. **Append-only events** — no in-place mutation of historical provider outputs.
3. **All transports** (Wall-Bounce API, unified MCP `analyze_*`, legacy codex-mcp) **read/write Layer A** when `sessionId` is present.
4. **Multi-LLM transcript** includes cross-provider dialogue — not only user↔assistant dyad.

**Core document shape (direction):**

```typescript
interface OrchestrationSession {
  schemaVersion: '1.1';
  sessionId: string;
  conversationId?: string;
  createdAt: string;   // ISO 8601 UTC — session birth
  updatedAt: string;   // ISO 8601 UTC — last touch (append or continue-read)
  expiresAt: string;   // ISO 8601 UTC — min(createdAt + maxTtl, updatedAt + idleTtl) at write time
  clientTimezone?: string;  // IANA, e.g. Asia/Tokyo — display / audit context; NOT duplicated per event
  events: OrchestrationEvent[];
  providerHandles: { /* … */ };
  stats?: { eventCount: number; lastSeq: number; lastRound?: number };
  metadata?: Record<string, unknown>;
}
```

**Every event carries temporal + ordering metadata** (see §2.1.1–§2.1.2).

**Event envelope (required on all event types):**

```typescript
interface OrchestrationEventBase {
  eventId: string;     // UUID v4
  seq: number;         // monotonic 0..n within session
  ts: string;          // ISO 8601 UTC — interval **start** (or sole instant if no tsEnd)
  tsEnd?: string;      // ISO 8601 UTC — interval **end**; omit for point-in-time events
  durationMs?: number; // optional; SHOULD equal tsEnd−ts when both set (denormalized for queries)
}
```

**Event types:**

```typescript
type OrchestrationEvent =
  | (OrchestrationEventBase & { type: 'user_prompt'; content: string })  // ts only
  | (OrchestrationEventBase & { type: 'provider_invoke'; provider: …; profile: …; promptHash: string })  // ts = spawn start; in-flight
  | (OrchestrationEventBase & { type: 'provider_result'; invokeEventId: string; provider: string; content: string; success: boolean; latencyMs: number; tsEnd: string })  // ts = invoke start (denorm), tsEnd = completion
  | (OrchestrationEventBase & { type: 'round_consensus'; round: number; confidence: number; consensus: number; summary: string; tsEnd: string })  // ts = round fan-out start, tsEnd = consensus done
  | (OrchestrationEventBase & { type: 'aggregator'; model: string; content: string; tsEnd?: string })
  | (OrchestrationEventBase & { type: 'layer_c_retrieval'; source: 'cipher' | 'rag'; refIds: string[] })
  | (OrchestrationEventBase & { type: 'session_summarized'; reason: …; eventsBefore: number; summary: string });
```

### 2.1.1 Temporal metadata (mandatory)

| Field | Level | Required | Format | Purpose |
|-------|-------|----------|--------|---------|
| `createdAt` | Session | Yes | ISO 8601 UTC (`…Z`) | Session birth; **max TTL** anchor |
| `updatedAt` | Session | Yes | ISO 8601 UTC | Last activity; **idle TTL** anchor |
| `expiresAt` | Session | Yes | ISO 8601 UTC | Computed expiry at write |
| `clientTimezone` | Session | No | IANA (`Area/City`) | User-local display; **not** stored per event |
| `eventId` | Event | Yes | UUID v4 | Dedup, audit, cross-event links (`invokeEventId`) |
| `seq` | Event | Yes | int ≥ 0 | Canonical order |
| `ts` | Event | Yes | ISO 8601 UTC | Interval **start** or point instant |
| `tsEnd` | Event | Conditional | ISO 8601 UTC | Interval **end** — required on `provider_result`, `round_consensus` |
| `durationMs` | Event | No | int ≥ 0 | Denormalized span; SHOULD match `tsEnd − ts` |
| `invokeEventId` | `provider_result` | Yes | UUID v4 | Links result → `provider_invoke` (append-only pair) |
| `lastUsedAt` | `providerHandles.*` | Optional | ISO 8601 UTC | Layer B handle freshness |

**Rules:**

1. **All instants stored as UTC** (`…Z`). Single canonical timeline for ordering, TTL, and merge.
2. **`seq` assigned by `OrchestrationSessionStore`** — strictly +1 per append.
3. **Point events** (`user_prompt`, `layer_c_retrieval`, `session_summarized`): `ts` only; omit `tsEnd`.
4. **Provider span (split append-only):** `provider_invoke` sets `ts` = spawn start. `provider_result` sets `ts` = same start (denormalized), `tsEnd` = completion, `latencyMs`, `invokeEventId`. Do **not** PATCH invoke when result arrives.
5. **Round span:** `round_consensus` sets `ts` = round fan-out start, `tsEnd` = consensus computed, `durationMs` optional.
6. **Validation:** when `tsEnd` present, `tsEnd ≥ ts`; warn if `durationMs` disagrees with wall clock by >1s.
7. **Session `updatedAt` + idle TTL** refresh on append and continue-read.
8. **Event count does not expire sessions** — triggers `session_summarized` only (§2.4).

### 2.1.2 Timezone policy (UTC canonical; TZ session-scoped)

| Approach | Verdict |
|----------|---------|
| UTC only on every event | **Yes** — required |
| TZ offset duplicated on every event | **No** — redundant (~30–50 bytes × N events); drifts if user travels |
| IANA `clientTimezone` once per session | **Yes (optional)** — UI, logs (“user was in JST”), compliance context |
| Store local time + UTC per event | **No** — derive `UTC → local` via `clientTimezone` at display time |

**Not over-engineering:** `ts` + `tsEnd` on span events is ~50 bytes and avoids walking the event graph for latency dashboards. **Is over-engineering:** per-event TZ, or mutating `provider_invoke` to add `tsEnd` in place (breaks append-only).

**Display:** `formatEventLocal(event.ts, session.clientTimezone)` in UI layer — not in Redis payload per event.

**Why `ts` is not optional:** (unchanged) audit, replay, compaction safety.

**Schema artifacts:** [orchestration-session.schema.json](../../config/schemas/orchestration-session.schema.json) (v1.1) · [orchestration-memory.json](../../config/orchestration-memory.json) · [orchestration-session.ts](../../src/types/orchestration-session.ts)

**Storage (direction):**

- **Primary:** Redis — key prefix `orch:session:{sessionId}` (new; distinct from legacy `codex:session:*`).
- **Reuse:** Generic [`session-manager.ts`](../../src/services/session-manager.ts) patterns where applicable; do **not** conflate app user session with orchestration session.
- **Archive:** MySQL / object storage before TTL delete (future).
- **TTL policy:** See §2.4 (idle + max; not event-count expiry).

**Service (Track B):** `OrchestrationSessionStore` in `src/services/` (name fixed at implementation).

### 2.4 Retention and TTL policy (design defaults)

**Formula:** `expiresAt = min(createdAt + maxTtl, updatedAt + idleTtl)` — recomputed on every touch.

| Parameter | Layer | Default | Role |
|-----------|-------|---------|------|
| `idleTtlSeconds` | **A** | **604800** (7 days) | Sliding — absorbs sleep, weekends, “continue tomorrow” |
| `maxTtlSeconds` | **A** | **2592000** (30 days) | Absolute cap — abandoned sessions |
| `touchOnRead` | **A** | `true` | Continue with `sessionId` refreshes idle TTL |
| `maxEventsBeforeSummarize` | **A** | **500** | Triggers `session_summarized` — **not** expiry |
| `maxBytesBeforeSummarize` | **A** | **2097152** (2 MiB) | Same |
| — | **B** | inherits **A** | `providerHandles` live inside session document |
| — | **C** | external | Cipher/RAG own retention; `layer_c_retrieval` events use event `ts` |

Config file: [config/orchestration-memory.json](../../config/orchestration-memory.json). Legacy `codex:session:*` keeps **1h** until B-M5 migration.

**Event count vs time:** Time drives expiry; event count drives **summarization** only. This avoids punishing long pauses while bounding Redis size.

### 2.2 Layer B — Provider-native session (optional optimization)

**Purpose:** Reduce CLI spawn overhead; hold provider CLI resume tokens **under** Layer A `providerHandles`.

| Provider | Native mechanism | TechSapo AS-IS | To-Be |
|----------|------------------|----------------|-------|
| **claude** | `--resume <id>` / `--continue` + `--print` | CLI disk only; adapter ignores | Store `resumeId` in `providerHandles.claude`; opt-in `continueProviderSession` |
| **codex** | `codex-reply` / session continue | `codex-session-manager` Redis | **Fold into** Layer A; helper wraps legacy manager during migration |
| **agy** | Antigravity conversation id; `cwd` | `workingDirectory` on spawn only | Store `conversationId` + `lastCwd` in `providerHandles.agy` |

**Rules:**

1. Layer B handles are **children of** `sessionId` — never authoritative without Layer A events.
2. Unrelated MCP tasks MUST NOT share a provider handle unless same `sessionId`.
3. Reuse is **opt-in** per invoke (`continueProviderSession: true`).

**Parity rule:** All three peers **may** have Layer B handles; absence of `claude-session-manager.ts` / `agy-session-manager.ts` today is **not** a goal state — but new code MUST NOT duplicate Codex's silo pattern. Use `providerHandles` + thin adapters.

### 2.3 Layer C — Long-term knowledge (Cipher, RAG)

**Purpose:** Cross-session retrieval — runbooks, precedents, domain dictionaries, verified episodic memory.

**Rules:**

1. Cipher `ask_cipher` — **retrieve before invoke**; inject into `context` / Layer A preamble.
2. Cipher **writes** — P5 verified-write policy only.
3. RAG chunk refs may be recorded as `layer_c_retrieval` events in Layer A.

---

## 3. Migration: `codex-session-manager` → Layer A

| Phase | Action |
|-------|--------|
| **B-M1** | Introduce `OrchestrationSessionStore`; new sessions use `orch:session:*` only |
| **B-M2** | On Codex invoke with `sessionId`, append Layer A events; copy `providerHandles.codex` from CLI response |
| **B-M3** | `multi-llm-session-handler` reads/writes Layer A — stop using CodexSessionManager as global conversation store |
| **B-M4** | Legacy `codex-mcp` / `/api/codex/*` routes delegate to Layer A (deprecate duplicate history) |
| **B-M5** | Retire or shrink `codex-session-manager` to thin Layer B helper (no standalone transcript) |

Until B-M3, treat `codex-session-manager` as **legacy Layer B prototype**, not orchestration memory.

---

## 4. API contract (direction — implement Track B)

### 4.1 Shared identifiers

| ID | Issued by | Used by |
|----|-----------|---------|
| `sessionId` | Orchestrator | Wall-Bounce API, MCP `analyze_*`, audit |
| `conversationId` | Optional client alias | Maps 1:1 to `sessionId` |
| `providerHandles.*` | Updated by adapters after each invoke | Layer B only |

### 4.2 MCP `analyze_*` (extends A-2)

```typescript
interface AnalyzeToolInput {
  prompt: string;
  context?: string;
  sessionId?: string;
  continueProviderSession?: boolean;
  // … InferenceProfile fields
}

interface AdapterRequest {
  prompt: string;
  context?: string;
  profile: InferenceProfile;
  workingDirectory?: string;
  sessionId?: string;              // Layer A attach
  continueProviderSession?: boolean;
}
```

**AS-IS (A-1):** `sessionId` ignored — smoke only.

### 4.3 Wall-Bounce API (To-Be)

Request may include `sessionId`; response returns `sessionId`. Each round appends Layer A events before SSE complete.

---

## 5. AS-IS vs To-Be (summary)

| Area | AS-IS | To-Be (Track B+) |
|------|-------|------------------|
| Orchestration memory | Fragmented; Codex-only Redis silo | **Layer A** `OrchestrationSessionStore` |
| Provider session parity | Codex manager only; Claude/agy CLI-native only | **Layer B** `providerHandles` for all peers |
| `analyze_*` MCP | Stateless | `sessionId` + Layer A append |
| `multi-llm-session-handler` | CodexSessionManager as store | Layer A |
| Cipher / RAG | External, manual | Layer C + `layer_c_retrieval` events |
| Response cache (Track D) | None | Hash Layer A reads; not a transcript |

---

## 6. Consequences

### Positive

- Multi-LLM workflows auditable and continuable.
- Stable `sessionId` contract for Track B adapters.
- Codex legacy investment migrates instead of diverging further.

### Negative / trade-offs

- Migration touches legacy codex-mcp and multi-llm paths.
- Storage growth — summarization / archival required.
- Layer B reuse risks context bleed — strict `sessionId` scoping.

### Forbidden

- Layer B or C **without** Layer A on production Wall-Bounce paths.
- Three independent `*-session-manager.ts` files as parallel transcripts.
- Cursor chat as system of record.

---

## 7. Implementation tracks (mapping)

| Track | Memory work |
|-------|-------------|
| **Gate A→B** | **G-MEM:** closed 2026-06-18; TS-22 accepted; Layer A mandatory; no new provider silos |
| **M1** | `OrchestrationSessionStore` + `orch:session:*` + schema v1.0 ([types](../../src/types/orchestration-session.ts), [schema](../../config/schemas/orchestration-session.schema.json)) |
| **M2** | `sessionId` on `AdapterRequest` + MCP schema |
| **M3** | Wall-Bounce rounds append Layer A events; continuation + negative retry events ([TS-24](./TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md)) |
| **M4–M5** | `codex-session-manager` migration (§3) |
| **M6** | Claude / agy `providerHandles` + opt-in continue |
| **Track D** | Response cache on Layer A read path |
| **Track C / P5** | Cipher verified write; PromptAnalyzer session context |

Runbook detail: [CURSOR_MCP_TODO.md § Memory substrate](../CURSOR_MCP_TODO.md#memory-substrate-gate-prerequisite-for-track-b).

---

## 8. Related documents

| Document | Relationship |
|----------|--------------|
| [TS-17 LLM Provider Transport](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) | Inter-round text from Layer A |
| [TS-20 Inference Profiles](./TECH_STACK_INFERENCE_PROFILES.md) | Profile on `provider_invoke` events |
| [TS-24 Session continuation + retry](./TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) | `user_feedback`, `profile_retry`; upward jitter policy |
| [CODEX_REDIS_SESSION_IMPLEMENTATION.md](../CODEX_REDIS_SESSION_IMPLEMENTATION.md) | **Legacy** — superseded by Layer A for transcript |
| [MCP_SERVICES.md § Session](../MCP_SERVICES.md#session-management) | AS-IS vs To-Be summary |

---

## 9. Status log

| Date | Change |
|------|--------|
| 2026-06-18 | v1.0 — TS-22 accepted (direction); Gate A→B prerequisite |
| 2026-06-18 | v1.1 — AS-IS inventory; codex-only legacy clarified; anti-patterns; `providerHandles`; codex migration phases; no parallel claude/agy session managers |
| 2026-06-18 | v1.2 — Mandatory event `ts` / `eventId` / `seq`; session `expiresAt`; idle 7d / max 30d TTL; JSON Schema + config defaults |
| 2026-06-18 | v1.3 — `ts`+`tsEnd` span model; `invokeEventId`; session `clientTimezone` (IANA); UTC-only per event |
| 2026-06-18 | **G-MEM closed** — design sign-off; M1 Redis store deferred to Track B |
