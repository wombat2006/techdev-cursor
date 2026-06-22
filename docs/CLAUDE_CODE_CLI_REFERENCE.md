# Claude Code — CLI Reference

**Status**: Documented — fork adapter uses subset of flags; full reference for operators  
**Platform**: [CLI reference](https://code.claude.com/docs/en/cli-reference) · `claude --help` (partial)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [SECURITY.md](./SECURITY.md) · [decisions/TECH_STACK_CLI_INVOKE_METADATA.md](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md)

---

## What it is

Canonical **command-line** surface for Claude Code: interactive sessions, print mode (`-p`), auth, MCP/plugins, background agents, session resume.

**Note:** `claude --help` does not list every flag — absence from help ≠ unavailable.

**Fork AS-IS:** [`claude-adapter.ts`](../src/adapters/claude-adapter.ts) spawns:

```text
claude --print --model <alias> --strict-mcp-config [--effort <level>]
```

stdin = prompt; stdout = text only. See [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) and backlog **WB-14**.

---

## Core commands

| Command | Purpose |
|---------|---------|
| `claude` | Interactive session |
| `claude "query"` | Interactive with initial prompt |
| `claude -p "query"` | Print mode — exit after response |
| `cat f \| claude -p "q"` | Pipe stdin (10MB cap v2.1.128+) |
| `claude -c` / `--continue` | Continue latest in cwd |
| `claude -r "<id\|name>" "q"` | Resume session |
| `claude update` / `claude install [ver]` | Version management |
| `claude auth login\|logout\|status` | Auth (`--console` for API billing) |
| `claude mcp` | MCP config — [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) |
| `claude plugin` | Plugins — [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) |
| `claude setup-token` | Long-lived OAuth for CI (subscription) |

### Background agents (v2.1+)

| Command | Purpose |
|---------|---------|
| `claude agents` | Agent view; `--json` for scripting |
| `claude --bg "task"` | Start background session |
| `claude attach <id>` | Attach terminal to background session |
| `claude logs <id>` | Recent output |
| `claude stop <id>` / `claude kill` | Stop background session |
| `claude respawn <id>` | Restart with conversation intact |
| `claude rm <id>` | Remove from list (transcript kept for `--resume`) |
| `claude daemon status` / `daemon stop` | Supervisor diagnostics |

---

## Print mode flags (`-p`)

Detail: [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md).

| Flag | Purpose |
|------|---------|
| `--bare` | Skip hooks/skills/plugins/MCP/CLAUDE.md — CI default path |
| `--output-format` | `text` \| `json` \| `stream-json` |
| `--json-schema` | Validated structured output |
| `--allowedTools` / `--disallowedTools` | Permission patterns |
| `--permission-mode` | `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions` |
| `--max-budget-usd` | Spend cap |
| `--max-turns` | Agentic turn limit |
| `--continue` / `--resume` | Multi-turn print pipelines |
| `--no-session-persistence` | Don't save session |
| `--init` / `--maintenance` | Setup hooks (print only) |
| `--include-partial-messages` | Stream tokens (`stream-json` + `--verbose`) |
| `--mcp-config` + `--strict-mcp-config` | Isolated MCP (adapter uses strict) |

---

## Session and worktree flags

| Flag | Purpose |
|------|---------|
| `-n` / `--name` | Session display name; resume by name |
| `--session-id` | Fixed UUID |
| `--fork-session` | New ID when resuming |
| `--from-pr` | Resume sessions linked to PR |
| `--add-dir` | Extra read/edit dirs (file access; limited `.claude/` discovery) |
| `-w` / `--worktree` | Git worktree isolation |
| `--setting-sources` | `user`, `project`, `local` |
| `--settings` | Inline or file JSON override |

---

## Model and behavior

| Flag | Purpose |
|------|---------|
| `--model` | `sonnet`, `opus`, `haiku`, `fable`, or full ID |
| `--effort` | `low` … `max` (session override) |
| `--fallback-model` | Comma-separated fallback chain |
| `--advisor` | Server-side advisor tool (v2.1.98+) |
| `--agent` / `--agents` | Subagent override / dynamic JSON |
| `--permission-mode plan` | Plan mode at start |
| `--tools` | Restrict built-in tools |
| `--disable-slash-commands` | No skills/commands |

### System prompt flags

| Flag | Effect |
|------|--------|
| `--system-prompt` / `--system-prompt-file` | **Replace** default |
| `--append-system-prompt` / `-file` | **Append** to default |

Append = keep Claude Code identity + extra rules. Replace = you own full prompt. See [memory](https://code.claude.com/docs/en/memory) vs [output styles](https://code.claude.com/docs/en/output-styles).

---

## Debug and safe mode

| Flag | Purpose |
|------|---------|
| `--debug` / `--debug-file` | Category-filtered logs |
| `--safe-mode` | Disable customizations (v2.1.169+) — [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) |
| `--bare` | Minimal scripted surface (not same as safe-mode) |

`--safe-mode`: still loads auth, model, built-in tools, permissions; managed policy may still apply hooks.

---

## Auth and security (fork)

| Item | Fork policy |
|------|-------------|
| `claude auth login` | CLI/OAuth — per [SECURITY.md](./SECURITY.md) |
| `ANTHROPIC_API_KEY` in env | **Stripped** in `claude-adapter.ts` |
| `claude setup-token` | CI only when explicitly approved |
| `--dangerously-skip-permissions` | Avoid in shared automation |

---

## Adapter → CLI mapping (target)

| Adapter need | CLI flag (today / backlog) |
|--------------|----------------------------|
| Non-interactive | `--print` ✅ |
| Model alias | `--model` ✅ |
| Effort | `--effort` ✅ |
| MCP isolation | `--strict-mcp-config` ✅ (no `--mcp-config` yet) |
| JSON + usage | `--output-format json` ⏳ WB-14 |
| Reproducible CI | `--bare` ⏳ B-6 |
| Tool allowlist | `--allowedTools` ⏳ |
| Session resume | `--resume` ⏳ |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.cliReference` | Platform URL, key flags |
| `prompting.guidanceTopics[]` | `claude-code-cli-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | 3–4 flags only; no JSON metadata parse |
| Docs | No generated flag inventory in repo (platform is source of truth) |

---

## Backlog

- **WB-14** — `--output-format json` + parser in adapter
- **B-6** — `--bare` for Wall-Bounce analyze in CI
- **E-12** — Document `claude agents --json` for local ops (optional)

---

## References

- [CLI reference (platform)](https://code.claude.com/docs/en/cli-reference)
- [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)
- [Settings](https://code.claude.com/docs/en/settings) · [Permission modes](https://code.claude.com/docs/en/permission-modes)
- [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) · [CLAUDE_CODE_BEST_PRACTICES.md](./CLAUDE_CODE_BEST_PRACTICES.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md)
