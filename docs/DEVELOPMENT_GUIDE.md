# TechSapo Development Guide

## 🛠️ Development Commands

### Build and Development
```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
./scripts/start-monitoring.sh  # Start with full monitoring stack
```

### Testing
```bash
npm test             # Run all tests
npm run test:coverage  # Run tests with coverage
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch   # Watch mode for development
```

### Code Quality
```bash
npm run lint         # Lint TypeScript files (ESLint on src/**/*.ts)
```

### MCP Services
```bash
npm run brv-mcp      # Start ByteRover memory MCP (brv mcp)
```

## 🏗️ Architecture Details

### Server Structure
- **Primary Server** (`src/index.ts`): Bootstrap shim → `src/server/` (`TechSapoServer`, routes, middleware)
- **Wall-Bounce Server** (`src/wall-bounce-server.ts`): Shim → `src/wall-bounce-server/` (optional legacy IT-support process)
- **Legacy alternate entry** (`src/server.ts`): Specialized server for real-time analysis and metrics (if used separately from `index.ts`)

> **SRP module layout:** Large monoliths split into directories with thin shims preserving import paths — [SRP_MONOLITH_REFACTOR.md](./SRP_MONOLITH_REFACTOR.md) · [SRP_REFACTOR_DEPENDENCY_ORDER.md](./SRP_REFACTOR_DEPENDENCY_ORDER.md)

### Key Services

#### Wall-Bounce Analyzer (`src/services/wall-bounce-analyzer.ts`)
- **Shim** → `src/services/wall-bounce/` (constitution path unchanged)
- **Multi-LLM Orchestration**: Coordinates multiple AI providers for consensus
- **Quality Assurance**: Confidence scoring and consensus validation
- **Provider Support**: OpenAI ([OPENAI_MODEL_MATRIX.md](./OPENAI_MODEL_MATRIX.md) — AS-IS: `gpt-5-codex`), Google Gemini via **Antigravity CLI（`agy`）**, OpenRouter (NO Anthropic API_KEY)
- **Task Types**: basic, premium, critical with different provider configurations
- **Agent Framework**: Optional integration with `@openai/agents` for multi-agent workflows

#### MCP Integration Services
- **MCPIntegrationService** (`src/services/mcp-integration-service.ts`): Shim → `mcp-integration/`
- **MCPConfigManager** (`src/services/mcp-config-manager.ts`): Shim → `mcp-config-manager/` — cost optimization and tool selection
- **MCPPerformanceMonitor** (`src/services/mcp-performance-monitor.ts`): Shim → `mcp-performance-monitor/` — metrics, alerts, recommendations (`npm run mcp-performance`)
- **MCPApprovalManager** (`src/services/mcp-approval-manager.ts`): Shim → `mcp-approval-manager/` — multi-layer approval workflows
- **UltraConservativeMonitor** (`src/services/ultra-conservative-monitor.ts`): Shim → `ultra-conservative-monitor/` — Phase 3 gradual rollout monitoring (leaf)
- **SRPSafetyMonitor** (`src/services/srp-safety-monitor.ts`): Shim → `srp-safety-monitor/` — Phase 3 auto-rollback safety (leaf)

#### RAG System (`src/services/googledrive-connector.ts`)
- **Shim** → `googledrive-connector/` — **legacy AS-IS** in this repo; platform delegation per [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md)
- **GoogleDrivePushSetup** (`src/services/googledrive-push-setup.ts`): Shim → `googledrive-push-setup/` — Drive push notification channel setup (`webhook-setup` routes)

#### Hugging Face (`src/services/huggingface-client.ts`)
- **Shim** → `huggingface-client/` — embeddings, inference, model info; used by `embedding-service` / `inference-service`
- **EmbeddingService** (`src/services/embedding-service.ts`): Shim → `embedding-service/` — batching, cache, multi-model analysis
- **InferenceService** (`src/services/inference-service.ts`): Shim → `inference-service/` — tiered models, conversation, analysis
- **GoogleDriveWebhookHandler** (`src/services/googledrive-webhook-handler.ts`): Shim → `googledrive-webhook-handler/` — Drive push → RAG vector sync
- **Embedding Service**: Text embeddings for semantic search
- **Vector Storage**: OpenAI vector stores for RAG operations

## 📊 API Endpoints

### Core Application (port from config)
- `POST /api/v1/generate` - Multi-LLM text generation with wall-bounce
- `POST /api/v1/analyze-logs` - Log analysis with multi-LLM consensus
- `GET /api/v1/health` - Health check with Redis/session status
- `POST /api/v1/rag/search` - RAG search against Google Drive documents

### Monitoring & Metrics
- `GET /api/v1/metrics/stream` - Server-Sent Events real-time metrics
- `GET /metrics` - Prometheus metrics endpoint
- Grafana Dashboard: `http://localhost:3000` (admin/techsapo2024!)

## 🔧 Configuration

### Environment Variables
Key variables defined in `src/config/environment.ts`:
- **OpenAI**: API key for GPT-5 ONLY (GPT-4/GPT-4o prohibited per project rules)
- **Google**: Gemini API and Google Drive OAuth credentials
- **Anthropic**: Use SDK only, NO API_KEY for MAX x5 Plan cost avoidance
- **Redis**: Connection settings for caching
- **MCP Settings**: Budget tiers, security levels, tool configurations

### TypeScript Configuration
- **Target**: ES2022 with CommonJS modules
- **Output**: `./dist/` directory
- **Source Maps**: Enabled for debugging
- **Strict Mode**: Full TypeScript strictness enabled

### Testing Setup
- **Framework**: Jest with ts-jest transformer
- **Environment**: Node.js test environment
- **Coverage**: Collected from `src/**/*.ts` (excluding .d.ts and index.ts)
- **Timeout**: 30 seconds for long-running integration tests
- **Setup**: `tests/setup.ts` for test configuration
- **SRP module suites**: `npm test -- --testPathPattern="…-modules" --forceExit` — see [TESTING_GUIDE.md](./TESTING_GUIDE.md) · [SRP_MONOLITH_REFACTOR.md](./SRP_MONOLITH_REFACTOR.md)

## 🎯 Development Guidelines

### MCP Wall-Bounce Requirements
- **Mandatory Multi-LLM**: All analysis must use 2+ LLM providers via Wall-Bounce
- **Quality Thresholds**: Confidence ≥ 0.7, Consensus ≥ 0.6 or auto-escalation
- **Japanese Responses**: Primary language for user-facing content
- **Context7 Integration**: Use Context7 MCP for technical documentation references

### Code Patterns
- **Error Handling**: Comprehensive try-catch with structured logging (`src/utils/logger.ts`)
- **Redis Integration**: All caching through `src/services/redis-service.ts`
- **Session Management**: User session tracking via `src/services/session-manager.ts`
- **Security**: Input validation, authentication middleware, CORS configuration

### Service Dependencies
- **Node.js**: ≥20.0.0 required (WSL-native for Cursor MCP — see [CURSOR_MCP_PLAN.md](./CURSOR_MCP_PLAN.md) Phase 0)
- **Claude Code CLI**: WSL-native `@anthropic-ai/claude-code` + OAuth (not Windows `/mnt/c/` shim)
- **Codex CLI**: WSL-native `@openai/codex` + `~/.codex/auth.json` (not Windows npm)
- **Antigravity CLI**: `agy` on WSL PATH for Google Tier 1（OAuth token under `~/.gemini/antigravity-cli/`）。→ [ANTIGRAVITY_CLI_MIGRATION.md](./ANTIGRAVITY_CLI_MIGRATION.md)  
  Wall-Bounce spawns `agy --print` via [src/utils/antigravity-cli.ts](../src/utils/antigravity-cli.ts)
- **Redis**: Required for caching and session management
- **Database**: MySQL2 for audit logs and monitoring data
- **Monitoring**: Prometheus + Grafana stack in Docker containers

### WSL Native CLI Prerequisites (Cursor MCP Phase 0)

**Mandatory before Cursor MCP registration** (Phase 1). Full plan: [CURSOR_MCP_PLAN.md](./CURSOR_MCP_PLAN.md).

On WSL2, **Windows npm CLIs** (`/mnt/c/.../claude`, `codex`) fail with `Exec format error`. Cursor MCP spawns processes in WSL — install and authenticate **Linux-native** binaries only.

| CLI | Install (WSL) | Auth | Verify |
|-----|---------------|------|--------|
| **Claude Code** | `npm install -g @anthropic-ai/claude-code` | OAuth: `claude login` **or** symlink `~/.claude/.credentials.json` ← Windows | `unset ANTHROPIC_API_KEY`; `claude --print --model sonnet "ok"` |
| **Codex** | `npm install -g @openai/codex` | `codex login` → `~/.codex/auth.json` | `which codex` not under `/mnt/c/` |
| **Antigravity** | `curl -fsSL https://antigravity.google/cli/install.sh \| bash` → `~/.local/bin/agy` | OAuth token: `~/.gemini/antigravity-cli/antigravity-oauth-token` (browser on first use; **no** `agy auth login` in 1.0.9) | `cd /tmp && echo 'ok' \| agy --print --model gemini-2.5-flash` |

**PATH rule:** `which claude` and `which codex` MUST resolve to WSL paths (e.g. `~/.nvm/.../bin/`), not `/mnt/c/Users/.../npm/`.

**Phase 0 sign-off checklist** (all required before Phase 1):

```
[x] claude  — WSL native + OAuth (no ANTHROPIC_API_KEY)
[x] codex   — WSL native + ~/.codex/auth.json
[x] agy     — WSL native + OAuth token; `/tmp` + stdin probe (A-0.3)
[x] npm run build — project compiles
```

**Phase 0 sign-off complete 2026-06-18** (build verified in A-0.4).

### CLI inference knobs (subscription quota)

Use provider CLIs directly to consume **subscription quota** (not Cursor Agent). Each CLI accepts model and reasoning controls mapped from [InferenceProfile](./decisions/TECH_STACK_INFERENCE_PROFILES.md) (TS-20).

**Claude Code** (after Phase 0 above):

```bash
unset ANTHROPIC_API_KEY
claude --print --model haiku   --effort low    "Short classification task"
claude --print --model sonnet  --effort medium "Implement InferenceProfile types"
claude --print --model opus    --effort max    "Architecture trade-off synthesis"
```

CoT is controlled via profile `cot` (`off` | `brief` | `full`) in orchestrated calls; for manual CLI sessions, use explicit prompts (e.g. "think step by step" when `full` is desired) until adapter pass-through lands in Phase 0.

**Codex** (after WSL-native install + auth — symlink or `codex login`):

```bash
which codex          # not /mnt/c/...
codex exec -c 'approval_policy="never"' "Reply with only: ok"
```

**Antigravity** (`agy`) — prompt on **stdin** (not CLI argv); probe from **`/tmp`**, not repo root (git cwd triggers agentic workspace exploration):

```bash
test -f ~/.gemini/antigravity-cli/antigravity-oauth-token && echo "agy oauth ok"
cd /tmp
echo 'Summarize query' | agy --print --model gemini-2.5-flash
echo 'Deep analysis'   | agy --print --model gemini-2.5-pro
```

| Knob | Claude | Codex | agy |
|------|--------|-------|-----|
| Model | `--model` | config / CLI | `--model` |
| Effort | `--effort low…max` | `reasoning_effort` | provider-specific |
| CoT | profile `cot` → prompt policy | profile `cot` | profile `cot` |
| Temperature | profile / settings | when supported | generation config |

Peer providers: `claude`, `codex`, `agy`. Opus is **aggregator-only** (preset `critical`).

## 📁 Project Structure

```
src/
├── index.ts              # Bootstrap + re-export → server/
├── server/               # TechSapoServer (split from index.ts)
├── wall-bounce-server/   # Optional legacy IT-support server
├── config/               # Environment and configuration
├── controllers/          # Request handlers
├── middleware/           # Express middleware (auth, validation, error handling)
├── metrics/
│   ├── prometheus-client.ts   # Shim → prometheus/
│   └── prometheus/            # Metrics domain modules
├── routes/               # API route definitions
├── services/
│   ├── wall-bounce-analyzer.ts    # Shim → wall-bounce/ (constitution)
│   ├── wall-bounce/               # Analyzer modules
│   ├── log-analyzer/              # Log analysis modules
│   ├── mcp-integration-service.ts # Shim → mcp-integration/
│   ├── googledrive-connector.ts   # Shim → googledrive-connector/ (legacy RAG)
│   ├── cost-tracking.ts           # Shim → cost-tracking/
│   ├── mcp-config-manager.ts      # Shim → mcp-config-manager/
│   ├── mcp-performance-monitor.ts # Shim → mcp-performance-monitor/
│   ├── ultra-conservative-monitor.ts # Shim → ultra-conservative-monitor/
│   ├── srp-safety-monitor.ts      # Shim → srp-safety-monitor/
│   ├── codex-mcp-server.ts        # Shim → codex-mcp/
│   ├── codex-mcp-integration.ts   # Deprecated shim → mcp-product-integration (TS-28)
│   └── __mocks__/                 # Test mocks
├── utils/
│   └── file-type-detector/        # File type detection modules
├── types/                # TypeScript type definitions
└── data/                 # Static data and configuration

docker/                   # Container configurations
scripts/                  # Deployment and utility scripts
tests/                    # Test files (unit and integration)
public/                   # Static web assets for monitoring UI
```

Details: [SRP_MONOLITH_REFACTOR.md](./SRP_MONOLITH_REFACTOR.md) · [docs/agents/development-notes.md](./agents/development-notes.md)

## 💡 Key Implementation Notes

### Wall-Bounce Analysis Pattern
All user queries must flow through the wall-bounce system:
1. Query reception (Claude Code as orchestrator)
2. Multi-LLM provider selection based on task complexity
3. Parallel analysis execution with different providers
4. Consensus validation and quality scoring
5. Integrated response with confidence metrics

### MCP Service Integration
- Services communicate via Model Context Protocol v2025-03-26
- Automatic tool selection based on task type and budget constraints
- Multi-layer approval workflows for sensitive operations
- Real-time cost tracking and budget management

### Performance Considerations
- Redis caching for frequent operations
- Concurrent processing of LLM requests
- Server-Sent Events for real-time monitoring
- Prometheus metrics with automatic alerting