## Project Purpose

**`techdev-cursor`** is an **integrated Cursor IDE development-environment project**, forked from upstream `wombat2006/techdev` (Wall-Bounce multi-LLM platform).

- **Primary goals:** **Improve coding accuracy** and **reduce coding workload** (unified MCP, CLI adapters, multi-LLM Wall-Bounce in dev loop)
- **Explicitly not:** IT incident/troubleshooting analysis project (upstream InfraOps fork specialization)
- **Upstream:** `wombat2006/techdev` (reference / optional cherry-pick)
- **Fork tag:** `fork-base/5cc31f57`
- **Manifest:** `forkProfile.yaml`

## Tech Stack

- Runtime: Node.js >=18 with Express 4
- Language: TypeScript (compiled via `tsc` to `dist/`)
- Tooling: Jest for tests, ESLint, ts-node-dev for local dev
- Integrations: prom-client, `@modelcontextprotocol/sdk`, Redis/MySQL, Google Drive RAG
- Provider CLIs (subscription): `claude`, `codex`, `agy` (WSL-native; no API keys in code)

## Repository Tree (verified 2026-06-18)

```
techdev-cursor/                    # ~250 files (excl. .git, node_modules)
├── forkProfile.yaml               # Fork manifest (DevAssist-Cursor)
├── AGENTS.md                      # Neutral agent top (constitution + nav)
├── CLAUDE.md                      # Claude Code shim → AGENTS.md
├── README.md / README_ja.md       # Fork-primary banner present
├── package.json                   # name: techdev-cursor; techsapo-providers-mcp script
├── config/
│   ├── cursor-mcp.template.json   # Unified techsapo-providers registration
│   ├── codex-mcp.toml             # Legacy codex daemon config
│   └── fork/                      # Fork Day 0 stubs (all present)
│       ├── devassist-task-router.json
│       ├── devassist-dictionary-v0.json
│       ├── disclaimer-devassist.json
│       └── grounding-providers.json  # []
├── src/                           # 69 TypeScript/JSON files
│   ├── index.ts                   # Main Express HTTPS server (:8443)
│   ├── server.ts / wall-bounce-server.ts
│   ├── config/                    # environment, feature-flags, llm-providers.json
│   ├── controllers/               # huggingface-controller
│   ├── routes/                    # 11 route modules (wall-bounce-api, rag, webhooks, …)
│   ├── services/                  # 40+ services (core business logic)
│   │   ├── wall-bounce-analyzer.ts    # Wall-Bounce core (legacy spawn)
│   │   ├── wall-bounce-orchestrator.ts
│   │   ├── mcp-integration-service.ts
│   │   ├── claude-code-mcp-server.ts  # Legacy; deprecated for Cursor
│   │   ├── codex-mcp-server.ts        # Ops/daemon only
│   │   └── googledrive-*.ts           # RAG
│   ├── middleware/                # error-handler, openai-auth, validation, metrics
│   ├── metrics/                   # prometheus-client
│   ├── types/                     # huggingface, googleapis (no fork types yet)
│   └── utils/                     # logger, security, mcp-clients, …
├── tests/                         # 24 test files (unit/integration/security/performance)
├── scripts/                       # start/stop, monitoring, pptx-gen, codex-mcp daemon
├── public/                        # Dashboard HTML/JS/CSS
├── docs/                          # 93 files (ARCHITECTURE, FORK_CURSOR, CURSOR_MCP_TODO, ADRs)
└── .cursor/rules/                 # documentation-sync.mdc
```

### Fork extension layout (planned — FORK_CURSOR.md)

| Path | Status |
|------|--------|
| `forkProfile.yaml` | ✅ |
| `config/fork/*.json` | ✅ |
| `config/cursor-mcp.template.json` | ✅ |
| `config/inference-profiles.json` | ❌ Track A-2+ |
| `config/schemas/` | ❌ optional Day 0 |
| `src/types/inference-profile.ts` | ✅ Track A-1 |
| `src/types/adapter-types.ts` | ✅ Track A-1 |
| `src/adapters/` (claude, codex, agy, resolver) | ✅ Track A-1 |
| `src/services/techsapo-providers-mcp-server.ts` | ✅ Track A-1 |
| `tests/adapters/` | ✅ resolver unit test |

## Core Subsystems

1. **Wall-Bounce** — `wall-bounce-analyzer.ts` + `wall-bounce-api.ts` (SSE); Google Tier 1 via `agy --print` (`src/utils/antigravity-cli.ts`)
2. **MCP (legacy → unified)** — Target: single stdio `techsapo-providers` with `analyze_claude`, `analyze_codex`, `analyze_agy`; not yet implemented
3. **RAG** — Google Drive connector, embeddings, webhooks
4. **Monitoring** — Prometheus metrics via `src/metrics/`

## Execution Tracks (from CURSOR_MCP_TODO)

**Priority (2026-06):** P0 **Track A** (finish A-0 auth + Cursor register) → Gate A→B → P1 **Track B** → Gate B→C → P3 **Track C**. P2 **E/F code** and P4 **D / Batch / P5+** — see [runbook § Track priority](../docs/CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review).

| Track | Tree impact | Status |
|-------|-------------|--------|
| Fork Day 0 | forkProfile + config stubs + template + npm script | ✅ committed |
| A-0 | WSL CLI auth (claude/codex/agy) | ✅ **A-0 sign-off 2026-06-18** — all probes pass; A-1 unblocked |
| A-1 code | adapters + unified MCP server | ✅ implemented |
| A-1 ops | Cursor MCP register + G7 smoke | `[~]` WSL smoke OK; Windows Settings paste pending |
| A-2 | InferenceProfile in unified MCP schemas | ❌ |
| B | wall-bounce-analyzer → adapters | ❌ |
| F (code) | catalog loader + cost routing | ❌ schema/stub only |
| C | P5 Phase 0 (orchestrator merge, constitution enforce) | ❌ |
| D / F-13 / P5+ | cache, Batch RAG, Grounding | ❌ low priority |

## Key References

- Fork design: `docs/FORK_CURSOR.md`
- Runbook: `docs/CURSOR_MCP_TODO.md`
- Architecture: `docs/ARCHITECTURE.md`
- Wall-Bounce: `docs/WALL_BOUNCE_SYSTEM.md`
