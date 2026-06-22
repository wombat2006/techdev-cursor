# Wall-Bounce — AS-IS (Code-Derived)

**Status:** Active internal reference · **Source of truth:** `src/` (2026-06-22 audit)  
**Human entry:** [README.md](../README.md) · [README_en.md](../README_en.md) (Goal / AS-IS / what we need)  
**Companion:** [WALL_BOUNCE_TO_BE.md](./WALL_BOUNCE_TO_BE.md) · [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md)  
**Constitution (target, not fully implemented):** [AGENTS.md](../AGENTS.md#constitution) · [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md)

> This document records **what the code does today**. Constitution text (2–5 rounds, quality gates, implementation-only path) describes **To-Be** where it diverges.

---

## 1. Scope

Wall-Bounce in this repo means **multi-provider LLM orchestration** for analysis-style requests. Two consumption paths exist:

| Path | Entry | Orchestration | Provider transport |
|------|-------|---------------|-------------------|
| **Track A — Cursor MCP** | `techsapo-providers` MCP (`analyze_*`) | **None** — single-shot per tool call | `src/adapters/*` → CLI |
| **Track B — Wall-Bounce API / server** | HTTP routes, `wall-bounce-server.ts`, `server.ts` | `WallBounceAnalyzer` or `WallBounceAdapter` → `WallBounceOrchestrator` | **Legacy spawn** in analyzer; adapters only on MCP path |

**Canonical implementation file (constitution):** `src/services/wall-bounce-analyzer.ts` — used by API routes, test UI, `multi-llm-session-handler`, and main `server.ts`.

---

## 2. Entry points (inventory)

| Consumer | File | Analyzer used | Notes |
|----------|------|---------------|-------|
| SSE streaming API | `src/routes/wall-bounce-api.ts` | `WallBounceAnalyzer` | `GET /api/v1/wall-bounce/analyze` |
| Simple JSON API | `src/routes/wall-bounce-api.ts` | `WallBounceAnalyzer` | `POST /analyze-simple` — always `parallel`, `taskType: basic` |
| Legacy wall-bounce server | `src/wall-bounce-server.ts` | `WallBounceAdapter` → `WallBounceOrchestrator` | `/api/v1/generate`, incident/RAG-style endpoints |
| Main server | `src/server.ts` | `WallBounceAnalyzer` | Additional routes |
| Test UI | `src/routes/test-ui.ts` | `WallBounceAnalyzer` | Dev only |
| Multi-LLM session | `src/services/multi-llm-session-handler.ts` | `WallBounceAnalyzer` + **Codex-only** `codex-session-manager` | Turn 1 = direct Codex; turn 2+ = wall-bounce |

**MCP (`src/services/techsapo-providers-mcp-server.ts`):** Tools `analyze_claude`, `analyze_codex`, `analyze_agy` — **one provider, one prompt, one response**. No aggregation, no rounds, no threshold branch.

---

## 3. Dual orchestration implementations (gap B3)

| Component | Responsibility | Used by |
|-----------|----------------|---------|
| **`WallBounceAnalyzer`** | Monolithic: provider selection, parallel/sequential execution, aggregator LLM, in-process `flowDetails` | API, tests, session handler |
| **`WallBounceOrchestrator`** + **`ConsensusEngine`** | SRP: parallel peer calls → Jaccard consensus → result | `wall-bounce-server.ts` via adapter only |

Both exist in production code. **They are not unified.** Behavior differs (aggregator LLM vs text-similarity consensus).

---

## 4. `executeWallBounce` flow (primary path)

**Method:** `WallBounceAnalyzer.executeWallBounce(prompt, options)`

### 4.1 Pre-execution

1. **`taskType`** — from `options.taskType` or auto-detected:
   - `isSimpleQuery(prompt)` → `simple` (lightweight models)
   - else default `basic`
2. **`mode`** — `options.mode === 'sequential'` ? `sequential` : **`parallel` (default)**
3. **`depth`** — `validateDepth(options.depth, mode)`:
   - parallel → **1** (ignored)
   - sequential → default **3**, clamp **3–5** (warn + reset if out of range)
4. **Aggregator** — `selectAggregatorByCognitiveAnalysis(prompt, taskType)` picks aggregator provider key
5. **Peer count** — `getProviderOrder(taskType)` + slice by task type (`basic`→2, `premium`→4, else all)

**No upfront “difficulty score”** gates mode selection. Simple-query detection is a **lightweight regex/heuristic**, not a full difficulty model.

### 4.2 Execution branches

| Mode | What runs | “Rounds” in constitution sense |
|------|-----------|----------------------------------|
| **parallel** | All peers **concurrently** → single **aggregator** LLM call | **1 pass** (not 2–5) |
| **sequential** | Peers **one after another** (`depth` steps, 3–5) → **aggregator** | **1 chain + 1 aggregation** (depth ≠ constitution rounds) |

After execution: **return result**. **No loop** if confidence/consensus is below threshold.

### 4.3 Fallback

If `config.wallBounce.enableFallback` and peer count &lt; `minProviders`, internal Claude providers (`opus-4.1`, `sonnet-4`) may be invoked. Controlled by env `ENABLE_WALL_BOUNCE_FALLBACK` (default off).

---

## 5. Provider invocation (AS-IS transport)

`invokeProvider` uses **legacy per-provider methods** (`invokeClaude`, `invokeGPT5`, `invokeGemini`, `executeGeminiCLI`) — **not** `src/adapters/*`.

MCP Track A uses adapters (`claude-adapter`, `codex-adapter`, `agy-adapter`) with `InferenceProfile` resolution.

**Gap B-1:** Wall-Bounce API and MCP do not share the same adapter transport layer.

---

## 6. Aggregation and consensus

### 6.1 WallBounceAnalyzer (API path)

- Peers return `LLMResponse` with `content`, `confidence`, `cost`
- **Aggregator** receives `buildAggregatorPrompt(...)` and is invoked as a **separate LLM** (`DEFAULT_AGGREGATOR_PROVIDER`, typically Opus-class)
- Final `consensus.confidence` = **aggregator response confidence**, not inter-peer agreement score
- `onConsensusUpdate` callback fires **once** with aggregator confidence

### 6.2 ConsensusEngine (orchestrator path)

- Jaccard word overlap between peer texts → `agreement_score`
- `consensusConfidence = (bestVote.confidence + averageAgreement) / 2`
- If `requireConsensus && consensusConfidence < confidenceThreshold` → **`logger.warn` only** — result still returned

**Neither path blocks or re-runs on low scores.**

---

## 7. Quality thresholds (constitution vs code)

| Rule (constitution / docs) | AS-IS code |
|----------------------------|------------|
| confidence ≥ 0.7, consensus ≥ 0.6 | Thresholds appear in options defaults (0.7–0.9 by task type) but **no hard gate** on API return |
| 2–5 rounds required | **Not enforced** — single parallel or single sequential chain per request |
| Single-round forbidden | **Violated** — parallel mode is one peer round + aggregation |
| Escalate if below threshold | Orchestrator `checkTierEscalation` may log; analyzer **does not** branch to extra rounds |

---

## 8. Mode selection (user control)

| Control | AS-IS |
|---------|-------|
| HTTP query `mode=parallel\|sequential` | `wall-bounce-api.ts` — **only** external selector |
| Request body `mode`, `depth` | `wall-bounce-server.ts` `/api/v1/generate` |
| Prompt keywords (e.g. 「壁打ちで」) | **Not implemented** |
| MCP / Cursor config for mode | **Not implemented** |
| User-configurable threshold | **Not implemented** (fixed per task_type / options) |

Sequential mode **still runs aggregator** and emits consensus score — there is no “no consensus” path in code.

---

## 9. Observability (SSE)

**Implemented:** `GET /api/v1/wall-bounce/analyze` (`wall-bounce-api.ts`)

| Event | Payload (summary) |
|-------|-------------------|
| `thinking` | provider, step, content, timestamp |
| `provider_response` | provider, response (**truncated 500 chars**), timestamp |
| `consensus` | score, timestamp |
| `final_answer` | answer, metadata (mode, session_id, times, providers) |
| `error` | message, timestamp |

Callbacks wired from `executeWallBounce` options: `onThinking`, `onProviderResponse`, `onConsensusUpdate`.

**Gaps:**

- `session_id` query param is **logged only** — not wired to Layer A / Redis
- No SSE from MCP Track A
- No structured “aggregator reasoning” or peer-to-peer dialogue events
- `flowDetails` built in analyzer is **not** streamed to client (in-memory + console logs)

**ADR:** [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./decisions/TECH_STACK_LLM_PROVIDER_TRANSPORT.md) — SSE at HTTP boundary only.

---

## 10. Objection / user challenge flow

**Not implemented.**

[TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) (TS-24) defines post-answer **negative feedback → retry** at ADR level only. No API for challenging aggregator rationale or multi-option user choice.

---

## 11. Session and memory

| Mechanism | AS-IS |
|-----------|-------|
| Layer A `OrchestrationSession` | Types/schema exist; **no Redis store** in wall-bounce path |
| `session_id` on SSE API | Passthrough in metadata only |
| `multi-llm-session-handler` | Codex Redis session manager — **not** Layer A (TS-22 violation) |
| Round events in durable transcript | **Not appended** |

---

## 12. Configuration (`config/environment.ts`)

```typescript
wallBounce: {
  enableFallback: process.env.ENABLE_WALL_BOUNCE_FALLBACK === 'true',
  enableTimeout: process.env.ENABLE_WALL_BOUNCE_TIMEOUT === 'true',
  timeoutMs: parseInt(process.env.WALL_BOUNCE_TIMEOUT_MS || '0', 10),
  minProviders: parseInt(process.env.WALL_BOUNCE_MIN_PROVIDERS || '1', 10),
}
```

Parallel execution comment in code: **“タイムアウト無し”** (no timeout) unless env enables it.

---

## 13. Task-type provider matrix (analyzer)

From `getProviderOrder` / task type slicing (simplified):

| taskType | Typical peers | Aggregator |
|----------|---------------|------------|
| `simple` | gemini flash + pro (min 2) | Cognitive analysis selection |
| `basic` | 2 peers | Same |
| `premium` | up to 4 peers | Same |
| `critical` | all configured peers | Same |

Exact model IDs in code still reference legacy names (`gpt-5-codex`, `gemini-2.5-pro`, `opus-4.1`, etc.) — catalog migration pending (Track E).

---

## 14. Constitution compliance summary

| Constitution rule | AS-IS |
|-------------------|-------|
| Always Wall-Bounce | API paths yes; MCP **no** (by design for daily dev) |
| 2–5 rounds | **No** — single pass |
| confidence ≥ 0.7, consensus ≥ 0.6 | **Warn only** (orchestrator); analyzer uses aggregator confidence without gate |
| Implementation via `wall-bounce-analyzer.ts` | **Yes** for main API; parallel orchestrator path is separate |
| Japanese user-facing output | Prompt templates mixed; not centrally enforced |

---

## 15. Primary code references

| Topic | Location |
|-------|----------|
| Main orchestration | `src/services/wall-bounce-analyzer.ts` — `executeWallBounce`, `executeParallelMode`, `executeSequentialMode` |
| SSE API | `src/routes/wall-bounce-api.ts` |
| SRP orchestrator | `src/services/wall-bounce-orchestrator.ts`, `consensus-engine.ts` |
| Adapter path | `src/services/wall-bounce-adapter.ts` |
| MCP single-shot | `src/services/techsapo-providers-mcp-server.ts` |
| Session (legacy) | `src/services/multi-llm-session-handler.ts` |
| Config | `src/config/environment.ts` → `wallBounce` |

---

## 16. Related documents

| Doc | Role |
|-----|------|
| [WALL_BOUNCE_TO_BE.md](./WALL_BOUNCE_TO_BE.md) | Target behavior and gaps |
| [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) | File-level change list |
| [decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md](./decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) | TS-25 — default routing ADR |
| [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) | Track B / C gates and tasks |
