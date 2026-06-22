# TS-27: Ollama Local Gateway (Cloud + Local Models)

**Status:** Proposed (direction) — 2026-06-22  
**Related:** [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) (TS-17) · [TECH_STACK_USER_EXTENSIBLE_LLM.md](./TECH_STACK_USER_EXTENSIBLE_LLM.md) (TS-23) · [TECH_STACK_CLI_INVOKE_METADATA.md](./TECH_STACK_CLI_INVOKE_METADATA.md) (TS-26) · [SECURITY.md](../SECURITY.md)

---

## Context

Teams may want **additional model vendors** (Qwen, DeepSeek, Kimi, GLM, GPT-OSS, etc.) without adding a new vendor CLI for each. [Ollama](https://ollama.com) provides:

1. **Local inference** — models pulled to the same node (`llama3`, `qwen3`, …).
2. **Cloud models** — proxied through the **local daemon** after `ollama signin`, using the `:cloud` suffix (e.g. `qwen3.5:cloud`, `gpt-oss:120b-cloud`).

**Product goal (To-Be):** Optional **`ollama` adapter** that calls `http://localhost:11434` (or configured host) so TechSapo can route inference through one HTTP transport while still using subscription CLIs (`claude`, `codex`, `agy`) as constitution peers.

**Feasibility:** Verified via Ollama official docs (Context7, 2026-06-22) and repo architecture review (Serena). **Not implemented** in `src/` AS-IS.

---

## AS-IS (this repo)

| Item | State |
|------|--------|
| `ProviderId` | `'claude' \| 'codex' \| 'agy'` only — [adapter-types.ts](../../src/types/adapter-types.ts) |
| Ollama adapter | **None** |
| MCP tools | `analyze_claude`, `analyze_codex`, `analyze_agy` only |
| Catalog / matrix | Open map (TS-23 L2) — no `ollama` row |
| Security default | Subscription CLI / OAuth; **no API keys in repo** — [SECURITY.md](../SECURITY.md) |
| ByteRover | Local Ollama **not recommended** for `brv curate` — [MCP_SERVICES.md](../MCP_SERVICES.md) (orthogonal to inference adapter) |

---

## Ollama capabilities (external, verified)

### Transport

| Path | Endpoint | Auth |
|------|----------|------|
| **Local API (preferred)** | `http://localhost:11434/api/chat` · `/api/generate` | Local calls unauthenticated; **cloud models** require prior `ollama signin` (daemon forwards credentials) |
| **OpenAI-compatible** | `http://localhost:11434/v1/chat/completions` | Dummy `api_key` accepted by Ollama |
| **Direct cloud API** | `https://ollama.com/api/*` | `Authorization: Bearer $OLLAMA_API_KEY` |

### Cloud models

- Model ids use **`:cloud` suffix** when invoked via local daemon (e.g. `qwen3.5:cloud`).
- Catalog includes Kimi, Qwen, GLM, DeepSeek, GPT-OSS, etc. (Ollama `recommendedModels` / cloud limits in upstream source).
- **Distinct billing** from Claude Code / Codex / Antigravity subscriptions — TaskRouter must treat `ollama` as a separate cost channel.

### Metadata (TS-26 alignment)

Native `/api/generate` response (non-streaming) includes:

| Ollama field | `ProviderInvokeMetadata` |
|--------------|--------------------------|
| `done_reason` | `stopReason` |
| `prompt_eval_count` | `usage.inputTokens` |
| `eval_count` | `usage.outputTokens` |
| `total_duration` (ns) | `durationMs` (÷ 1e6) |
| `model` | `resolvedModel` |

OpenAI-compatible responses expose `usage` on the completion object when supported.

---

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| **A — `ollama-adapter` via local HTTP** (`localhost:11434`) | Single transport for local + cloud; same-node per TS-17; structured JSON + usage; fits `ProviderAdapter` | Requires Ollama daemon on WSL; cloud needs `ollama signin`; new L3 adapter |
| **B — Direct `https://ollama.com/api`** | No local daemon | `OLLAMA_API_KEY` in env; bypasses “local gateway” story; weaker alignment with SECURITY |
| **C — OpenRouter / other router only** | One API for many models | Separate ADR; API-key path; duplicates Ollama cloud catalog partially |
| **D — Per-vendor native CLIs only** | Matches current CLI-first policy | N× CLIs; no unified cloud model access |

---

## Decision

**Chosen option: A — Local Ollama HTTP gateway adapter (Proposed direction)**

### 1. New L3 adapter: `ollama` (TS-23)

| Piece | Direction |
|-------|-----------|
| **Code** | `src/adapters/ollama-adapter.ts` — `fetch` to `{baseUrl}/api/chat` (default `http://127.0.0.1:11434`) |
| **ProviderId** | Extend union with `'ollama'` |
| **MCP (optional)** | `analyze_ollama` tool after adapter ships |
| **Matrix** | `adapters.ollama` preset row → catalog model ids (e.g. `qwen3.5:cloud`) |
| **Catalog** | L1 entries with `transport.preferredInvocation: ollama_http` |

**Not** a replacement for constitution peers (`claude`, `codex`, `agy`) in initial rollout — **optional adapter** for cost / capability routing (TS-23 §3.2).

### 2. Invocation contract

```typescript
// POST {baseUrl}/api/chat
{
  "model": "qwen3.5:cloud",   // or local tag without :cloud
  "messages": [{ "role": "user", "content": "<prompt>" }],
  "stream": false
}
```

- **Profile `model`** from InferenceProfile / catalog — **never** hardcode cloud ids in orchestrator.
- **WSL:** `baseUrl` defaults to `127.0.0.1:11434` on same node; document Windows-host vs WSL-remote Ollama as operator concern ([CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) A-0 class probe).

### 3. Authentication (SECURITY exception, scoped)

| Method | Allowed | Storage |
|--------|---------|---------|
| **`ollama signin`** (daemon session) | **Preferred** — no key in repo | Operator runs once per machine |
| **`OLLAMA_API_KEY`** | Only for **direct** `ollama.com` fallback (non-default) | Gitignored `config/local/` or env — **never** committed |
| Dummy OpenAI key on `/v1/*` | Local only | N/A |

Orchestrator code **must not** embed API keys. Adapter reads `OLLAMA_HOST` / optional key from env only when ADR-approved local overlay exists (TS-23 To-Be `config/local/*.json`).

### 4. Metadata wire schema (TS-26 extension)

Add when implementing:

- `config/schemas/cli-metadata/ollama-chat-response.schema.json`
- Fixture: `config/fixtures/cli-metadata/ollama-chat-success.json`
- Map to existing [ProviderInvokeMetadata](../../src/types/provider-invoke-metadata.ts)

### 5. Constitution and Wall-Bounce

| Rule | Application |
|------|-------------|
| 2+ peer LLMs | `ollama` **does not** satisfy constitution peers until explicit ADR promotion |
| Wall-Bounce optional peer | To-Be: TaskRouter may include `ollama` as **non-default** peer after B-1 adapter unify |
| Daily Cursor MCP | Optional `analyze_ollama` for experiments |

### 6. Explicit non-goals (initial phase)

- Replacing `claude` / `codex` / `agy` subscription paths
- ByteRover (`brv`) inference through Ollama
- Runtime “add Ollama model” UI (P5+)
- Bundling Ollama installer in repo

---

## Consequences

### Positive

- One adapter → many local + cloud models (Qwen, DeepSeek, Kimi, …).
- HTTP JSON fits TS-26 metadata without char/4 estimates.
- Aligns with TS-23 open matrix — L2 catalog rows without new vendor CLIs.
- Same-node gateway consistent with TS-17 (HTTP to co-located daemon, not LLM-to-LLM HTTP).

### Negative / risks

| Risk | Mitigation |
|------|------------|
| Ollama daemon not running | Health probe in adapter; clear error in MCP / API |
| Cloud model without `signin` | Document A-0-style check; fail fast with actionable message |
| Model id drift (`:cloud` suffix) | Catalog as source of truth; contract tests with fixtures |
| Double subscription cost | Track F cost routing; label `ollama` channel in Layer A events |
| WSL localhost mismatch | `OLLAMA_HOST` env; runbook note |
| SECURITY policy tension | Scoped exception: Ollama auth only via signin or gitignored local key |

### Forbidden

- Committing `OLLAMA_API_KEY` or cloud credentials to the repo.
- Routing constitution-mandatory Wall-Bounce **only** through Ollama without peer ADR.
- Using Ollama as bypass to inject raw OpenAI/Anthropic API keys into orchestrator code.

---

## Implementation phases (backlog)

| Phase | Deliverable | Track / Gate |
|-------|-------------|--------------|
| **0** | This ADR accepted; catalog transport enum stub | Doc |
| **1** | `ollama-adapter.ts` + `ProviderId` + wire schema + fixture | **L3** · after B-6 metadata types stable |
| **2** | Catalog L1 models (`*:cloud` + selected local) + matrix `adapters.ollama` | TS-23 L1–L2 |
| **3** | `analyze_ollama` MCP tool (optional) | Track A-2 extension |
| **4** | TaskRouter optional peer (non-constitution) | Track F |
| **5** | Wall-Bounce peer slot (if promoted) | ADR amend + Track C |

Suggested file tasks: [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](../WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) (WB-19+ when scheduled).

---

## Verification (operator)

```bash
# Prerequisite: Ollama installed, daemon running on same node as TechSapo
ollama signin

# Cloud model via local gateway
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "qwen3.5:cloud",
  "messages": [{"role": "user", "content": "Reply with exactly: ok"}],
  "stream": false
}'

# Local model (no :cloud) — optional smoke
ollama pull llama3.2
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role": "user", "content": "ok"}],
  "stream": false
}'
```

Record redacted responses under `config/fixtures/cli-metadata/` when implementing contract tests.

---

## Sync required (on acceptance)

- [ ] [decisions/README.md](./README.md) — TS-27 row
- [ ] [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
- [ ] [PROVIDER_INTEGRATION_BACKLOG.md](../PROVIDER_INTEGRATION_BACKLOG.md)
- [ ] [TECH_STACK_USER_EXTENSIBLE_LLM.md](./TECH_STACK_USER_EXTENSIBLE_LLM.md) — example `ollama` L3
- [ ] [SECURITY.md](../SECURITY.md) — scoped Ollama auth exception (if Accepted)
- [ ] Implementation — separate commit when scheduled

---

## References

- Ollama cloud docs — `https://github.com/ollama/ollama/blob/main/docs/cloud.mdx`
- Ollama API authentication — `https://docs.ollama.com/api/authentication`
- Ollama OpenAI compatibility — `https://docs.ollama.com/api/openai-compatibility`
- [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md)
- [TECH_STACK_USER_EXTENSIBLE_LLM.md](./TECH_STACK_USER_EXTENSIBLE_LLM.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-22 | v0.1 — Proposed direction: local Ollama HTTP gateway adapter for cloud + local models |
