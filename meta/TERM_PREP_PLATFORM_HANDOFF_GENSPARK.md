# Handoff: Genspark / AI Drive scope vs term-prep-platform

**From:** techdev-cursor (consumer)  
**To:** [term-prep-platform](https://github.com/wombat2006/term-prep-platform) maintainers / agents  
**Status:** Active boundary memo (2026-06-25) — not an ADR  
**Consumer canonical:** this file + links below (platform agents **read** techdev-cursor; **do not** expect a mirror MD in term-prep-platform)

Consumer detail: [GENSPARK_CONNECTOR_IDEA.md §3](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) · [TO-BE-GLOSSARY-PIPELINE.md § Genspark boundary](./TO-BE-GLOSSARY-PIPELINE.md#genspark-ai-drive-boundary-ts-30-idea--consumer-doc-only) · [README § Implementation ownership](../README.md#実装分担techdev-cursor-vs-term-prep-platform)

---

## Why this exists

techdev-cursor plans a **Genspark Add-on (TS-30)** with **mandatory AI Drive (`aidrive`)**.  
term-prep-platform owns **corpus mirror + OpenAI Vector Store ingest**.  
Names overlap (“Drive”) — this handoff prevents **duplicate ingest**, **wrong canonical paths**, and **scope leaks** across repos.

**Cross-repo policy:** Consumer agents edit **techdev-cursor only**. Platform agents read consumer docs (sibling clone or GitHub) + this prompt. Platform implementation requests → **notify the user**; do not edit the other repo without explicit instruction.

---

## Copy-paste prompt (use in term-prep-platform workspace)

Paste the block below when starting agent work on **term-prep-platform** that touches ingest, connectors, RAG Vector, or techdev-cursor integration.

```markdown
## Context: techdev-cursor Genspark boundary (read first)

You are working in **term-prep-platform**, not techdev-cursor.

**Read before coding** (techdev-cursor repo — sibling clone or GitHub; no platform-local mirror required):

1. `meta/TERM_PREP_PLATFORM_HANDOFF_GENSPARK.md` (this handoff — consumer canonical)
2. `docs/ideas/GENSPARK_CONNECTOR_IDEA.md` §3.2–3.3 (boundary + aidrive vs Vector Store)
3. `meta/TO-BE-GLOSSARY-PIPELINE.md` § Genspark AI Drive boundary
4. `README.md` § Implementation ownership (ja) or `README_en.md` § Implementation ownership

### Three “Drive” surfaces (do not conflate)

| Surface | Corpus / Vector canonical? | Owner |
|---------|---------------------------|-------|
| Google Drive mirror (`googledrive-connector.ts` → platform) | **Yes** | term-prep-platform Phase 0.5+ |
| S3 / OneDrive (platform connectors) | **Yes** (when added) | term-prep-platform |
| Genspark **AI Drive** (`aidrive`) | **No** — tool staging only | techdev-cursor Genspark Add-on |
| Genspark **`google_drive` tool** | **No** — agent convenience; not `corpus.files` | Genspark Add-on |

### aidrive vs Vector Store (decision shortcuts)

| Need | Use | Not |
|------|-----|-----|
| Internal doc semantic search / RAG | OpenAI Vector Store (platform ingest path) | aidrive |
| Genspark tool file I/O (upload, analyze media) | **aidrive** | Vector Store |
| Live web grounding | **gsk search / crawl** | Vector (unless pre-ingested) |
| Persist aidrive draft into team KB | **ADR bridge only:** export → platform mirror → Vector | aidrive → Vector direct |

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
4. **Do not** edit techdev-cursor from this workspace. If platform work depends on consumer changes, **notify the user** with open questions — consumer docs stay canonical in techdev-cursor.
5. aidrive → KB bridge (export → mirror → Vector) is **out of scope** unless both repos agree via ADR.
6. **Do not** create or maintain a duplicate boundary MD in term-prep-platform unless the user explicitly requests it.

### My task

<describe your term-prep-platform task here>
```

---

## Sync checklist (when consumer boundary changes)

Update **techdev-cursor only** (same commit):

- [ ] Update [GENSPARK_CONNECTOR_IDEA.md](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) §3
- [ ] Update [TO-BE-GLOSSARY-PIPELINE.md](./TO-BE-GLOSSARY-PIPELINE.md) § Genspark boundary
- [ ] Update this handoff (`meta/TERM_PREP_PLATFORM_HANDOFF_GENSPARK.md`)
- [ ] Update [README.md](../README.md) / [README_en.md](../README_en.md) § Implementation ownership
- [ ] Notify user if platform implementation is required (user or platform agent implements in term-prep-platform)
