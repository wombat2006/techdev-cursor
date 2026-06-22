# TechSapo Documentation Index

**Navigation for active fork documentation** — see [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md) for README shape, legacy quarantine, and sync tiers.

---

## Quick Start by Role

### Developer

1. **[README.md](../README.md)** (ja — GitHub top) · **[README_en.md](../README_en.md)** — **Goal (To-Be) · AS-IS · what we need** + thin entry
2. **[FORK_STATUS.md](./FORK_STATUS.md)** · **[ja/FORK_STATUS.md](./ja/FORK_STATUS.md)** — Gate / Track progress
3. **[CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md)** · **[ja/CURSOR_MCP_TODO_ja.md](./ja/CURSOR_MCP_TODO_ja.md)** — runbook (en canonical · ja summary)
4. **[FORK_CURSOR.md](./FORK_CURSOR.md)** · **[ja/FORK_CURSOR.md](./ja/FORK_CURSOR.md)** — fork identity
5. **[FORK_ONBOARDING.md](./FORK_ONBOARDING.md)** · **[ja/FORK_ONBOARDING.md](./ja/FORK_ONBOARDING.md)** — design depth
6. **[AGENTS.md](../AGENTS.md)** · **[docs/agents/](./agents/)** — AI agent navigation
7. **[ARCHITECTURE.md](./ARCHITECTURE.md)** · **[WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md)** · **[WALL_BOUNCE_AS_IS.md](./WALL_BOUNCE_AS_IS.md)** · **[WALL_BOUNCE_TO_BE.md](./WALL_BOUNCE_TO_BE.md)**
8. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** · **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**

### Operations

1. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** · **[MONITORING_OPERATIONS.md](./MONITORING_OPERATIONS.md)**
2. **[SECURITY.md](./SECURITY.md)**

### Integration

1. **[MCP_SERVICES.md](./MCP_SERVICES.md)** · **[CURSOR_MCP_PLAN.md](./CURSOR_MCP_PLAN.md)**
2. **[codex-mcp-implementation.md](./codex-mcp-implementation.md)** · **[ANTIGRAVITY_CLI_MIGRATION.md](./ANTIGRAVITY_CLI_MIGRATION.md)**
3. **[API_REFERENCE.md](./API_REFERENCE.md)** · **[PROVIDER_INTEGRATION_BACKLOG.md](./PROVIDER_INTEGRATION_BACKLOG.md)**
4. **[RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md)** — Google Drive RAG · glossary prep §
5. **[../meta/TO-BE-GLOSSARY-PIPELINE.md](../meta/TO-BE-GLOSSARY-PIPELINE.md)** — glossary consumer (edit this repo only; platform invoke read-only)

---

## Essential Documentation

### Policy & status

| Document | Purpose | Audience |
|----------|---------|----------|
| **DOCUMENTATION_POLICY.md** | README shape, legacy, P0/P1/P2 sync, **B2b ja pairs** | Maintainers / humans |
| **FORK_STATUS.md** · **ja/FORK_STATUS.md** | Rolling Gate / Track progress | Humans / reviewers |
| **FORK_CURSOR.md** · **ja/FORK_CURSOR.md** | Fork identity (DevAssist; not InfraOps) | Developers |
| **FORK_ONBOARDING.md** · **ja/FORK_ONBOARDING.md** | Design philosophy & AS-IS / To-Be depth | Humans / reviewers |

### Agent navigation

| Document | Purpose |
|----------|---------|
| **../AGENTS.md** | Neutral skeleton (constitution + Quick Nav) |
| **../CLAUDE.md** | Claude Code shim → AGENTS.md |
| **agents/commands.md** | dev / test / MCP commands |
| **agents/mcp-rules.md** | Serena / Cipher / Codex / Context7 |
| **agents/development-notes.md** | Common tasks, structure |
| **agents/claude-code.md** | Claude Code notes |
| **CLAUDE_CODE_SKILLS.md** | Claude Code filesystem skills, slash commands |

### Core architecture

| Document | Purpose |
|----------|---------|
| **ARCHITECTURE.md** | System design |
| **WALL_BOUNCE_SYSTEM.md** | Multi-LLM orchestration (operator guide) |
| **WALL_BOUNCE_AS_IS.md** | Code-derived AS-IS truth |
| **WALL_BOUNCE_TO_BE.md** | Target behavior + gap matrix |
| **WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md** | Per-file modification points |
| **MCP_SERVICES.md** | MCP service architecture |
| **SECURITY.md** | Security patterns |

### Development & operations

| Document | Purpose |
|----------|---------|
| **DEVELOPMENT_GUIDE.md** | Workflows |
| **SRP_MONOLITH_REFACTOR.md** | Monolith → module split record (shims, tests, inventory) |
| **SRP_REFACTOR_DEPENDENCY_ORDER.md** | Import-graph refactor order (TS deps, phases) |
| **TESTING_GUIDE.md** | Testing strategy |
| **DEPLOYMENT_GUIDE.md** | Deployment |
| **MONITORING_OPERATIONS.md** | Monitoring |
| **API_REFERENCE.md** | HTTP API |

### Runbook & backlog

| Document | Purpose |
|----------|---------|
| **CURSOR_MCP_TODO.md** | Tracks, Gates, WSL CLI, MCP registration |
| **CURSOR_MCP_PLAN.md** | Cursor MCP plan overview |
| **PROVIDER_INTEGRATION_BACKLOG.md** | Provider adapter backlog |
| **TECH_STACK_WORKSPACE.md** | TS-01…21 decision backlog |

### Architecture Decision Records

| Document | ID |
|----------|-----|
| **decisions/README.md** | ADR index |
| **decisions/TECH_STACK_LLM_MODEL_CATALOG.md** | TS-21 |
| **decisions/TECH_STACK_USER_EXTENSIBLE_LLM.md** | TS-23 — user-addable models (L1–L2) |
| **decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md** | TS-24 — session continuation + negative retry (upward jitter) |
| **decisions/TECH_STACK_INFERENCE_PROFILES.md** | TS-20 |
| **decisions/TECH_STACK_MEMORY_SUBSTRATE.md** | TS-22 |
| **decisions/TECH_STACK_LLM_PROVIDER_TRANSPORT.md** | TS-17 |
| **decisions/TECH_STACK_CLI_INVOKE_METADATA.md** | TS-26 — CLI usage / stop_reason / session_id at adapter boundary |
| **decisions/TECH_STACK_OLLAMA_GATEWAY.md** | TS-27 — Ollama local gateway (cloud + local models); optional adapter |
| **decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md** | TS-25 — parallel-first; threshold branch; keyword modes |
| **decisions/TECH_STACK_CORE_VS_ADDON_COUPLING.md** | TS-18 |
| **decisions/TECH_STACK_AWS_PERIPHERAL.md** | TS-13 |
| **decisions/WALL_BOUNCE_P5_ARCHITECTURE.md** | P5+ roadmap |

### Integration guides (active)

| Document | Topic |
|----------|-------|
| **OPENAI_MODEL_MATRIX.md** | OpenAI model IDs (doc) |
| **OPENAI_PROMPT_GUIDANCE.md** | GPT-5.x prompt guidance |
| **OPENAI_COOKBOOK_INTEGRATION.md** | Cookbook → catalog |
| **ANTHROPIC_COOKBOOK_INTEGRATION.md** | Claude cookbook → catalog |
| **ANTHROPIC_CAPABILITIES_OVERVIEW.md** | Platform capabilities hub (5 areas) |
| **ANTHROPIC_MODELS_OVERVIEW.md** | Claude model family — AS-IS vs current tier |
| **ANTHROPIC_MODEL_SYSTEM_CARDS.md** | Model system cards — safety evals, PDF links |
| **ANTHROPIC_PROMPT_GUIDANCE.md** | Claude per-model prompt / character |
| **ANTHROPIC_BATCH_API_RAG.md** | Optional Message Batches RAG (gated) |
| **ANTHROPIC_EXTENDED_THINKING.md** | Extended thinking (manual — 4.5 AS-IS) |
| **ANTHROPIC_ADAPTIVE_THINKING.md** | Adaptive thinking (4.6+ migration) |
| **ANTHROPIC_MULTILINGUAL_SUPPORT.md** | Multilingual / Japanese MMLU routing |
| **ANTHROPIC_MESSAGE_STREAMING.md** | Messages API SSE streaming |
| **ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md** | Code execution sandbox tool calls |
| **ANTHROPIC_PROMPT_CACHING.md** | Prompt caching (automatic + explicit breakpoints) |
| **ANTHROPIC_PRICING.md** | API pricing — catalog AS-IS rates, batch, tools |
| **ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md** | Mid-session `role: system` without cache bust |
| **ANTHROPIC_TOKEN_COUNTING.md** | `messages/count_tokens` preflight API |
| **ANTHROPIC_PDF_SUPPORT.md** | PDF document blocks (url / base64 / Files API) |
| **ANTHROPIC_VISION.md** | Image vision blocks — limits, token cost, coordinates |
| **ANTHROPIC_PARALLEL_TOOL_USE.md** | Parallel tool use + result batching |
| **ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md** | Eager tool input streaming |
| **ANTHROPIC_SKILLS_AUTHORING.md** | Agent Skills authoring |
| **ANTHROPIC_AGENT_SKILLS.md** | Agent Skills overview — API, surfaces, ZDR |
| **CLAUDE_CODE_SKILLS.md** | Claude Code Skills — filesystem, frontmatter, bundled /run |
| **CLAUDE_CODE_MCP_CONNECT.md** | Claude Code MCP client — scopes, transports, OAuth |
| **CLAUDE_CODE_HOOKS.md** | Claude Code hooks — lifecycle events, matchers, permissions |
| **CLAUDE_CODE_DEBUG.md** | Claude Code config debug — `/context`, `/doctor`, isolation |
| **CLAUDE_CODE_COST_MANAGEMENT.md** | Claude Code cost — `/usage`, context, model, hooks |
| **CLAUDE_CODE_PLUGINS.md** | Claude Code plugins — marketplaces, LSP, install scopes |
| **CLAUDE_CODE_SCHEDULED_TASKS.md** | Claude Code `/loop`, cron, loop.md |
| **CLAUDE_CODE_PROGRAMMATIC.md** | Claude Code `claude -p`, `--bare`, Agent SDK CLI |
| **CLAUDE_CODE_DEEP_LINKS.md** | Claude Code `claude-cli://` deep links |
| **CLAUDE_CODE_BEST_PRACTICES.md** | Claude Code workflow synthesis — context, verify, plan |
| **CLAUDE_CODE_GLOSSARY.md** | Claude Code terminology index — links to fork docs |
| **CLAUDE_CODE_AUTO_MODE.md** | Claude Code auto mode classifier — `autoMode` settings |
| **CLAUDE_CODE_MONITORING.md** | Claude Code OpenTelemetry — metrics, events, traces |
| **CLAUDE_CODE_CLI_REFERENCE.md** | Claude Code CLI commands and flags |
| **ANTHROPIC_CONTEXT_WINDOW.md** | Context windows + compaction |
| **OPENAI_BATCH_API_RAG.md** | Optional Batch RAG (gated) |
| **ANTIGRAVITY_CLI_MIGRATION.md** | Tier 1 Google (`agy`) |
| **gemini-api-migration-guide.md** | Gemini / Antigravity |
| **codex-mcp-implementation.md** | Codex MCP |
| **mcp-integration-guide.md** | MCP patterns |
| **RAG_SETUP_GUIDE.md** | RAG ingest |

### Customer-facing

| Document | Language |
|----------|----------|
| **proposals/WALL_BOUNCE_PLATFORM_PROPOSAL.md** | Japanese |

### Japanese human docs (`docs/ja/`)

| English | Japanese | Notes |
|---------|----------|-------|
| **FORK_STATUS.md** | **ja/FORK_STATUS.md** | Gate updates: sync both (P0) |
| **FORK_ONBOARDING.md** | **ja/FORK_ONBOARDING.md** | P1 |
| **FORK_CURSOR.md** | **ja/FORK_CURSOR.md** | P1; bootstrap detail → English |
| **CURSOR_MCP_TODO.md** | **ja/CURSOR_MCP_TODO_ja.md** | Summary only; en = execution truth |
| **RAG_SETUP_GUIDE.md** | **ja/rag-setup-guide.md** | Existing pair |

See [DOCUMENTATION_POLICY §4 B2b](./DOCUMENTATION_POLICY.md#b2b--human-docs-docsja-pairs).

---

## Archived / legacy

Upstream platform docs **not maintained** for this fork. Do not use for fork decisions.

→ **[legacy/README.md](./legacy/README.md)** — phase 1 index (SRP migration, team manual, production deploy narratives, etc.)

Phase 2 (planned): exploratory `mcp-*.md` cluster — [DOCUMENTATION_POLICY §6](./DOCUMENTATION_POLICY.md#6-legacy-quarantine-d2).

---

## Related

| Doc | Role |
|-----|------|
| [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md) | Doc layers, sync tiers, date formats |
| [FORK_STATUS.md](./FORK_STATUS.md) | Rolling progress |
| [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) | Execution truth |
