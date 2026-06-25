---
name: consumer-integration
description: Start techdev-cursor work with correct platform handoff reads. Use when the user touches glossary config, glossary extract, MCP, corpus paths, Phase 0.5 Drive mirror, or mentions term-prep-platform consumer-handoff.
disable-model-invocation: true
---

# Consumer integration (read platform handoff first)

**Pair (platform):** `term-prep-platform/.cursor/skills/platform-integration/SKILL.md`  
**Direction:** Consumer reads **platform** status + contract before editing **techdev-cursor**.

## Goal

Scope **techdev-cursor** work correctly before coding. Platform docs are **read-only** from this workspace.

## Non-negotiables

- **Do not** edit or commit `term-prep-platform` unless the user explicitly instructs otherwise.
- **Do not** copy `meta/consumer-handoff/` into techdev-cursor — read sibling or GitHub.
- **Do** edit consumer config, npm scripts, and docs in **this repo** when the user assigns consumer-side work.

## Resolve platform path

| Priority | Path |
|----------|------|
| 1 | `$TERM_PREP_PLATFORM_ROOT` |
| 2 | `../term-prep-platform` |
| 3 | Stop and ask user for path |

## Mandatory read order (platform repo)

| Step | File |
|------|------|
| 0 | `meta/consumer-handoff/README.md` |
| 1 | `meta/consumer-handoff/05-platform-implementation.md` |
| 2 | `meta/consumer-handoff/01-platform-status.md` |
| 3 | `meta/consumer-handoff/02-schema-and-cli.md` |
| 4 | `meta/consumer-handoff/03-consumer-actions.md` |

## Consumer boundary (this repo — read)

| Step | File |
|------|------|
| 0 | `meta/TERM_PREP_PLATFORM_STATUS.md` (shim) |
| 1 | `meta/platform-integration/README.md` |
| 2 | `meta/platform-integration/03-glossary-consumer-contract.md` |
| 3 | `meta/TO-BE-GLOSSARY-PIPELINE.md` |

Genspark / aidrive: `meta/platform-integration/02-genspark-aidrive-boundary.md`

## Workflow

1. Confirm read of platform steps 0–4 and consumer boundary.
2. State **will implement** vs **will not touch** (platform repo, Genspark on platform).
3. Plan scoped to **techdev-cursor** only.
4. If platform code is required → use skill `consumer-handoff` (`request-platform-change.sh`) or notify user; do not edit platform.
5. If boundary unclear → stop and ask before coding.

## Task shortcuts

| Task | Minimum platform reads |
|------|------------------------|
| `glossary:extract` / config | 01 + 02 |
| Phase 0.5 Drive mirror wiring | 05 + 01 + 02 + `04-consumer-pr-guide-techdev-cursor.md` |
| MCP `glossary-knowledge` | 02 § MCP |
| Genspark scope check | consumer `02-genspark-aidrive-boundary.md` only |

## Output format (when preparing work)

```markdown
## Ownership
- Consumer (this repo): ...
- Platform (read-only): ...
- Not touching: ...

## Plan (techdev-cursor only)
...

## Platform dependencies
- Status: ...
- If blocked: request-platform-change.sh or user assigns platform task
```

## Related skills

| Skill | When |
|-------|------|
| `consumer-handoff` | Platform Issue received · CHANGELOG stale · apply 04 PR checklist |
| `platform-handoff` | Generate paste prompt for **platform** agent chat |
