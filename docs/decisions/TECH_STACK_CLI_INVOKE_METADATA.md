# TS-26: CLI Invoke Metadata (usage, stop_reason, session)

**Status:** Accepted (direction) — 2026-06-22  
**Related:** [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) (TS-17) · [TECH_STACK_MEMORY_SUBSTRATE.md](./TECH_STACK_MEMORY_SUBSTRATE.md) (TS-22) · [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) (TS-24) · [WALL_BOUNCE_AS_IS.md](../WALL_BOUNCE_AS_IS.md)

---

## Context

HTTP Messages API responses (e.g. Claude) expose structured fields: `model`, `stop_reason`, `usage.input_tokens` / `output_tokens`, cache breakdown, etc. This repo uses **subscription CLIs only** (no API keys in code — [SECURITY.md](../SECURITY.md)). Peer providers are invoked via `claude`, `codex`, and `agy` ([TS-17](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md)).

**Question:** Can equivalent metadata be captured from CLI stdout/stderr without bypassing the CLI security model?

**Finding:** Yes for **Claude** and **Codex** (verified on WSL 2026-06-22); **agy** text-only (provisional). AS-IS adapters return **plain text only** and discard token lines ([WALL_BOUNCE_AS_IS.md](../WALL_BOUNCE_AS_IS.md) §5).

---

## AS-IS (this repo)

| Layer | Behavior |
|-------|----------|
| `AdapterResult` | `content`, `executionTimeMs`, `provider`, `model` — **no usage / stop_reason** |
| `claude-adapter` | `claude --print` → text stdout only |
| `codex-adapter` | Strips `] tokens used:` from stdout when extracting content |
| `agy` / `antigravity-cli.ts` | Text stdout + stderr only |
| `wall-bounce-analyzer` | `tokens` often `prompt.length/4`; `confidence` hardcoded or heuristic |

---

## Provider feasibility (CLI, same node)

### Claude Code CLI — **High**

`claude --print --output-format json` returns a **single JSON object** (verified 2026-06-22 on WSL).

| Field (CLI JSON) | Maps to API-like use |
|------------------|----------------------|
| `result` | Assistant text |
| `stop_reason` | e.g. `end_turn` |
| `usage.input_tokens` / `output_tokens` | Token accounting |
| `usage.cache_read_input_tokens` / `cache_creation_input_tokens` | Cache-aware billing |
| `modelUsage.<modelId>` | **Resolved** model id |
| `total_cost_usd` | Cost hint (subscription-internal estimate) |
| `session_id` | Continuation / Layer B handle |
| `duration_ms`, `num_turns`, `terminal_reason` | Observability |

Not identical to Messages API `{ type: "message", content: [...] }` — wrapper is `type: "result"`.

**Also:** `--output-format stream-json` for incremental events (SSE / Layer A).

**Adapter change:** add `--output-format json`; parse stdout JSON; map to `ProviderInvokeMetadata`.

### OpenAI Codex CLI — **High** (JSONL verified 2026-06-22)

| Mechanism | Notes |
|-----------|--------|
| `codex exec --json` | JSONL on stdout — **verified** on WSL (ChatGPT account, **no `-m`**; default model) |
| `turn.completed.usage` | `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens` |
| `thread.started.thread_id` | Continuation handle candidate |
| `item.completed` · `agent_message` | Assistant `text` |
| Text log | `] tokens used: N` fallback when `--json` unavailable |
| `-m gpt-5-codex` | **Fails** on ChatGPT account (400) — do not hardcode in adapter default |

**Verified sample** (redacted fixture: [codex-exec-success.events.json](../../config/fixtures/cli-metadata/codex-exec-success.events.json)):

```json
{"type":"turn.completed","usage":{"input_tokens":14853,"cached_input_tokens":4992,"output_tokens":20,"reasoning_output_tokens":13}}
```

**Adapter change:** add `--json`; parse JSONL; map to `ProviderInvokeMetadata`; omit `-m gpt-5-codex` unless profile explicitly sets a supported model.

### Antigravity (`agy`) — **Medium (spike)**

AS-IS: `--print` text only. Legacy Gemini CLI docs mention `--output-format json`; **`agy` parity unverified** — check stderr/log for usage or add JSON flag if exposed.

**Adapter change:** spike → parse structured output or stderr; else estimate + mark `metadata.provisional: true`.

---

## Decision

### 1. Capture CLI metadata at the **adapter boundary** (not HTTP API)

Extend peer invocation through `ProviderAdapter.invoke()` to return normalized **`ProviderInvokeMetadata`** alongside `content`. No `ANTHROPIC_API_KEY` / OpenAI API keys in orchestrator code.

### 2. Schema layers (wire + normalized)

Adapters parse **provider-native CLI output** (wire), validate against JSON Schema where possible, then map to **orchestrator-facing** metadata.

| Layer | Location | Role |
|-------|----------|------|
| **Wire (per provider)** | [config/schemas/cli-metadata/](../../config/schemas/cli-metadata/) | `claude-cli-result`, `codex-cli-event`, `agy-cli-text-response` |
| **Normalized** | [provider-invoke-metadata.schema.json](../../config/schemas/provider-invoke-metadata.schema.json) · [provider-invoke-metadata.ts](../../src/types/provider-invoke-metadata.ts) | `AdapterResult.metadata` |
| **Fixtures** | [config/fixtures/cli-metadata/](../../config/fixtures/cli-metadata/) | Contract tests — redacted CLI captures |
| **Tests** | [cli-metadata-schema.test.ts](../../tests/adapters/cli-metadata-schema.test.ts) | Wire + normalized validation |

**Mapping (examples):**

| Wire field | Normalized field |
|------------|------------------|
| Claude `usage.input_tokens` | `usage.inputTokens` |
| Claude `stop_reason` | `stopReason` |
| Claude `session_id` | `sessionId` |
| Codex `turn.completed.usage.input_tokens` | `usage.inputTokens` |
| Codex `turn.completed.usage.cached_input_tokens` | `usage.cacheReadTokens` |
| Codex `thread.started.thread_id` | `sessionId` |
| agy stdout text | `content` only; `metadata.provisional: true` |

### 3. Normalized schema (orchestrator-facing)

Types: [src/types/provider-invoke-metadata.ts](../../src/types/provider-invoke-metadata.ts). JSON Schema: [provider-invoke-metadata.schema.json](../../config/schemas/provider-invoke-metadata.schema.json).

```typescript
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  reasoningOutputTokens?: number;
}

interface ProviderInvokeMetadata {
  resolvedModel: string;
  stopReason?: string;
  usage?: TokenUsage;
  costUsd?: number;
  sessionId?: string;
  durationMs?: number;
  numTurns?: number;
  terminalReason?: string;
  providerRaw?: unknown;
  provisional?: boolean;
}

interface AdapterResult {
  // existing fields...
  metadata?: ProviderInvokeMetadata;
}
```

### 4. Provider CLI flags (canonical)

| Provider | CLI invocation | Metadata source |
|----------|----------------|-----------------|
| Claude | `claude --print --output-format json` (+ `--model`, `--effort`, …) | Parse result JSON |
| Claude (stream) | `--output-format stream-json` | Event stream → Layer A / SSE |
| Codex | `codex exec --json …` | JSONL events |
| agy | TBD after spike | JSON or stderr parse |

### 5. Downstream consumers

| Consumer | Use |
|----------|-----|
| **Layer A** (TS-22) | Append `usage` + `stopReason` on `round_peer` / `round_aggregate` events |
| **Hard gate** (C-1) | `stop_reason !== end_turn` → retry or wall-bounce branch |
| **TS-25 threshold branch** | Replace char/4 confidence with real completion signals where applicable |
| **Track F cost routing** | `costUsd` / tokens from catalog pricing |
| **TS-24 continuation** | Persist Claude `session_id` in `providerHandles` |
| **Prometheus** | `llm_invoke_tokens_total`, `llm_invoke_cost_usd` (optional) |
| **SSE** (B-5) | `usage` snapshot events per provider |

### 6. Security unchanged

- CLI/OAuth/subscription paths only ([SECURITY.md](../SECURITY.md)).
- `providerRaw` stored in Layer A for audit — not echoed to end users by default.

---

## Consequences

### Positive

- Real token and stop metadata without API keys.
- Unblocks honest observability and cost-aware routing.
- Claude `session_id` aligns with TS-24 without Codex-only silos.

### Negative / risks

| Risk | Mitigation |
|------|------------|
| CLI JSON schema drift | Pin min CLI version in docs; contract tests with recorded fixtures |
| Cache tokens confuse “input” | Document billing fields; prefer `modelUsage` / `total_cost_usd` for cost |
| Codex stdout mixing | Use `--json` mode |
| agy gap | `provisional: true` until structured output confirmed |

### Forbidden

- Adding HTTP API keys to adapters for metadata “convenience”.
- Discarding `tokens used` / JSON usage after parse (today’s codex-adapter anti-pattern).

---

## Implementation phases

| Phase | Deliverable | Track |
|-------|-------------|-------|
| **0** | Wire + normalized schemas; `ProviderInvokeMetadata` types; extend `AdapterResult` | B-6 ✅ schemas; adapter parse pending |
| **1** | `claude-adapter`: `--output-format json` + parser | B-6 |
| **2** | `codex-adapter`: `--json` JSONL or token line capture | B-6 |
| **3** | `agy-adapter` spike + parser or provisional flag | B-6 |
| **4** | Wall-Bounce + Layer A event fields; drop char/4 estimates | B-1, M3 |
| **5** | SSE `usage` events; Prometheus counters | B-5, ops |

Details: [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](../WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) (WB-13…WB-18).

---

## Verification (manual)

```bash
# Claude — metadata JSON (subscription OAuth)
claude -p "Reply with exactly: ok" --model haiku --output-format json

# Codex — JSONL events (ChatGPT account: omit -m; gpt-5-codex may 400)
codex exec --json "Reply with exactly: ok"
```

Record redacted fixtures under `config/fixtures/cli-metadata/` when implementing contract tests.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-22 | v1.1 — Per-provider wire JSON Schemas + normalized schema; Codex JSONL verified |
| 2026-06-22 | v1.0 — Accepted direction: CLI metadata at adapter boundary |
