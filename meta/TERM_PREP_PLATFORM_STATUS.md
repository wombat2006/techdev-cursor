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

## D-004 status (2026-06-29 — in progress)

> **Policy change:** Platform has adopted artifact boundary (package CLI + Semver pin) as the consumer invoke contract.  
> A+C cross-repo Issue bot workflow is **deprecated**. `06-cross-repo-workflow.md` is legacy.  
> **A1 (install source: PyPI / private index) is an open user decision.** Full cutover deferred until A1 resolved.

| Consumer action | Status |
|-----------------|--------|
| A1: decide install source (PyPI / private index) | **pending — user decision** |
| A2: `mcp.json` → PATH-based command | pending consumer PR |
| A3: `glossary-config.json` schema alignment | pending |
| A4: CI contract check | pending consumer PR |

## Read order (consumer agents)

> D-004 updated read order. `05-platform-implementation.md` superseded by `01`; `06-cross-repo-workflow.md` deprecated.

| Step | Platform file | Purpose |
|------|---------------|---------|
| 0 | `README.md` | Index |
| 1 | `01-platform-status.md` | Phase progress + D-004 migration state |
| 2 | `02-schema-and-cli.md` | Schema · CLI entrypoints · MCP contract |
| 3 | `04-consumer-pr-guide-techdev-cursor.md` | Consumer PR / wiring spec |
| 4 | `03-consumer-actions.md` | Open obligations checklist |
| 5 | `CHANGELOG.md` | Dated platform changes |
| ~~6~~ | ~~`06-cross-repo-workflow.md`~~ | **Deprecated (D-004)** |

---

## Consumer scripts (this repo)

| Script | Purpose |
|--------|---------|
| `scripts/platform-handoff/check-handoff.sh` | Compare CHANGELOG vs `meta/.platform-handoff-last-seen` (reads CHANGELOG directly — D-004 fix applied) |
| `scripts/platform-handoff/request-platform-change.sh` | Open Issue on term-prep-platform |

```bash
./scripts/platform-handoff/check-handoff.sh
./scripts/platform-handoff/check-handoff.sh --mark-seen
```

> **D-004 note:** `check-handoff.sh` previously called `handoff_changelog.py` (removed from platform). Updated to read CHANGELOG via grep (Stage 1 fix applied 2026-06-30).

---

## Boundary (consumer → platform)

[meta/platform-integration/README.md](./platform-integration/README.md)

**Glossary consumer doc:** [meta/TO-BE-GLOSSARY-PIPELINE.md](./TO-BE-GLOSSARY-PIPELINE.md)
