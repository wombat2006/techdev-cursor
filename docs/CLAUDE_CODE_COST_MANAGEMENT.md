# Claude Code — Manage Costs Effectively

**Status**: Documented — fork bills via CLI providers per [SECURITY.md](./SECURITY.md); this doc applies to `claude` CLI usage patterns  
**Platform**: [Manage costs effectively](https://code.claude.com/docs/en/costs) · [claude.com/pricing](https://claude.com/pricing) · [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md)

---

## What it is

Claude Code cost scales with **API token consumption** (subscription plans bundle usage differently). Enterprise averages cited by Anthropic: ~**$13/developer/active day**, **$150–250/developer/month**; **90%** stay under **$30/active day**. Pilot a small group and use tracking tools before wide rollout.

**Core lever:** Token cost grows with **context size**. Claude Code already applies **prompt caching** and **auto-compaction**; this doc covers tracking, team limits, and manual reduction strategies.

**Fork AS-IS:** Wall-Bounce multi-LLM rounds multiply provider cost — see [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md). Cursor sessions do not expose `/usage`; use provider consoles for authoritative billing.

---

## Track costs

### `/usage`

Session block (top): token stats + **local dollar estimate** (may differ from invoice). **API users:** Session block reflects API token usage. **Pro/Max subscribers:** usage included in plan — session cost figure not billing-relevant; plan bars and breakdown shown instead.

Authoritative billing: [Claude Console Usage](https://platform.claude.com/usage). Fleet dashboards: OTel `claude_code.cost.usage` — [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md). API rate reference: [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md).

**Pro / Max / Team / Enterprise:** Plan usage bars; breakdown by skills, subagents, plugins, MCP servers (% of total). `d` / `w` = last 24h / 7d (local session history only — other devices / claude.ai excluded).

**VS Code extension:** Account & usage dialog (Day/Week) — requires Claude Code **v2.1.174+**.

### Team / API

| Control | Where |
|---------|--------|
| Workspace spend limits | [Console workspaces](https://platform.claude.com/docs/en/build-with-claude/workspaces#workspace-limits) |
| Cost reporting | [Usage and cost tracking](https://platform.claude.com/docs/en/build-with-claude/workspaces#usage-and-cost-tracking) |
| Pro/Max monthly cap | `/usage-credits` |
| Auto "Claude Code" workspace | Created on first Console auth — no API keys; counts toward org rate limits |
| Workspace rate cap | [Workspace rate limit](https://platform.claude.com/docs/en/api/rate-limits#setting-lower-limits-for-workspaces) |

**Bedrock / Vertex / Foundry:** No cost metrics from cloud — enterprises often use [LiteLLM](https://docs.litellm.ai/docs/proxy/virtual_keys#tracking-spend) (unaffiliated, unaudited).

### TPM / RPM guidance (per user, org-level pool)

| Team size | TPM/user | RPM/user |
|-----------|----------|----------|
| 1–5 | 200k–300k | 5–7 |
| 5–20 | 100k–150k | 2.5–3.5 |
| 20–50 | 50k–75k | 1.25–1.75 |
| 50–100 | 25k–35k | 0.62–0.87 |
| 100–500 | 15k–20k | 0.37–0.47 |
| 500+ | 10k–15k | 0.25–0.35 |

Larger orgs → lower per-user TPM (less concurrent use). Limits are **org-wide**, not hard per-user caps.

---

## Reduce token usage

### Context management

- **`/usage`** or [status line context %](https://code.claude.com/docs/en/statusline#context-window-usage)
- **`/clear`** between unrelated tasks; **`/rename`** then **`/resume`** to return
- **`/compact Focus on …`** or CLAUDE.md compact instructions — pairs with [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md)
- **`SessionStart` compact hook** for post-compaction reminders — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md)

### Model selection

| Task | Model |
|------|--------|
| Most coding | **Sonnet** (lower cost than Opus) |
| Architecture / hard reasoning | **Opus** |
| Simple subagent work | `model: haiku` in subagent config |
| Mid-session switch | `/model` or `/config` default |

Catalog AS-IS: Sonnet `claude-sonnet-4-6`, Opus aggregate `claude-opus-4-6` (escalate `claude-opus-4-8`), Haiku `claude-haiku-4-5`.

### MCP overhead

- Tool defs **deferred by default** ([MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)) — names only until used
- **`/context`** to see consumers
- Prefer **`gh` / `aws` / `gcloud` / `sentry-cli`** when sufficient (no per-tool listing)
- Disable unused servers via **`/mcp`** — [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md)

### Code intelligence plugins

Typed-language LSP plugins → go-to-definition vs grep + multi-file reads — fewer exploration tokens. See [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md#code-intelligence-lsp-plugins).

### Hooks and skills (preprocess / on-demand)

**Hooks** shrink what Claude sees — e.g. PreToolUse grep log to ERROR lines only:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/filter-test-output.sh"
          }
        ]
      }
    ]
  }
}
```

Script returns `updatedInput` with filtered command — see [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md).

```bash
#!/bin/bash
# ~/.claude/hooks/filter-test-output.sh
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command')

if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
  filtered_cmd="$cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100"
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"allow\",\"updatedInput\":{\"command\":\"$filtered_cmd\"}}}"
else
  echo "{}"
fi
```

**Skills** load **on demand** vs CLAUDE.md at session start. Move workflow-specific instructions from CLAUDE.md → skills; keep CLAUDE.md **under ~200 lines** (essentials only).

### CLAUDE.md vs skills

| Surface | When loaded | Cost impact |
|---------|-------------|-------------|
| CLAUDE.md | Session start | Always in base context |
| Skills | Invocation | Pay only when used |

### Extended thinking

Thinking tokens bill as **output**. Default on for quality; reduce for simple tasks:

- `/effort` or `/model` effort level (adaptive models)
- Disable in `/config` where allowed
- Fixed budget models: `MAX_THINKING_TOKENS=8000`
- Adaptive models ignore nonzero budgets — use effort, not budget
- **Fable 5:** thinking always on — cannot disable

See [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).

### Subagents and agent teams

- Delegate verbose ops (tests, logs, docs fetch) to **subagents** — summary returns to main thread
- **Agent teams:** ~**7×** tokens vs standard when teammates run in plan mode; each teammate = separate context + instance
- Keep teams **small**; **Sonnet** for teammates; focused spawn prompts; shut down when done
- Disabled by default: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings or env

### Prompt and workflow discipline

- **Specific prompts** — narrow file/function targets vs "improve codebase"
- **Plan mode** (`Shift+Tab`) before large edits
- **Escape** early; `/rewind` to checkpoint
- **Verification targets** in prompt (tests, screenshots)
- **Incremental test** — one file at a time

### Prompt caching (automatic)

Claude Code applies caching for repeated system content — API detail: [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md).

---

## Behavior and billing changes

Claude Code updates may change cost reporting and features. Check `claude --version`. Billing questions: [Console support](https://platform.claude.com/login).

---

## Background token usage

Idle background (typically **< $0.04/session**):

- Conversation summarization for `claude --resume`
- Some commands (e.g. `/usage`) status checks

---

## Fork mapping

| Claude Code | This fork |
|-------------|-----------|
| `/usage` | Provider consoles + Prometheus (when wired) |
| Auto compaction | Not in `claude-adapter.ts` AS-IS |
| Multi-LLM Wall-Bounce | 2–5 rounds × multiple providers — constitution |
| Hooks preprocess | Track E-5 — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) |
| `npm run validate:config` | Catalog integrity, not spend |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.costManagement` | `/usage`, team limits pointers |
| `prompting.guidanceTopics[]` | `claude-code-cost-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | No token usage reporting to session |
| Wall-Bounce | No per-round cost budget or model downgrade policy |
| F-10 | Cost topics not injected at runtime |

---

## Backlog

- **E-7** — Document Wall-Bounce cost awareness: when to use Haiku extract vs Sonnet analyze.
- **E-5** — PreToolUse log-filter hook example in repo `.claude/hooks/`.

---

## References

- [Manage costs (platform)](https://code.claude.com/docs/en/costs)
- [API pricing](./ANTHROPIC_PRICING.md)
- [Prompt caching (Claude Code)](https://code.claude.com/docs/en/prompt-caching)
- [Agent teams](https://code.claude.com/docs/en/agent-teams)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md)
