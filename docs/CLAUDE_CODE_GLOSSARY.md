# Claude Code — Glossary

**Status**: Terminology index — links to fork docs + platform pages  
**Platform**: [Claude Code glossary](https://code.claude.com/docs/en/glossary) · [Platform glossary](https://platform.claude.com/docs/en/about-claude/glossary) (tokens, temperature, RAG)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_BEST_PRACTICES.md](./CLAUDE_CODE_BEST_PRACTICES.md) · [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## How to use this doc

Platform defines canonical terms. This page maps each **Claude Code** concept to the fork doc that covers implementation detail (if any). For model-level terms (context window tokens, RAG), use the [platform glossary](https://platform.claude.com/docs/en/about-claude/glossary).

---

## A–C

| Term | Summary | Fork / platform doc |
|------|---------|---------------------|
| **Agent teams** | Independent sessions + shared tasks; experimental | [agent-teams](https://code.claude.com/docs/en/agent-teams) · `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` — [cost doc](./CLAUDE_CODE_COST_MANAGEMENT.md) |
| **Agentic coding / harness / loop** | Tools + loop: context → act → verify | [how it works](https://code.claude.com/docs/en/how-claude-code-works) · [BEST_PRACTICES](./CLAUDE_CODE_BEST_PRACTICES.md) |
| **Artifact** | Live web output on claude.ai | [artifacts](https://code.claude.com/docs/en/artifacts) |
| **Auto memory** | Claude-written notes `~/.claude/projects/` | [memory](https://code.claude.com/docs/en/memory#auto-memory) |
| **Auto mode** | Classifier-based permission mode | [AUTO_MODE](./CLAUDE_CODE_AUTO_MODE.md) · [permission-modes](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode) |
| **Bare mode** | `--bare` skips local config discovery | [PROGRAMMATIC](./CLAUDE_CODE_PROGRAMMATIC.md) · [CLI_REFERENCE](./CLAUDE_CODE_CLI_REFERENCE.md) |
| **Bundled skills** | `/loop`, `/code-review`, etc. | [SKILLS](./CLAUDE_CODE_SKILLS.md) |
| **Channel** | MCP push events into session | [channels](https://code.claude.com/docs/en/channels) |
| **Checkpoint** | Per-prompt restore (`/rewind`) | [checkpointing](https://code.claude.com/docs/en/checkpointing) · [BEST_PRACTICES](./CLAUDE_CODE_BEST_PRACTICES.md) |
| **`.claude` directory** | Project config root | [claude-directory](https://code.claude.com/docs/en/claude-directory) · [DEBUG](./CLAUDE_CODE_DEBUG.md) |
| **CLAUDE.md** | Your persistent instructions | [memory](https://code.claude.com/docs/en/memory) · [AGENTS.md](../AGENTS.md) (fork neutral top) |
| **Command** | `/name` invocations | [commands](https://code.claude.com/docs/en/commands) → prefer **Skills** |
| **Compaction** | Auto/manual summarize when context full | [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [SCHEDULED_TASKS](./CLAUDE_CODE_SCHEDULED_TASKS.md) |
| **Context window** | Session working memory | [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · `/context` — [DEBUG](./CLAUDE_CODE_DEBUG.md) |

---

## D–H

| Term | Summary | Fork / platform doc |
|------|---------|---------------------|
| **Dispatch** | Mobile → Desktop session | [desktop](https://code.claude.com/docs/en/desktop) |
| **Effort level** | Adaptive reasoning budget | [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · `--effort` in adapter |
| **Extended thinking** | Visible reasoning | [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) |
| **Hook** | Deterministic lifecycle handler | [HOOKS](./CLAUDE_CODE_HOOKS.md) |

---

## M–P

| Term | Summary | Fork / platform doc |
|------|---------|---------------------|
| **Managed settings** | Org-enforced policy | [server-managed-settings](https://code.claude.com/docs/en/server-managed-settings) |
| **MCP** | External tools protocol | [MCP_CONNECT](./CLAUDE_CODE_MCP_CONNECT.md) · Cursor: `.cursor/mcp.json` |
| **MCP Tool Search** | Deferred tool schemas | [MCP_CONNECT](./CLAUDE_CODE_MCP_CONNECT.md) · [COST](./CLAUDE_CODE_COST_MANAGEMENT.md) |
| **Non-interactive mode** | `-p` / `--print` | [PROGRAMMATIC](./CLAUDE_CODE_PROGRAMMATIC.md) (was "headless") |
| **Output style** | System-prompt persona | [output-styles](https://code.claude.com/docs/en/output-styles) |
| **Permission mode** | `default`, `plan`, `auto`, … | [CLI_REFERENCE](./CLAUDE_CODE_CLI_REFERENCE.md) |
| **Permission rule** | allow/ask/deny patterns | [permissions](https://code.claude.com/docs/en/permissions) · [HOOKS](./CLAUDE_CODE_HOOKS.md) |
| **Plan mode** | Research without edits | [BEST_PRACTICES](./CLAUDE_CODE_BEST_PRACTICES.md) |
| **Plugin** | Bundled skills/hooks/MCP | [PLUGINS](./CLAUDE_CODE_PLUGINS.md) |
| **Project trust** | Accept dir before config loads | [claude-directory](https://code.claude.com/docs/en/claude-directory) |
| **Prompt injection** | Hostile instructions in content | [SECURITY.md](./SECURITY.md) |

---

## R–W

| Term | Summary | Fork / platform doc |
|------|---------|---------------------|
| **Remote Control** | Local session from phone/browser | [remote-control](https://code.claude.com/docs/en/remote-control) |
| **Rules** | `.claude/rules/` path-scoped | [memory](https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/) |
| **Sandboxing** | OS isolation for Bash | [sandboxing](https://code.claude.com/docs/en/sandboxing) |
| **Session** | Conversation + context per cwd | [PROGRAMMATIC](./CLAUDE_CODE_PROGRAMMATIC.md) · [SCHEDULED_TASKS](./CLAUDE_CODE_SCHEDULED_TASKS.md) |
| **Settings layers** | managed → CLI → local → project → user | [DEBUG](./CLAUDE_CODE_DEBUG.md) · [settings](https://code.claude.com/docs/en/settings) |
| **Skill** | `SKILL.md` workflow/knowledge | [SKILLS](./CLAUDE_CODE_SKILLS.md) · [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) |
| **Subagent** | Delegated assistant, own context | [sub-agents](https://code.claude.com/docs/en/sub-agents) · [BEST_PRACTICES](./CLAUDE_CODE_BEST_PRACTICES.md) |
| **Surface** | CLI, VS Code, Desktop, web | [platforms](https://code.claude.com/docs/en/platforms) — fork: Cursor + `claude` CLI |
| **Teleport** | Web session → local terminal | [claude-code-on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web) |
| **Tool** | Read, Edit, Bash, MCP, … | [tools-reference](https://code.claude.com/docs/en/tools-reference) |
| **Turn** | One user message → Claude response | [how it works](https://code.claude.com/docs/en/how-claude-code-works) |
| **Verification loop** | Tests/build until pass | [BEST_PRACTICES](./CLAUDE_CODE_BEST_PRACTICES.md) |
| **OpenTelemetry** | Client metrics/events/traces export | [MONITORING](./CLAUDE_CODE_MONITORING.md) |
| **Worktree isolation** | `-w` separate git worktree | [worktrees](https://code.claude.com/docs/en/worktrees) · [CLI_REFERENCE](./CLAUDE_CODE_CLI_REFERENCE.md) |

---

## Deprecated / renamed

| Old | Now | Notes |
|-----|-----|-------|
| Headless mode | Non-interactive mode | Same `-p` |
| Custom commands | Skills | `.claude/commands/` still works |
| Slash commands | Commands | Product copy dropped "slash" |

---

## Fork-only terms

| Term | Meaning in this repo |
|------|---------------------|
| **Wall-Bounce** | Multi-LLM 2–5 round analyze — [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md) |
| **AGENTS.md** | Neutral agent nav (not CLAUDE.md) |
| **`.cursor/rules/`** | Cursor hooks/rules analogue |
| **`claude-adapter.ts`** | `claude --print` Wall-Bounce provider path |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.glossary` | Platform glossary URLs |
| `prompting.guidanceTopics[]` | `claude-code-glossary-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| F-10 | Glossary topics not injected at runtime |
| Repo | No ja glossary pair (logic docs English per policy) |

---

## References

- [Glossary (platform)](https://code.claude.com/docs/en/glossary)
- [Platform glossary](https://platform.claude.com/docs/en/about-claude/glossary)
- Full Claude Code doc set — [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
