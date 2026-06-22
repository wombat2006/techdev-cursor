# SRP Monolith Refactor — Implementation Record

**Status:** Active (2026-06-22)  
**Scope:** File-size / Single-Responsibility refactor of oversized TypeScript modules in `src/`  
**Audience:** Maintainers, reviewers, coding agents  
**Related:** [legacy/SRP_MIGRATION_STRATEGY.md](./legacy/SRP_MIGRATION_STRATEGY.md) (orchestrator-level SRP), [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md) (constitution), [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## 1. Purpose

Several core files had grown beyond maintainable size (≈600–1,850 lines). This refactor **splits monoliths into focused modules** (~500 lines max per file) while preserving **backward-compatible import paths** via thin shim files.

Goals:

| Goal | Detail |
|------|--------|
| **SRP** | One module ≈ one concern (invokers, routes, metrics domain, approval workflow, etc.) |
| **Stable API** | Existing `import … from './services/wall-bounce-analyzer'` paths unchanged |
| **Constitution** | Wall-Bounce entry remains `src/services/wall-bounce-analyzer.ts` (re-export only) |
| **Testability** | Module-level Jest suites under `tests/services/*-modules.test.ts` |
| **Traceability** | ByteRover (`brv-curate`) used to record patterns for agents |

This document is the **canonical record** of what was split, where code lives now, and how to extend the pattern.

---

## 2. Conventions (apply to all splits)

### 2.1 Shim pattern

```
Original path (public)          Module directory (implementation)
─────────────────────          ─────────────────────────────────
src/foo.ts          ──export──► src/foo/index.ts + src/foo/*.ts
```

- The **shim** at the original path contains **re-exports only** (no logic).
- Internal imports use the **directory** (`./wall-bounce/…`), not the shim, to avoid circular imports.
- Example: `file-type-detector.ts` → `export … from './file-type-detector/index'` (not `'./file-type-detector'`).

### 2.2 Size target

- Target: **≤ ~500 lines** per module.
- Acceptable exceptions: data-heavy tables (e.g. `magic-patterns.ts` at 482 lines).

### 2.3 Tests

| Suite | Pattern |
|-------|---------|
| Module smoke / unit | `tests/services/<area>-modules.test.ts` |
| Wall-Bounce regression | `tests/services/wall-bounce-modules.test.ts`, `opus-aggregate-escalation.test.ts` |
| Run command | `npm test -- --testPathPattern="…-modules\|wall-bounce\|opus-aggregate\|file-type-detector" --forceExit` |

`--forceExit` is required when suites pull in `prometheus/persistence.ts` (Redis snapshot `setInterval` keeps Jest alive).

### 2.4 Typecheck

```bash
npx tsc --noEmit
```

All splits must pass before merge.

---

## 3. Summary inventory

| Original monolith | ~Before | Module dir | Shim | Max module (lines) |
|-------------------|---------|------------|------|-------------------|
| `wall-bounce-analyzer.ts` | 1,852 | `src/services/wall-bounce/` | `wall-bounce-analyzer.ts` | 282 (`analyzer.ts`) |
| `codex-mcp-server.ts` | 1,332 | `src/services/codex-mcp/` | `codex-mcp-server.ts` | 416 (`mcp-handlers.ts`) |
| `file-type-detector.ts` | 948 | `src/utils/file-type-detector/` | `file-type-detector.ts` | 482 (`magic-patterns.ts`) |
| `log-analyzer.ts` | 1,292 | `src/services/log-analyzer/` | `log-analyzer.ts` | 359 (`comprehensive-analysis.ts`) |
| `mcp-integration-service.ts` | 695 | `src/services/mcp-integration/` | `mcp-integration-service.ts` | 183 (`index.ts`) |
| `prometheus-client.ts` | 620 | `src/metrics/prometheus/` | `prometheus-client.ts` | 147 (`rag-metrics.ts`) |
| `wall-bounce-server.ts` | 594 | `src/wall-bounce-server/` | `wall-bounce-server.ts` | 139 (`routes/rag-routes.ts`) |
| `index.ts` (main server) | 670 | `src/server/` | `index.ts` (bootstrap + re-export) | 141 (`llm-health.ts`) |
| `googledrive-connector.ts` | 792 | `src/services/googledrive-connector/` | `googledrive-connector.ts` | 194 (`rag-search.ts`) |
| `cost-tracking.ts` | 437 | `src/services/cost-tracking/` | `cost-tracking.ts` | ~385 (`service.ts`) |
| `mcp-config-manager.ts` | 392 | `src/services/mcp-config-manager/` | `mcp-config-manager.ts` | 147 (`manager.ts`) |
| `ultra-conservative-monitor.ts` | 579 | `src/services/ultra-conservative-monitor/` | `ultra-conservative-monitor.ts` | 244 (`monitor.ts`) |
| `mcp-performance-monitor.ts` | 543 | `src/services/mcp-performance-monitor/` | `mcp-performance-monitor.ts` | 154 (`monitor.ts`) |
| `srp-safety-monitor.ts` | 424 | `src/services/srp-safety-monitor/` | `srp-safety-monitor.ts` | 155 (`monitor.ts`) |

**Total:** 14 monoliths → 14 module trees + 14 shims. **86+ tests** in the SRP module suite (13 suites) as of this record.

**Dependency order:** [SRP_REFACTOR_DEPENDENCY_ORDER.md](./SRP_REFACTOR_DEPENDENCY_ORDER.md)

---

## 4. Per-area detail

### 4.1 Wall-Bounce analyzer (constitution path)

**Shim:** `src/services/wall-bounce-analyzer.ts`  
**Modules:** `src/services/wall-bounce/`

| File | Lines | Responsibility |
|------|-------|----------------|
| `analyzer.ts` | 282 | `WallBounceAnalyzer`, `executeWallBounce`, `optimizePrompt` |
| `sequential-mode.ts` | 262 | Sequential multi-round execution |
| `parallel-mode.ts` | 199 | Parallel provider execution |
| `prompt-builder.ts` | 224 | Prompts, `buildWallBounceResult`, depth validation |
| `gpt5-invoker.ts` | 181 | Codex CLI (OpenAI Tier 2) |
| `cognitive-analysis.ts` | 119 | Aggregator / cognitive signal selection |
| `claude-invoker.ts` | 113 | Claude MCP invoker |
| `provider-registry.ts` | 94 | Provider registration |
| `provider-dispatch.ts` | 76 | `invokeProvider`, `getProviderOrder` |
| `gemini-invoker.ts` | 70 | Antigravity CLI (`agy`) |
| `config.ts`, `types.ts`, `mode-context.ts`, `aggregate-runner.ts`, `query-classifier.ts`, `text-utils.ts` | &lt;105 each | Config, types, helpers |
| `index.ts` | 10 | Public exports |

**Notes:**

- Constitution rule **#4** unchanged: implementation path is still `wall-bounce-analyzer.ts` (shim → `wall-bounce/`).
- Coexists with earlier SRP layer (`wall-bounce-adapter.ts`, `wall-bounce-orchestrator.ts`, `consensus-engine.ts`) — adapter used when `shouldUseSRPArchitecture()` is true.
- Tests: `wall-bounce-modules.test.ts` (7), `opus-aggregate-escalation.test.ts` (5).

---

### 4.2 Codex MCP server

**Shim:** `src/services/codex-mcp-server.ts`  
**Modules:** `src/services/codex-mcp/`

| File | Lines | Responsibility |
|------|-------|----------------|
| `mcp-handlers.ts` | 416 | `registerCodexMcpHandlers` (tools / prompts / resources) |
| `tool-handlers.ts` | 349 | `handleCodexTool`, session, cleanup, metrics |
| `codex-executor.ts` | 158 | `executeCodex` spawn logic |
| `server.ts` | 137 | `CodexMCPServer` facade, start/stop |
| `performance-store.ts` | 131 | Cache, batching, metrics store |
| `types.ts`, `output-parser.ts`, `log-utils.ts`, `prompt-utils.ts`, `mcp-handler-context.ts` | ≤66 | Types, parsing, utilities |
| `index.ts` | 6 | Re-exports |

**Tests:** `codex-mcp-modules.test.ts` (3).  
**Known pre-existing issue:** `codex-mcp-server.test.ts` fails to parse (uuid ESM / Jest) — unrelated to this split.

---

### 4.3 File type detector

**Shim:** `src/utils/file-type-detector.ts` → `./file-type-detector/index`  
**Modules:** `src/utils/file-type-detector/`

| File | Lines | Responsibility |
|------|-------|----------------|
| `magic-patterns.ts` | 482 | Magic-byte signatures |
| `text-detection.ts` | 223 | Text / encoding heuristics |
| `office-detection.ts` | 116 | Office Open XML detection |
| `detect.ts` | 106 | Main `detectFileType` orchestration |
| `types.ts` | 19 | Interfaces |
| `index.ts` | 2 | Re-exports |

**Tests:** `file-type-detector.test.ts` (35) — unchanged path, still passes.

**Fixes during split:** `export export` typo, broken block comment, missing `}`, circular shim path.

---

### 4.4 Log analyzer

**Shim:** `src/services/log-analyzer.ts`  
**Modules:** `src/services/log-analyzer/`  
**Consumer:** `src/server.ts` → `LogAnalyzer` from `./services/log-analyzer`

| File | Lines | Responsibility |
|------|-------|----------------|
| `analyze-entry.ts` | 111 | `analyzeLogs` — Wall-Bounce first, emergency fallback |
| `comprehensive-analysis.ts` | 359 | Permission / core dump / connection / startup analyzers |
| `domain-analyzers.ts` | 301 | systemd, nginx, mysql, kernel, application, general |
| `wall-bounce-pipeline.ts` | 283 | Mandatory multi-LLM path (`performMandatoryWallBounceAnalysis`) |
| `error-context.ts` | 127 | `detectLogType`, `extractErrorContext`, `generateDynamicSolution` |
| `systemd-ai.ts` | 38 | Context7 knowledge bridge → comprehensive analysis |
| `types.ts` | 53 | `LogAnalysisRequest`, `LogAnalysisResult`, `ErrorContext` |
| `logger.ts` | 1 | Re-exports `../../utils/logger` (Jest-safe) |
| `index.ts` | 5 | `LogAnalyzer` static class |

**Dependency graph (simplified):**

```
analyze-entry
  ├── domain-analyzers ──► error-context ──► systemd-ai ──► comprehensive-analysis
  └── wall-bounce-pipeline
```

**Tests:** `log-analyzer-modules.test.ts` (3).

---

### 4.5 MCP integration service

**Shim:** `src/services/mcp-integration-service.ts`  
**Modules:** `src/services/mcp-integration/`  
**Consumers:** `codex-mcp-integration.ts`, `mcp-performance-monitor.ts`

| File | Lines | Responsibility |
|------|-------|----------------|
| `index.ts` | 183 | `MCPIntegrationService`, singleton `mcpIntegrationService` |
| `performance-store.ts` | 174 | Cache, circuit breaker, request queue, metrics |
| `analytics.ts` | 114 | `buildAnalytics`, `buildSystemStatus` |
| `tool-execution.ts` | 102 | OpenAI Responses API execution for approved tools |
| `approval-workflow.ts` | 94 | `processApprovalWorkflow`, `simulateApprovalDecision` |
| `types.ts` | 45 | `MCPExecutionRequest`, `MCPExecutionResult` |

**Tests:** `mcp-integration-modules.test.ts` (3).

---

### 4.6 Prometheus metrics client

**Shim:** `src/metrics/prometheus-client.ts` → `./prometheus/index`  
**Modules:** `src/metrics/prometheus/`  
**Wrapper class:** `prometheus-client-class.ts` (unchanged — delegates to shim)

| File | Lines | Responsibility |
|------|-------|----------------|
| `rag-metrics.ts` | 147 | RAG / Google Drive / webhook metrics + record helpers |
| `persistence.ts` | 106 | Redis snapshot, restore, SIGTERM/SIGINT hooks, 5-min interval |
| `infrastructure-metrics.ts` | 90 | Redis, MySQL, cache, errors, circuit breaker, resource gauges |
| `wall-bounce-metrics.ts` | 63 | Wall-Bounce counters/histograms + `recordWallBounceAnalysis` |
| `http-metrics.ts` | 55 | HTTP request metrics + `recordHttpRequest` |
| `llm-metrics.ts` | 53 | LLM metrics + `recordLLMResponse` |
| `initialize.ts` | 35 | `initializeMetrics` (default gauge values, restore on boot) |
| `security-metrics.ts` | 26 | Auth, rate limit, sanitization counters |
| `registry.ts` | 11 | `register` + `collectDefaultMetrics` |
| `model-map.ts` | 9 | `getModelByProvider` |
| `index.ts` | 18 | Re-exports + load log |

**Tests:** `prometheus-wall-bounce-server-modules.test.ts` (prometheus section).

---

### 4.7 Wall-Bounce server (legacy IT-support process)

**Shim:** `src/wall-bounce-server.ts` (loads `node-deprecation-suppressor`, re-exports `app` / `server`)  
**Modules:** `src/wall-bounce-server/`

| File | Lines | Responsibility |
|------|-------|----------------|
| `routes/rag-routes.ts` | 139 | `/api/v1/rag/search`, `/api/v1/rag/status` |
| `routes/generate-routes.ts` | 109 | `/api/v1/generate` |
| `routes/log-analysis-routes.ts` | 92 | `/api/v1/analyze-logs` |
| `create-app.ts` | 75 | Express factory, middleware, route registration, error handlers |
| `routes/health-routes.ts` | 48 | `/metrics`, `/health`, `/api/v1/health` |
| `routes/debug-routes.ts` | 49 | `/api/v1/debug/wall-bounce` |
| `rag-connector.ts` | 40 | Shared `GoogleDriveRAGConnector` lazy singleton |
| `srp-executor.ts` | 31 | `executeWallBounceWithSRP` (adapter vs legacy analyzer) |
| `index.ts` | 26 | `app.listen`, graceful SIGTERM |

**Tests:** `prometheus-wall-bounce-server-modules.test.ts` (wall-bounce-server section).

---

### 4.8 Main API server (`index.ts`)

**Entry:** `src/index.ts` (15 lines — bootstrap when `require.main === module`)  
**Modules:** `src/server/`

| File | Lines | Responsibility |
|------|-------|----------------|
| `llm-health.ts` | 141 | `/api/v1/llm-health` (agy + codex CLI probes) |
| `routes.ts` | 137 | `/metrics`, static public files, API mounts, `/api/docs`, `/api/status` |
| `test-factory.ts` | 92 | `createServer()` for integration tests |
| `techsapo-server.ts` | 83 | `TechSapoServer` class |
| `internal-health.ts` | 78 | `fetchInternalHealthStatus` (localhost HTTP client) |
| `middleware.ts` | 72 | helmet, cors, body parser, request log, `/ping` |
| `lifecycle.ts` | 51 | Graceful shutdown, process signal handlers |
| `index.ts` | 2 | Re-exports |

**Route mounts (in `routes.ts`):**

- `/api/v1/wall-bounce` → `wall-bounce-api`
- `/api/v1/huggingface`, `/api/huggingface` → `huggingface-routes`
- `/api/v1/rag` → `rag-endpoint`
- `/api/v1/webhooks`, `/api/v1/webhook-setup` → webhook routes
- `/test-ui` → `test-ui`

**Tests:** `server-modules.test.ts` (3) — mocks heavy route imports for `TechSapoServer` instantiation.  
**Integration:** `tests/integration/api.test.ts` uses `createServer` from `src/index` (unchanged).

---

### 4.9 Google Drive RAG connector (legacy)

**Shim:** `src/services/googledrive-connector.ts`  
**Modules:** `src/services/googledrive-connector/`  
**Consumers:** `rag-endpoint`, `webhook-endpoints`, `webhook-setup`, `googledrive-push-setup`, `googledrive-webhook-handler`, `wall-bounce-server/rag-connector`

| File | Lines | Responsibility |
|------|-------|----------------|
| `rag-search.ts` | 194 | `searchRAG`, `searchWithMCP` (Responses API + MCP) |
| `download-document.ts` | 173 | Size-based arraybuffer / streaming download |
| `vector-store.ts` | 159 | Vector store create / add / remove |
| `sync-operations.ts` | 148 | `syncFolderToRAG`, `syncDocumentsById` |
| `connector.ts` | 96 | `GoogleDriveRAGConnector` facade |
| `list-documents.ts` | 60 | Drive file listing |
| `types.ts` | 28 | Config + document interfaces |

**Pattern:** Pure functions take `(drive, openai, …)`; class delegates via `syncOps()` bundle.

**Tests:** `googledrive-cost-tracking-modules.test.ts` (shim export smoke).

> Legacy AS-IS — platform delegation per [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md). Refactor is for maintainability only.

---

### 4.10 Cost tracking (Hugging Face)

**Shim:** `src/services/cost-tracking.ts`  
**Modules:** `src/services/cost-tracking/`  
**Consumer:** `controllers/huggingface-controller.ts`

| File | Lines | Responsibility |
|------|-------|----------------|
| `service.ts` | ~385 | `CostTrackingService` — records, summaries, alerts, cleanup |
| `model-pricing.ts` | ~35 | `createDefaultModelPricing`, `calculateModelCost` |
| `types.ts` | ~27 | `CostSummary`, `BudgetAlert` |

**Tests:** `googledrive-cost-tracking-modules.test.ts` (pricing multiplier).

---

### 4.11 MCP config manager

**Shim:** `src/services/mcp-config-manager.ts`  
**Modules:** `src/services/mcp-config-manager/`  
**Consumers:** `mcp-approval-manager.ts`, `mcp-integration/*`

| File | Lines | Responsibility |
|------|-------|----------------|
| `manager.ts` | 147 | `MCPConfigManager` — tool selection, approval lookup, config updates |
| `defaults.ts` | 77 | `buildDefaultToolConfigurations` (Cipher, Context7, Drive, Gmail, SharePoint) |
| `selection.ts` | 70 | Priorities, security/env gates, contextual optimizations |
| `cost-estimation.ts` | 44 | `estimateToolCosts` |
| `types.ts` | 34 | `MCPToolConfig`, `MCPConfigContext`, `COST_THRESHOLDS` |

**Tests:** `mcp-config-manager-modules.test.ts` (selection, cost estimation, shim smoke).

---

### 4.12 Ultra-conservative monitor (Phase 3 rollout)

**Shim:** `src/services/ultra-conservative-monitor.ts`  
**Modules:** `src/services/ultra-conservative-monitor/`  
**Consumers:** none in `src/` (leaf — legacy gradual rollout tooling)

| File | Lines | Responsibility |
|------|-------|----------------|
| `monitor.ts` | 244 | `UltraConservativeMonitor` singleton — phase transitions, interval loop |
| `phase-configurations.ts` | 77 | `buildPhaseConfigurations`, `getPreviousPhase`, traffic % |
| `pre-transition-check.ts` | 76 | Pre-transition safety gate |
| `types.ts` | 73 | Phase/metrics/evaluation types |
| `metrics-collector.ts` | 54 | Simulated metrics collection |
| `health-evaluation.ts` | 57 | `evaluatePhaseHealth` |
| `stability-score.ts` | 32 | Rolling stability score from history |
| `math-utils.ts` | 5 | `calculateVariance` |

**Tests:** `ultra-conservative-monitor-modules.test.ts` (phase ladder, health evaluation, shim smoke).

---

### 4.13 MCP performance monitor

**Shim:** `src/services/mcp-performance-monitor.ts`  
**Modules:** `src/services/mcp-performance-monitor/`  
**Consumers:** `package.json` scripts (`mcp-performance`, `mcp-metrics`, `mcp-alerts`, `mcp-recommendations`)

| File | Lines | Responsibility |
|------|-------|----------------|
| `monitor.ts` | 154 | `MCPPerformanceMonitor` — interval loop, public API |
| `alerts.ts` | 128 | Alert evaluation and deduplication |
| `recommendations.ts` | 88 | Optimization recommendation generation |
| `types.ts` | 87 | Metrics, alerts, thresholds types |
| `metrics-collector.ts` | 50 | `buildPerformanceMetrics`, history trim |
| `metric-calculations.ts` | 30 | Cache/cost/queue derivations |
| `performance-summary.ts` | 28 | `buildPerformanceSummary` |
| `system-metrics.ts` | 14 | Process memory/CPU snapshot |

**Tests:** `mcp-performance-monitor-modules.test.ts` (alerts, recommendations, summary, shim smoke).

---

### 4.14 SRP safety monitor (Phase 3 rollback)

**Shim:** `src/services/srp-safety-monitor.ts`  
**Modules:** `src/services/srp-safety-monitor/`  
**Consumers:** none in `src/` (leaf — Phase 3 5% safety tooling)

| File | Lines | Responsibility |
|------|-------|----------------|
| `monitor.ts` | 155 | `SRPSafetyMonitor` singleton — interval loop, event handlers |
| `safety-evaluations.ts` | 124 | Error/latency/memory/consensus threshold checks |
| `types.ts` | 43 | `SafetyMetrics`, `SafetyAlert`, thresholds |
| `metrics-collector.ts` | 38 | Simulated metrics from history + process |
| `alerts.ts` | 33 | Alert building, action hints, history trim |
| `emergency-rollback.ts` | 31 | `emergencyDisableSRP` + rollback record |
| `metrics-history.ts` | 32 | Rolling window helpers |
| `thresholds.ts` | 14 | Env-driven `loadSafetyThresholds` |

**Tests:** `srp-safety-monitor-modules.test.ts` (evaluations, alerts, shim smoke).

---

## 5. Shim reference (quick lookup)

| Shim path | Re-exports from |
|-----------|-----------------|
| `src/services/wall-bounce-analyzer.ts` | `./wall-bounce` |
| `src/services/codex-mcp-server.ts` | `./codex-mcp` |
| `src/utils/file-type-detector.ts` | `./file-type-detector/index` |
| `src/services/log-analyzer.ts` | `./log-analyzer/index` |
| `src/services/mcp-integration-service.ts` | `./mcp-integration/index` |
| `src/metrics/prometheus-client.ts` | `./prometheus/index` |
| `src/wall-bounce-server.ts` | `./wall-bounce-server/index` |
| `src/index.ts` | `./server/*` + bootstrap |
| `src/services/googledrive-connector.ts` | `./googledrive-connector/index` |
| `src/services/cost-tracking.ts` | `./cost-tracking/index` |
| `src/services/mcp-config-manager.ts` | `./mcp-config-manager/index` |
| `src/services/ultra-conservative-monitor.ts` | `./ultra-conservative-monitor/index` |
| `src/services/mcp-performance-monitor.ts` | `./mcp-performance-monitor/index` |
| `src/services/srp-safety-monitor.ts` | `./srp-safety-monitor/index` |

---

## 6. Verification checklist

After any further split in this series:

1. `npx tsc --noEmit`
2. SRP module tests (see §2.3)
3. Spot-check shim: **no logic** in shim files
4. Grep importers: `rg "from ['\"].*<old-monolith>" src/` — should hit shim only
5. Optional: `brv-curate` with module tree + pattern summary

---

## 7. Known issues (not introduced by refactor)

| Issue | Affected tests | Mitigation |
|-------|----------------|------------|
| uuid ESM under Jest | `api.test.ts`, `codex-mcp-server.test.ts` | Separate Jest config / mock uuid |
| Prometheus `setInterval` | Any suite importing full `prometheus/index` | `--forceExit` or mock persistence in unit tests |
| `googledrive-connector.ts` | Performance / security tests import connector | Legacy file; platform delegation planned |

---

## 8. Remaining large files (not yet split)

| File | ~Lines | Notes |
|------|--------|-------|
| `src/services/googledrive-connector.ts` | 792 | **Split** → `googledrive-connector/` |
| `src/services/googledrive-webhook-handler.ts` | 588 | Webhook + RAG sync |
| `src/services/ultra-conservative-monitor.ts` | 579 | **Split** → `ultra-conservative-monitor/` |
| `src/services/mcp-performance-monitor.ts` | 543 | **Split** → `mcp-performance-monitor/` |
| `src/services/codex-mcp-integration.ts` | 565 | Codex ↔ MCP integration |
| `src/utils/migrate-to-redis.ts` | 558 | One-off migration utility |

---

## 9. Agent / MCP tooling used

| Tool | Role in this refactor |
|------|------------------------|
| **Serena MCP** | Symbol overview before splitting `wall-bounce-analyzer` |
| **ByteRover (`brv-curate`)** | Curated patterns for wall-bounce, codex-mcp, log-analyzer, mcp-integration, prometheus, wall-bounce-server, server splits |

Query example for agents: `brv-query` → “SRP shim pattern for wall-bounce / log-analyzer”.

---

## 10. Changelog

| Date (JST context) | Change |
|--------------------|--------|
| 2026-06-23 | `srp-safety-monitor/` split (Phase 2 #4) |
| 2026-06-23 | Phase 2 start: `mcp-config-manager/` split; `mcp-config-manager-modules.test.ts` |
| 2026-06-23 | Phase 0–1 complete: `googledrive-connector/`, `cost-tracking/`; 64 module tests; README/ARCHITECTURE/DEVELOPMENT_GUIDE sync |
| 2026-06-22 | Initial record: 8 monolith splits, 62 SRP module tests, shims documented |

---

*For orchestrator-level SRP (Adapter / Orchestrator / ConsensusEngine), see [legacy/SRP_MIGRATION_STRATEGY.md](./legacy/SRP_MIGRATION_STRATEGY.md). For Wall-Bounce operator behavior, see [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md).*
