# Claude Code — Deep Links (`claude-cli://`)

**Status**: Documented — no fork runbook deep links committed (Track E-10)  
**Platform**: [Launch sessions from links](https://code.claude.com/docs/en/deep-links) · [VS Code tab links](https://code.claude.com/docs/en/vs-code#launch-a-vs-code-tab-from-other-tools)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [SECURITY.md](./SECURITY.md) · [MONITORING_OPERATIONS.md](./MONITORING_OPERATIONS.md)

---

## What it is

**Deep links** are `claude-cli://` URLs that open Claude Code in a **new terminal** with an optional working directory and **pre-filled prompt** (not auto-sent until Enter). Requires Claude Code **v2.1.91+**.

Use cases:

- Incident runbooks → repo + diagnostic prompt
- Monitoring alerts / dashboards → investigation prompt
- README onboarding links
- CI failure notifications with job context

**Security:** Link only fills the prompt box — nothing runs until you press Enter. UI shows **`Prompt from an external link`** until send/clear. Prompts &gt; 1,000 chars show length warning.

**Fork AS-IS:** Cursor IDE has no `claude-cli://` handler. Links target **`claude` CLI** on the engineer's machine (WSL/Linux per [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)).

---

## URL format

Only path accepted: **`claude-cli://open`**

| Parameter | Description |
|-----------|-------------|
| `q` | Pre-fill prompt — [URL-encode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent); `%0A` for newlines; max **5,000** chars |
| `cwd` | Absolute working directory (network/UNC rejected) |
| `repo` | GitHub `owner/name` — resolves to local clone Claude has seen before |

Minimal:

```text
claude-cli://open
```

Example with repo + multi-line prompt:

```text
claude-cli://open?repo=acme/payments&q=Investigate%20failed%20deploy.%0ACheck%20recent%20commits%20to%20main.
```

**Precedence:** If both `cwd` and `repo` are set, **`cwd` wins** (even if path missing).

---

## `cwd` vs `repo`

| Use | When |
|-----|------|
| `cwd` | Everyone has same absolute path (devcontainer, standard VM) |
| `repo` | Shared link; clones live in different locations |

**`repo` resolution:**

- Each `claude` run in a Git repo records `owner/name` → filesystem path
- Deep link opens **most recently used** matching path (clones/worktrees tracked separately)
- Only paths where Claude Code has run **at least once**
- Does **not** switch branch — opens current checkout state
- Welcome header shows resolved path

No matching clone → session opens in **home directory**.

---

## Examples

### Runbook (Markdown)

```markdown
## High 5xx rate on web-gateway

1. Acknowledge in PagerDuty.
2. [Open Claude Code in gateway repo](claude-cli://open?repo=acme/web-gateway&q=5xx%20elevated.%20Check%20deploys%20and%20logs.)
3. Post findings in #incident.
```

**GitHub README/issues/wiki:** Renders strip `claude-cli://` — label only, no clickable link. Put URL in a **code block** for copy-paste. See [troubleshooting](#github-strips-custom-schemes).

Pair long prompts with repo [Skills](./CLAUDE_CODE_SKILLS.md) — `q` can name `/skill-name` only.

### Shell (WSL/Linux)

```bash
xdg-open "claude-cli://open?repo=acme/payments&q=review%20open%20PRs"
```

macOS: `open "claude-cli://..."`  
Windows PowerShell: `Start-Process "claude-cli://..."`  
cmd: `start "" "claude-cli://..."`

---

## Handler registration

Registered on **first interactive `claude` session** (user-level only):

| Platform | Location |
|----------|----------|
| macOS | `~/Applications/Claude Code URL Handler.app` |
| Linux | `~/.local/share/applications/claude-code-url-handler.desktop` (or `$XDG_DATA_HOME`) |
| WSL | Same as Linux if desktop + `xdg-open` available |

Terminal preference: macOS remembers last terminal (iTerm2, Ghostty, kitty, …); Linux `$TERMINAL` → `x-terminal-emulator` → fallbacks; Windows Terminal → PowerShell → cmd.

**Disable:** `disableDeepLinkRegistration: "disable"` in `settings.json`; org-wide via [managed settings](https://code.claude.com/docs/en/server-managed-settings).

---

## VS Code variant

Extension handler: **`vscode://anthropic.claude-code/open`** — opens editor tab, not terminal. See [VS Code launch from tools](https://code.claude.com/docs/en/vs-code#launch-a-vs-code-tab-from-other-tools).

---

## vs programmatic CLI

| Deep link | `claude -p` |
|-----------|-------------|
| Interactive terminal | Script/CI stdout |
| Prompt pre-filled, user sends | Runs immediately |
| Local click/shell open | Pipe, JSON output |

See [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Click does nothing | Run interactive `claude` once to register; Linux needs desktop/`xdg-open` |
| Plain text on GitHub | Code block with full URL |
| Opens in home dir | Run `claude` in clone once, or use `cwd` |
| Wrong terminal (macOS) | Start `claude` in preferred terminal once |
| Wrong terminal (Linux) | Set `$TERMINAL` |

Config issues: [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md).

---

## Fork mapping

| Claude Code | This fork |
|-------------|-----------|
| Runbook deep links | Document in ops runbooks for CLI users; Cursor users open repo manually |
| `repo=org/techdev-cursor` | Works after `claude` run in fork clone |
| PagerDuty / alert links | Could embed `claude-cli://` in internal wiki (not GitHub MD links) |
| Wall-Bounce API | No deep-link integration |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.deepLinks` | Scheme, params, min version |
| `prompting.guidanceTopics[]` | `claude-code-deeplink-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No sample runbook deep links in `docs/` |
| Cursor | No URL handler |
| CI | Notifications don't emit `claude-cli://` links |

---

## Backlog

- **E-10** — Internal incident template with `repo=` + short `q` pointing at fork Skills.
- **Ops** — Pair with [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) / Routines for unattended vs click-to-investigate.

---

## References

- [Deep links (platform)](https://code.claude.com/docs/en/deep-links)
- [Non-interactive / headless](https://code.claude.com/docs/en/headless)
- [Skills](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md)
