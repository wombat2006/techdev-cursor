# Claude Code — Run Programmatically (CLI / Agent SDK)

**Status**: Documented — `claude-adapter.ts` uses `--print` text-only AS-IS; JSON/streaming backlog WB-14  
**Platform**: [Run Claude Code programmatically](https://code.claude.com/docs/en/programmatic) · [CLI reference](https://code.claude.com/docs/en/cli-reference) · [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_CLI_REFERENCE.md](./CLAUDE_CODE_CLI_REFERENCE.md) · [SECURITY.md](./SECURITY.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_DEEP_LINKS.md](./CLAUDE_CODE_DEEP_LINKS.md) · [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) · [decisions/TECH_STACK_CLI_INVOKE_METADATA.md](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md)

---

## What it is

The [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) exposes the same tools, agent loop, and context management as interactive Claude Code — via **CLI** (`claude -p`), **Python**, or **TypeScript** packages.

This doc covers **CLI non-interactive mode** (`claude -p` / `--print`). For structured outputs, tool approval callbacks, and native message objects, see [Agent SDK Python/TypeScript](https://code.claude.com/docs/en/agent-sdk/overview).

**Fork AS-IS:** [`src/adapters/claude-adapter.ts`](../src/adapters/claude-adapter.ts) spawns `claude --print --model … --strict-mcp-config` with stdin prompt; parses **plain stdout** only. No `--bare`, `--output-format json`, or `--allowedTools` yet.

---

## Basic usage

```bash
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
```

All [CLI options](https://code.claude.com/docs/en/cli-reference) work with `-p`:

| Flag | Use |
|------|-----|
| `--continue` | Continue most recent conversation |
| `--resume <id>` | Resume specific session |
| `--allowedTools` | Auto-approve tools |
| `--output-format` | `text` / `json` / `stream-json` |
| `--permission-mode` | e.g. `acceptEdits`, `dontAsk` |

```bash
claude -p "What does the auth module do?"
```

---

## Bare mode (`--bare`)

Skips auto-discovery: hooks, skills, plugins, MCP, auto memory, `CLAUDE.md`. Recommended for **CI/scripts** — same result on every machine.

```bash
claude --bare -p "Summarize this file" --allowedTools "Read"
```

Default tools in bare mode: Bash, file read, file edit. Load context explicitly:

| Need | Flag |
|------|------|
| System prompt additions | `--append-system-prompt`, `--append-system-prompt-file` |
| Settings | `--settings <file-or-json>` |
| MCP | `--mcp-config <file-or-json>` |
| Custom agents | `--agents <json>` |
| Plugin | `--plugin-dir`, `--plugin-url` |

Bare mode skips OAuth/keychain — auth via `ANTHROPIC_API_KEY` or `apiKeyHelper` in `--settings`. **Will become default for `-p`** in a future release.

**Fork note:** Adapter does not pass `--bare` today — local hooks/MCP may affect Wall-Bounce runs.

---

## Pipe stdin

```bash
cat build-error.txt | claude -p 'explain this build error' > output.txt
```

**v2.1.128+:** Piped stdin capped at **10MB** — use file path in prompt for larger inputs.

`--output-format json` includes `total_cost_usd` per invocation — [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md).

---

## Structured output

| `--output-format` | Returns |
|-------------------|---------|
| `text` (default) | Plain text |
| `json` | `result`, `session_id`, usage metadata |
| `stream-json` | NDJSON events (with `--verbose --include-partial-messages`) |

JSON Schema:

```bash
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

Structured payload in `structured_output` field. Parse with `jq`:

```bash
claude -p "Summarize" --output-format json | jq -r '.result'
```

**Backlog WB-14:** Wire `--output-format json` in `claude-adapter.ts` for usage/session_id.

### Stream events (subset)

| Event | Purpose |
|-------|---------|
| `system/init` | Model, tools, MCP, plugins loaded |
| `system/api_retry` | Retryable API failure |
| `system/plugin_install` | Marketplace install progress (`CLAUDE_CODE_SYNC_PLUGIN_INSTALL`) |
| `stream_event` + `text_delta` | Token streaming |

Plugin CI: fail on `plugin_errors` in `system/init`.

---

## Permissions for CI

```bash
claude -p "Run tests and fix failures" --allowedTools "Bash,Read,Edit"
```

Permission modes:

| Mode | Behavior |
|------|----------|
| `dontAsk` | Deny unless in `permissions.allow` or read-only set |
| `acceptEdits` | Auto file writes + common fs commands |

```bash
claude -p "Apply lint fixes" --permission-mode acceptEdits
```

`--allowedTools` uses [permission rule syntax](https://code.claude.com/docs/en/settings#permission-rule-syntax) — `Bash(git diff *)` needs space before `*`.

Skills in `-p`: include `/skill-name` in prompt string. Interactive-only commands (`/login`) unavailable. **v2.1.181+:** `/config thinking=false` in prompt.

---

## System prompt

```bash
gh pr diff "$1" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json
```

See [system prompt flags](https://code.claude.com/docs/en/cli-reference#system-prompt-flags).

Wall-Bounce: `buildFullPrompt` in adapter composes profile + context — not `--append-system-prompt` today.

---

## Continue / resume sessions

```bash
claude -p "Review for performance issues"
claude -p "Focus on database queries" --continue

session_id=$(claude -p "Start review" --output-format json | jq -r '.session_id')
claude -p "Continue" --resume "$session_id"
```

Session lookup scoped to project directory + git worktrees — [sessions](https://code.claude.com/docs/en/sessions#resume-a-session).

Pairs with [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) `--resume` for cron tasks.

---

## Background tasks at exit

| Type | `claude -p` behavior |
|------|---------------------|
| Background Bash (dev server) | Terminated ~**5s** after result (v2.1.163+) |
| Background subagents | Wait for completion (part of output) |
| Subagent wait cap | **10 min** default (v2.1.182+); `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`; `0` = unlimited |

---

## Fork mapping

| Platform | This fork |
|----------|-----------|
| `claude -p` | `claude-adapter.ts` `--print` |
| `--bare` CI | Not wired — recommend for B-6 |
| `--output-format json` | Backlog WB-14 / TS-CLI metadata |
| Agent SDK Python/TS | Not in repo AS-IS |
| `ANTHROPIC_API_KEY` in env | **Deleted** in adapter per [SECURITY.md](./SECURITY.md) |

```17:20:src/adapters/claude-adapter.ts
    const args = ['--print', '--model', model, '--strict-mcp-config'];
    if (request.profile.effort) {
      args.push('--effort', request.profile.effort);
    }
```

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.programmaticCli` | `-p`, `--bare`, output formats |
| `prompting.guidanceTopics[]` | `claude-code-programmatic-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | No `--bare`, `--allowedTools`, JSON output, streaming |
| Wall-Bounce | No per-invocation cost from `total_cost_usd` |
| F-10 | Programmatic topics not injected |

---

## Backlog

- **WB-14 / B-6** — `--output-format json`; parse usage, `session_id`, `stop_reason` — [TECH_STACK_CLI_INVOKE_METADATA.md](./decisions/TECH_STACK_CLI_INVOKE_METADATA.md)
- **B-6** — `--bare` for reproducible CI analyze rounds
- **Track E** — Document when to use Agent SDK packages vs CLI adapter

---

## References

- [Run programmatically (platform)](https://code.claude.com/docs/en/programmatic)
- [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) · [quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
- [CLI reference](https://code.claude.com/docs/en/cli-reference)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions) · [GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd)
- [Streaming output (SDK)](https://code.claude.com/docs/en/agent-sdk/streaming-output)
- [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [SECURITY.md](./SECURITY.md)
