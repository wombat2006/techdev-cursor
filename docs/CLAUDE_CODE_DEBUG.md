# Claude Code — Debug Your Configuration

**Status**: Documented — fork uses Cursor rules + `AGENTS.md`; this doc applies to `claude` CLI sessions  
**Platform**: [Debug your configuration](https://code.claude.com/docs/en/debug-config) · [.claude directory reference](https://code.claude.com/docs/en/claude-directory)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [AGENTS.md](../AGENTS.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

When Claude Code ignores an instruction or a configured feature does not appear, the cause is usually one of:

1. The file **did not load**
2. It loaded from a **different path** than expected
3. Another scope **overrode** it

This guide documents **inspection commands** and **isolation techniques** to see what actually loaded. For install/auth issues, use [troubleshoot installation](https://code.claude.com/docs/en/troubleshoot-install).

**Fork AS-IS:** Cursor agents do not expose `/context` or `/doctor`. Use this doc when debugging **`claude` CLI** sessions; for Cursor, compare [mcp-rules.md](./agents/mcp-rules.md) and `.cursor/rules/`.

---

## Inspection commands

Run **`/context`** first — shows everything in the context window (system prompt, memory, skills, MCP tools, messages).

| Command | Shows |
|---------|--------|
| `/context` | Full context breakdown |
| `/memory` | Loaded `CLAUDE.md` + rules + auto-memory |
| `/skills` | Project, user, plugin skills |
| `/agents` | Subagents and settings |
| `/hooks` | Active hook configs (read-only) |
| `/mcp` | MCP servers, status, approval |
| `/permissions` | Resolved allow/deny rules |
| `/doctor` | Schema errors, invalid keys, install health |
| `/debug [issue]` | Session debug logging + Claude-assisted diagnosis |
| `/status` | Active settings sources (incl. managed) |

**`/doctor`:** Press `f` to send the report to Claude for guided fixes.

---

## CLAUDE.md vs permissions vs hooks

| Surface | Role | Guarantee level |
|---------|------|-----------------|
| **CLAUDE.md** / rules | "We do it this way here" — conventions | Guidance; adherence varies with clarity and length |
| **Permissions** | Allow/deny tool patterns | Enforced by permission system |
| **Hooks** | Deterministic lifecycle actions | Enforced at event boundaries |

Use CLAUDE.md for build commands and project norms. Use permissions or hooks for security boundaries and **must-never** rules — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md).

**Subdirectory `CLAUDE.md`:** Loads **on demand** when Claude **reads** a file in that directory — not at session start, not on Write/Edit there. See [memory loading](https://code.claude.com/docs/en/memory#how-claude-md-files-load).

**Explore / Plan subagents:** Built-in agents **skip** `CLAUDE.md`. Restate critical rules in the delegating prompt or put them in custom agent file body.

---

## Settings scope and precedence

Settings merge: **managed** (org) → **local** → **project** → **user**. CLI flags and [env vars](https://code.claude.com/docs/en/env-vars) add another override layer.

| File | Purpose |
|------|---------|
| `~/.claude/settings.json` | User hooks, permissions, env |
| `.claude/settings.json` | Project — commit |
| `.claude/settings.local.json` | Project — overrides `settings.json` |
| `~/.claude.json` | **App state / UI only** — **not** hooks, permissions, or env |

**Common mistake:** Putting `hooks` or `permissions` in `~/.claude.json` — they belong in `settings.json`.

Run `/status` for active sources. Run `/doctor` for invalid keys. Details: [settings scopes](https://code.claude.com/docs/en/settings#how-scopes-interact).

---

## Debug MCP

Run `/mcp` — connection status, approval, tool count.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Server missing | Wrong file location | Project MCP = **repo root** `.mcp.json`, not `.claude/` |
| Server missing | `mcpServers` in `settings.json` | Use `.mcp.json` or `claude mcp add --scope user` |
| Disabled | Approval dismissed | Approve from `/mcp` |
| Failed start | Relative script path | Absolute paths; `npx`/`uvx` on PATH OK |
| Connected, 0 tools | Server not listing tools | Reconnect; `claude --debug mcp` |
| Missing env in child | `env` only in `settings.json` | Per-server `env` in `.mcp.json` |

Full config: [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md).

---

## Debug hooks

Run `/hooks` — if hook **missing**, it is not being read (must be under `"hooks"` in `settings.json`, not a standalone file except plugin `hooks/hooks.json`).

If hook **listed but not firing**:

| Cause | Fix |
|-------|-----|
| `matcher` is JSON **array** | Use single string: `"Edit\|Write"` |
| Lowercase tool name (`bash`) | Case-sensitive: `Bash`, `Edit`, `Write` |
| Stale view | Wait file-stability delay; re-run `/hooks` |

Live evaluation: `claude --debug hooks` — see [debug hooks](https://code.claude.com/docs/en/hooks#debug-hooks) and [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md).

---

## Debug skills

| Symptom | Fix |
|---------|-----|
| Not in `/skills` | Use `.claude/skills/<name>/SKILL.md`, not `.claude/skills/name.md` |
| Listed but never auto-invoked | Check `disable-model-invocation`; description match; `/skills` "user-only" badge |

Detail: [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md).

---

## Isolate: safe mode and clean config

### `--safe-mode` (v2.1.169+)

```bash
claude --safe-mode
```

Disables customizations: `CLAUDE.md`, skills, plugins, hooks, MCP, custom commands/agents. Auth, model, built-in tools, permissions still work. **Managed** org hooks/status line may still run.

If problem disappears → re-enable surfaces one at a time with inspection commands above.

### `CLAUDE_CONFIG_DIR` clean session

Bypass everything under `~/.claude`; launch from a dir with no `.claude/`, `.mcp.json`, or `CLAUDE.md`:

```bash
cd /tmp && CLAUDE_CONFIG_DIR=/tmp/claude-clean claude
```

- Managed settings outside `~/.claude` may still apply
- Linux/WSL: re-login (credentials under config dir)
- macOS: Keychain credentials may carry over

Reintroduce real config incrementally to find the culprit.

---

## Common causes (quick reference)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hook never fires | `matcher` as array | Single string with `\|` |
| Hook never fires | Lowercase tool name | `Bash` not `bash` |
| Hook never fires | Standalone hooks file | `"hooks"` key in `settings.json` |
| Global hooks ignored | In `~/.claude.json` | Move to `~/.claude/settings.json` |
| Setting ignored | `settings.local.json` override | Check local scope |
| Skill missing | Flat `.md` file | Folder + `SKILL.md` |
| Skill user-only | `disable-model-invocation` | `/skills` badge |
| Subdir CLAUDE.md ignored | On-demand load only | Trigger via Read in that dir |
| SessionEnd cleanup missing | No hook | Add `SessionEnd` in settings |
| MCP in `.claude/` | Wrong path | Root `.mcp.json` |
| `Bash(rm *)` misses `/bin/rm` | Prefix matches literal string | Explicit patterns or PreToolUse hook |

---

## Fork mapping

| Claude Code | This fork (Cursor) |
|-------------|-------------------|
| `/memory` → `CLAUDE.md` | [AGENTS.md](../AGENTS.md) + [CLAUDE.md](../CLAUDE.md) shim |
| `.claude/skills/` | Not committed AS-IS; [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) |
| `.mcp.json` | `.cursor/mcp.json` — [mcp-rules.md](./agents/mcp-rules.md) |
| `.claude/settings.json` hooks | `.cursor/rules/` + user rules (no lifecycle hooks) |
| `/doctor` | `npm run validate:config` for catalog; no CLI equivalent |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.debug` | Inspection commands, safe mode, clean config |
| `prompting.guidanceTopics[]` | `claude-code-debug-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No committed `.claude/settings.json` to validate with `/doctor` |
| Cursor | No `/context` or configuration merge UI |
| Wall-Bounce | No runtime wiring of Claude Code debug surfaces |

---

## Backlog

- **E-6** — Document fork onboarding: when to use `claude --safe-mode` vs Cursor for reproducing agent issues.
- **E-5** — After project hooks land, verify with `/hooks` + `claude --debug hooks`.

---

## References

- [Debug configuration (platform)](https://code.claude.com/docs/en/debug-config)
- [.claude directory reference](https://code.claude.com/docs/en/claude-directory)
- [Settings](https://code.claude.com/docs/en/settings) · [Memory](https://code.claude.com/docs/en/memory)
- [Hooks](https://code.claude.com/docs/en/hooks) · [MCP](https://code.claude.com/docs/en/mcp)
- [CLI `--safe-mode`](https://code.claude.com/docs/en/cli-reference#cli-flags)
- [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md)
