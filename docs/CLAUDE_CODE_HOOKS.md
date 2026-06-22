# Claude Code Hooks Integration

**Status**: Documented — no project `.claude/settings.json` hooks committed yet (Track E-5)  
**Platform**: [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide) · [Hooks reference](https://code.claude.com/docs/en/hooks)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [SECURITY.md](./SECURITY.md) · [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

---

## What it is

**Hooks** are user-defined shell commands (or HTTP / MCP / prompt / agent handlers) that run at fixed points in Claude Code's lifecycle. They provide **deterministic** automation — format on save, block protected files, notify on idle, re-inject context after compaction — without relying on the model to remember.

**Fork AS-IS:** Cursor agents use [mcp-rules.md](./agents/mcp-rules.md) and `.cursor/rules/` — **not** Claude Code hooks. Hooks apply to `claude` CLI sessions and committed `.claude/settings.json`.

---

## Quick start

Add to `~/.claude/settings.json` (Linux/WSL example — desktop notification):

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Claude Code needs your attention'"
          }
        ]
      }
    ]
  }
}
```

Browse configured hooks: `/hooks` (read-only — edit JSON or ask Claude to change).

---

## Hook types

| `type` | Runs | Use |
|--------|------|-----|
| `command` | Shell (default) | Formatters, guards, logging |
| `http` | POST to URL | Team audit service, cloud functions |
| `mcp_tool` | Connected MCP server tool | See [hooks reference](https://code.claude.com/docs/en/hooks#mcp-tool-hook-fields) |
| `prompt` | Single LLM turn (Haiku default) | Judgment: task complete? |
| `agent` | Subagent with tools (experimental) | Verify tests pass before `Stop` |

Skills/agents can declare scoped hooks in frontmatter — [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md).

---

## Common events (subset)

| Event | When | Block? |
|-------|------|--------|
| `PreToolUse` | Before tool runs | Yes — exit 2 or JSON `deny` |
| `PostToolUse` | After tool succeeds | No undo |
| `PermissionRequest` | Permission dialog | JSON `allow` / `deny` |
| `Notification` | Idle, permission prompt, MCP elicitation | Limited |
| `SessionStart` | Start / resume / **compact** | Inject stdout context |
| `PostCompact` / `PreCompact` | Compaction | Context engineering |
| `UserPromptSubmit` | Before prompt processed | Inject / block |
| `Stop` | Claude finished responding | `decision: block` to continue |
| `ConfigChange` | Settings/skills file changed | Audit or block |
| `SessionEnd` | Session terminates | Cleanup |

Full list: [hook lifecycle](https://code.claude.com/docs/en/hooks#hook-lifecycle).

---

## Command hook I/O

**Input:** JSON on stdin (`session_id`, `cwd`, `tool_name`, `tool_input`, …).

**Output:**

| Exit | Effect |
|------|--------|
| `0` | Proceed; stdout may add context (`UserPromptSubmit`, `SessionStart`) |
| `2` | Block — stderr → feedback to Claude or user |
| Other | Proceed with transcript error notice |

**Structured JSON** (exit 0, stdout): e.g. `PreToolUse`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Use rg instead of grep"
  }
}
```

`permissionDecision`: `allow` | `deny` | `ask` | `defer` (headless). **Managed deny rules still win over hook `allow`.**

---

## Matchers

Narrow hooks by event-specific field:

| Event family | Matcher filters | Example |
|--------------|-----------------|---------|
| Tool events | Tool name | `Edit\|Write`, `Bash`, `mcp__github__.*` |
| `SessionStart` | Source | `compact`, `startup`, `resume` |
| `Notification` | Type | `idle_prompt`, `permission_prompt` |
| `ConfigChange` | Source | `project_settings`, `skills` |

**`if` field** (v2.1.85+): permission-rule syntax on tool args — `Bash(git *)` inside a `Bash` matcher group.

---

## Fork patterns

### Auto-format after edits

`.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

### Block protected files

`PreToolUse` + `.claude/hooks/protect-files.sh` (exit 2) — `.env`, `package-lock.json`, `.git/`.

### Re-inject context after compaction

Pairs with [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) compaction:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: npm run validate:config before catalog edits.'"
          }
        ]
      }
    ]
  }
}
```

### direnv / `CLAUDE_ENV_FILE`

`SessionStart` + `CwdChanged` → `direnv export bash > "$CLAUDE_ENV_FILE"`.

### Permission auto-approve (narrow matcher only)

`PermissionRequest` + `ExitPlanMode` — JSON `behavior: allow`. **Never** empty matcher on permission hooks.

---

## Prompt and agent hooks

**Prompt** (`type: prompt`): model returns `{"ok": true}` or `{"ok": false, "reason": "..."}`.

**Agent** (`type: agent`, experimental): subagent verifies codebase (e.g. tests before `Stop`); default 60s / 50 turns.

Prefer **command** hooks for production policy; prompt/agent for judgment.

---

## Configuration locations

| File | Scope |
|------|--------|
| `~/.claude/settings.json` | User — all projects |
| `.claude/settings.json` | Project — commit for team |
| `.claude/settings.local.json` | Project — gitignored |
| Managed policy | Org-wide |
| Plugin `hooks/hooks.json` | When plugin enabled |
| Skill/agent frontmatter | While active |

Disable all: `"disableAllHooks": true` (managed hooks may still run).

Scripts: `.claude/hooks/*.sh` — `chmod +x`; use `"$CLAUDE_PROJECT_DIR"/.claude/hooks/...`.

---

## Permissions interaction

- `PreToolUse` runs **before** permission mode checks.
- Hook `deny` blocks even in `bypassPermissions`.
- Hook `allow` does **not** override settings deny rules.

---

## Troubleshooting (summary)

| Issue | Check |
|-------|--------|
| Hook not firing | `/hooks`; matcher case; event type |
| `hook error` | Test with `echo '{...}' \| ./script.sh`; `chmod +x` |
| JSON parse fail | Shell profile echo in non-interactive — guard with `[[ $- == *i* ]]` |
| Stop loop | `stop_hook_active` in input; cap `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` |
| `/hooks` empty | Valid JSON; correct path; restart session |

Debug: `claude --debug-file /tmp/claude.log` or `/debug`; transcript `Ctrl+O`.

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.hooks` | Settings paths, `/hooks` |
| `prompting.guidanceTopics[]` | `claude-code-hooks-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No `.claude/settings.json` hooks for validate:config / doc-sync |
| Cursor | No equivalent lifecycle hooks in Cursor agent rules |
| Wall-Bounce | No hook integration in `claude-adapter.ts` |

---

## Backlog

- **E-5** — Project hooks: `PostToolUse` prettier/eslint; `PreToolUse` block `.env`; `SessionStart` compact reminders.
- **F-10** — Document hook patterns in agent-edit onboarding.

---

## References

- [Hooks guide (platform)](https://code.claude.com/docs/en/hooks-guide)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Permissions](https://code.claude.com/docs/en/permissions)
- [Security guidance plugin](https://code.claude.com/docs/en/security-guidance)
- [Bash validator example](https://github.com/anthropics/claude-code/blob/main/examples/hooks/bash_command_validator_example.py)
- [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md)
