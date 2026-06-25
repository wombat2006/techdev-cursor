---
name: consumer-handoff
description: Handle term-prep-platform handoff on techdev-cursor — check CHANGELOG, apply consumer PR spec, escalate to platform. Use when the user mentions platform-handoff Issue, consumer-handoff CHANGELOG, check-handoff, request-platform-change, or A+C cross-repo workflow.
disable-model-invocation: true
---

# Consumer handoff (platform → techdev-cursor)

**Pair (platform):** `term-prep-platform/.cursor/skills/consumer-handoff/SKILL.md`  
**Direction:** Platform publishes status; **consumer** reads and applies obligations in **techdev-cursor**.

## Goal

After platform work (or a `platform-handoff` Issue), keep consumer wiring correct: read platform pack, apply **this repo** changes per spec, verify with scripts. **Do not edit term-prep-platform.**

## Non-negotiables

- **Do not** commit to `term-prep-platform`.
- **Do not** mirror full `meta/consumer-handoff/` into techdev-cursor.
- **Do** implement consumer-side files listed in platform `04-consumer-pr-guide-techdev-cursor.md` when the user assigns that work.

## Canonical docs

### Platform (read-only)

| Step | File |
|------|------|
| 0 | `../term-prep-platform/meta/consumer-handoff/README.md` |
| 1 | `05-platform-implementation.md` |
| 2 | `01-platform-status.md` |
| 3 | `02-schema-and-cli.md` |
| 4 | `04-consumer-pr-guide-techdev-cursor.md` — **consumer PR spec** |
| 5 | `03-consumer-actions.md` |
| 6 | `CHANGELOG.md` |
| 7 | `06-cross-repo-workflow.md` |

### Consumer (this repo)

| File | Role |
|------|------|
| `meta/TERM_PREP_PLATFORM_STATUS.md` | Shim → platform pack |
| `scripts/platform-handoff/check-handoff.sh` | NEW / STALE / OK vs CHANGELOG |
| `scripts/platform-handoff/request-platform-change.sh` | Open platform Issue (reverse path) |

## Workflow

### A. Platform Issue or “handoff update” received

1. Run from **techdev-cursor** root:
   ```bash
   ./scripts/platform-handoff/check-handoff.sh
   ```
2. Read platform `CHANGELOG.md` + linked handoff docs.
3. If **NEW** or **STALE**:
   - Apply missing consumer changes per `04-consumer-pr-guide-techdev-cursor.md` (this repo only).
   - Run verification from 04 § Post-merge (e.g. `glossary:extract:check`, `glossary:sync:check` when scripts exist).
4. Mark seen:
   ```bash
   ./scripts/platform-handoff/check-handoff.sh --mark-seen
   ```

### B. Consumer blocked — need platform change

1. **Do not** edit platform repo.
2. Run:
   ```bash
   export CROSS_REPO_GH_TOKEN=...
   ./scripts/platform-handoff/request-platform-change.sh \
     --title "<short title>" --body "<what platform must do>"
   ```
3. Tell user to wait for platform CHANGELOG + new consumer Issue (workflow C).

### C. User asks for handoff summary

Return:

1. **check-handoff status** (NEW / STALE / OK) and latest CHANGELOG id.
2. **Consumer obligations** — bullets from `03-consumer-actions.md` still open.
3. **Files to change** — from `04` (no full duplicate of 04).
4. **Next command** — verify or `--mark-seen`.

## Output format (summary)

```markdown
## Handoff status
- Latest platform entry: ...
- check-handoff: NEW | STALE | OK

## Consumer actions (this repo)
- [ ] ...

## Platform (read-only — do not edit)
- ...

## Commands
...
```

## Related skills

| Skill | When |
|-------|------|
| `consumer-integration` | Before starting consumer work — read platform contract |
| `platform-handoff` | Brief a **platform** agent (outbound paste prompt) |
