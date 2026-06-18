# Tech Stack Decision: Memory Substrate (Orchestration Transcript + Provider Sessions + Long-Term)

**Document type**: Architecture Decision Record (ADR)  
**ID**: TS-22  
**Version**: 1.0  
**Date**: 2026-06-18  
**Status**: **Accepted (direction)** — documentation and Gate A→B prerequisite; implementation starts Track B

---

## 1. Context

TechSapo coordinates **multiple LLM providers** (Wall-Bounce: 2–5 rounds, 2+ peers, consensus thresholds). Providers do not talk to each other directly; the **Orchestrator** fans out prompts, collects outputs, builds consensus, and injects prior context into subsequent rounds ([TS-17](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md)).

Without durable memory:

- Wall-Bounce rounds lose continuity (constitution 2–5 rounds become meaningless).
- Multi-turn user workflows cannot reference prior analysis.
- Cursor MCP `analyze_*` tools remain stateless one-shots — disconnected from orchestration.
- Cipher / RAG cannot be applied consistently (nothing to attach retrieval to).

**AS-IS fragments (not a unified substrate):**

| Component | What it stores | Gap |
|-----------|----------------|-----|
| `codex-session-manager.ts` + Redis | Codex-only session messages | Not orchestration transcript; not used by unified adapters |
| `multi-llm-session-handler.ts` | Conversation history → Wall-Bounce prompt | Not wired to `techsapo-providers` MCP |
| `wall-bounce-analyzer.ts` | Round summaries (`accumulatedSummary`) in-process | No durable append-only log of all provider I/O |
| `inference-service.ts` | In-memory history (20 turns) | Not shared across services |
| Cipher MCP | Long-term episodic knowledge | Retrieval layer — **not** a transcript store |
| A-1 `analyze_*` adapters | Nothing | Stateless by design (temporary) |

**Product requirement:** Conversation history retention and reference is **mandatory** for production Wall-Bounce and multi-LLM workflows. Track B adapter wiring MUST NOT proceed without this decision accepted.

Related: [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md) · [MCP_SERVICES.md](../MCP_SERVICES.md) · [WALL_BOUNCE_P5_ARCHITECTURE.md](./WALL_BOUNCE_P5_ARCHITECTURE.md) (Cipher write policy)

---

## 2. Decision

Introduce a **Memory Substrate** with three layers. **Layer A is the source of truth** for orchestration; Layers B and C are auxiliary.

```
┌─────────────────────────────────────────────────────────────┐
│ Layer C — Long-term knowledge (Cipher, RAG, fork dictionaries) │
│   retrieve before invoke; optional verified write (P5 policy)  │
└───────────────────────────────┬─────────────────────────────┘
                                │ context injection
┌───────────────────────────────▼─────────────────────────────┐
│ Layer A — OrchestrationSession (MANDATORY, append-only)         │
│   sessionId, rounds, per-provider I/O, consensus, metadata      │
└───────────────────────────────┬─────────────────────────────┘
                                │ optional per-provider handle
┌───────────────────────────────▼─────────────────────────────┐
│ Layer B — Provider session (OPTIONAL, latency + local continuity)│
│   Claude --resume, codex-reply, agy conversation id           │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Layer A — OrchestrationSession (source of truth)

**Purpose:** Durable record of a workflow: user intent, every Wall-Bounce round, every peer provider request/response, aggregator output, consensus scores, and injected context for the next round.

**Rules:**

1. **Single issuer:** Orchestrator (Wall-Bounce API or future session service) creates `sessionId`; clients pass it on subsequent calls.
2. **Append-only events** — no in-place mutation of historical provider outputs.
3. **All transports** (Wall-Bounce API, unified MCP `analyze_*`, legacy codex-mcp) **read/write through Layer A** when `sessionId` is present — not private silos.
4. **Multi-LLM transcript** includes cross-provider dialogue (what Gemini said, what Codex said, consensus) — not only user↔assistant dyad.

**Proposed event types (implementation Track B+):**

```typescript
type OrchestrationEvent =
  | { type: 'user_prompt'; content: string; ts: string }
  | { type: 'provider_invoke'; provider: 'claude' | 'codex' | 'agy'; profile: InferenceProfile; promptHash: string; ts: string }
  | { type: 'provider_result'; provider: string; content: string; success: boolean; latencyMs: number; ts: string }
  | { type: 'round_consensus'; round: number; confidence: number; consensus: number; summary: string; ts: string }
  | { type: 'aggregator'; model: string; content: string; ts: string };
```

**Storage (direction):** Redis first (align with existing `codex-session-manager`, `session-manager`); audit/archive to MySQL or object storage later. TTL default **24h active**, configurable; archive before delete.

### 2.2 Layer B — Provider session (optional optimization)

**Purpose:** Reduce CLI spawn overhead and preserve provider-native conversation state within one orchestration session.

| Provider | Native mechanism | Scope |
|----------|------------------|-------|
| Claude | `--resume <id>` / `--continue` with `--print` | Same provider, same model/cwd policy |
| Codex | `codex-reply` / session continue (legacy pattern) | Same sandbox/model |
| agy | conversation id / stdin `--print` | Same cwd policy; smoke may use `/tmp` |

**Rules:**

1. Layer B handles are **children of** `sessionId` — stored in Layer A metadata, not a second source of truth.
2. Unrelated MCP tasks MUST NOT share a provider session unless explicitly continuing the same `sessionId`.
3. Provider session reuse is **opt-in** per invoke (`continue: true` or explicit `providerSessionId`).

**Does not replace Layer A:** Even with warm CLI sessions, every provider I/O is logged to Layer A.

### 2.3 Layer C — Long-term knowledge (Cipher, RAG)

**Purpose:** Cross-session retrieval — runbooks, precedents, domain dictionaries, verified episodic memory.

**Rules:**

1. Cipher `ask_cipher` is **retrieval before invoke** — inject into `context` / Layer A preamble; not a substitute for Layer A transcript.
2. Cipher **writes** follow P5 verified-write policy ([WALL_BOUNCE_P5_ARCHITECTURE.md](./WALL_BOUNCE_P5_ARCHITECTURE.md)) — no unverified auto-write from raw provider output.
3. RAG / Google Drive connectors supply static or semi-static corpora; orchestration events may **reference** chunk IDs in Layer A.

---

## 3. API contract (direction — implement Track B)

### 3.1 Shared identifiers

| ID | Issued by | Used by |
|----|-----------|---------|
| `sessionId` | Orchestrator | Wall-Bounce API, MCP `analyze_*`, audit |
| `conversationId` | Optional alias / external client ref | Maps 1:1 to `sessionId` |
| `providerSessionId` | Provider CLI | Layer B only; scoped under `sessionId` |

### 3.2 MCP `analyze_*` (To-Be — extends A-2)

Current `inputSchema` has `context` and `workingDirectory` but **no durable session**. Track B adds:

```typescript
interface AnalyzeToolInput {
  prompt: string;
  context?: string;
  sessionId?: string;           // attach to OrchestrationSession
  continueProviderSession?: boolean;  // Layer B opt-in
  // … existing InferenceProfile fields
}
```

**AS-IS (A-1):** `sessionId` ignored — stateless smoke only. Documented exception until B-2.

### 3.3 Wall-Bounce API (To-Be)

Request may include `sessionId`; response returns `sessionId` (new or echoed). Each round appends Layer A events before returning SSE complete.

---

## 4. AS-IS vs To-Be

| Area | AS-IS | To-Be (Track B+) |
|------|-------|------------------|
| `analyze_*` MCP | Stateless one-shot | Optional `sessionId`; logs to Layer A |
| Wall-Bounce rounds | In-process summary injection | Layer A transcript + summary |
| Codex legacy MCP | Redis session only | Migrated under Layer A |
| Cipher | External MCP, manual | Retrieve hook in orchestrator pre-invoke |
| Response cache (Track D) | Not implemented | Layer on top of Layer A read path |

---

## 5. Consequences

### Positive

- Multi-LLM workflows remain auditable and continuable.
- Track B adapter wiring has a stable contract (`sessionId` on `AdapterRequest`).
- Cipher/RAG roles are bounded — less "memory pollution" risk.

### Negative / trade-offs

- Storage growth — require summarization/archival policy per session.
- Latency: Layer A writes add I/O; mitigate with async append + Redis.
- Provider session reuse risks context bleed — strict scoping under `sessionId`.

### Forbidden

- Using **only** Layer B or Layer C without Layer A for production Wall-Bounce paths.
- Treating Cursor Agent chat history as the system transcript.
- Single-round Wall-Bounce to "save memory" (constitution violation).

---

## 6. Implementation tracks (mapping)

| Track | Memory work |
|-------|-------------|
| **Gate A→B** | **G-MEM:** This ADR accepted; team agrees Layer A is mandatory |
| **B-0 / B-1** | Extend `AdapterRequest` + types; stub `OrchestrationSessionStore` interface |
| **B-2** | Wall-Bounce round logging to Layer A; MCP `sessionId` pass-through |
| **B-3** | File-backed InferenceProfile + session-aware prompt build |
| **Track D** | Response cache reads Layer A hash; does not replace transcript |
| **Track C / P5** | Cipher verified write; morphological + PromptAnalyzer use session context |

---

## 7. Related documents

| Document | Relationship |
|----------|--------------|
| [TS-17 LLM Provider Transport](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) | Inter-round = text in prompts from Layer A |
| [TS-20 Inference Profiles](./TECH_STACK_INFERENCE_PROFILES.md) | Profile stored per `provider_invoke` event |
| [CURSOR_MCP_TODO.md § Memory substrate](../CURSOR_MCP_TODO.md#memory-substrate-gate-prerequisite-for-track-b) | Runbook steps |
| [CODEX_REDIS_SESSION_IMPLEMENTATION.md](../CODEX_REDIS_SESSION_IMPLEMENTATION.md) | Legacy Layer B reference |

---

## 8. Status log

| Date | Change |
|------|--------|
| 2026-06-18 | TS-22 accepted (direction); Gate A→B prerequisite before Track B implementation |
