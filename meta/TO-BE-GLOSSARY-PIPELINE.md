# TO-BE: Glossary / Terminology Pipeline (techdev-cursor consumer)

Project: **techdev-cursor** (glossary **consumer**)

Status: Phase 0 complete — first extract run on in-repo docs corpus

**Last updated:** 2026/06/21 23:26:30 JST

Related:
[glossary-config.json](./glossary-config.json) · [RAG_SETUP_GUIDE.md](../docs/RAG_SETUP_GUIDE.md) · [FORK_STATUS.md § Completed](../docs/FORK_STATUS.md#completed-fork) (milestone timestamps)

**Consumer config (this repo):** `meta/glossary-config.json`  
**Platform implementation (read-only invoke):** [term-prep-platform](https://github.com/wombat2006/term-prep-platform) — `glossary_extractor.py`, `mcp/glossary-knowledge`, and **planned** storage + RAG Vector connectors

---

## Consumer boundary (mandatory)

Work on glossary prep **only in this repo**. Do **not** edit, commit, or cross-check `term-prep-platform` from consumer tasks.

| Do in **techdev-cursor** | Do **not** from consumer work |
|--------------------------|-------------------------------|
| `meta/glossary-config.json` (`corpus.files`, scoring, filters) | `term-prep-platform/projects/techdev-cursor/*` |
| `meta/glossary-adopt.json`, `meta/glossary-hold.json` | Platform integration docs / mirror config sync |
| `npm run glossary:extract` / `glossary:extract:check` | Commits or PRs on term-prep-platform |
| `npm run glossary:mcp-smoke` | Duplicating platform Python or MCP source here |

**Invoke model:** sibling clone `../term-prep-platform` (or `TERM_PREP_PLATFORM_ROOT`) is a **read-only runtime dependency** — same as calling an installed CLI. Platform maintains its own copy of consumer metadata if needed; that is **out of scope** for agents working in this repo.

Do **not** duplicate platform Python or MCP in this repo. `.cursor/mcp.json` registers `glossary-knowledge` → sibling platform (verify only; do not change `techsapo-providers`).

### Platform escalation — notify the user

If consumer-side work **cannot proceed** without a change in `term-prep-platform`, **stop and tell the user explicitly**. Do **not** open, edit, or commit the platform repo yourself.

**Escalate when any of these apply:**

| Trigger | Example |
|---------|---------|
| Extractor fails on valid consumer config | schema mismatch, missing config key support |
| Config field has no effect | e.g. `filter.max_candidates_output` ignored by current extractor |
| MCP / knowledge filter cannot be enabled from consumer config alone | Phase 2.5 provider wiring, new tools |
| Platform bug blocks extract or smoke test | crash in `glossary_extractor.py` or `glossary-knowledge` MCP |
| New platform feature requested | PII MCP, registry seed-first, storage connectors (Drive / S3 / OneDrive, …), RAG Vector connectors |

**What to include in the notification:**

1. **Blocked goal** — what you were trying to do in techdev-cursor  
2. **What you already tried** — consumer config / npm script / error output  
3. **Platform change needed** — repo path(s), file(s), suggested fix or feature  
4. **Consumer side done?** — yes/no; if yes, list commits or files ready  
5. **Ask** — e.g. “Shall I prepare a platform PR?” or “Please apply this on term-prep-platform”

**Example (short):**

> Glossary extract ignores `max_candidates_output: 100` (1043 adopt rows written).  
> **Platform:** implement cap in `term-prep-platform/scripts/glossary_extractor.py` `write_outputs()`.  
> **Consumer:** no change required after platform fix — re-run `npm run glossary:extract`.  
> Please update term-prep-platform (or tell me to).

---

## Role in this repo

| Layer | Location | Notes |
|-------|----------|-------|
| **Consumer** | techdev-cursor (here) | corpus paths, config, adopt/hold JSON |
| **Platform CLI** | sibling `term-prep-platform` | invoke only via npm scripts below |
| **RAG ingest (AS-IS)** | `src/services/googledrive-connector.ts` | Google Drive → prep → Vector Store — **legacy in this repo** |
| **RAG ingest (To-Be)** | sibling `term-prep-platform` | **Delegation planned:** Google Drive connector (replaces in-repo implementation), arbitrary storage connectors (S3, OneDrive, …), RAG Vector store connectors |
| **Dictionary export (planned)** | `config/fork/devassist-dictionary-v0.json` | From registry / adopt |

### Connector delegation (planned)

| Connector | AS-IS (this repo) | To-Be (term-prep-platform) |
|-----------|-------------------|----------------------------|
| **Google Drive** | `googledrive-connector.ts` | Move / reimplement on platform |
| **Other storage** | — | S3, OneDrive, and other backends on platform |
| **RAG Vector** | partial via googledrive-connector | Dedicated Vector ingest/query connectors on platform |

Consumer agents: **do not** extend `googledrive-connector.ts` for new RAG prep work — escalate to the user for platform changes ([Platform escalation](#platform-escalation--notify-the-user)).

### Genspark AI Drive boundary (TS-30 idea — consumer doc only)

Planned [Genspark Add-on](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) uses **Genspark AI Drive (`aidrive`)** for tool file I/O (**mandatory when implemented**). That is **not** the same as **Google Drive** corpus ingest below.

| Surface | Canonical for glossary / RAG corpus? | Owner |
|---------|--------------------------------------|-------|
| Google Drive mirror (`googledrive-connector.ts` → platform) | **Yes** | term-prep-platform Phase 0.5+ |
| S3 / OneDrive (platform connectors) | **Yes** (when added) | term-prep-platform |
| Genspark **AI Drive** (`aidrive`) | **No** — tool staging only | techdev-cursor Genspark Add-on |
| Genspark **`google_drive` tool** | **No** — agent convenience; do not wire to `corpus.files` | Genspark Add-on |

Do **not** point `meta/glossary-config.json` `corpus.files` at Genspark AI Drive paths. Cross-repo platform changes still require [Platform escalation](#platform-escalation--notify-the-user).

Details: [GENSPARK_CONNECTOR_IDEA.md §3.2](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md#32-term-prep-platform-boundary--conflict-review) · [platform handoff](../meta/TERM_PREP_PLATFORM_HANDOFF_GENSPARK.md) (consumer canonical — platform agents read techdev-cursor; no mirror MD required)

---

## Phase 0 (done)

- Output split: `meta/glossary-adopt.json`, `meta/glossary-hold.json` (Git-tracked)
- `filter.emit_reject: false` — reject rows stay out of Git (`build/glossary/reject.jsonl` only when enabled)
- Config fields: `filter`, `output`, `knowledge_filter` (MCP disabled until Phase 2.5)
- Legacy single-file `meta/glossary-candidates.json` **deprecated** (`.gitignore` — see below)
- First extract: 11 in-repo markdown paths (interim until Google Drive local mirror)

## Tracked vs ignored outputs

| Path | Git | Notes |
|------|-----|-------|
| `meta/glossary-config.json` | ✅ | Consumer config |
| `meta/glossary-adopt.json` | ✅ | Adopt candidates |
| `meta/glossary-hold.json` | ✅ | Hold candidates |
| `meta/glossary-registry.json` | ✅ (Phase 2) | Not created yet |
| `meta/glossary-candidates.json` | ❌ | Legacy — **gitignored** |
| `build/glossary/reject.jsonl` | ❌ | Only when `filter.emit_reject: true` |

Output paths are **repo-relative** (`corpus_files`) and **sibling-relative** (`morphology.dicdir` → `../term-prep-platform/...`). `npm run glossary:extract` runs [normalize-glossary-output.py](../scripts/normalize-glossary-output.py) after the platform CLI.

Verify ignore rule:

```bash
touch meta/glossary-candidates.json
git check-ignore -v meta/glossary-candidates.json   # → .gitignore match
rm meta/glossary-candidates.json
```

| Phase | Content |
|-------|---------|
| 1 | Core package split (platform) |
| 2 | Registry seed-first |
| 2.5 | MCP knowledge filter enabled |
| 3 | Dictionary / GLOSSARY curation workflow |
| 4 | RAG prep via platform connectors (storage + Vector); deprecate in-repo `googledrive-connector.ts` hook |

Reference consumer walkthrough: [dopagaki-transition `meta/TO-BE-GLOSSARY-PIPELINE.md`](https://github.com/wombat2006/dopagaki-transition/blob/main/meta/TO-BE-GLOSSARY-PIPELINE.md)

---

## Run extractor

From **this repo** (consumer config only; platform clone read-only):

```bash
npm run glossary:extract:check   # fugashi + unidic-lite
npm run glossary:extract         # writes meta/glossary-adopt.json, meta/glossary-hold.json
```

Override platform location: `TERM_PREP_PLATFORM_ROOT=/path/to/term-prep-platform npm run glossary:extract`

Prerequisites: fugashi + unidic-lite in platform venv (`requirements-dev.txt`).  
Edit `corpus.files` in `meta/glossary-config.json` only (paths relative to repo root via `project_root: ".."`).

---

## MCP registration (Cursor)

Tracked in `.cursor/mcp.json` (sibling `../term-prep-platform`; read-only):

```json
"glossary-knowledge": {
  "command": "../term-prep-platform/.venv/bin/python",
  "args": ["-m", "glossary_knowledge_mcp"],
  "cwd": "../term-prep-platform/mcp/glossary-knowledge"
}
```

---

## Verification (Phase 0)

### MCP stub — `classify_term`

```bash
npm run glossary:mcp-smoke
```

Expected: `label: unknown`, `provider_id: null` (NullProvider stub until Phase 2.5).

### Extractor

```bash
npm run glossary:extract:check
```

## Next (not in scope yet)

- Google Drive local mirror → replace interim `corpus.files`
- `filter.max_candidates_output` cap in platform extractor
- Phase 2.5 knowledge filter enablement
- Platform storage connectors (Google Drive delegation from `googledrive-connector.ts`, S3, OneDrive, …)
- Platform RAG Vector connectors (ingest / query)
