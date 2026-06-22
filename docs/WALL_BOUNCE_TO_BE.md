# Wall-Bounce — To-Be (Target Behavior)

**Status:** Accepted direction (owner vision, 2026-06-22)  
**Human entry:** [README.md](../README.md) · [README_en.md](../README_en.md)  
**Companion:** [WALL_BOUNCE_AS_IS.md](./WALL_BOUNCE_AS_IS.md) · [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md)  
**ADR:** [TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md](./decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) (TS-25) · [TECH_STACK_CLI_INVOKE_METADATA.md](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md) (TS-26)

---

## 1. Design principles

1. **No upfront difficulty scoring** — measuring query difficulty on first turn is too heavy; routing uses **execution mode** and **post-aggregation thresholds** instead.
2. **Default = fast path first** — parallel multi-LLM → aggregate → **only then** decide if deeper wall-bounce is needed.
3. **User override by configuration and language** — MCP settings and prompt keywords (e.g. 「壁打ちで」) select mode without a separate “difficulty” API.
4. **Observable process** — user can follow peer outputs, aggregator deliberation, and path to final answer (SSE or equivalent).
5. **Challengeable consensus** — user can object to aggregator reasoning; system re-queries peers and offers **explicit choices** for next behavior.

---

## 2. Execution modes (To-Be)

### 2.1 Default mode — `parallel-then-maybe-wall-bounce`

```
User query
    │
    ▼
┌─────────────────────────┐
│ Parallel peer LLMs (2+) │  ← same prompt / InferenceProfile peers
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Aggregator synthesis    │
│ + quality metrics       │
└───────────┬─────────────┘
            ▼
     metrics ≥ user/config thresholds?
       │              │
      Yes             No
       │              │
       ▼              ▼
  Return result   Auto-enter **wall-bounce mode**
                  (constitution 2–5 rounds)
```

- **Thresholds:** confidence and consensus — **user-configurable** (defaults align with constitution: 0.7 / 0.6).
- **Wall-bounce mode (when triggered):** additional **2–5 rounds** of structured peer ↔ aggregator dialogue until thresholds met or max rounds — implements constitution intent without always paying multi-round cost.

### 2.2 Forced wall-bounce mode

User selects **immediate** multi-round wall-bounce (skip or shorten parallel-first phase):

| Override channel | Example |
|------------------|---------|
| Prompt keyword | 「壁打ちで」「壁打ちモードで」 |
| MCP / IDE config | `execution.defaultMode: wall-bounce` |
| API flag | `mode=wall-bounce` (explicit) |

### 2.3 Parallel-only mode (optional override)

User forces **parallel → aggregate only** — no auto branch even if below threshold (e.g. exploratory coding):

| Override channel | Example |
|------------------|---------|
| Prompt keyword | 「並列のみ」「パラレルのみ」 |
| MCP config | `execution.autoWallBounce: false` |

### 2.4 Serial chain mode

User selects **serial peer chain** (today’s `sequential` concept, refined):

| Rule | To-Be |
|------|-------|
| Trigger | Prompt keyword (e.g. 「シリアルで」「直列で」) or API `mode=serial` |
| Peer order | Configurable chain depth (3–5 peers) |
| Consensus threshold | **Disabled** — no inter-peer agreement gate (peers do not vote in parallel) |
| Aggregator | Still produces final synthesis; metrics are **informational only** |

---

## 3. Observability (To-Be)

User can **follow in real time**:

| Stream content | To-Be |
|----------------|-------|
| Each peer request/response | Full text (or configurable cap), provider id, timing |
| Inter-round dialogue | Round N peer outputs, aggregator interim notes |
| Aggregator deliberation | Reasoning summary, conflicts resolved, evidence cited |
| Threshold decision | Scores vs thresholds; branch to wall-bounce announced |
| Final answer | With provenance links to round events |

**Transport:** **SSE** on HTTP API (extend AS-IS `wall-bounce-api.ts`); optional WebSocket later. MCP may expose read-only progress via companion HTTP URL or future MCP notification spec.

**Persistence:** All events append to **Layer A** `OrchestrationSession` ([TS-22](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md)) for replay and objection handling.

---

## 4. Objection flow (To-Be)

After aggregator output, user may **challenge** reasoning (specific claims or overall judgment):

```
User objection (with optional quote / claim ids)
    │
    ▼
Aggregator + peers re-query (focused prompt on disputed points)
    │
    ▼
Present: peer views on objection + aggregator recommendation
    │
    ▼
User chooses among system-offered options, e.g.:
  • Accept revised aggregator answer
  • Run another wall-bounce round (counts toward 2–5 cap)
  • Return to parallel-only re-run
  • Escalate model tier (premium/critical profile)
  • Abort and keep prior answer
```

Extends [TS-24](./decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) negative retry with **structured objection** and **explicit user choice** — not silent auto-retry only.

---

## 5. Track alignment (Cursor daily vs strict analysis)

| Concern | Track A (MCP) | Track B (API / orchestrator) |
|---------|---------------|------------------------------|
| Daily single-provider coding | `analyze_*` unchanged as **opt-in single shot** | N/A |
| Multi-LLM without full wall-bounce | Optional future `analyze_multi` or agent-composed calls | Default `parallel-then-maybe-wall-bounce` |
| Constitution 2–5 rounds | Only when user forces wall-bounce or API branch fires | **Canonical** implementation in `wall-bounce-analyzer.ts` |
| Mode keywords | Read from prompt + `.cursor` / MCP env config | Same rules in `PromptAnalyzer` |

---

## 6. AS-IS vs To-Be gap matrix

| Capability | AS-IS | To-Be |
|------------|-------|-------|
| Default entry | Single parallel pass + aggregate | Parallel + aggregate → **threshold branch** |
| Upfront difficulty model | Light `isSimpleQuery` heuristic only | **None** (by design) |
| Constitution 2–5 rounds | Not enforced | **On branch or forced mode** |
| Threshold below target | Log warn / return anyway | **Auto wall-bounce branch** (unless parallel-only override) |
| User threshold config | Fixed per task_type | **User/MCP configurable** |
| Mode from prompt | Not supported | **Keyword + MCP config** |
| Serial mode | `sequential` API flag; still aggregates + consensus score | Serial + **no consensus gate** |
| SSE observability | Partial (500-char truncate) | **Full round stream + Layer A** |
| Objection UX | None | **Re-query + user choice menu** |
| CLI invoke metadata | Text only; Codex token line discarded | **usage**, **stop_reason**, **session_id** via CLI JSON ([TS-26](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md)) |
| Adapter unification | MCP adapters vs analyzer spawn | **Single adapter path (B-1)** |
| Durable session | None in WB path | **Layer A M1–M3** |
| MCP wall-bounce | Not available | Optional; primary strict path remains API |

---

## 7. Gate and track mapping

| Work package | Track | Gate |
|--------------|-------|------|
| Adapter wiring to analyzer | **B** B-1 | Gate B→C prerequisite |
| CLI invoke metadata (usage, stop_reason) | **B** B-6 ([TS-26](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md)) | Gate B→C G9 |
| Layer A store + round events | **B** M1–M3 | Gate B→C prerequisite |
| Mode routing + threshold branch (TS-25) | **B** B-4 | Gate B→C prerequisite |
| SSE + Layer A stream | **B** B-5 | Gate B→C prerequisite |
| InferenceProfile file + retryOnNegative | **B** B-0 | Gate B→C |
| PromptAnalyzer keywords (mode) | **C** C-2 extension | Gate C |
| Hard gate on final return | **C** C-1 | Gate C |
| Constitution round loop (2–5) in code | **C** C-4 (revised per TS-25) | Gate C |
| Objection workflow | **C** C-7 (new) | Gate C |
| Orchestrator merge | **C** C-5 | Gate C |

**Gate B→C** should require **B-1, B-4, B-5, M1** minimum — not only adapter stubs.

**Gate C** completes platform: hard gate, PromptAnalyzer, dictionary, **round enforce**, objection, orchestrator unity.

Details: [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) · [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md)

---

## 8. Constitution reconciliation

Constitution text remains supreme. To-Be interprets it as:

- **“2–5 rounds”** applies to **wall-bounce mode** (forced or threshold-triggered), not to every request’s first parallel pass.
- **“Always Wall-Bounce”** for strict analysis means **never single-LLM bypass on the API path** — parallel-first still uses **2+ peers**.
- **Single-round wall-bounce forbidden** — parallel-only result without peer diversity or without branch when below threshold is a **Gate C** violation to fix.

Update [AGENTS.md](../AGENTS.md) constitution summary only after Gate C passes — until then AS-IS doc carries the honest gap.

---

## 9. Related documents

| Doc | Role |
|-----|------|
| [WALL_BOUNCE_AS_IS.md](./WALL_BOUNCE_AS_IS.md) | Code truth |
| [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) | Per-file tasks |
| [decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md](./decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) | TS-25 ADR |
| [decisions/TECH_STACK_CLI_INVOKE_METADATA.md](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md) | TS-26 — CLI usage / stop_reason / session_id |
| [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md) | Operator guide (sync after implementation) |
| [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) | Objection + retry policy |
