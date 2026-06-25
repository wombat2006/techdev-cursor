# Custom subagents (multi-model opinions)

Read-only opinion subagents for parallel second-opinion workflows on **techdev-cursor** work (glossary consumer, Wall-Bounce, platform boundary, handoff).

| Subagent | Model | Invoke |
|----------|-------|--------|
| `gpt-opinion` | GPT-5.5 | `/gpt-opinion <question>` |
| `codex-opinion` | Codex 5.3 | `/codex-opinion <question>` |
| `gemini-opinion` | Gemini 3.1 Pro | `/gemini-opinion <question>` |

## Parallel comparison (example)

```text
Run /gpt-opinion, /codex-opinion, and /gemini-opinion in parallel on this design question:

Should consumer Phase 0.5 wiring use npm glossary:sync delegation vs in-repo googledrive-connector?

Context: meta/TERM_PREP_PLATFORM_STATUS.md · ../term-prep-platform/meta/consumer-handoff/05-platform-implementation.md

Then compare the three opinions in a table: agreements, disagreements, and a merged recommendation.
```

## Consumer-specific uses

| Topic | Suggested subagent |
|-------|-------------------|
| Schema / platform contract | `gpt-opinion` |
| Consumer script / npm wiring | `codex-opinion` |
| Genspark / aidrive boundary · scope | `gemini-opinion` |
| Cross-repo handoff (A+C) | `gpt-opinion` + `gemini-opinion` |

## Cursor skills (consumer ↔ platform)

| Skill | Pair on platform |
|-------|------------------|
| `consumer-integration` | `platform-integration` |
| `consumer-handoff` | `consumer-handoff` |
| `platform-handoff` | (outbound paste prompt) |

See `.cursor/skills/README.md`

## Requirements

- Enable **GPT-5.5**, **Codex 5.3**, and **Gemini 3.1 Pro** in Cursor **Settings → Models**.
- All three agents use `readonly: true` — opinions only, no file edits.

## Related

- Platform status (read-only): `../term-prep-platform/meta/consumer-handoff/` · shim `meta/TERM_PREP_PLATFORM_STATUS.md`
- Consumer → platform boundary: `meta/platform-integration/`
