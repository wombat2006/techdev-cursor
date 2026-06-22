# Claude Code — Scheduled Tasks and /loop

**Status**: Documented — no project `.claude/loop.md` committed (Track E-9)  
**Platform**: [Run prompts on a schedule](https://code.claude.com/docs/en/scheduled-tasks) · [Routines (cloud)](https://code.claude.com/docs/en/routines) · [Monitor tool](https://code.claude.com/docs/en/tools-reference#monitor-tool)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_BEST_PRACTICES.md](./CLAUDE_CODE_BEST_PRACTICES.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Scheduled tasks** re-run prompts automatically on an interval or at a one-shot time — poll deployments, babysit PRs, session reminders. Requires Claude Code **v2.1.72+** (`claude --version`).

**Session-scoped:** Tasks live in the **current conversation**. New session clears them. **`claude --resume`** / **`--continue`** restores unexpired tasks. For durable scheduling outside a session, use [Routines](https://code.claude.com/docs/en/routines) (cloud), [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks), or [GitHub Actions](https://code.claude.com/docs/en/github-actions).

**Event-driven alternative:** [Channels](https://code.claude.com/docs/en/channels) — CI pushes into session. **Condition until met:** [`/goal`](https://code.claude.com/docs/en/goal) — not interval-based.

**Fork AS-IS:** Cursor agents have no `/loop` or cron tools. Wall-Bounce rounds are request-driven, not session cron.

---

## Compare scheduling options

| | Cloud (Routines) | Desktop | `/loop` (this doc) |
|---|------------------|---------|-------------------|
| Runs on | Anthropic cloud | Your machine | Your machine |
| Machine on required | No | Yes | Yes |
| Open session required | No | No | **Yes** |
| Survives restart | Yes | Yes | Restored on `--resume` if unexpired |
| Local files | No (fresh clone) | Yes | Yes |
| MCP | Per-task connectors | Config + connectors | Inherits session |
| Permission prompts | No (autonomous) | Configurable | Inherits session |
| Min interval | 1 hour | 1 minute | 1 minute |

Use **cloud** for reliable unattended work; **Desktop** for local files; **`/loop`** for quick in-session polling.

---

## `/loop` bundled skill

Quickest repeat-while-session-open. Interval and prompt are optional:

| Input | Example | Behavior |
|-------|---------|----------|
| Interval + prompt | `/loop 5m check the deploy` | Fixed [cron schedule](#fixed-interval) |
| Prompt only | `/loop check the deploy` | [Dynamic interval](#dynamic-interval) Claude chooses |
| Interval only / bare | `/loop` or `/loop 15m` | [Built-in maintenance](#built-in-maintenance) or `loop.md` |

Nest commands: `/loop 20m /review-pr 1234`.

### Fixed interval

```text
/loop 5m check if the deployment finished and tell me what happened
```

Units: `s`, `m`, `h`, `d`. Seconds round up to minutes (cron granularity). Non-clean steps (`7m`, `90m`) rounded — Claude reports chosen cadence.

### Dynamic interval

Omit interval → Claude picks 1m–1h delay after each iteration based on observations (short while CI active, longer when quiet). May use [Monitor tool](https://code.claude.com/docs/en/tools-reference#monitor-tool) instead of polling — often more token-efficient.

Listed in scheduled tasks; **7-day expiry** applies; **jitter** does not apply to dynamic loops.

**Bedrock / Vertex / Foundry:** Prompt-only `/loop` uses fixed **10-minute** schedule instead of dynamic.

### Built-in maintenance

Bare `/loop` (no prompt): each iteration —

1. Continue unfinished conversation work
2. Tend current branch PR (review comments, CI, merge conflicts)
3. Cleanup passes (bug hunt, simplification) when idle

No new initiatives; irreversible actions only if transcript already authorized.

**Bedrock / Vertex / Foundry:** Bare `/loop` prints usage message (no maintenance prompt).

### Customize with `loop.md`

Replaces built-in prompt for bare `/loop` only (not when prompt supplied on CLI).

| Path | Scope |
|------|--------|
| `.claude/loop.md` | Project (wins over user) |
| `~/.claude/loop.md` | User default |

Plain Markdown; edits apply next iteration. Max **25,000 bytes** (truncated beyond). **Not read** on Bedrock/Vertex/Foundry.

---

## One-time reminders

Natural language (not `/loop`):

```text
remind me at 3pm to push the release branch
in 45 minutes, check whether the integration tests passed
```

Single-fire cron; deletes after run.

---

## Cron tools

| Tool | Purpose |
|------|---------|
| `CronCreate` | Schedule (5-field cron, prompt, recurring vs once) |
| `CronList` | List IDs, schedules, prompts |
| `CronDelete` | Cancel by 8-char ID |

Max **50** tasks per session. Ask in natural language: "what scheduled tasks do I have?" / "cancel the deploy check job".

---

## Execution semantics

- Scheduler checks every second; fires **between turns** at low priority (waits if Claude busy)
- Times in **local timezone** (`0 9 * * *` = 9am local)
- **No catch-up** for missed intervals while busy — fires once when idle
- **Esc** during `/loop` wait stops next wakeup (direct cron tasks unaffected)
- Dynamic loop can self-end when task complete; fixed interval runs until Esc or expiry

### Jitter

| Type | Offset |
|------|--------|
| Recurring | Up to 30m after scheduled time (or half interval if &lt; hourly) |
| One-shot at `:00` / `:30` | Up to 90s early |

Offset deterministic from task ID. For exact timing, avoid `:00`/`:30` (e.g. `3 9 * * *`).

### Seven-day expiry

Recurring tasks expire **7 days** after creation — final fire then delete. Recreate or use Routines/Desktop for longer recurrence.

---

## Cron expression reference

5 fields: `minute hour day-of-month month day-of-week`.

Supports `*`, `5`, `*/15`, `1-5`, `1,15,30`. Day-of-week `0`/`7` = Sunday … `6` = Saturday.

**Not supported:** `L`, `W`, `?`, `MON`, `JAN`.

When both day-of-month and day-of-week constrained, match if **either** matches (vixie-cron).

| Example | Meaning |
|---------|---------|
| `*/5 * * * *` | Every 5 minutes |
| `0 9 * * 1-5` | Weekdays 9am local |
| `30 14 15 3 *` | March 15 2:30pm local |

---

## Disable

```bash
export CLAUDE_CODE_DISABLE_CRON=1
```

Disables scheduler, cron tools, and `/loop`. Scheduled tasks stop firing. See [env vars](https://code.claude.com/docs/en/env-vars).

---

## Cost and token notes

Each `/loop` iteration consumes tokens like a normal prompt. Dynamic loops + Monitor can reduce waste vs fixed polling — [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md).

Long-running loops accumulate context — use `/clear` between unrelated work or narrow `loop.md` scope.

---

## Fork mapping

| Claude Code | This fork |
|-------------|-----------|
| `/loop` session polling | No equivalent — use CI webhooks + agent session |
| `loop.md` PR babysitting | Manual PR review or automation in CI |
| Routines (cloud) | Out of scope AS-IS |
| `CLAUDE_CODE_DISABLE_CRON` | N/A in Cursor |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.scheduledTasks` | `/loop`, cron tools, `loop.md` paths |
| `prompting.guidanceTopics[]` | `claude-code-scheduled-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No `.claude/loop.md` for fork maintenance |
| Wall-Bounce | No cron or scheduled analyze rounds |
| Cursor | No session scheduler |

---

## Backlog

- **E-9** — Optional `.claude/loop.md` for `npm run validate:config` + doc-sync reminders on long sessions.
- **E-7** — Document when Wall-Bounce should **not** mirror `/loop` (multi-provider cost).

---

## References

- [Scheduled tasks (platform)](https://code.claude.com/docs/en/scheduled-tasks)
- [Routines](https://code.claude.com/docs/en/routines) · [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)
- [Channels](https://code.claude.com/docs/en/channels) · [/goal](https://code.claude.com/docs/en/goal)
- [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md)
