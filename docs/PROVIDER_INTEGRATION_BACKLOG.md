# Provider Integration Backlog

**Status**: Living document — future expansion margin; items are **not strictly prioritized**  
**Owner**: TechSapo Development Team  
**Related**: [FORK_CURSOR.md](./FORK_CURSOR.md) · [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) · [ANTIGRAVITY_CLI_MIGRATION.md](./ANTIGRAVITY_CLI_MIGRATION.md)

---

## Track A-1 (current baseline)

Unified MCP + CLI adapters — **implemented**:

| Component | Path |
|-----------|------|
| Types | `src/types/inference-profile.ts`, `src/types/adapter-types.ts` |
| Resolver | `src/adapters/inference-profile-resolver.ts` (hardcoded presets) |
| Adapters | `src/adapters/{claude,codex,agy}-adapter.ts` |
| MCP server | `src/services/techsapo-providers-mcp-server.ts` |
| Google transport | `src/utils/antigravity-cli.ts` (`agy --print` + stdin) |

Cursor registration: [config/cursor-mcp.template.json](../config/cursor-mcp.template.json)

---

## Future expansion (open backlog)

No fixed priority order. Pick up when a track gate or product need aligns.

### OpenAI model catalog migration

Target catalog: [OPENAI_MODEL_MATRIX.md](./OPENAI_MODEL_MATRIX.md) (GPT-5.5, GPT-5.5 Pro, GPT-5.4 mini, GPT-5.4 nano). **Documentation only** — implement when scheduled:

- [ ] **E-1** — Map InferenceProfile presets (`fast`→nano, `balanced`→mini, `deep`→5.5, `critical`→5.5 Pro) in `config/inference-profiles.json` (depends on A-2)
- [ ] **E-2** — Update `src/config/llm-providers.json` OpenAI provider entries and model aliases
- [ ] **E-3** — Update `src/adapters/codex-adapter.ts` default model flags when Codex CLI exposes new IDs
- [ ] **E-4** — Responses API path for GPT-5.5 family (prompt caching 24h constraint)
- [ ] **E-5** — Update `src/config/llm-character-sheets.json`, monitoring labels, README diagrams after code switch
- [ ] **E-6** — Adapter / Wall-Bounce regression tests for new model routing
- [ ] **E-7** — Anthropic / Google catalog pass (separate from OpenAI; IDs may also lag vendor releases)

### LLM Model Catalog schema (TS-21)

Multi-vendor static traits — **schema + stub only**; loader / TaskRouter wiring pending:

- [ ] **F-1** — `npm run validate:config` — ajv validate `config/llm-model-catalog.json` against schema
- [ ] **F-2** — `src/services/llm-model-catalog-loader.ts` — load + alias resolve at startup
- [ ] **F-3** — TaskRouter filters models by `capabilities` + `roles` (e.g. tool required → exclude nano)
- [ ] **F-4** — Migrate `llm-providers.json` entries to reference `catalogId` instead of duplicating traits
- [ ] **F-5** — Sync vendor matrix docs (OpenAI, Anthropic, Google) from catalog export or CI check
- [ ] **F-6** — Unit tests: alias resolution, deprecated model warnings, role eligibility

ADR: [TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · Schema: [config/schemas/llm-model-catalog.schema.json](../config/schemas/llm-model-catalog.schema.json)

### Provider transport / SDK

- [ ] **Track A-2** — `config/inference-profiles.json` + JSON Schema; resolver loads file instead of hardcode
- [ ] **Track B** — Wire adapters into `wall-bounce-analyzer.ts`; remove nested MCP client spawn
- [ ] **Python Antigravity SDK sidecar** — optional agent path via `google-antigravity` ([repo](https://github.com/google-antigravity/antigravity-sdk-python)); blocked on OAuth/subscription parity (API key today conflicts with [SECURITY.md](./SECURITY.md))
- [ ] **SDK OAuth watch** — adopt when SDK supports Google AI Pro OAuth ([forum thread](https://discuss.ai.google.dev/t/will-antigravity-sdk-support-oauth/145587))
- [ ] **Vertex / enterprise auth** — if SDK Vertex path stabilizes ([issue #8](https://github.com/google-antigravity/antigravity-sdk-python/issues/8))
- [ ] **Node-native SDK slots** — reserve adapter interface for Anthropic/OpenAI SDK paths where subscription allows (parallel to CLI adapters)

### MCP / Cursor

- [ ] **Gate A→B** — stdio smoke: `ListTools` + one `CallTool` per `analyze_*` from Cursor
- [ ] **A-2 MCP schemas** — extend tool `inputSchema` with full InferenceProfile fields per [TS-20](./decisions/TECH_STACK_INFERENCE_PROFILES.md)
- [ ] **Usage metrics (Track D)** — CLI usage parse → Prometheus; response cache opt-in

### Wall-Bounce / P5

- [ ] **Track C** — constitution round enforce (TS-12), orchestrator merge, PromptAnalyzer + dictionary v0
- [ ] **Haiku registration** — `fast` preset via Track B-3
- [ ] **Provider Gateway (TS-17 To-Be)** — HTTP/SSE sidecar only if multi-node deployment required

### Config / validation

- [ ] `config/schemas/` — fork-profile, inference-profiles, task-router JSON Schema
- [ ] `npm run validate:config` — ajv validation script
- [ ] `tests/adapters/` — smoke tests per adapter (mock spawn or tagged integration)

### Documentation

- [ ] ADR: SDK vs CLI boundary when Python SDK OAuth lands
- [ ] Update [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) known-state when Gate A→B passes

---

## Design margin (intentionally left open)

```text
src/adapters/          ← add new ProviderAdapter implementations here
src/types/             ← shared InferenceProfile / AdapterRequest
src/utils/             ← low-level CLI helpers (e.g. antigravity-cli.ts)
sidecar/ (future)      ← optional Python SDK subprocess boundary — not created yet
```

Adapters **spawn CLI only** (no nested MCP). SDK sidecar, if added later, should sit behind the same `ProviderAdapter` interface so Wall-Bounce and unified MCP do not fork transport logic.

---

## References

| Topic | Document |
|-------|----------|
| Fork layout | [FORK_CURSOR.md § Directory layout](./FORK_CURSOR.md#directory-layout-fork) |
| InferenceProfile | [TECH_STACK_INFERENCE_PROFILES.md](./decisions/TECH_STACK_INFERENCE_PROFILES.md) |
| Transport | [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./decisions/TECH_STACK_LLM_PROVIDER_TRANSPORT.md) |
| OpenAI model catalog | [OPENAI_MODEL_MATRIX.md](./OPENAI_MODEL_MATRIX.md) |
| LLM model catalog (TS-21) | [TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) |
| Antigravity Python SDK | [github.com/google-antigravity/antigravity-sdk-python](https://github.com/google-antigravity/antigravity-sdk-python) |
