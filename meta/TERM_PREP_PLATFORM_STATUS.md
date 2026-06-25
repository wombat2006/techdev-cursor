# term-prep-platform — progress & consumer obligations (read-only)

**Canonical pack lives on platform.** Do not copy `meta/consumer-handoff/` into this repo unless explicitly requested.

**Cursor skills:** `.cursor/skills/consumer-integration` · `.cursor/skills/consumer-handoff`  
**Outbound platform prompt:** `.cursor/skills/platform-handoff` · `meta/platform-integration/PROMPT_START.md`

---

## Resolve platform path

| Priority | Path |
|----------|------|
| 1 | `$TERM_PREP_PLATFORM_ROOT/meta/consumer-handoff/README.md` |
| 2 | `../term-prep-platform/meta/consumer-handoff/README.md` |
| 3 | [GitHub — meta/consumer-handoff](https://github.com/wombat2006/term-prep-platform/tree/main/meta/consumer-handoff) |

---

## Read order (consumer agents)

| Step | Platform file | Purpose |
|------|---------------|---------|
| 0 | `README.md` | Index |
| 1 | `05-platform-implementation.md` | What platform built (Phase 0 · 0.5) |
| 2 | `01-platform-status.md` | Phase progress |
| 3 | `02-schema-and-cli.md` | Schema · CLI · MCP contract |
| 4 | `04-consumer-pr-guide-techdev-cursor.md` | Consumer PR / wiring spec |
| 5 | `03-consumer-actions.md` | Open obligations checklist |
| 6 | `CHANGELOG.md` | Dated platform changes |
| 7 | `06-cross-repo-workflow.md` | A+C bot Issue / PR coordination |

---

## Consumer scripts (this repo)

| Script | Purpose |
|--------|---------|
| `scripts/platform-handoff/check-handoff.sh` | Compare CHANGELOG vs `meta/.platform-handoff-last-seen` |
| `scripts/platform-handoff/request-platform-change.sh` | Open Issue on term-prep-platform |

```bash
./scripts/platform-handoff/check-handoff.sh
./scripts/platform-handoff/check-handoff.sh --mark-seen
```

---

## Boundary (consumer → platform)

[meta/platform-integration/README.md](./platform-integration/README.md)

**Glossary consumer doc:** [meta/TO-BE-GLOSSARY-PIPELINE.md](./TO-BE-GLOSSARY-PIPELINE.md)
