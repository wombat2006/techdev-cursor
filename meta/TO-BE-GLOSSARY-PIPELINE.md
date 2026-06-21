# TO-BE: Glossary / Terminology Pipeline (techdev-cursor consumer)

Project: **techdev-cursor** (glossary **consumer**)

Status: Phase 0 complete — consumer config + adopt/hold outputs; corpus TBD

Related:
[term-prep-platform](https://github.com/wombat2006/term-prep-platform) · [glossary-config.json](./glossary-config.json) · [RAG_SETUP_GUIDE.md](../docs/RAG_SETUP_GUIDE.md)

**Canonical implementation:** [term-prep-platform](https://github.com/wombat2006/term-prep-platform) (`glossary_extractor.py`, `mcp/glossary-knowledge`)  
**Platform mirror:** `term-prep-platform/projects/techdev-cursor/glossary-config.json`  
**Consumer config (this repo):** `meta/glossary-config.json`

---

## Role in this repo

| Layer | Location | Notes |
|-------|----------|-------|
| **Platform** | term-prep-platform | MCP, extractor, governance |
| **Consumer** | techdev-cursor (here) | corpus paths, config, adopt/hold JSON |
| **RAG target** | `src/services/googledrive-connector.ts` | Google Drive → prep → Vector Store |
| **Dictionary export (planned)** | `config/fork/devassist-dictionary-v0.json` | From registry / adopt |

Do **not** duplicate platform Python or MCP in this repo. `.cursor/mcp.json` registers `glossary-knowledge` → term-prep-platform (verify only; do not change `techsapo-providers`).

---

## Phase 0 (done)

- Output split: `meta/glossary-adopt.json`, `meta/glossary-hold.json` (Git-tracked)
- `filter.emit_reject: false` — reject rows stay out of Git (`build/glossary/reject.jsonl` only when enabled)
- Config fields: `filter`, `output`, `knowledge_filter` (MCP disabled until Phase 2.5)
- Legacy single-file `meta/glossary-candidates.json` **deprecated**

## Next (not in scope yet)

| Phase | Content |
|-------|---------|
| 1 | Core package split (platform) |
| 2 | Registry seed-first |
| 2.5 | MCP knowledge filter enabled |
| 3 | Dictionary / GLOSSARY curation workflow |
| 4 | RAG prep hook in googledrive-connector |

Reference consumer walkthrough: [dopagaki-transition `meta/TO-BE-GLOSSARY-PIPELINE.md`](https://github.com/wombat2006/dopagaki-transition/blob/main/meta/TO-BE-GLOSSARY-PIPELINE.md)

---

## Run extractor (when corpus is ready)

From term-prep-platform (canonical CLI):

```bash
cd /path/to/term-prep-platform
python scripts/glossary_extractor.py \
  --config projects/techdev-cursor/glossary-config.json
```

Or with consumer config path:

```bash
python scripts/glossary_extractor.py \
  --config /path/to/techdev-cursor/meta/glossary-config.json
```

Prerequisites: fugashi + unidic-lite (`term-prep-platform/requirements-dev.txt`).  
Set `corpus.files` in config before first run (paths relative to `project_root`).

---

## MCP registration (Cursor)

Already configured in `.cursor/mcp.json` (local path; gitignored):

```json
"glossary-knowledge": {
  "command": ".../term-prep-platform/.venv/bin/python",
  "args": ["-m", "glossary_knowledge_mcp"],
  "cwd": ".../term-prep-platform/mcp/glossary-knowledge"
}
```

See [term-prep-platform/docs/integrations/techdev-cursor.md](https://github.com/wombat2006/term-prep-platform/blob/main/docs/integrations/techdev-cursor.md).
