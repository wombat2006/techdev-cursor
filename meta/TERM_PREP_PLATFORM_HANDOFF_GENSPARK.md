# Handoff: Genspark / AI Drive scope vs term-prep-platform

**From:** techdev-cursor (consumer)  
**To:** [term-prep-platform](https://github.com/wombat2006/term-prep-platform) maintainers / agents  
**Status:** Active boundary memo (2026-06-25) — not an ADR  
**Platform canonical file:** `term-prep-platform/docs/integrations/techdev-cursor-genspark-boundary.md` (sibling clone)

Consumer detail: [GENSPARK_CONNECTOR_IDEA.md §3](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) · [TO-BE-GLOSSARY-PIPELINE.md § Genspark boundary](./TO-BE-GLOSSARY-PIPELINE.md#genspark-ai-drive-boundary-ts-30-idea--consumer-doc-only)

---

## Why this exists

techdev-cursor plans a **Genspark Add-on (TS-30)** with **mandatory AI Drive (`aidrive`)**.  
term-prep-platform owns **corpus mirror + OpenAI Vector Store ingest**.  
Names overlap (“Drive”) — this handoff prevents **duplicate ingest**, **wrong canonical paths**, and **scope leaks** across repos.

---

## Copy-paste prompt (use in term-prep-platform workspace)

Paste the block below when starting agent work on **term-prep-platform** that touches ingest, connectors, RAG Vector, or techdev-cursor integration.

```markdown
## Context: techdev-cursor Genspark boundary (read first)

You are working in **term-prep-platform**, not techdev-cursor.

**Read before coding:**
- `docs/integrations/techdev-cursor-genspark-boundary.md` (this repo — canonical)
- Consumer idea: techdev-cursor `docs/ideas/GENSPARK_CONNECTOR_IDEA.md` §3.2–3.3

### Scope split (mandatory)

| Capability | term-prep-platform | techdev-cursor |
|------------|-------------------|----------------|
| Google Drive corpus mirror (Phase 0.5) | **YES** — reuse `googledrive-connector.ts` | Legacy until delegated; **no new** connector features |
| S3 / OneDrive mirror | **YES** (planned) | **NO** |
| OpenAI Vector Store ingest (Phase 4.5) | **YES** — connector `vector` mode | AS-IS legacy only; hook to platform when ready |
| glossary_extractor · registry · adopt/hold | **YES** | Consumer config + `npm run glossary:extract` only |
| glossary-knowledge MCP | **YES** | Register in `.cursor/mcp.json` only |
| Genspark AI Drive (`aidrive`) | **NO** — do not implement | **YES** when TS-30 built |
| Genspark search/crawl/summarize | **NO** | **YES** (grounding add-on) |
| Wall-Bounce / analyze_* MCP | **NO** | **YES** |

### Rules

1. **Never** treat Genspark **aidrive** as corpus canonical or Vector ingest source.
2. **Never** add Genspark / `GSK_API_KEY` / `gsk` CLI to term-prep-platform unless user explicitly opens a new ADR.
3. **Do** keep Phase 0.5 Drive mirror and Phase 4.5 Vector connector as the **only** durable ingest path for techdev-cursor consumer.
4. If consumer needs a platform change, document in `docs/integrations/techdev-cursor-genspark-boundary.md` § Open questions and notify the user — do not edit techdev-cursor from here without instruction.
5. aidrive → KB bridge (export → mirror → Vector) is **out of scope** unless both repos agree via ADR.

### My task

<describe your term-prep-platform task here>
```

---

## Sync checklist (when consumer boundary changes)

- [ ] Update [GENSPARK_CONNECTOR_IDEA.md](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) §3
- [ ] Update [TO-BE-GLOSSARY-PIPELINE.md](./TO-BE-GLOSSARY-PIPELINE.md) § Genspark boundary
- [ ] Update sibling `term-prep-platform/docs/integrations/techdev-cursor-genspark-boundary.md`
- [ ] Update [README.md](../README.md) / [README_en.md](../README_en.md) § Implementation ownership
- [ ] Notify user if platform implementation is required
