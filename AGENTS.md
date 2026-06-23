# TechSapo — Agent Navigation Guide

**AI Orchestration Platform with Wall-Bounce Multi-LLM Analysis**

> **Repo:** `techdev-cursor` — integrated Cursor dev environment (coding accuracy + workload reduction); fork of Wall-Bounce `techdev`. Not IT incident analysis. See [FORK_CURSOR.md](docs/FORK_CURSOR.md).

> **Skeleton only.** See linked docs for commands, MCP rules, and details. Do not bloat this file — accuracy degrades when it grows.

> **Plan A:** P0–P3 done — this file is the **neutral top** for all coding agents. [CLAUDE.md](CLAUDE.md) is a Claude Code shim only. Detail docs: [docs/agents/](docs/agents/). Cursor rules: [.cursor/rules/](.cursor/rules/) (`wall-bounce-constitution.mdc`, `documentation-sync.mdc`, `llm-catalog-edits.mdc`).

---

## Constitution

> **Supreme rules.** All analysis, design, and implementation decisions in this repository MUST follow these rules. **No exceptions.**

### Wall-Bounce Obligations

1. **Always use Wall-Bounce** — No single-LLM dependency or bypass
2. **Round count: 2 to 5** — Run **at least 2 rounds**, **at most 5 rounds** (single-round wall-bounce is forbidden)
3. **Quality thresholds** — confidence ≥ 0.7, consensus ≥ 0.6 (add rounds or escalate if not met)
4. **Implementation path** — Only via `src/services/wall-bounce-analyzer.ts`
5. **Output language** — Japanese for user-facing content

Details: [WALL_BOUNCE_SYSTEM.md](docs/WALL_BOUNCE_SYSTEM.md) · [WALL_BOUNCE_AS_IS.md](docs/WALL_BOUNCE_AS_IS.md) · [WALL_BOUNCE_TO_BE.md](docs/WALL_BOUNCE_TO_BE.md) (TS-25 mode routing · TS-26 CLI metadata)

---

## Quick Navigation

| Task | Primary File | Documentation |
|------|--------------|---------------|
| **Wall-Bounce AS-IS / To-Be** | `wall-bounce-analyzer.ts` | [WALL_BOUNCE_AS_IS.md](docs/WALL_BOUNCE_AS_IS.md) · [WALL_BOUNCE_TO_BE.md](docs/WALL_BOUNCE_TO_BE.md) · [TS-25](docs/decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) · [TS-26](docs/decisions/TECH_STACK_CLI_INVOKE_METADATA.md) |
| MCP Integration | `src/services/mcp-integration-service.ts` | [MCP_SERVICES.md](docs/MCP_SERVICES.md) |
| Cursor MCP runbook | Phase 0: WSL CLI + auth first | [CURSOR_MCP_TODO.md](docs/CURSOR_MCP_TODO.md) · [CURSOR_MCP_PLAN.md](docs/CURSOR_MCP_PLAN.md) |
| Memory substrate (TS-22) | Before Track B | [TECH_STACK_MEMORY_SUBSTRATE.md](docs/decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |
| Session continuation + retry (TS-24) | Track B M1–M3 | [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](docs/decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| Fork identity / status / onboarding | — | [FORK_CURSOR.md](docs/FORK_CURSOR.md) · [FORK_STATUS.md](docs/FORK_STATUS.md) · [FORK_ONBOARDING.md](docs/FORK_ONBOARDING.md) |
| API Routes | `src/routes/wall-bounce-api.ts` | [API_REFERENCE.md](docs/API_REFERENCE.md) |
| Security & Auth | `src/middleware/` | [SECURITY.md](docs/SECURITY.md) |
| System Architecture | `src/index.ts` → `src/server/` | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| SRP monolith splits | Shim + module dirs (14 done, Phase 2 #4) | [SRP_MONOLITH_REFACTOR.md](docs/SRP_MONOLITH_REFACTOR.md) · [SRP_REFACTOR_DEPENDENCY_ORDER.md](docs/SRP_REFACTOR_DEPENDENCY_ORDER.md) |
| LLM Model Catalog | `config/llm-model-catalog.json` | [TECH_STACK_LLM_MODEL_CATALOG.md](docs/decisions/TECH_STACK_LLM_MODEL_CATALOG.md) |
| OpenAI model IDs | catalog slice | [OPENAI_MODEL_MATRIX.md](docs/OPENAI_MODEL_MATRIX.md) |
| OpenAI prompt guidance | `prompting.*` in catalog | [OPENAI_PROMPT_GUIDANCE.md](docs/OPENAI_PROMPT_GUIDANCE.md) |
| Anthropic cookbook / prompt guidance | `prompting.*`, `cookbookIndex` | [ANTHROPIC_CAPABILITIES_OVERVIEW.md](docs/ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [ANTHROPIC_COOKBOOK_INTEGRATION.md](docs/ANTHROPIC_COOKBOOK_INTEGRATION.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](docs/ANTHROPIC_PROMPT_GUIDANCE.md) |
| RAG ingest (AS-IS → platform) | Legacy `googledrive-connector/` shim → **term-prep-platform** storage + Vector connectors | [RAG_SETUP_GUIDE.md](docs/RAG_SETUP_GUIDE.md) |
| Glossary prep (consumer) | `meta/glossary-config.json` | [TO-BE-GLOSSARY-PIPELINE.md](meta/TO-BE-GLOSSARY-PIPELINE.md) |
| Provider backlog | `src/adapters/*` | [PROVIDER_INTEGRATION_BACKLOG.md](docs/PROVIDER_INTEGRATION_BACKLOG.md) |
| MCP product layer (TS-28) | `mcp-product-integration` (shim: `codex-mcp-integration.ts`) | [TS-28](docs/decisions/TECH_STACK_CODEX_MCP_INTEGRATION_REFACTOR.md) — **NAME-VN:** no vendor names before routing |

---

## Mandatory Rules (Summary)

| Area | Requirement | Details |
|------|-------------|---------|
| **Wall-Bounce** | **Constitution**: 2–5 rounds required, 2+ LLMs, confidence ≥ 0.7, consensus ≥ 0.6, via `wall-bounce-analyzer.ts` only | [WALL_BOUNCE_SYSTEM.md](docs/WALL_BOUNCE_SYSTEM.md) |
| **Security** | CLI/SDK only (`agy` / `codex` / Anthropic SDK); no API keys in code or env | [SECURITY.md](docs/SECURITY.md) |
| **MCP work** | Follow Serena / ByteRover (`brv`) / Codex / Context7 rules | [mcp-rules.md](docs/agents/mcp-rules.md) |
| **Glossary consumer** | Edit **this repo only** (`meta/glossary-*`); invoke platform CLI read-only; **notify user** if platform change is required — **no** term-prep-platform edits from here | [TO-BE-GLOSSARY-PIPELINE.md § Platform escalation](meta/TO-BE-GLOSSARY-PIPELINE.md#platform-escalation--notify-the-user) |
| **Memory** | Layer A `OrchestrationSession` mandatory; event `ts`/`tsEnd` UTC; session `clientTimezone` optional | [TECH_STACK_MEMORY_SUBSTRATE.md](docs/decisions/TECH_STACK_MEMORY_SUBSTRATE.md) v1.3 |
| **Commit** | P0/P1/P2 doc sync per policy; same commit as implementation | [DOCUMENTATION_POLICY.md](docs/DOCUMENTATION_POLICY.md) |
| **Doc language** | Logic docs **English**; `README.md` (ja top) / proposals Japanese | [DOCUMENTATION_POLICY.md](docs/DOCUMENTATION_POLICY.md) |
| **Vendor naming** | No vendor proper names **before** multi-provider routing boundary | [TS-28 NAME-VN](docs/decisions/TECH_STACK_CODEX_MCP_INTEGRATION_REFACTOR.md#411-vendor-neutral-naming-name-vn) |

### Provider Tiers (Summary)

```
Tier 1: Gemini (agy)           → Antigravity CLI
Tier 2: OpenAI                 → Codex CLI today; GPT-5.4 mini/nano, GPT-5.5 (To-Be — OPENAI_MODEL_MATRIX.md)
Tier 3: Claude Sonnet 4.6      → Internal SDK / Claude Code CLI
Tier 4: GPT-5.5 / GPT-5.5 Pro  → Responses API (To-Be); Opus 4.6 aggregate (4.8 escalate)
```

> **AS-IS code** may still reference `gpt-5-codex` until [PROVIDER_INTEGRATION_BACKLOG.md](docs/PROVIDER_INTEGRATION_BACKLOG.md#openai-model-catalog-migration).

> **Implementation note:** Google Tier 1 uses Antigravity CLI (`agy`) via `src/utils/antigravity-cli.ts` → [ANTIGRAVITY_CLI_MIGRATION.md](docs/ANTIGRAVITY_CLI_MIGRATION.md)

---

## Agent Detail Documents

| Topic | Document |
|-------|----------|
| Commands (dev / test / MCP / monitoring / emergency) | [commands.md](docs/agents/commands.md) |
| MCP usage rules | [mcp-rules.md](docs/agents/mcp-rules.md) |
| Dev notes, common tasks, environment checks | [development-notes.md](docs/agents/development-notes.md) |
| Claude Code tool notes | [claude-code.md](docs/agents/claude-code.md) |
| Development workflows | [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) |
| LLM model catalog (TS-21) | [decisions/TECH_STACK_LLM_MODEL_CATALOG.md](docs/decisions/TECH_STACK_LLM_MODEL_CATALOG.md) |
| Memory substrate (TS-22) | [decisions/TECH_STACK_MEMORY_SUBSTRATE.md](docs/decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |
| Session continuation + retry (TS-24) | [decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](docs/decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| OpenAI Cookbook integration | [OPENAI_COOKBOOK_INTEGRATION.md](docs/OPENAI_COOKBOOK_INTEGRATION.md) |
| OpenAI prompt guidance | [OPENAI_PROMPT_GUIDANCE.md](docs/OPENAI_PROMPT_GUIDANCE.md) |
| Anthropic Cookbook integration | [ANTHROPIC_COOKBOOK_INTEGRATION.md](docs/ANTHROPIC_COOKBOOK_INTEGRATION.md) |
| Anthropic prompt guidance | [ANTHROPIC_PROMPT_GUIDANCE.md](docs/ANTHROPIC_PROMPT_GUIDANCE.md) |
| Anthropic capabilities overview (platform hub) | [ANTHROPIC_CAPABILITIES_OVERVIEW.md](docs/ANTHROPIC_CAPABILITIES_OVERVIEW.md) |
| Anthropic Message Batches for RAG (optional, gated) | [ANTHROPIC_BATCH_API_RAG.md](docs/ANTHROPIC_BATCH_API_RAG.md) |
| Anthropic extended thinking | [ANTHROPIC_EXTENDED_THINKING.md](docs/ANTHROPIC_EXTENDED_THINKING.md) |
| Anthropic adaptive thinking | [ANTHROPIC_ADAPTIVE_THINKING.md](docs/ANTHROPIC_ADAPTIVE_THINKING.md) |
| Anthropic multilingual support | [ANTHROPIC_MULTILINGUAL_SUPPORT.md](docs/ANTHROPIC_MULTILINGUAL_SUPPORT.md) |
| Anthropic message streaming | [ANTHROPIC_MESSAGE_STREAMING.md](docs/ANTHROPIC_MESSAGE_STREAMING.md) |
| Anthropic programmatic tool calling | [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](docs/ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) |
| Anthropic prompt caching | [ANTHROPIC_PROMPT_CACHING.md](docs/ANTHROPIC_PROMPT_CACHING.md) |
| Anthropic mid-conversation system messages | [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](docs/ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md) |
| Anthropic token counting | [ANTHROPIC_TOKEN_COUNTING.md](docs/ANTHROPIC_TOKEN_COUNTING.md) |
| Anthropic PDF support | [ANTHROPIC_PDF_SUPPORT.md](docs/ANTHROPIC_PDF_SUPPORT.md) |
| Anthropic vision | [ANTHROPIC_VISION.md](docs/ANTHROPIC_VISION.md) |
| Anthropic parallel tool use | [ANTHROPIC_PARALLEL_TOOL_USE.md](docs/ANTHROPIC_PARALLEL_TOOL_USE.md) |
| Anthropic fine-grained tool streaming | [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](docs/ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) |
| Anthropic Agent Skills authoring | [ANTHROPIC_SKILLS_AUTHORING.md](docs/ANTHROPIC_SKILLS_AUTHORING.md) |
| Anthropic Agent Skills overview | [ANTHROPIC_AGENT_SKILLS.md](docs/ANTHROPIC_AGENT_SKILLS.md) |
| Claude Code Skills | [CLAUDE_CODE_SKILLS.md](docs/CLAUDE_CODE_SKILLS.md) |
| Claude Code MCP connect | [CLAUDE_CODE_MCP_CONNECT.md](docs/CLAUDE_CODE_MCP_CONNECT.md) |
| Claude Code hooks | [CLAUDE_CODE_HOOKS.md](docs/CLAUDE_CODE_HOOKS.md) |
| Claude Code debug config | [CLAUDE_CODE_DEBUG.md](docs/CLAUDE_CODE_DEBUG.md) |
| Anthropic models overview | [ANTHROPIC_MODELS_OVERVIEW.md](docs/ANTHROPIC_MODELS_OVERVIEW.md) |
| Anthropic model system cards | [ANTHROPIC_MODEL_SYSTEM_CARDS.md](docs/ANTHROPIC_MODEL_SYSTEM_CARDS.md) |
| Anthropic API pricing | [ANTHROPIC_PRICING.md](docs/ANTHROPIC_PRICING.md) |
| Claude Code cost management | [CLAUDE_CODE_COST_MANAGEMENT.md](docs/CLAUDE_CODE_COST_MANAGEMENT.md) |
| Claude Code plugins | [CLAUDE_CODE_PLUGINS.md](docs/CLAUDE_CODE_PLUGINS.md) |
| Claude Code scheduled tasks | [CLAUDE_CODE_SCHEDULED_TASKS.md](docs/CLAUDE_CODE_SCHEDULED_TASKS.md) |
| Claude Code programmatic CLI | [CLAUDE_CODE_PROGRAMMATIC.md](docs/CLAUDE_CODE_PROGRAMMATIC.md) |
| Claude Code deep links | [CLAUDE_CODE_DEEP_LINKS.md](docs/CLAUDE_CODE_DEEP_LINKS.md) |
| Claude Code best practices | [CLAUDE_CODE_BEST_PRACTICES.md](docs/CLAUDE_CODE_BEST_PRACTICES.md) |
| Claude Code glossary | [CLAUDE_CODE_GLOSSARY.md](docs/CLAUDE_CODE_GLOSSARY.md) |
| Claude Code auto mode | [CLAUDE_CODE_AUTO_MODE.md](docs/CLAUDE_CODE_AUTO_MODE.md) |
| Claude Code monitoring (OTel) | [CLAUDE_CODE_MONITORING.md](docs/CLAUDE_CODE_MONITORING.md) |
| Claude Code CLI reference | [CLAUDE_CODE_CLI_REFERENCE.md](docs/CLAUDE_CODE_CLI_REFERENCE.md) |
| Anthropic context windows | [ANTHROPIC_CONTEXT_WINDOW.md](docs/ANTHROPIC_CONTEXT_WINDOW.md) |
| OpenAI Batch API for RAG ingest (optional, gated) | [OPENAI_BATCH_API_RAG.md](docs/OPENAI_BATCH_API_RAG.md) |
| Project structure and tech stack | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Testing | [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) |
| Tech stack refinement (prep) | [TECH_STACK_WORKSPACE.md](docs/TECH_STACK_WORKSPACE.md) |
| Operations and deployment | [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) · [MONITORING_OPERATIONS.md](docs/MONITORING_OPERATIONS.md) |
| Full documentation index | [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) |
| Documentation policy | [DOCUMENTATION_POLICY.md](docs/DOCUMENTATION_POLICY.md) |

---

## Tool-specific layers

Do **not** duplicate constitution or domain docs in tool files — link to this file and Layer 2 docs.

| Tool | Entry | Role |
|------|-------|------|
| **All agents** | `AGENTS.md` (this file) | Neutral constitution + navigation |
| **Claude Code** | [CLAUDE.md](CLAUDE.md) | Native shim → AGENTS.md (P1 done) |
| **Cursor** | [.cursor/rules/*.mdc](.cursor/rules/) | `alwaysApply` + globs; constitution / doc-sync / catalog / **portable MCP** ([cursor-mcp-post-pull.mdc](.cursor/rules/cursor-mcp-post-pull.mdc)) |
| **Codex / Copilot** | `AGENTS.md` | Primary; no extra root file required |
| **Humans** | [README.md](README.md) · [README_en.md](README_en.md) · [FORK_STATUS.md](docs/FORK_STATUS.md) · [FORK_ONBOARDING.md](docs/FORK_ONBOARDING.md) · [DOCUMENTATION_POLICY.md](docs/DOCUMENTATION_POLICY.md) · [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) | Onboarding |

---

## Tech Stack (Summary)

| Layer | Technology |
|-------|------------|
| Runtime | Node.js ≥20 |
| Language | TypeScript (ES2022) |
| Framework | Express.js |
| Cache | Redis |
| Testing | Jest + fast-check |
| Monitoring | Prometheus + Grafana |

---

**Production-ready AI orchestration platform with enterprise-grade monitoring, security, and multi-LLM coordination.**
