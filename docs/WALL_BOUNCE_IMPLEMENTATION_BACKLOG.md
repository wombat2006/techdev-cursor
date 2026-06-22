# Wall-Bounce — Implementation Backlog (Modification Points)

**Status:** Active · derived from [WALL_BOUNCE_AS_IS.md](./WALL_BOUNCE_AS_IS.md) → [WALL_BOUNCE_TO_BE.md](./WALL_BOUNCE_TO_BE.md)  
**Execution runbook:** [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md)

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Blocks To-Be default mode or constitution path |
| **P1** | Required for Gate B→C or C |
| **P2** | UX / observability polish |

---

## Core orchestration (`src/services/`)

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-01 | `wall-bounce-analyzer.ts` | Split phases: `executeParallelPhase` → `evaluateThresholds` → optional `executeWallBounceRounds` (2–5) | P0 | B-4 |
| WB-02 | `wall-bounce-analyzer.ts` | Remove “single pass = done” — loop until thresholds or max rounds when in wall-bounce mode | P0 | C-4 |
| WB-03 | `wall-bounce-analyzer.ts` | Wire `src/adapters/*` instead of `invokeClaude` / `invokeGPT5` / `invokeGemini` | P0 | B-1 |
| WB-04 | `wall-bounce-analyzer.ts` | `PromptAnalyzer` hook: keyword → `ExecutionMode` enum | P1 | B-4 / C-2 |
| WB-05 | `wall-bounce-analyzer.ts` | User/config thresholds (`confidenceMin`, `consensusMin`) with constitution defaults | P0 | B-4 |
| WB-06 | `wall-bounce-analyzer.ts` | Serial mode: skip consensus gate; mark metrics informational | P1 | B-4 |
| WB-07 | `wall-bounce-analyzer.ts` | Append round events to Layer A store (inject `OrchestrationSessionStore`) | P0 | M1–M3 |
| WB-08 | `wall-bounce-analyzer.ts` | Objection handler entry: `submitObjection(sessionId, claim, note)` | P1 | C-7 |
| WB-09 | `wall-bounce-orchestrator.ts` | Merge into analyzer **or** deprecate after B-1 parity tests | P1 | C-5 |
| WB-10 | `consensus-engine.ts` | Expose `consensus` score separately from `confidence`; hard gate hook for C-1 | P1 | C-1 |
| WB-11 | `wall-bounce-adapter.ts` | Redirect to unified analyzer or delete after C-5 | P2 | C-5 |
| WB-12 | `multi-llm-session-handler.ts` | Replace Codex-only Redis with Layer A; align turn routing with TS-25 | P1 | M2 |
| WB-13 | `src/types/provider-invoke-metadata.ts` + `config/schemas/provider-invoke-metadata.schema.json` + `cli-metadata/*` | Wire + normalized schemas; `AdapterResult.metadata` type | P1 | B-6 ✅ types/schemas |
| WB-14 | `claude-adapter.ts` | `--output-format json`; parse usage / stop_reason / session_id | P1 | B-6 |
| WB-15 | `codex-adapter.ts` | `codex exec --json` JSONL or retain `tokens used` line | P1 | B-6 |
| WB-16 | `agy-adapter.ts` / `antigravity-cli.ts` | Spike structured usage; `provisional` fallback | P2 | B-6 |
| WB-17 | `wall-bounce-analyzer.ts` | Propagate metadata to Layer A; remove char/4 token estimates | P1 | B-1, M3 |
| WB-18 | `config/fixtures/cli-metadata/` | Redacted CLI JSON fixtures + adapter contract tests | P1 | B-6 |
| WB-19 | `ollama-adapter.ts` + catalog/matrix | HTTP to `localhost:11434`; cloud (`*:cloud`) + local models | P2 | TS-27 L3 |

---

## API & transport (`src/routes/`, `src/`)

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-20 | `routes/wall-bounce-api.ts` | Query/body: `mode`, thresholds, `sessionId` (required for continuation) | P0 | B-4 |
| WB-21 | `routes/wall-bounce-api.ts` | SSE: new events `round_start`, `round_end`, `threshold_decision`, `branch_wall_bounce` | P1 | B-5 |
| WB-22 | `routes/wall-bounce-api.ts` | Remove 500-char truncate or make limit configurable | P2 | B-5 |
| WB-23 | `routes/wall-bounce-api.ts` | `POST` objection endpoint + SSE `objection_result` | P1 | C-7 |
| WB-24 | `wall-bounce-server.ts` | Single entry via unified analyzer; align modes with TS-25 | P1 | C-5 |
| WB-25 | `server.ts` | Audit duplicate WB routes; consolidate | P2 | C-5 |

---

## MCP & Cursor (`src/services/techsapo-providers-mcp-server.ts`, config)

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-30 | `techsapo-providers-mcp-server.ts` | Document: MCP stays single-shot; mode keywords forwarded when calling API (future) | P2 | A-2 |
| WB-31 | `config/fork/` or new `config/wall-bounce-modes.json` | Default thresholds + keyword table | P1 | B-4 |
| WB-32 | `.cursor/mcp.json` / template | Optional env for `WALL_BOUNCE_DEFAULT_MODE` | P2 | A-2 |

---

## Prompt analysis (new / planned)

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-40 | `src/services/prompt-analyzer.ts` (new) | Keyword detection: 壁打ち / 並列 / シリアル; strip keywords from LLM prompt | P1 | C-2 |
| WB-41 | `prompt-analyzer.ts` | Morphological parse integration (TS-19) — routing only | P1 | C-2 |

---

## Memory (TS-22)

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-50 | `src/services/orchestration-session-store.ts` (new) | Redis `orch:session:*` implementation | P0 | M1 |
| WB-51 | `src/types/orchestration-memory.ts` | Event types: `round_peer`, `round_aggregate`, `threshold_branch`, `user_objection` | P0 | M3 |

---

## Config & profiles

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-60 | `config/inference-profiles.json` (new) | Presets + `retryOnNegative` stub per TS-24 | P1 | B-0 |
| WB-61 | `src/config/environment.ts` | `wallBounce.defaultMode`, threshold defaults | P1 | B-4 |

---

## Tests

| ID | File | Change | Priority | Track |
|----|------|--------|----------|-------|
| WB-70 | `tests/wall-bounce/mode-routing.test.ts` (new) | Keyword → mode; threshold branch | P0 | B-4 |
| WB-71 | `tests/wall-bounce/round-enforce.test.ts` (new) | 1 round fail; 2 pass; 6 capped at 5 | P0 | C-4 |
| WB-72 | `tests/wall-bounce/sse-events.test.ts` (new) | Event sequence contract | P1 | B-5 |

---

## Documentation sync (same commit as implementation)

| ID | File | When |
|----|------|------|
| WB-D1 | `docs/WALL_BOUNCE_AS_IS.md` | After each gate — refresh code truth |
| WB-D2 | `docs/WALL_BOUNCE_TO_BE.md` | When scope changes |
| WB-D3 | `docs/WALL_BOUNCE_SYSTEM.md` | Gate C pass — operator guide |
| WB-D4 | `README.md` / `README_en.md` | P1 summary if default UX changes |
| WB-D5 | `docs/FORK_STATUS.md` + ja | Milestone rows |
| WB-D6 | `docs/API_REFERENCE.md` | New endpoints / SSE events |
| WB-D7 | `AGENTS.md` | Constitution summary only after C-4 proven in code |

---

## Suggested implementation order

1. **M1** — Layer A store (WB-50, WB-51)  
2. **B-1** — Adapter wiring (WB-03)  
2b. **B-6** — CLI invoke metadata (WB-13…18, [TS-26](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md))  
3. **B-4** — Mode routing + threshold branch (WB-01, WB-05, WB-20, WB-61, WB-70)  
4. **B-5** — SSE + Layer A stream (WB-21, WB-22)  
5. **C-4** — Round loop enforce (WB-02, WB-71)  
6. **C-1** — Hard gate (WB-10)  
7. **C-7** — Objection (WB-08, WB-23)  
8. **C-5** — Orchestrator merge (WB-09, WB-11, WB-24)
