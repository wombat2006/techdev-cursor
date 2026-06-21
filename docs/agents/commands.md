# Agent Commands Reference

[← AGENTS.md](../../AGENTS.md) · [CLAUDE.md shim](../../CLAUDE.md) · [Documentation Index](../DOCUMENTATION_INDEX.md)

Command reference for TechSapo development and operations. For workflows, see [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md).

---

## Development Workflow

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript → dist/
npm run dev          # Hot reload development
npm start            # PM2 daemons (techsapo + codex-mcp)
npm run pm2:start    # Same as npm start
npm run pm2:stop     # Stop PM2 daemons
npm run start:legacy # Legacy nohup startup
npm run lint         # Code quality check
```

---

## Testing

```bash
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:coverage     # Coverage report (target: 100%)
npm run test:watch        # Watch mode
```

Requirements: [TESTING_GUIDE.md](../TESTING_GUIDE.md)

---

## MCP Services

**Prerequisite:** Complete [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) **Track A-0** (WSL-native `claude`, `codex`, `agy` + auth) before Cursor MCP registration.

```bash
npm run cipher-mcp        # Long-term memory MCP
npm run codex-mcp         # GPT-5/Codex MCP integration
npm run claude-code-mcp   # Claude Code MCP (Sonnet 4.5)
npm run codex-mcp-test    # Verify Codex MCP after Phase 0
npm run cipher-api        # Cipher API mode (port 3002)
```

Architecture: [MCP_SERVICES.md](../MCP_SERVICES.md) · Cursor plan: [CURSOR_MCP_PLAN.md](../CURSOR_MCP_PLAN.md)

---

## Glossary prep (consumer — this repo only)

Read-only invoke of sibling `term-prep-platform` CLI. **Do not edit or commit the platform repo** from consumer tasks.

```bash
npm run glossary:extract:check   # fugashi + unidic-lite via platform venv
npm run glossary:extract         # refresh meta/glossary-adopt.json, meta/glossary-hold.json
npm run glossary:mcp-smoke       # classify_term stub → unknown
```

Config: `meta/glossary-config.json` · Boundary: [Consumer boundary](../../meta/TO-BE-GLOSSARY-PIPELINE.md#consumer-boundary-mandatory) · If platform must change → [notify user](../../meta/TO-BE-GLOSSARY-PIPELINE.md#platform-escalation--notify-the-user) (do not edit term-prep-platform from here)

---

## Monitoring & Operations

```bash
./scripts/start-monitoring.sh     # Prometheus + Grafana stack
sudo systemctl status techsapo    # Production service status
```

Details: [MONITORING_OPERATIONS.md](../MONITORING_OPERATIONS.md)

---

## Environment Verification

**Cursor MCP Phase 0** — all must pass (WSL-native paths only):

```bash
which claude && claude --version    # NOT /mnt/c/.../npm/claude
which codex  && codex --version     # WSL: npm install -g @openai/codex
which agy    && agy --version       # ~/.local/bin/agy
unset ANTHROPIC_API_KEY
test -f ~/.claude/.credentials.json || test -f ~/.claude/session  # Claude OAuth
test -f ~/.codex/auth.json && echo "codex auth ok"
test -f ~/.gemini/antigravity-cli/antigravity-oauth-token && echo "agy oauth ok"
npm run build && npm run mcp:list-tools-smoke && npm run g7:adapter-smoke
which agy             # Antigravity CLI (required)
which codex           # Codex CLI (required for GPT-5)
redis-cli ping        # Redis must be running
sudo systemctl status techsapo
```

Details: [CURSOR_MCP_TODO.md](../CURSOR_MCP_TODO.md) · [CURSOR_MCP_PLAN.md](../CURSOR_MCP_PLAN.md) · [CURSOR_MCP_TEMPLATE.md](../CURSOR_MCP_TEMPLATE.md)

Antigravity migration: [ANTIGRAVITY_CLI_MIGRATION.md](../ANTIGRAVITY_CLI_MIGRATION.md)

---

## Emergency & Rollback

```bash
./scripts/start-monitoring.sh              # Prometheus + Grafana stack
./scripts/production-monitoring.js         # App health polling (logs alerts)
```

Abnormal user alerts route to **LINE** via **line-notification** Webhook — see [MONITORING_OPERATIONS.md § LINE](../MONITORING_OPERATIONS.md#ユーザー異常通知line).

### Health Checks

```bash
curl https://localhost:8443/health       # Application health
curl https://localhost:8443/metrics      # Prometheus metrics
```

---

## Useful Scripts (`scripts/`)

```bash
./scripts/comprehensive-rag-test.sh        # Full RAG system testing
./scripts/production-monitoring.js         # Production health monitoring
./scripts/resync-drive-docs.ts            # Google Drive document sync
npm run test:contract                     # Contract + config validation (fork gate)
npm run generate:proposal-pptx            # Regenerate Wall-Bounce proposal PPTX
```
