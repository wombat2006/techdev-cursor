# Claude Code — Configure Auto Mode

**Status**: Documented — no `autoMode` block committed in this repo yet  
**Platform**: [Configure auto mode](https://code.claude.com/docs/en/auto-mode-config) · [Permission modes (enable + defaults)](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_GLOSSARY.md](./CLAUDE_CODE_GLOSSARY.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_CLI_REFERENCE.md](./CLAUDE_CODE_CLI_REFERENCE.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Auto mode** is a [permission mode](https://code.claude.com/docs/en/permission-modes) where a **classifier model** reviews tool calls in the background so most actions run without approval prompts. It blocks irreversible, destructive, or out-of-environment actions.

This page is the **configuration reference** for the classifier. For enabling auto mode and default block behavior, see [permission modes](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode).

**Fork AS-IS:** Wall-Bounce uses `claude --print` with `--strict-mcp-config` — not interactive auto mode. Auto mode applies to interactive `claude` CLI / IDE sessions. Cursor has its own permission model.

**Availability:** Anthropic API — all users. Bedrock / Vertex / Foundry — set `CLAUDE_CODE_ENABLE_AUTO_MODE=1` first. Team/Enterprise may require admin enablement.

---

## Two gates

| Layer | Runs | Override |
|-------|------|----------|
| **`permissions.*`** (allow / ask / deny) | First | `permissions.deny` in managed settings blocks **before** classifier — cannot be overridden |
| **Auto mode classifier** | Second | `autoMode` settings + user intent |

Deny and explicit ask rules still prompt or block before the classifier runs.

---

## Where configuration is read

| Scope | File | Use for |
|-------|------|---------|
| Project conventions | `CLAUDE.md` | Behavioral rules — classifier reads same content as Claude |
| Personal | `~/.claude/settings.json` | Trusted infrastructure |
| Per-project local | `.claude/settings.local.json` | Project-specific buckets/services |
| Organization | [Managed settings](https://code.claude.com/docs/en/server-managed-settings) | Fleet-wide `autoMode` |
| Automation | `--settings` inline JSON / Agent SDK | Per-invocation override |

**Not read from:** `.claude/settings.json` (shared project settings) — checked-in repos cannot inject classifier allow rules.

Scopes **merge additively**. Managed entries cannot be removed by developers; a developer `allow` can override org `soft_deny` inside the classifier (not a hard policy boundary — use `permissions.deny` for that).

---

## `autoMode.environment` (trusted infrastructure)

Default trusts working directory + current repo remotes only. Push to company org or write team buckets is blocked until listed.

Entries are **prose**, not regex. Include `"$defaults"` to keep built-in entries spliced at that position.

```json
{
  "autoMode": {
    "environment": [
      "$defaults",
      "Source control: github.example.com/acme-corp and all repos under it",
      "Trusted cloud buckets: s3://acme-build-artifacts, gs://acme-ml-datasets",
      "Trusted internal domains: *.corp.example.com, api.internal.example.com",
      "Key internal services: Jenkins at ci.example.com, Artifactory at artifacts.example.com"
    ]
  }
}
```

**Rollout:** (1) source control org + key services, (2) domains + buckets, (3) fill rest as denials appear.

Cover: organization, source control orgs, cloud buckets/prefixes, internal domains, CI/artifact/incident tooling, compliance context.

---

## Override block and allow rules

| Field | Effect |
|-------|--------|
| `hard_deny` | Unconditional block — user intent and `allow` do not apply |
| `soft_deny` | Block unless explicit user intent or `allow` exception |
| `allow` | Exceptions to matching `soft_deny` rules |

**Precedence (inside classifier):** `hard_deny` → `soft_deny` → `allow` → explicit user intent (must describe the **exact** action — "clean up the repo" ≠ force-push authorization).

For tool-pattern hard blocks **before** classifier, use [`permissions.deny`](https://code.claude.com/docs/en/permissions).

```json
{
  "autoMode": {
    "environment": ["$defaults", "Source control: github.example.com/acme-corp"],
    "allow": [
      "$defaults",
      "Deploying to staging namespace is allowed: isolated, resets nightly"
    ],
    "soft_deny": [
      "$defaults",
      "Never run database migrations outside the migrations CLI"
    ],
    "hard_deny": [
      "$defaults",
      "Never send repository contents to third-party code-review APIs"
    ]
  }
}
```

> **Warning:** Omitting `"$defaults"` in any array **replaces the entire default list** for that section. Empty `soft_deny` without `$defaults` drops built-in blocks (force push, `curl | bash`, prod deploys). Run `claude auto-mode defaults` before taking full ownership.

Each section is independent — setting only `environment` leaves default `allow` / `soft_deny` / `hard_deny` intact.

---

## Inspect configuration (CLI)

```bash
claude auto-mode defaults   # built-in rules as JSON
claude auto-mode config     # effective rules with your settings applied
claude auto-mode critique   # AI review of custom allow/soft_deny/hard_deny
```

After saving settings, run `config` to confirm `$defaults` expanded. To replace a built-in rule, copy `defaults` output, edit, paste in place of `"$defaults"`.

---

## Review denials

Denied tool calls appear in `/permissions` → **Recently denied**. Press `r` to mark for retry on exit.

Repeated denials for same destination → add to `autoMode.environment`, then `claude auto-mode config`.

Programmatic reaction: [`PermissionDenied` hook](https://code.claude.com/docs/en/hooks#permissiondenied) — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md).

---

## Fork mapping

| Platform | This repo |
|----------|-----------|
| `autoMode` in `~/.claude/settings.json` | Not committed — document only |
| `permissions.deny` managed | [SECURITY.md](./SECURITY.md) policy |
| Classifier + CLAUDE.md | [AGENTS.md](../AGENTS.md) + `.cursor/rules/` for Cursor |
| `claude --print` adapter | No auto mode — non-interactive |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.autoMode` | Platform URL + CLI subcommands |
| `prompting.guidanceTopics[]` | `claude-code-auto-mode-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No `.claude/settings.json` `autoMode` block |
| Adapter | `claude-adapter.ts` uses `--print` — classifier not engaged |
| F-10 | Auto mode topics not injected at runtime |
| Cursor | Separate permission UX — not `autoMode` settings |

---

## See also

- [Permission modes](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode)
- [Permissions](https://code.claude.com/docs/en/permissions)
- [Managed settings](https://code.claude.com/docs/en/server-managed-settings)
- [Settings reference](https://code.claude.com/docs/en/settings) — `autoMode` key
- [Glossary — Auto mode](./CLAUDE_CODE_GLOSSARY.md)
