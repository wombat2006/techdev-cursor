# Claude Code — Tool Notes

> Claude Code–specific pointers. Neutral agent rules: [AGENTS.md](../../AGENTS.md).

| Purpose | Document |
|---------|----------|
| **Glossary (terms)** | [CLAUDE_CODE_GLOSSARY.md](../CLAUDE_CODE_GLOSSARY.md) — agentic loop, compaction, hooks, MCP, skills |
| **Auto mode config** | [CLAUDE_CODE_AUTO_MODE.md](../CLAUDE_CODE_AUTO_MODE.md) — `autoMode.environment`, deny/allow rules |
| **Monitoring (OTel)** | [CLAUDE_CODE_MONITORING.md](../CLAUDE_CODE_MONITORING.md) — metrics, events, SIEM audit |
| **Best practices (start here)** | [CLAUDE_CODE_BEST_PRACTICES.md](../CLAUDE_CODE_BEST_PRACTICES.md) — context, verify, plan, session |
| **CLI reference** | [CLAUDE_CODE_CLI_REFERENCE.md](../CLAUDE_CODE_CLI_REFERENCE.md) — commands, flags, adapter mapping |
| **Neutral top (all agents)** | [AGENTS.md](../../AGENTS.md) |
| **Claude Code shim** | [CLAUDE.md](../../CLAUDE.md) |
| **Claude Code Skills** | [CLAUDE_CODE_SKILLS.md](../CLAUDE_CODE_SKILLS.md) — filesystem skills, `/commands`, frontmatter |
| **Claude Code MCP (client)** | [CLAUDE_CODE_MCP_CONNECT.md](../CLAUDE_CODE_MCP_CONNECT.md) — `claude mcp`, `.mcp.json` scopes |
| **Claude Code Hooks** | [CLAUDE_CODE_HOOKS.md](../CLAUDE_CODE_HOOKS.md) — lifecycle automation, `/hooks` |
| **Claude Code debug** | [CLAUDE_CODE_DEBUG.md](../CLAUDE_CODE_DEBUG.md) — `/context`, `/doctor`, safe mode |
| **Claude Code costs** | [CLAUDE_CODE_COST_MANAGEMENT.md](../CLAUDE_CODE_COST_MANAGEMENT.md) — `/usage`, token reduction |
| **Claude Code plugins** | [CLAUDE_CODE_PLUGINS.md](../CLAUDE_CODE_PLUGINS.md) — marketplaces, LSP, `/plugin` |
| **Claude Code scheduled** | [CLAUDE_CODE_SCHEDULED_TASKS.md](../CLAUDE_CODE_SCHEDULED_TASKS.md) — `/loop`, cron tools |
| **Claude Code programmatic** | [CLAUDE_CODE_PROGRAMMATIC.md](../CLAUDE_CODE_PROGRAMMATIC.md) — `claude -p`, Agent SDK CLI |
| **Claude Code deep links** | [CLAUDE_CODE_DEEP_LINKS.md](../CLAUDE_CODE_DEEP_LINKS.md) — `claude-cli://` runbooks |
| **Platform Agent Skills (API)** | [ANTHROPIC_AGENT_SKILLS.md](../ANTHROPIC_AGENT_SKILLS.md) |
| **SKILL.md authoring** | [ANTHROPIC_SKILLS_AUTHORING.md](../ANTHROPIC_SKILLS_AUTHORING.md) |
| Commands | [commands.md](./commands.md) |
| MCP usage rules | [mcp-rules.md](./mcp-rules.md) |
| Dev notes and structure | [development-notes.md](./development-notes.md) |
| WSL CLI setup | [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md) |
| Full documentation index | [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) |

## Skills quick reference

| Location | Path |
|----------|------|
| Personal | `~/.claude/skills/<name>/SKILL.md` |
| Project | `.claude/skills/<name>/SKILL.md` |
| Legacy commands | `.claude/commands/<name>.md` (same as `/name`) |

Invoke: `/skill-name` or let Claude auto-load when `description` matches. Side-effect workflows: `disable-model-invocation: true` in frontmatter.

Full detail: [CLAUDE_CODE_SKILLS.md](../CLAUDE_CODE_SKILLS.md).

## MCP quick reference

| Surface | Config file |
|---------|-------------|
| Claude Code (this CLI) | `~/.claude.json` + project `.mcp.json` |
| Cursor IDE (this fork) | `.cursor/mcp.json` |

```bash
claude mcp add --transport http <name> <url>
claude mcp list
# In session: /mcp
```

Full detail: [CLAUDE_CODE_MCP_CONNECT.md](../CLAUDE_CODE_MCP_CONNECT.md).

## Hooks quick reference

| Location | Path |
|----------|------|
| User | `~/.claude/settings.json` |
| Project | `.claude/settings.json` (commit) |
| Local | `.claude/settings.local.json` (gitignored) |
| Scripts | `.claude/hooks/*.sh` |

Browse: `/hooks` (read-only). Common events: `PreToolUse`, `PostToolUse`, `SessionStart` (`compact`), `Notification`.

Full detail: [CLAUDE_CODE_HOOKS.md](../CLAUDE_CODE_HOOKS.md).

## Debug quick reference

| Command | Purpose |
|---------|---------|
| `/context` | What loaded into context |
| `/memory` | CLAUDE.md + rules |
| `/doctor` | Schema / invalid keys (`f` → send to Claude) |
| `/status` | Active settings scopes |
| `/hooks` · `/mcp` · `/skills` | Surface-specific inspection |

Isolation: `claude --safe-mode` (v2.1.169+); `CLAUDE_CONFIG_DIR=/tmp/claude-clean claude` for clean user config.

**Do not** put hooks/permissions in `~/.claude.json` — use `~/.claude/settings.json`.

Full detail: [CLAUDE_CODE_DEBUG.md](../CLAUDE_CODE_DEBUG.md).

## Cost quick reference

| Lever | Action |
|-------|--------|
| Track | `/usage` (local estimate); Console for billing |
| Context | `/clear`, `/compact`, keep CLAUDE.md lean → skills |
| Model | Sonnet default; Haiku subagents; Opus for hard reasoning |
| MCP | Disable unused via `/mcp`; prefer CLI tools when enough |
| Preprocess | PreToolUse hooks filter logs — [CLAUDE_CODE_HOOKS.md](../CLAUDE_CODE_HOOKS.md) |
| Thinking | Lower `/effort` or disable for simple tasks |

Full detail: [CLAUDE_CODE_COST_MANAGEMENT.md](../CLAUDE_CODE_COST_MANAGEMENT.md).

## Plugins quick reference

```shell
/plugin                                    # Discover / Installed / Marketplaces / Errors
/plugin marketplace add anthropics/claude-code
/plugin install github@claude-plugins-official
/reload-plugins
```

Plugin skills: `/plugin-name:skill-name`. Scopes: user (default), project, local, managed.

Full detail: [CLAUDE_CODE_PLUGINS.md](../CLAUDE_CODE_PLUGINS.md).

## Scheduled tasks quick reference

```text
/loop 5m check the deploy          # fixed interval (v2.1.72+)
/loop check CI on the PR           # dynamic interval
/loop                              # maintenance prompt or .claude/loop.md
```

`CronCreate` / `CronList` / `CronDelete` — max 50/session; 7-day recurring expiry. Disable: `CLAUDE_CODE_DISABLE_CRON=1`.

Full detail: [CLAUDE_CODE_SCHEDULED_TASKS.md](../CLAUDE_CODE_SCHEDULED_TASKS.md).

## Programmatic CLI quick reference

```bash
claude -p "Review auth.py" --allowedTools "Read,Edit"
claude --bare -p "CI summarize" --allowedTools "Read"    # skip local hooks/MCP/CLAUDE.md
claude -p "Summary" --output-format json | jq -r '.result'
```

Adapter AS-IS: [`claude-adapter.ts`](../../src/adapters/claude-adapter.ts) uses `--print` text only. Backlog: `--bare`, JSON output (WB-14).

Full detail: [CLAUDE_CODE_PROGRAMMATIC.md](../CLAUDE_CODE_PROGRAMMATIC.md).

## Deep links quick reference

```text
claude-cli://open?repo=owner/name&q=URL-encoded%20prompt
xdg-open "claude-cli://open?repo=acme/app&q=investigate%20alert"
```

v2.1.91+; prompt pre-filled only (Enter to send). GitHub MD strips `claude-cli://` — use code blocks.

Full detail: [CLAUDE_CODE_DEEP_LINKS.md](../CLAUDE_CODE_DEEP_LINKS.md).
