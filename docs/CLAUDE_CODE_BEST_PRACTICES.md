# Claude Code — Best Practices

**Status**: Synthesis doc — links to fork integration docs; not a duplicate of platform prose  
**Platform**: [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) · [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) · [Extend Claude Code](https://code.claude.com/docs/en/features-overview)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [AGENTS.md](../AGENTS.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md)

---

## Core constraint

**Context window is the scarce resource.** Conversation, file reads, and command output fill context fast; performance degrades as it fills.

| Action | Doc |
|--------|-----|
| Track usage | `/usage`, OTel `claude_code.cost.usage`, [status line](https://code.claude.com/docs/en/statusline) |
| Reduce tokens | [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) |
| Fleet cost dashboards | [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) |
| Compaction / clear | [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) |
| Interactive walkthrough | [context window](https://code.claude.com/docs/en/context-window) |

**Fork:** Wall-Bounce multi-round analyze multiplies context cost — constitution requires 2–5 rounds; scope tasks accordingly ([WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md)).

---

## Verify work (close the loop)

Give Claude a **pass/fail check**: tests, build exit code, linter, screenshot diff.

| Level | Mechanism |
|-------|-----------|
| Same prompt | "implement X, run tests, fix failures" |
| Session | [`/goal`](https://code.claude.com/docs/en/goal) condition |
| Deterministic | [Stop hook](./CLAUDE_CODE_HOOKS.md) (8-block cap) |
| Second opinion | [Subagent](https://code.claude.com/docs/en/sub-agents) or `/code-review` |

Ask for **evidence** (test output, command + result), not assertions.

---

## Explore → plan → implement → commit

Use [plan mode](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) (`Shift+Tab`) for multi-file or uncertain work:

1. **Explore** — read, no edits  
2. **Plan** — `Ctrl+G` to edit plan in editor  
3. **Implement** — tests + verification  
4. **Commit** — PR when ready  

**Skip plan** for one-line fixes (typo, rename, log line).

---

## Prompts and rich context

| Strategy | Example shift |
|----------|----------------|
| Scope task | "add tests" → "test foo.py logged-out edge case, no mocks" |
| Point to sources | `@src/auth/`, git history, existing widget pattern |
| Symptom + location | "login bug" → "after session timeout, check token refresh in src/auth/" |

**Rich input:** `@files`, paste images, URLs (`/permissions` allowlist), pipe `cat log | claude`, MCP/Bash fetch.

Vague prompts OK for **exploration** when you can course-correct.

---

## Configure the environment

| Surface | Guidance | Fork doc |
|---------|----------|----------|
| **CLAUDE.md** | `/init`; keep short; skills for on-demand | [memory](https://code.claude.com/docs/en/memory) · [AGENTS.md](../AGENTS.md) |
| **Permissions** | auto mode, allowlists, `/sandbox` | [AUTO_MODE](./CLAUDE_CODE_AUTO_MODE.md) · [permissions](https://code.claude.com/docs/en/permissions) |
| **CLI tools** | `gh`, `aws`, `gcloud` over raw API | [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) |
| **MCP** | `claude mcp add` | [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) |
| **Hooks** | deterministic guards | [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) |
| **Skills** | `.claude/skills/` | [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) |
| **Subagents** | `.claude/agents/` | [sub-agents](https://code.claude.com/docs/en/sub-agents) |
| **Plugins** | `/plugin` | [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) |

### CLAUDE.md rules of thumb

**Include:** commands Claude can't guess, non-default style, test runners, repo etiquette, env quirks.  
**Exclude:** what code already shows, long tutorials, per-file maps.

Use `@import` for modular instructions. **Prune** when rules are ignored (file too long).

**Cursor fork:** [AGENTS.md](../AGENTS.md) + `.cursor/rules/` — parallel role to CLAUDE.md for Cursor agents.

### CLAUDE.md vs hooks vs skills

| | Advisory | Deterministic | On-demand |
|---|----------|---------------|-----------|
| CLAUDE.md | ✓ | | |
| Hooks | | ✓ | |
| Skills | | | ✓ |

---

## Communicate

- **Onboarding questions** — ask like a senior engineer (no special prompt).
- **Large features** — Claude interviews via `AskUserQuestion` → write `SPEC.md` → **fresh session** to implement.

---

## Manage sessions

| Control | Use |
|---------|-----|
| `Esc` | Stop mid-action |
| `Esc+Esc` / `/rewind` | Restore conversation/code or summarize from checkpoint |
| `/clear` | Unrelated tasks; after 2+ failed corrections |
| `/compact <focus>` | Targeted summarization |
| `/btw` | Side Q&A without context growth |
| Subagents | Investigation without polluting main thread |
| `/rename` + `--continue` / `--resume` | Named workstreams |

Checkpoints restore **Claude-made** changes only — not a git substitute.

---

## Automate and scale

| Pattern | Doc |
|---------|-----|
| `claude -p` / `--bare` CI | [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) |
| Parallel sessions / worktrees | [worktrees](https://code.claude.com/docs/en/worktrees) |
| Fan-out `for file in …; claude -p` | programmatic doc |
| `/loop` polling | [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) |
| Deep links in runbooks | [CLAUDE_CODE_DEEP_LINKS.md](./CLAUDE_CODE_DEEP_LINKS.md) |
| Auto permission mode | `--permission-mode auto` |
| Adversarial review | subagent vs PLAN.md; avoid style-chase |

**Writer/Reviewer:** two sessions — implement in A, review in B with fresh context.

---

## Common failure patterns

| Pattern | Fix |
|---------|-----|
| Kitchen sink session | `/clear` between tasks |
| Repeated corrections | `/clear` + better initial prompt after 2 failures |
| Bloated CLAUDE.md | Prune; move to skills/hooks |
| No verification | Tests, build, screenshots |
| Infinite exploration | Narrow scope or subagents |

---

## Fork mapping (Cursor + Wall-Bounce)

| Platform practice | This repo |
|-------------------|-----------|
| CLAUDE.md | [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md) shim |
| Plan mode | Cursor Plan mode (user-driven) |
| Hooks | `.cursor/rules/` + user rules; Claude hooks in `.claude/settings.json` (E-5) |
| `claude -p` adapter | [`claude-adapter.ts`](../src/adapters/claude-adapter.ts) — text only |
| Multi-LLM verify | Wall-Bounce 2–5 rounds — not single-LLM bypass |
| Japanese user output | Constitution — [AGENTS.md](../AGENTS.md) |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.bestPractices` | `/init`, platform URL |
| `prompting.guidanceTopics[]` | `claude-code-best-practices-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No committed root `CLAUDE.md` for fork (AGENTS.md is neutral top) |
| F-10 | Best-practice topics not injected at runtime |
| Adapter | No verification loop in `claude-adapter.ts` |

---

## Backlog

- **E-11** — Optional `.claude/CLAUDE.md` or skills for fork contributor workflows.
- **WB-14** — Programmatic JSON + cost from `claude -p` for analyze rounds.

---

## References

- [Best practices (platform)](https://code.claude.com/docs/en/best-practices)
- [Common workflows](https://code.claude.com/docs/en/common-workflows)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- Claude Code doc set: [CLAUDE_CODE_GLOSSARY.md](./CLAUDE_CODE_GLOSSARY.md) · [CLAUDE_CODE_AUTO_MODE.md](./CLAUDE_CODE_AUTO_MODE.md) · [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) · [CLAUDE_CODE_CLI_REFERENCE.md](./CLAUDE_CODE_CLI_REFERENCE.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) · [CLAUDE_CODE_DEEP_LINKS.md](./CLAUDE_CODE_DEEP_LINKS.md)
