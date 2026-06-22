# Claude Code — Connect MCP Servers

**Status**: Documented — fork uses **Cursor** `.cursor/mcp.json` for Serena/ByteRover; Claude Code MCP is a **separate client config** (this doc)  
**Platform**: [Connect to MCP servers](https://code.claude.com/docs/en/mcp) · [MCP reference](https://code.claude.com/docs/en/mcp) · [Model Context Protocol](https://modelcontextprotocol.io/introduction)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [agents/mcp-rules.md](./agents/mcp-rules.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [MCP_SERVICES.md](./MCP_SERVICES.md) · [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) · [CLAUDE_CODE_MCP_IMPLEMENTATION.md](./CLAUDE_CODE_MCP_IMPLEMENTATION.md) · [SECURITY.md](./SECURITY.md) · [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

---

## What it is

**MCP (Model Context Protocol)** lets Claude Code call external tools (issue trackers, databases, browsers, docs search). MCP **servers** expose tools; Claude Code is the **client**.

**This fork — two MCP surfaces:**

| Surface | Config | Used by |
|---------|--------|---------|
| **Cursor IDE** | `.cursor/mcp.json` | Cursor agents — Serena, ByteRover, Codex, Context7 ([mcp-rules.md](./agents/mcp-rules.md)) |
| **Claude Code CLI** | `~/.claude.json` + project `.mcp.json` | `claude` sessions — this doc |

Do not confuse with [CLAUDE_CODE_MCP_IMPLEMENTATION.md](./CLAUDE_CODE_MCP_IMPLEMENTATION.md) — that documents this repo's **legacy MCP server** wrapping `claude` CLI for Wall-Bounce (deprecated for Cursor).

---

## Quick start (HTTP server)

Run **outside** a `claude` session:

```bash
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
claude mcp list
claude
# In session: Use the claude-code-docs server to look up what MCP_TIMEOUT does
```

Remove when done:

```bash
claude mcp remove claude-code-docs
```

Each connected server consumes **context** (tool names + server instructions load every session). Remove unused servers.

---

## CLI commands

| Command | Purpose |
|---------|---------|
| `claude mcp add` | Register server (shell, not in-session) |
| `claude mcp list` | Status of all servers |
| `claude mcp get <name>` | Scope, URL/command, errors |
| `claude mcp remove <name>` | Delete entry (`--scope` if multi-scope) |
| `claude mcp reset-project-choices` | Re-prompt project server approval |
| `claude mcp add-from-claude-desktop` | Import from Desktop config (macOS/WSL) |

**In-session:** `/mcp` — list, authenticate, reconnect, approve project servers.

---

## Transports

### HTTP (hosted)

```bash
claude mcp add --transport http <name> <url>
```

OAuth services (Sentry, Linear, Notion): add URL → `/mcp` → **Authenticate** in browser.

Static token:

```bash
claude mcp add --transport http github --header "Authorization: Bearer <token>" <url>
```

### stdio (local subprocess)

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

- No `--transport` flag (default `stdio`)
- Everything after `--` is the spawn command
- First connect may fail while `npx` downloads — retry `claude mcp list`

---

## Installation scopes

| Scope | Flag | File | Who |
|-------|------|------|-----|
| **local** | (default) | `~/.claude.json` under this project key | You, this project only |
| **user** | `--scope user` | `~/.claude.json` top-level `mcpServers` | You, all projects |
| **project** | `--scope project` | `<repo>/.mcp.json` | Team (commit + approve on clone) |

Scope is fixed at add time — remove and re-add to change scope.

`claude mcp get <name>` shows which scope holds a definition.

**Windows:** `~/.claude.json` → `%USERPROFILE%\.claude.json`. Override dir: `CLAUDE_CONFIG_DIR`.

---

## `.mcp.json` format (project scope)

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "type": "http",
      "url": "https://code.claude.com/docs/mcp"
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

- Read at **session start** — restart after edits
- First project-scoped server → **approval prompt** (security)
- Optional `env` for API keys: `"env": { "API_KEY": "..." }`

**Not valid paths:** `~/.claude/config/mcp.json`, `~/.claude/mcp.json`, `%APPDATA%\Claude\mcp.json`.

---

## Connection status

| Status | Meaning |
|--------|---------|
| `✓ Connected` | Ready |
| `! Connected · tools fetch failed` | Connected but no tools — `claude mcp get <name>` |
| `! Needs authentication` | OAuth / header required |
| `✗ Failed to connect` | No response — see troubleshooting |
| `✗ Connection error` | Threw on connect |
| `⏸ Pending approval` | Project server awaiting approval |

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `MCP_TIMEOUT` | Startup timeout ms (default 30000). Example: `MCP_TIMEOUT=60000 claude` |
| `CLAUDE_CONFIG_DIR` | Alternate config root for `~/.claude.json` |

Pass per-server env on add: `claude mcp add --env KEY=value ...`

---

## Fork alignment

| Need | Use |
|------|-----|
| Wall-Bounce dev in **Cursor** | [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) — `.cursor/mcp.json` |
| Agent-edit in **Claude Code** | This doc — `claude mcp add` or commit `.mcp.json` |
| Same Serena on both | Register separately per surface (different config files) |
| WSL CLI auth | [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) — `claude login`, no `ANTHROPIC_API_KEY` |

Example Serena on Claude Code (from project root):

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)"
```

---

## Troubleshooting (summary)

| Symptom | Fix |
|---------|-----|
| No servers in `/mcp` | Added from wrong project dir; wrong config path; use `--scope user` |
| HTTP failed | `curl -I <url>` — 401/403 → auth; no response → URL/network |
| stdio failed | Run spawn command manually; check `--` separator on `mcp add` |
| Startup timeout | Raise `MCP_TIMEOUT` |
| Server already exists | `claude mcp remove <name> --scope <scope>` |
| No tools | Missing `--env` / API key |
| `.mcp.json` ignored | Restart session; check parse warning in `/mcp` |
| OAuth fails | `/mcp` → Authenticate; open URL manually |

Full platform troubleshooting: [Connect to MCP servers](https://code.claude.com/docs/en/mcp).

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.mcp` | Config paths, timeout, `/mcp` |
| `prompting.guidanceTopics[]` | `claude-code-mcp-*` slugs |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No committed `.mcp.json` for Claude Code (Cursor uses `.cursor/mcp.json`) |
| Parity | Serena/ByteRover rules in [mcp-rules.md](./agents/mcp-rules.md) target Cursor, not `claude mcp` |
| Legacy | `claude-code-mcp-server.ts` — separate from client MCP config |

---

## Backlog

- **E-5** — Optional project `.mcp.json` template for Claude Code agent-edit alongside Cursor config.
- Document dual-registration runbook in [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) if product needs both surfaces.

---

## References

- [Connect to MCP servers (platform)](https://code.claude.com/docs/en/mcp)
- [MCP installation scopes](https://code.claude.com/docs/en/mcp#mcp-installation-scopes)
- [Anthropic MCP directory](https://code.claude.com/docs/en/mcp#find-and-build-mcp-servers)
- [Build an MCP server](https://modelcontextprotocol.io/quickstart/server)
- [Fork MCP architecture](./MCP_SERVICES.md) · [Cursor MCP runbook](./CURSOR_MCP_TODO.md)
