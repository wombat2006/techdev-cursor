# Antigravity CLI Migration (Google Tier 1 Provider)

**Version**: 1.0  
**Date**: 2026-06-18  
**Status**: Implemented in `wall-bounce-analyzer.ts` via `src/utils/antigravity-cli.ts`

---

## Background

Google is consolidating **Gemini CLI** into **Antigravity CLI**. TechSapo Tier 1 (Google / Gemini analysis) provider access standard is **Antigravity CLI**.

- **CLI command**: `agy` (formerly: `gemini`)
- **Authentication**: Google OAuth via first successful CLI use; token at `~/.gemini/antigravity-cli/antigravity-oauth-token` (**agy 1.0.9 has no `agy auth login` subcommand**). Embedded API keys remain forbidden.
- **Example models**: Gemini 2.5 Pro / Flash (via Antigravity harness)
- **Prompt transport**: stdin + `--print` (matches [antigravity-cli.ts](../src/utils/antigravity-cli.ts); do not pass long prompts as CLI argv)

Reference: [Google Developers Blog — Transitioning Gemini CLI to Antigravity CLI](https://developers.googleblog.com/en/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)

---

## Role in TechSapo

| Item | Documentation standard | Implementation (AS-IS) |
|------|------------------------|-------------------------|
| Google Tier 1 | Antigravity CLI (`agy`) | `wall-bounce-analyzer.ts` spawns `agy --print` (stdin) |
| Security | CLI spawn only, no API keys | Unchanged |
| Wall-Bounce | Multi-provider coordination | Unchanged |

**Future implementation migration**: `spawn('gemini', …)` → `spawn('agy', …)` — **done** in `executeGeminiCLI` / aggregation fallback. Prompt via stdin + `--print`; plain-text response (not JSON).

---

## Development Environment Setup

**WSL2:** Install `agy` **inside WSL** (`~/.local/bin/agy`). Required for Cursor MCP Phase 0 — see [CURSOR_MCP_PLAN.md](./CURSOR_MCP_PLAN.md).

```bash
# Install Antigravity CLI (official)
curl -fsSL https://antigravity.google/cli/install.sh | bash

# Verify binary
which agy
agy --version

# Auth — token file (browser OAuth on first probe if missing)
test -f ~/.gemini/antigravity-cli/antigravity-oauth-token && echo "agy oauth token ok"

# Smoke probe — from /tmp, stdin (NOT from git repo cwd; NOT prompt as argv)
cd /tmp
echo 'Reply with only: ok' | agy --print --model gemini-2.5-flash
```

Full troubleshooting (repo cwd agent loop, timeouts): [CURSOR_MCP_TODO.md § A-0.3](./CURSOR_MCP_TODO.md#a-03-antigravity-agy).

---

## Related Documentation

| Document | Content |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Provider tier layout |
| [SECURITY.md](./SECURITY.md) | CLI spawn security |
| [GEMINI_CLI_INTEGRATION_GUIDE.md](./GEMINI_CLI_INTEGRATION_GUIDE.md) | Legacy Gemini CLI guide (reference; to be superseded by Antigravity) |
| [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md) | Wall-Bounce provider configuration |
| [CURSOR_MCP_PLAN.md](./CURSOR_MCP_PLAN.md) | WSL CLI prerequisite for Cursor MCP |

---

## Terminology

| Legacy | New (documentation standard) |
|--------|------------------------------|
| Gemini CLI | Antigravity CLI |
| `gemini` command | `agy` command |
| Via Gemini CLI | Via Antigravity CLI |

Model names **Gemini 2.5 Pro / Flash** remain the LLM model names used on Antigravity.
