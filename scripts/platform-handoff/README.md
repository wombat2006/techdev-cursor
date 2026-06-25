# Consumer-side platform handoff scripts

Paired with term-prep-platform `meta/consumer-handoff/` and `.cursor/skills/consumer-handoff`.

Copied from [term-prep-platform consumer-templates](https://github.com/wombat2006/term-prep-platform/tree/main/scripts/cross_repo/consumer-templates). Refresh:

```bash
../term-prep-platform/scripts/cross_repo/install_consumer_scripts.sh
```

## Scripts

| Script | Purpose |
|--------|---------|
| `check-handoff.sh` | Compare platform CHANGELOG to `meta/.platform-handoff-last-seen` |
| `request-platform-change.sh` | Open Issue on term-prep-platform (reverse path of bot notify) |

## Typical flow (A + C hybrid)

1. Platform pushes + bot opens Issue on consumer (`platform-handoff` label)
2. Consumer maintainer reads Issue links → platform `meta/consumer-handoff/`
3. `./scripts/platform-handoff/check-handoff.sh` — see if already handled
4. If wiring needed: consumer PR per platform `04-consumer-pr-guide-techdev-cursor.md`
5. `./scripts/platform-handoff/check-handoff.sh --mark-seen`
6. If platform code needed: `./scripts/platform-handoff/request-platform-change.sh`

## Env

| Variable | Default |
|----------|---------|
| `TERM_PREP_PLATFORM_ROOT` | `../term-prep-platform` |
| `PLATFORM_REPO` | `wombat2006/term-prep-platform` |
| `CONSUMER_REPO` | `wombat2006/techdev-cursor` |
| `CROSS_REPO_GH_TOKEN` | for `request-platform-change.sh` |

## Git

`meta/.platform-handoff-last-seen` is gitignored (local sync marker).

Canonical workflow: `../term-prep-platform/meta/consumer-handoff/06-cross-repo-workflow.md`
