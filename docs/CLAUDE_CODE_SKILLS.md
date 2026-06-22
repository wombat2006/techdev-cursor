# Claude Code Skills Integration

**Status**: Documented — repo has no canonical `.claude/skills/` tree yet (Track E-5)  
**Platform**: [Extend Claude with skills](https://code.claude.com/docs/en/skills) · [Commands reference](https://code.claude.com/docs/en/commands) · [Agent Skills open standard](https://agentskills.io)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) · [agents/mcp-rules.md](./agents/mcp-rules.md) · [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md)

---

## What it is

**Claude Code Skills** extend the [Agent Skills](https://agentskills.io) open standard with filesystem discovery, slash commands (`/skill-name`), dynamic shell injection, subagent forks, and tool permissions scoped per skill.

Unlike repeating procedures in `CLAUDE.md`, a skill's **body loads only when invoked** — long reference material has near-zero cost until used.

**Fork AS-IS:** Primary agent-edit surface is `claude` CLI ([SECURITY.md](./SECURITY.md)). API pre-built Skills (`pptx`, etc.) are separate — see [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md).

---

## Commands merged into skills

| Legacy | Skills equivalent | Result |
|--------|-------------------|--------|
| `.claude/commands/deploy.md` | `.claude/skills/deploy/SKILL.md` | Both create `/deploy` |

Skills add: supporting files directory, invocation-control frontmatter, automatic model invocation. Legacy `.claude/commands/` still works; **skill wins on name clash**.

---

## Where skills live

| Scope | Path | Applies to |
|-------|------|------------|
| Enterprise | Managed settings | Org-wide |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All projects |
| Project | `.claude/skills/<name>/SKILL.md` | Repo only |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |
| Nested monorepo | `packages/foo/.claude/skills/` | When working in that package |

**Precedence (same name):** enterprise → personal → project → overrides bundled skill. Plugin skills use `plugin-name:skill-name` namespace.

**Nested name clash:** e.g. root `deploy` vs `apps/web/.claude/skills/deploy` → qualified `/apps/web:deploy`.

**Discovery:** Skills load from project root **and parent dirs** up to repo root; nested `.claude/skills/` discovered when editing files in subdirs. `--add-dir` loads skills from added paths (exception to config-not-loaded rule).

**Live reload:** Edits under watched skill dirs apply in-session (`SKILL.md` text). New top-level skill dir may need restart. Plugin hooks/MCP need `/reload-plugins`.

---

## Bundled skills (Claude Code)

Disabled via `disableBundledSkills` setting. Prompt-based bundled skills include `/code-review`, `/batch`, `/debug`, `/loop`, `/claude-api`.

### Run / verify (v2.1.145+)

| Skill | Purpose |
|-------|---------|
| `/run` | Launch and drive the app to see a change |
| `/verify` | Build/run app to confirm behavior (not just tests/types) |
| `/run-skill-generator` | Record install/env/launch recipe → `.claude/skills/run-<name>/` |

`/run` and `/verify` infer from README / `package.json` / Makefile. Non-standard setups (DB, env files, GUI): run `/run-skill-generator` once per project.

---

## SKILL.md layout

```text
my-skill/
├── SKILL.md           # Required entrypoint
├── reference.md       # On-demand
└── scripts/
    └── helper.py      # Executed, not loaded into context
```

Authoring quality: [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) — keep `SKILL.md` &lt;500 lines.

---

## Content types

| Type | Use | Invocation |
|------|-----|------------|
| **Reference** | Conventions, patterns, domain knowledge | Inline; Claude auto-loads when relevant |
| **Task** | Deploy, commit, multi-step workflows | Often `disable-model-invocation: true` + `/name` |

---

## Frontmatter (Claude Code extensions)

Beyond platform `name` / `description`:

| Field | Purpose |
|-------|---------|
| `disable-model-invocation: true` | Manual `/only` — side-effect workflows |
| `user-invocable: false` | Claude-only background knowledge |
| `allowed-tools` | Pre-approve tools while skill active (review project skills before trust) |
| `disallowed-tools` | Remove tools from pool until next user message |
| `context: fork` | Run in isolated subagent |
| `agent` | Subagent type when `context: fork` (`Explore`, `Plan`, custom) |
| `paths` | Glob — auto-load only when editing matching files |
| `model` / `effort` | Override for current turn |
| `arguments` / `$ARGUMENTS` / `$0` | Positional args |
| `when_to_use` | Appended to description (1,536 char listing cap) |
| `hooks` | Skill-scoped lifecycle hooks — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) |

**Command name** comes from **directory name** (not frontmatter `name`), except plugin-root `SKILL.md`.

### Invocation matrix

| Frontmatter | User `/` | Claude auto | Description in context |
|-------------|----------|-------------|------------------------|
| (default) | Yes | Yes | Yes (truncated listing) |
| `disable-model-invocation: true` | Yes | No | No |
| `user-invocable: false` | No | Yes | Yes |

---

## Dynamic context injection

`` !`git diff HEAD` `` runs **before** Claude sees the skill; output replaces the placeholder (preprocessing).

- Multi-line: fenced block opened with ` ```! `
- Use `${CLAUDE_SKILL_DIR}` for bundled script paths
- Disable user/project/plugin skills: `disableSkillShellExecution: true` in settings (managed/bundled unaffected)

---

## Skill content lifecycle

Invoked skill content stays in the conversation for the session. Claude Code does **not** re-read `SKILL.md` each turn — write standing instructions.

**Auto-compaction:** Re-attaches recent skill invocations after summary (5k tokens each skill, 25k combined budget). Re-invoke after compaction if behavior drifts.

---

## Subagent fork

`context: fork` — skill body becomes subagent task; no main conversation history. Requires explicit task instructions.

| Pattern | Task source | Agent |
|---------|-------------|-------|
| Skill + `context: fork` | `SKILL.md` | `agent:` field |
| Subagent + `skills:` preload | Delegation message | Subagent body |

`Explore` / `Plan` agents skip `CLAUDE.md` and git status at startup.

---

## Permissions and visibility

| Mechanism | Effect |
|-----------|--------|
| Deny `Skill` tool | Block all programmatic skill invocation |
| `Skill(name)` / `Skill(name *)` | Allow/deny specific skills |
| `skillOverrides` in settings | `on` / `name-only` / `user-invocable-only` / `off` per skill |
| `disable-model-invocation: true` | Remove from Claude's skill listing entirely |

Project `.claude/skills/` `allowed-tools` applies after **workspace trust** acceptance — audit before trusting repos.

---

## Description budget

Many skills → descriptions shortened to fit listing budget (~1% of context window). Mitigations:

- `skillListingBudgetFraction` or `SLASH_COMMAND_TOOL_CHAR_BUDGET`
- `skillOverrides: "name-only"` for low-priority skills
- Put key triggers first in `description` / `when_to_use` (1,536 char cap per skill)
- `/doctor` — see truncated/dropped descriptions

---

## Evaluation

Baseline: same prompts with skill on vs `skillOverrides: off` in fresh sessions.

**skill-creator plugin** (`skill-creator@claude-plugins-official`): evals, grading, benchmark, description tuning — see [agentskills.io evaluating skills](https://agentskills.io/skill-creation/evaluating-skills).

---

## Fork use cases

| Scenario | Pattern |
|----------|---------|
| Wall-Bounce agent-edit procedures | `.claude/skills/<workflow>/SKILL.md` in repo |
| Monorepo package conventions | Nested `packages/*/.claude/skills/` |
| Deploy / commit guardrails | `disable-model-invocation: true` + `allowed-tools` |
| PR summary with live diff | `` !`gh pr diff` `` injection |
| Customer proposals | Align with `scripts/pptx-gen/` or migrate to Skills layout (E-5) |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode` | Paths, open standard, bundled run min version |
| `prompting.guidanceTopics[]` | `claude-code-skills-*` slugs |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No `.claude/skills/` committed |
| `claude-adapter.ts` | `--print` only — see [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md); no Skill tool / slash routing |
| Trust | Project skills with `allowed-tools` need workspace trust policy |

---

## Backlog

- **E-5** — Canonical repo skills tree + link from agent-edit docs.
- **F-10** — Inject `claude-code-skills-frontmatter` when Sonnet + agent-edit preset.

---

## References

- [Claude Code — Skills](https://code.claude.com/docs/en/skills)
- [Claude Code — Commands](https://code.claude.com/docs/en/commands)
- [Claude Code — Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code — Permissions](https://code.claude.com/docs/en/permissions)
- [Claude Code — Settings](https://code.claude.com/docs/en/settings)
- [Agent Skills standard](https://agentskills.io)
- [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md)
