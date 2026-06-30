# Glossary & connector contract (platform obligations)

**Read as:** Step 3 of [platform-integration index](./README.md)  
**Consumer mirror:** `meta/TO-BE-GLOSSARY-PIPELINE.md` (full consumer perspective)

---

## Roles

| Layer | Repo | Platform agent responsibility |
|-------|------|------------------------------|
| **Consumer** | techdev-cursor | Read-only — do not edit |
| **Platform CLI** | term-prep-platform | Own `glossary_extractor.py`, registry, outputs |
| **glossary-knowledge MCP** | term-prep-platform | Own `mcp/glossary-knowledge` |
| **RAG ingest (AS-IS)** | techdev-cursor legacy | `googledrive-connector.ts` — **do not extend**; reimplement on platform |
| **RAG ingest (To-Be)** | term-prep-platform | Drive mirror, S3/OneDrive, Vector connectors |

---

## Invoke surface (current state — D-004 migration in progress)

> **D-004 (2026-06-29):** Migration from sibling-path scripts to `term-prep-platform` package CLI entrypoints is **in progress**.
> A+C cross-repo Issue bot workflow is **deprecated**. `06-cross-repo-workflow.md` is legacy.
> **A1 (install source — PyPI / private index) is an open user decision.** Full package CLI cutover is deferred until A1 is resolved.

| Artifact | Current (AS-IS) | To-Be (D-004 complete) |
|----------|-----------------|------------------------|
| Corpus config | `meta/glossary-config.json` | Same |
| Adopt / hold | `meta/glossary-adopt.json`, `meta/glossary-hold.json` | Same |
| Extract invoke | `npm run glossary:extract` → `scripts/run-glossary-extract.sh` → sibling venv Python | `term-prep-extract --config meta/glossary-config.json` |
| MCP launch | `.cursor/mcp.json` → `../term-prep-platform/.venv/bin/python -m glossary_knowledge_mcp` | `"command": "term-prep-glossary-knowledge-mcp"` (PATH-based) |
| Contract guard | — | `term-prep-contract-check --config meta/glossary-config.json --expect-major 1` |

**Consumer actions pending (from platform `03-consumer-actions.md`):**
- A1: install source decision (user) — PyPI / private index
- A2: `mcp.json` PATH-based command update
- A3: `meta/glossary-config.json` schema alignment
- A4: CI contract check

**Sibling path:** `../term-prep-platform` still required until A1 resolved and package published.

---

## Connector delegation (planned phases)

| Connector | AS-IS (consumer) | To-Be (platform — you implement) |
|-----------|------------------|----------------------------------|
| **Google Drive** | `src/services/googledrive-connector.ts` | Phase 0.5: move / reimplement mirror |
| **Other storage** | — | S3, OneDrive, other backends |
| **RAG Vector** | partial via googledrive-connector | Phase 4.5: dedicated Vector ingest/query connectors |

**Rule:** New RAG prep work belongs on **platform**, not consumer `googledrive-connector.ts`. Consumer agents escalate to user; platform agents implement here.

---

## Genspark interaction with glossary

- **Do not** point consumer `meta/glossary-config.json` `corpus.files` at Genspark AI Drive paths.
- Corpus canonical paths = Google Drive mirror (platform) / in-repo / platform-synced paths.
- Genspark **aidrive** is tool staging only — see [02-genspark-aidrive-boundary.md](./02-genspark-aidrive-boundary.md).

---

## Phase 0 status (consumer)

- Output split: `glossary-adopt.json`, `glossary-hold.json`
- First extract: in-repo markdown paths (interim until Drive mirror)
- `glossary-knowledge` MCP: stub on platform side

---

## When platform work needs consumer changes

**Stop and notify the user** — do not edit techdev-cursor yourself.

| Trigger | Example |
|---------|---------|
| New config key consumer must set | schema extension in `glossary-config.json` |
| Extractor output shape change | adopt/hold JSON contract break |
| MCP tool surface change | new glossary-knowledge capabilities |
| Consumer npm script contract | new flags for `glossary:extract` |

**Include in notification:** blocked goal, platform change done/planned, what consumer must update, ask user to apply on techdev-cursor.

---

## When consumer work needs platform changes (reverse)

Consumer agents follow the same rule: notify user, do not edit platform.  
Your job: implement on platform when user assigns the task and you have read 01–03.

---

## Related

- [01-repo-split.md](./01-repo-split.md)
- [02-genspark-aidrive-boundary.md](./02-genspark-aidrive-boundary.md)
- `meta/TO-BE-GLOSSARY-PIPELINE.md` — consumer boundary + escalation templates
- `docs/RAG_SETUP_GUIDE.md` — legacy AS-IS RAG in consumer
