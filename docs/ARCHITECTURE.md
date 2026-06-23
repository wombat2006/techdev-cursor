# TechSapo System Architecture

## Overview

TechSapo is a production-ready AI orchestration platform implementing a **Wall-Bounce Analysis System** that coordinates multiple LLM providers for high-quality technical analysis.

## Core Components

### 1. Primary Application (`src/index.ts`)

Bootstrap shim re-exporting **`src/server/`** (`TechSapoServer`, middleware, routes, lifecycle).

Express.js-based HTTPS server with:
- Security middleware (Helmet, CORS)
- API routing and request handling
- Health check endpoints
- Prometheus metrics integration

**Port**: 8443 (HTTPS) or configured via environment
**Protocol**: HTTPS with TLS certificates

### 2. Wall-Bounce Analysis System

Multi-LLM orchestration engine ensuring quality through provider diversity.

**Core File**: `src/services/wall-bounce-analyzer.ts` (shim → `src/services/wall-bounce/`)

**Module layout**: invokers, modes (`parallel` / `sequential`), prompts, provider registry, consensus — see [SRP_MONOLITH_REFACTOR.md](./SRP_MONOLITH_REFACTOR.md).

**Provider Tiers** (target catalog — see [OPENAI_MODEL_MATRIX.md](./OPENAI_MODEL_MATRIX.md)):

1. **Gemini (Antigravity `agy`)** — Google Tier 1, no API keys
2. **OpenAI** — Codex CLI (AS-IS); **GPT-5.4 mini/nano**, **GPT-5.5**, **GPT-5.5 Pro** (To-Be via Responses API)
3. **Claude Sonnet 4.5** — Internal SDK / Claude Code CLI
4. **Claude Opus 4.1** — Aggregator role, synthesis

> **AS-IS**: `llm-providers.json` and adapters may still use legacy IDs (`gpt-5-codex`, etc.).

> **Implementation note**: Wall-Bounce Google Tier 1 uses Antigravity CLI (`agy --print` via [src/utils/antigravity-cli.ts](../src/utils/antigravity-cli.ts)).

**Execution Modes**:
- `parallel`: Concurrent provider execution (default)
- `sequential`: Wall-bounce chain with configurable depth (3-5)

**Inference profiles (TS-20)**: Per-task control of model, thinking effort, CoT, and temperature via `InferenceProfile` presets — see [TECH_STACK_INFERENCE_PROFILES.md](./decisions/TECH_STACK_INFERENCE_PROFILES.md) and [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md#inference-profiles-model-effort-cot-temperature).

**Cursor MCP (TS-21, planned)**: Phase 0 requires WSL-native `claude` / `codex` / `agy` + auth before IDE registration — [CURSOR_MCP_PLAN.md](./CURSOR_MCP_PLAN.md).

### 3. MCP Services Architecture

Model Context Protocol integration for standardized LLM interactions.

**Core MCP Services** (shims → module dirs where noted):
- `mcp-integration-service.ts` → `mcp-integration/` — central orchestration
- `mcp-approval-manager.ts` → `mcp-approval-manager/` — risk-based approval workflows
- `mcp-config-manager.ts` → `mcp-config-manager/` — tool optimization and cost estimation
- `mcp-performance-monitor.ts` → `mcp-performance-monitor/` — real-time MCP metrics and alerts
- `ultra-conservative-monitor.ts` → `ultra-conservative-monitor/` — gradual Phase 3 rollout safety (leaf)
- `srp-safety-monitor.ts` → `srp-safety-monitor/` — Phase 3 emergency rollback monitor (leaf)
- `codex-mcp-server.ts` → `codex-mcp/` — GPT-5/Codex integration
- `wall-bounce-adapter.ts` — MCP ↔ Wall-Bounce bridge

**MCP Protocol**: Uses `@modelcontextprotocol/sdk` for standardized tool/resource access

### 4. RAG System

Google Drive integration for document retrieval and embedding.

**Core File (AS-IS):** `src/services/googledrive-connector.ts` (shim → `googledrive-connector/`) — **legacy in this repo**
**Push notifications (AS-IS):** `src/services/googledrive-push-setup.ts` (shim → `googledrive-push-setup/`) — webhook channel setup for Drive changes

**To-Be:** Storage connectors (Google Drive, S3, OneDrive, …) and RAG Vector connectors move to sibling [term-prep-platform](https://github.com/wombat2006/term-prep-platform). See [TO-BE-GLOSSARY-PIPELINE.md § Connector delegation](../meta/TO-BE-GLOSSARY-PIPELINE.md#connector-delegation-planned).

**Features (AS-IS)**:
- Document search and indexing
- Embedding generation
- Vector mapping for semantic search
- Webhook support for real-time updates

## Directory Structure

> **SRP splits:** Large monoliths use thin shims + module directories. Inventory: [SRP_MONOLITH_REFACTOR.md](./SRP_MONOLITH_REFACTOR.md) · refactor order: [SRP_REFACTOR_DEPENDENCY_ORDER.md](./SRP_REFACTOR_DEPENDENCY_ORDER.md).

```
src/
├── index.ts                    # Bootstrap → server/
├── server/                     # TechSapoServer (from index.ts split)
├── wall-bounce-server/         # Optional legacy IT-support server
├── config/                     # Environment & feature flags
├── controllers/                # Request handlers
├── middleware/                 # Express middleware
├── metrics/
│   ├── prometheus-client.ts    # Shim → prometheus/
│   └── prometheus/             # Metrics domain modules
├── routes/                     # API route definitions
│   ├── wall-bounce-api.ts      # Wall-Bounce SSE endpoint
│   ├── huggingface-routes.ts   # HuggingFace integration
│   ├── rag-endpoint.ts         # RAG queries
│   └── webhook-endpoints.ts    # Webhook handlers
├── services/                   # Core business logic
│   ├── wall-bounce-analyzer.ts # Shim → wall-bounce/ (constitution)
│   ├── wall-bounce/            # Analyzer modules
│   ├── log-analyzer/           # Log analysis modules
│   ├── mcp-integration-service.ts  # Shim → mcp-integration/
│   ├── codex-mcp-server.ts     # Shim → codex-mcp/
│   ├── googledrive-connector.ts    # Shim → googledrive-connector/ (legacy RAG)
│   ├── cost-tracking.ts        # Shim → cost-tracking/
│   ├── mcp-config-manager.ts     # Shim → mcp-config-manager/
│   ├── mcp-performance-monitor.ts # Shim → mcp-performance-monitor/
│   ├── ultra-conservative-monitor.ts # Shim → ultra-conservative-monitor/
│   ├── srp-safety-monitor.ts     # Shim → srp-safety-monitor/
│   ├── huggingface-client.ts       # Shim → huggingface-client/
│   ├── embedding-service.ts        # Shim → embedding-service/
│   ├── inference-service.ts        # Shim → inference-service/
│   └── __mocks__/              # Test mocks
├── types/                      # TypeScript definitions
├── utils/
│   └── file-type-detector/     # File type detection modules
└── data/                       # Static data

scripts/                        # Build & deployment scripts
tests/                          # Test suites
docs/                           # Documentation
public/                         # Frontend assets
```

## Data Flow

### Wall-Bounce Analysis Request Flow

```
User Request (UI)
    ↓
POST /api/v1/wall-bounce/analyze (SSE)
    ↓
WallBounceAnalyzer.executeWallBounce()
    ↓
Parallel/Sequential Provider Invocation
    ├─→ invokeGemini() [CLI spawn]
    ├─→ invokeGPT5() [Codex MCP/CLI spawn]
    └─→ invokeClaude() [Internal SDK]
    ↓
Real-time SSE Events:
    - provider:start
    - provider:streaming (stdout chunks)
    - provider:complete
    - consensus updates
    ↓
Aggregation (Claude Opus 4.1)
    ↓
Final Response + Consensus Score
    ↓
SSE Complete Event
```

### Provider transport (same node)

Co-located providers (`agy`, `codex`, Claude Code MCP) use **stdio / MCP / in-process EventEmitter** — not HTTP streaming between providers. **HTTP SSE** is used only at the **external API boundary** (browser/clients). Inter-round Wall-Bounce passes **text context in prompts** after each round; there is no direct LLM-to-LLM HTTP pipe.

Optional **Provider Gateway (HTTP/SSE)** may be added later for sidecar or multi-node deployment (TS-08). See [decisions/TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./decisions/TECH_STACK_LLM_PROVIDER_TRANSPORT.md).

**Core vs add-on:** Keep Orchestrator + Wall-Bounce cohesive; plug Grounding, AWS, and fork features behind interfaces (loose coupling). See [decisions/TECH_STACK_CORE_VS_ADDON_COUPLING.md](./decisions/TECH_STACK_CORE_VS_ADDON_COUPLING.md).

### MCP Integration Flow

```
Wall-Bounce Request
    ↓
MCP Integration Service
    ↓
Approval Manager (risk assessment)
    ↓ [approved]
Config Manager (tool optimization)
    ↓
Codex MCP Server
    ↓
spawn('codex', [...args])
    ↓
GPT-5/GPT-5-Codex Response
    ↓
Session Management (Redis)
    ↓
Response to Wall-Bounce
```

## Technology Stack

### Runtime & Language
- **Node.js**: ≥20.0.0
- **TypeScript**: ES2022 target, CommonJS modules
- **Build**: `tsc` with source maps

### Framework & Libraries
- **Express.js**: HTTP server with middleware
- **Helmet**: Security headers
- **CORS**: Cross-origin configuration
- **Prometheus**: Metrics collection
- **Winston**: Structured logging

### Data Layer
- **Redis**: Session management, caching
  - **AS-IS:** fragmented — app [`session-manager`](../src/services/session-manager.ts), legacy Codex-only [`codex-session-manager`](../src/services/codex-session-manager.ts)
  - **To-Be (TS-22):** unified **Layer A** `OrchestrationSession` at `orch:session:{sessionId}` with `providerHandles` for optional Layer B CLI resume — see [TECH_STACK_MEMORY_SUBSTRATE.md](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md)
- **Vector Storage**: For RAG embeddings (future)

### LLM Integration
- **CLI Tools**: `agy` (Antigravity, Tier 1 Google), `codex` (OpenAI) — see [ANTIGRAVITY_CLI_MIGRATION.md](./ANTIGRAVITY_CLI_MIGRATION.md)
- **SDK**: Anthropic SDK for internal calls
- **MCP**: `@modelcontextprotocol/sdk`

### Testing
- **Jest**: Test runner with 5-minute timeout
- **fast-check**: Property-based testing
- **Coverage**: 100% target for Wall-Bounce components

### Monitoring
- **Prometheus**: Metrics scraping
- **Grafana**: Dashboards and visualization
- **AlertManager**: Threshold-based alerts

### AWS peripheral (planned)

Surrounding platform features target **AWS** (not yet implemented in application code):

| Concern | Service | Use |
|---------|---------|-----|
| Email | **Amazon SES** | Notifications, alerts |
| Object storage | **Amazon S3** | Artifacts, exports, optional document staging |
| Secrets (non-LLM) | **Secrets Manager** | DB URLs, webhook tokens, etc. |
| Key encryption | **KMS** | Secrets and S3 SSE-KMS |

LLM access remains **CLI/SDK only** — see [SECURITY.md](./SECURITY.md).  
Decision record: [decisions/TECH_STACK_AWS_PERIPHERAL.md](./decisions/TECH_STACK_AWS_PERIPHERAL.md) · workspace: [TECH_STACK_WORKSPACE.md](./TECH_STACK_WORKSPACE.md)

**Placeholders:** primary region **`ap-northeast-1` (Tokyo)** · SES From **`noreply@notify.techsapo.example`** (virtual domain, not production)

## Security Architecture

### Authentication & Authorization
- Input validation middleware
- Request sanitization
- MCP approval workflows for tool execution

### LLM Provider Security
- **No API keys in code**: CLI/SDK patterns only
- **Secure spawn**: Sanitized arguments, timeout controls
- **Shell injection prevention**: No shell meta-characters in user input

### Network Security
- HTTPS only (TLS certificates required)
- CORS configured per environment
- Helmet security headers

## Scalability Considerations

### Current Design
- Single Node.js process
- Redis for state management
- Nginx reverse proxy for SSL termination

### Future Scaling Options
- Horizontal scaling with load balancer
- Redis clustering for distributed sessions
- MCP service separation into microservices
- Vector database for RAG (Pinecone/Weaviate)

## Configuration Management

### Environment Variables
- `NODE_ENV`: production/development
- `PORT`: Application port (default 4000)
- `REDIS_URL`: Redis connection string
- Provider-specific config via MCP TOML files

### Feature Flags
Located in `src/config/feature-flags.ts`:
- Wall-Bounce timeout controls
- Provider enable/disable
- MCP approval policies

## API Endpoints

### Wall-Bounce
- `POST /api/v1/wall-bounce/analyze` - SSE streaming endpoint
- `POST /api/v1/wall-bounce/analyze-simple` - Simple JSON response

### RAG
- `POST /api/v1/rag/query` - Document search
- `POST /api/v1/rag/embed` - Embedding generation

### Health & Monitoring
- `GET /health` - Health check
- `GET /ping` - Liveness probe
- `GET /metrics` - Prometheus metrics

### Webhooks
- `POST /api/v1/webhooks/*` - Google Drive webhooks
- `POST /api/v1/webhook-setup/*` - Webhook configuration

## Related Documentation

- **TECH_STACK_WORKSPACE.md** - Tech stack refinement workspace (prep)
- **WALL_BOUNCE_SYSTEM.md** - Wall-Bounce implementation details
- **MCP_SERVICES.md** - MCP service architecture
- **DEVELOPMENT_GUIDE.md** - Development workflows
- **SECURITY.md** - Security guidelines
- **DEPLOYMENT_GUIDE.md** - Production deployment
