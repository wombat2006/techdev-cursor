# Tech Stack Decision: Codex MCP Integration Refactor (Provider-Parity Layer)

**Document type**: Architecture Decision Record (ADR)  
**ID**: TS-28  
**Version**: 1.2  
**Date**: 2026-06-22  
**Status**: **Accepted** — P0 may proceed; P3 session wiring gated on TS-22 M1; SRP #8 gated on P0  
**Deciders**: TechSapo Development Team

> **ADR filename** retains `CODEX_MCP_INTEGRATION` for index continuity. Scope now includes **vendor-neutral naming** for any module that routes to multi-provider orchestration — not Codex-only behavior.

**Changelog**

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06-22 | Initial direction (Option D layered refactor) |
| 1.1 | 2026-06-22 | Resolved D-01…D-18; mitigations applied; §4.6 high-severity re-review items |
| 1.2 | 2026-06-22 | **NAME-VN:** vendor names forbidden before routing boundary; rename map; supersedes NAME-1 retain-codex policy |

---

## 1. Context

`src/services/codex-mcp-integration.ts` (~566 lines) is the product integration layer for the legacy **Codex MCP server** (`codex-mcp-server.ts` → `codex-mcp/`). It was written before:

- Constitution Wall-Bounce modules (`src/services/wall-bounce/`) were split (invokers per provider).
- Unified provider adapters (`src/adapters/{agy,claude,codex}-adapter.ts`) and `techsapo-providers-mcp-server.ts` (Track A-1).
- Memory substrate Layer A (`OrchestrationSession`, [TS-22](./TECH_STACK_MEMORY_SUBSTRATE.md)).

Today the file creates **architectural asymmetry**:

| Provider | Constitution invoker | Product MCP integration layer | Dedicated MCP server |
|----------|---------------------|------------------------------|-------------------|
| Google (agy) | `wall-bounce/gemini-invoker.ts` | **None** | via `techsapo-providers-mcp-server` only |
| Anthropic | `wall-bounce/claude-invoker.ts` | **None** | `claude-code-mcp-server.ts` (invoker-spawned) |
| OpenAI (Codex) | `wall-bounce/gpt5-invoker.ts` | **`codex-mcp-integration.ts`** | `codex-mcp/` + legacy path |

Additional problems:

1. **Misnamed Wall-Bounce** — `executeCodexWithWallBounce()` routes through `mcpIntegrationService.executeMCPTools()` with a **single** `codex` tool and hard-codes `consensus_score: 1.0`. It does **not** call `WallBounceAnalyzer` (2–5 rounds, 2+ providers, thresholds).
2. **Not under the orchestrator** — No import edge from `wall-bounce-analyzer.ts` / `wall-bounce/analyzer.ts`. Sibling service, not a child.
3. **Broken dependency** — `executeWithWallBounce` passes `null` as `openaiClient` into `mcp-integration/tool-execution.ts`, which calls `openaiClient.responses.create` (OpenAI Responses API). This path cannot succeed without an API key — contradicting [SECURITY.md](../SECURITY.md) CLI/SDK-only policy.
4. **Codex-only session silo** — Redis persistence is Codex-branded; [TS-22](./TECH_STACK_MEMORY_SUBSTRATE.md) forbids adding parallel `claude-session-manager` / `agy-session-manager` as sources of truth.
5. **Side-effect import** — Auto-initializes on module load (`NODE_ENV !== 'test'`) but is **not wired** to production HTTP routes (tests + docs only).
6. **Duplicate OpenAI execution paths** — `gpt5-invoker.ts`, `codex-gpt5-provider.ts`, `codex-mcp-integration.ts`, and `codex-adapter.ts` each spawn or wrap Codex differently.
7. **Vendor name before routing** — `codex-mcp-integration` and `executeCodexWithWallBounce` imply Codex-only Wall-Bounce, but P0 delegates to **all-provider** `WallBounceAnalyzer`. Historical naming causes false “WB entry = Codex module” mental model ([§4.11](#411-vendor-neutral-naming-name-vn)).

**Trigger:** SRP Phase 3 #8 (`codex-mcp-integration.ts` split) must not cement the current design. Refactor direction must be decided before module extraction.

Related: [TS-17](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) · [TS-22](./TECH_STACK_MEMORY_SUBSTRATE.md) · [TS-26](./TECH_STACK_CLI_INVOKE_METADATA.md) · [PROVIDER_INTEGRATION_BACKLOG.md](../PROVIDER_INTEGRATION_BACKLOG.md) · [codex-mcp-implementation.md](../codex-mcp-implementation.md) · [SRP_REFACTOR_DEPENDENCY_ORDER.md](../SRP_REFACTOR_DEPENDENCY_ORDER.md)

**Code navigation (mandatory for implementation):** Serena MCP (symbols / references) + ByteRover `brv-query` / `brv-curate` (decisions / patterns). See [mcp-rules.md](../agents/mcp-rules.md).

---

## 2. AS-IS

### 2.1 Responsibility map (current)

```
codex-mcp-integration.ts
├── Config load (codex-mcp.toml)
├── CodexMCPServer lifecycle (start/stop/health)
├── executeCodexWithWallBounce()
│   ├── enable_wall_bounce → mcpIntegrationService (single codex tool)  ← NOT constitution WB
│   └── else → CodexMCPServer.handleCodexTool() (direct)
├── Redis execution history (Codex-specific keys)
├── Metrics / cost helpers
└── autoInit() on import
```

### 2.2 Consumers (verified via Serena)

| Consumer | Usage |
|----------|-------|
| `tests/services/codex-mcp-server.test.ts` | Integration tests |
| `docs/codex-mcp-implementation.md` | Documentation examples |
| Module `autoInit` | Silent init at import time |
| Production routes (`server.ts`, `wall-bounce-api.ts`) | **Not referenced** |

### 2.3 Parallel stacks (OpenAI only)

| Layer | File | Role |
|-------|------|------|
| Constitution | `wall-bounce/gpt5-invoker.ts` | Multi-round peer via `codex exec` spawn |
| SRP migration | `codex-gpt5-provider.ts` | `LLMProvider` for `llm-provider-registry` (feature-flag path) |
| Product MCP | `codex-mcp-integration.ts` | Legacy Codex MCP product wrapper |
| Unified adapter | `adapters/codex-adapter.ts` | Track A-1 symmetric CLI adapter |

---

## 3. Options Considered (architecture)

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A — SRP split only** | Extract `codex-mcp-integration/` modules; keep behavior | Low risk; unblocks line-count goal | Preserves asymmetry, misnamed WB, broken Responses path |
| **B — Rename to `llm-mcp-integration`** | One generic class for all providers | Surface symmetry | Forces three MCP server types into one file; duplicates `techsapo-providers-mcp-server` |
| **C — Deprecate entirely** | Remove `codex-mcp-integration`; use only `techsapo-providers-mcp-server` + `WallBounceAnalyzer` | Simplest runtime | Breaks legacy Codex MCP tools (`codex`, `codex-reply`), TOML config, existing tests/docs |
| **D — Layered refactor (chosen)** | Shared product shell + Codex plugin; true WB delegates to analyzer; sessions → Layer A | Fixes naming/deps; enables parity; keeps legacy Codex MCP | Larger refactor; phased delivery |

---

## 4. Decision

**Chosen: Option D — Layered refactor with shared shell and Codex-specific plugin.**

### 4.1 Target architecture (v1.1)

```
┌─────────────────────────────────────────────────────────────────┐
│ Constitution Wall-Bounce                                         │
│   invokeConstitutionWallBounce() → wallBounceAnalyzer            │
│   .executeWallBounce()  (2–5 rounds, 2+ providers)             │
└───────────────────────────────▲─────────────────────────────────┘
                                │ enable_wall_bounce === true
┌───────────────────────────────┴─────────────────────────────────┐
│ MCP product integration (vendor-neutral — P0 rename)             │
│   mcp-product-integration/  (shim: codex-mcp-integration.ts †) │
│   - routing: enable_wall_bounce → invokeConstitutionWallBounce() │
│   - direct → adapter parity / plugin dispatch                    │
│   - approval (direct only), metrics, Layer A hooks               │
└───────────────────────────────▲─────────────────────────────────┘
                                │ plugin (vendor OK below)
┌───────────────────────────────┴─────────────────────────────────┐
│ Provider plugins (after routing)                                 │
│   plugins/codex/ → CodexMCPServer, codex-reply, codex TOML     │
└─────────────────────────────────────────────────────────────────┘

† `codex-mcp-integration.ts` = **deprecated shim** re-exporting `mcp-product-integration` until P2; no new logic.

Parallel MCP surfaces (role-fixed — D-11):
  legacy codex-mcp/     → codex, codex-reply, TOML, sessions (product)
  techsapo-providers    → analyze_* one-shot (Cursor / symmetric CLI)
```

### 4.2 Behavioral rules

| Rule | Requirement |
|------|-------------|
| **WB-1** | When `enable_wall_bounce === true`, call **`invokeConstitutionWallBounce()`** which delegates to `wallBounceAnalyzer.executeWallBounce()`. Minimum 2 rounds, 2+ providers, confidence ≥ 0.7, consensus ≥ 0.6. |
| **WB-2** | Forbidden: single-provider execution labeled as `wall_bounce_analysis` with `consensus_score: 1.0`. |
| **WB-3** | When `enable_wall_bounce === false`, direct path: **`codex-adapter`** when [parity checklist](#48-codex-adapter-parity-checklist-d-08) satisfied; else **`CodexMCPServer`** fallback (`transport: mcp-server` in TOML). |
| **WB-4** | Default `enable_wall_bounce` in `config/codex-mcp.toml`: **`false`** (explicit opt-in for constitution WB on product layer). |
| **SEC-1** | Forbidden: `openaiClient.responses.create` / API keys on codex-mcp-integration path. |
| **SEC-2** | `mcp-integration/tool-execution.ts` Responses branch: **feature-flag disabled** by default (D-13); adapter/CLI path when re-enabled for other products. |
| **APPR-1** | Enterprise approval via `mcpIntegrationService`: **direct path only**. WB path: analyzer is governance (D-05). |
| **MEM-1** | Layer A `OrchestrationSession` authoritative ([TS-22](./TECH_STACK_MEMORY_SUBSTRATE.md)); `providerHandles.codex` for native ids. |
| **MEM-2** | `codex-session-manager.ts` = Layer B helper only. |
| **REPLY-1** | **`codex-reply` unchanged in P0** — stays on `CodexMCPServer` + `CodexSessionManager`. Adapter continue: **P3** after Layer A (D-07). |
| **PAR-1** | No `claude-mcp-integration.ts` / `agy-mcp-integration.ts` full copies. |
| **PAR-2** | Invokers → `src/adapters/*` (Track B, P4). |
| **INIT-1** | **P0:** `autoInit` logs deprecation warning. **P0+1 PR:** remove autoInit; explicit bootstrap only (D-09). |
| **SRP-1** | `shouldUseSRPArchitecture()`: document forbidden until invokers implemented; **runtime logs warn and forces false** (D-17). |
| **NAME-1** | ~~Retain `codex-mcp-integration` as canonical name~~ **Superseded by NAME-VN (v1.2).** |
| **NAME-VN** | **Vendor proper names forbidden before routing boundary** — see [§4.11](#411-vendor-neutral-naming-name-vn). |

### 4.3 `invokeConstitutionWallBounce()` (D-03)

New thin module (location: `src/services/wall-bounce/constitution-invoke.ts` or `src/services/invoke-constitution-wall-bounce.ts`):

- Single entry for constitution WB from product layer and (later) RAG Phase 2.
- Maps `WallBounceResult` → `MCPProductResult` per [§4.4](#44-result-mapping-d-06).
- Does **not** route through `executeWallBounceWithSRP()` while SRP invokers are stubs (SRP-1).

### 4.4 Result mapping (D-06)

Backward-compatible **`MCPProductResult`** (legacy alias `CodexIntegrationResult` deprecated in P0) when delegating to analyzer:

| `MCPProductResult` field | Source (`WallBounceResult`) |
|--------------------------|-----------------------------|
| `success` | `consensus.confidence >= 0.7` (and no throw) |
| `response` | `consensus.content` |
| `wall_bounce_analysis.providers_used` | `llm_votes.map(v => v.provider)` |
| `wall_bounce_analysis.consensus_score` | computed consensus (never hard-coded `1.0`) |
| `wall_bounce_analysis.confidence_score` | `consensus.confidence` |
| `cost_analysis.actual_cost` | `total_cost` |
| `performance_metrics.total_time_ms` | `processing_time_ms` |

### 4.5 Resolved decisions (v1.1)

| ID | Decision | Notes |
|----|----------|-------|
| **D-01** | **D** — `Accepted` + implementation defaults in this ADR | Status upgraded v1.1 |
| **D-02** | **C** — P0: WB contract only; Redis/Layer A in P3 | M1 not blocking P0 |
| **D-03** | **C** — `invokeConstitutionWallBounce()` helper | §4.3 |
| **D-04** | **A** — TOML default `enable_wall_bounce = false` | WB-4 |
| **D-05** | **D** — Approval: direct only | APPR-1 |
| **D-06** | **A** — Keep `CodexIntegrationResult`; map from analyzer | §4.4 |
| **D-07** | **A** *(adjusted)* — `codex-reply` stays on legacy MCP in P0 | REPLY-1; not adapter in P0 |
| **D-08** | **C** *(adjusted)* — Extend adapter with parity checklist; MCP server fallback | §4.8 |
| **D-09** | **B** *(adjusted)* — Deprecated `autoInit` in P0; remove P0+1 PR (tracked issue) | INIT-1 |
| **D-10** | **D** *(adjusted)* — Shell under `mcp-product-integration/` (inside or beside `mcp-integration/` per P1 layout) | Not `codex-mcp-integration/` for shared logic |
| **D-11** | **C** *(adjusted)* — Role-fixed dual MCP; legacy deprecate **P4+** only | Not merge to unified in P0–P2 |
| **D-12** | **D** — No production HTTP wire until Track B API design | Consumers: tests + CLI |
| **D-13** | **B** — Feature-flag off Responses branch in `tool-execution` | SEC-2 |
| **D-14** | **B′** *(adjusted)* — P4: thin `CodexLLMProvider` wrapper over `codex-adapter`; no 400-line merge | Not wired into codex-mcp-integration |
| **D-15** | **A** *(adjusted)* — Do not change Redis history in P0 | Migrate in P3 |
| **D-16** | **D′** *(adjusted)* — RAG: Phase 1 remove pseudo-WB + deprecation warning; Phase 2 separate ADR | §5 Phase RAG-1 |
| **D-17** | **D+** *(adjusted)* — Document SRP flag forbidden + runtime fallback to false | SRP-1 |
| **D-18** | **C + D** — Serena + `brv` for code scan; `brv-curate` after milestones | §1 |

### 4.6 High-severity re-review items

The following **accepted** choices still carry **residual high risk** after mitigations. Re-select before the listed gate if concerns remain (see §4.7).

| ID | Accepted choice | Residual high risk | Gate |
|----|-----------------|-------------------|------|
| **D-08** | Adapter parity then prefer adapter | P0–P2 **dual direct path** persists; parity slip delays adapter cutover | P0 exit |
| **D-10** | `mcp-integration/provider-product/` | **Responsibility creep** into enterprise MCP orchestration | P1 start |
| **D-16** | RAG Phase 1 pseudo-WB removal | **`POST /search` API behavior change** for `enable_wall_bounce` clients | RAG-1 PR |
| **D-13** | Disable Responses branch via flag | **Unknown consumers** of Responses path outside codex-integration | P0 (audit) |

Items **downgraded** by v1.1 mitigations (no longer high): D-07 (A not B), D-11 (C not B), D-15 (A not D), D-17 (runtime fallback added).

### 4.7 Re-review option matrix (high residual only)

#### D-08 — Direct path transport (re-review at P0 exit)

| Option | Summary | Residual risk |
|--------|---------|---------------|
| **D-08-C** *(accepted)* | Parity checklist + `codex-adapter` preferred; `CodexMCPServer` fallback | Medium — dual path until parity done |
| **D-08-B** | **`CodexMCPServer` only** for direct until P4 | Low — delays adapter; keeps asymmetry longer |
| **D-08-D** | TOML `transport: adapter \| mcp-server` explicit (no auto cutover) | Low — operator burden |
| **D-08-A** | **`codex-adapter` only** in P0 (drop sandbox/reply options on direct) | High — feature loss |

#### D-10 — Shared shell placement (re-review at P1 start)

| Option | Summary | Residual risk |
|--------|---------|---------------|
| **D-10-D** *(accepted)* | `mcp-integration/provider-product/` submodule | Medium — same package, import discipline required |
| **D-10-A** | Top-level `mcp-product-integration/` | Low — clearest SRP boundary |
| **D-10-C** | Skip P1; P0 + P2 split only | Medium — shell logic stays in monolith longer |
| **D-10-E** | Shell logic in `codex-mcp-integration/` only (no shared) | Low — PAR-1 friendly short-term; duplicates later |

#### D-16 — RAG wall-bounce (re-review before RAG-1 PR)

| Option | Summary | Residual risk |
|--------|---------|---------------|
| **D-16-D′** *(accepted)* | Phase 1: remove `mcp__gpt_5__*` pseudo-WB; deprecation warning | High API — clients lose parallel model analysis |
| **D-16-A** | Leave `rag-endpoint.ts` unchanged in TS-28 scope | Low — pseudo-WB remains misleading |
| **D-16-E** | Phase 1: `enable_wall_bounce` **ignored** (no-op), keep response shape | Medium — silent behavior change |
| **D-16-F** | Phase 1: return **501** when `enable_wall_bounce=true` with migration doc | Medium — explicit break, easier support |

#### D-13 — Responses API branch (re-review at P0 audit)

| Option | Summary | Residual risk |
|--------|---------|---------------|
| **D-13-B** *(accepted)* | Feature-flag default **off** | Medium until audit complete |
| **D-13-C** | Delete Responses branch (separate PR) | High if hidden consumers exist |
| **D-13-A** | Leave branch; codex-integration only bypasses | Low code change — SEC debt remains |
| **D-13-D** | Replace with adapter dispatch in `tool-execution` | Medium — larger P0 |

### 4.8 Codex-adapter parity checklist (D-08)

Direct path **must** use `codex-adapter` when all required items for the request are satisfied:

| Capability | `codex-adapter` (P0) | `CodexMCPServer` fallback |
|------------|------------------------|---------------------------|
| One-shot `codex exec` | Yes | Yes |
| `sandbox` | No → fallback | Yes |
| `reasoning_effort` / `verbosity` | No → fallback | Yes |
| `codex-reply` / session continue | No (P3) | Yes |
| MCP tools/resources protocol | No | Yes |

TOML: `codex.transport = "auto" | "adapter" | "mcp-server"` — default **`auto`** (checklist-driven).

### 4.9 API shape (direction — vendor-neutral)

```typescript
// mcp-product-integration/types.ts — NO vendor name in type or entry API
interface MCPProductRequest {
  prompt: string;
  sessionId?: string; // Layer A (P3)
  context: {
    task_type: 'basic' | 'premium' | 'critical';
    cost_tier: 'low' | 'medium' | 'high';
    user_id?: string;
  };
  options?: {
    enable_wall_bounce?: boolean;
    /** Set only after routing to a direct single-provider plugin */
    direct?: {
      providerId: 'codex'; // extensible; required for direct path only
      model?: string;
      transport?: 'auto' | 'adapter' | 'mcp-server';
      sandbox?: string;
      reasoning_effort?: 'minimal' | 'medium' | 'high';
      verbosity?: 'low' | 'medium' | 'high';
    };
  };
}

interface MCPProductResult { /* wall_bounce_analysis, cost_analysis, … */ }
```

**Canonical entry (P0):** `executeMCPProduct(request: MCPProductRequest): Promise<MCPProductResult>`

**Deprecated aliases (one release minimum):** `getCodexMCPIntegration`, `executeCodexWithWallBounce`, `CodexIntegrationResult`, `CodexWallBounceRequest` — log deprecation; remove P2+.

### 4.10 SRP Phase 3 #8 module layout (v1.2)

| Path | Contents |
|------|----------|
| `mcp-product-integration/` | Vendor-neutral routing, WB delegation, types, metrics (P0 core + P2 split) |
| `mcp-product-integration/plugins/codex/` | Codex-only: `CodexMCPServer` bind, TOML slice, `codex-reply` |
| `codex-mcp-integration.ts` | **Deprecated shim** → `mcp-product-integration/index.ts` (no new logic) |

**Gate:** Do not split #8 before P0 (WB-1, SEC-1, NAME-VN rename of public multi-provider APIs) lands.

### 4.11 Vendor-neutral naming (NAME-VN)

**Problem:** `codex-mcp-integration` predates constitution `wall-bounce/` and unified adapters. The module **routes** to multi-provider `WallBounceAnalyzer` when `enable_wall_bounce === true`. A **vendor proper name in the module or method that runs before routing** implies “Wall-Bounce = Codex path only” — false and harmful for Track B.

#### 4.11.1 Rule

| Zone | Vendor names (`codex`, `claude`, `agy`, `gemini`, …) |
|------|--------------------------------------------------------|
| **Before routing boundary** | **Forbidden** in paths, classes, and public methods that decide WB vs direct vs which orchestrator |
| **After routing boundary** | **Allowed** — adapters, plugins, MCP servers, Layer B session helpers, TOML `[codex]` section |
| **Constitution / multi-LLM** | **Must be vendor-neutral** — `invokeConstitutionWallBounce`, `WallBounceAnalyzer`, `MCPProductRequest` |

**Routing boundary** = the function that branches on `enable_wall_bounce` (or execution mode) **before** any single-provider spawn.

#### 4.11.2 Allowed Codex-specific names (unchanged)

| Asset | Why vendor OK |
|-------|----------------|
| `codex-mcp/`, `CodexMCPServer`, `codex-mcp-server.ts` | OpenAI Codex MCP **product** only |
| `codex-adapter.ts`, `codex-session-manager.ts` | Invoked **after** `providerId: 'codex'` |
| `config/codex-mcp.toml` `[codex]` | Provider-scoped config file |
| `codex-gpt5-provider.ts` | SRP registry slot (P4 thin wrapper target) |

#### 4.11.3 Rename map (P0 → P2)

| AS-IS (misleading) | To-Be (canonical) | Phase |
|--------------------|-------------------|-------|
| `codex-mcp-integration.ts` (logic) | `mcp-product-integration/` | P0 extract; P2 SRP split |
| `CodexMCPIntegration` | `MCPProductIntegration` | P0 |
| `getCodexMCPIntegration()` | `getMCPProductIntegration()` | P0 |
| `executeCodexWithWallBounce()` | `executeMCPProduct()` | P0 |
| `CodexWallBounceRequest` | `MCPProductRequest` | P0 |
| `CodexIntegrationResult` | `MCPProductResult` | P0 |
| `codex-mcp-integration.ts` (file) | Shim re-export only | P0–P2 then delete shim P2+ |

New code **must not** add `*-mcp-integration.ts` per vendor (reinforces PAR-1).

#### 4.11.4 Documentation rule

Human-facing architecture docs use **execution mode** (単発 / パラレル / シリアル / Wall-Bounce) as the primary axis; **entry path** is secondary. Never describe constitution Wall-Bounce as “the Codex integration path.”

---

## 5. Implementation Phases

| Phase | Scope | Exit criteria | Gate |
|-------|-------|---------------|------|
| **P0 — Contract fix** | WB-1/2/4, `invokeConstitutionWallBounce`, **NAME-VN renames**, mapping §4.4, SEC-1/2, APPR-1, INIT-1 deprecation, SRP-1 fallback, TOML default false, D-13 audit | Analyzer delegation; neutral public API; deprecated codex-prefixed aliases | Re-review **D-08**, **D-13** |
| **P0+1** | Remove `autoInit` | No import side effects | Issue linked from D-09 |
| **P1 — Codex plugin** | `mcp-product-integration/plugins/codex/` | TOML + `CodexMCPServer` only under plugin | Re-review **D-10** |
| **P2 — SRP split (#8)** | `mcp-product-integration/` modules; remove logic from deprecated shim | ≤500 lines/file | After P0 |
| **P3 — Memory M1** | Layer A store; REPLY-1 adapter continue design | MEM-1/2; history key migration | TS-22 M1 |
| **P4 — Invoker parity** | `gpt5-invoker` → `codex-adapter`; D-14 thin wrapper; D-11 legacy deprecate evaluation | Single Codex spawn in constitution path | Track B |
| **RAG-1** | D-16 Phase 1: remove pseudo-WB in `rag-endpoint.ts` | Deprecation warning + docs | Re-review **D-16** |

---

## 6. Consequences

### Positive

- Constitution WB is the only multi-LLM path; product layer defaults to direct Codex.
- Security policy aligned (no Responses API on integration path).
- Dual MCP roles documented; no forced merge in P0–P2.
- Vendor-neutral naming prevents “WB = Codex module” misconception (NAME-VN).

### Negative / trade-offs

- Dual direct transport until adapter parity (D-08).
- `mcp-integration/` package grows (mitigated by `provider-product/` subdir).
- RAG Phase 1 may break clients relying on pseudo-WB (D-16).
- SRP architecture remains in repo but runtime-disabled until invokers exist.

### Forbidden follow-ups

- `claude-mcp-integration.ts` / `agy-mcp-integration.ts` as full stacks.
- Single-LLM bypass labeled as Wall-Bounce.
- Wiring `codex-gpt5-provider.ts` into `mcp-product-integration`.
- New vendor-prefixed `*-mcp-integration` modules (PAR-1).
- Vendor names in public APIs **before** routing boundary (NAME-VN).
- `codex-reply` → adapter in P0 (D-07 A).

---

## 7. Sync Required

- [x] `docs/decisions/README.md` — TS-28 status Accepted v1.1
- [x] `docs/DOCUMENTATION_INDEX.md`
- [x] `docs/SRP_REFACTOR_DEPENDENCY_ORDER.md` — P0 gate on #8
- [x] `docs/PROVIDER_INTEGRATION_BACKLOG.md` — Track B cross-link
- [x] `docs/ARCHITECTURE.md` — codex-mcp-integration + dual MCP note
- [x] `docs/TECH_STACK_WORKSPACE.md` — TS-28 row
- [x] `config/codex-mcp.toml` — `enable_wall_bounce = false` (D-04)
- [x] `docs/codex-mcp-implementation.md` — TS-28 alignment
- [x] `README.md` + `README_en.md` — TS-28 summary
- [x] `docs/MCP_SERVICES.md` — dual MCP flows
- [x] `docs/WALL_BOUNCE_AS_IS.md` — legacy codex product
- [x] `docs/FORK_STATUS.md` + `docs/ja/FORK_STATUS.md` — milestone row
- [x] `brv-curate` — TS-28 v1.1 snapshot (D-18)
- [ ] Implementation PR(s) — P0 code

---

## 8. References

- [WALL_BOUNCE_SYSTEM.md](../WALL_BOUNCE_SYSTEM.md)
- [MCP_SERVICES.md](../MCP_SERVICES.md)
- [mcp-rules.md](../agents/mcp-rules.md)
- [TECH_STACK_MEMORY_SUBSTRATE.md](./TECH_STACK_MEMORY_SUBSTRATE.md) (TS-22)
- [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) (TS-17)
- [TECH_STACK_CLI_INVOKE_METADATA.md](./TECH_STACK_CLI_INVOKE_METADATA.md) (TS-26)
- [SRP_MONOLITH_REFACTOR.md](../SRP_MONOLITH_REFACTOR.md)
- `src/services/codex-mcp-integration.ts`
- `src/services/mcp-integration/`
- `src/adapters/codex-adapter.ts`
- `src/routes/rag-endpoint.ts`
- `src/services/techsapo-providers-mcp-server.ts`
