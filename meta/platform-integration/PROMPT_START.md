# Prompt to paste in term-prep-platform (user copy)

**You (human)** paste the block below into the term-prep-platform agent chat.  
Replace `<YOUR TASK>` with a concrete task.  
Ensure techdev-cursor is available at a sibling path or set `TECHDEV_CURSOR_ROOT`.

---

## Copy from here

```markdown
## Integration context (mandatory — read before coding)

You are working in **term-prep-platform**. techdev-cursor is the **consumer** fork — read it; do **not** edit it.

### Step 1 — Resolve consumer repo path

Check in order:
1. `$TECHDEV_CURSOR_ROOT` if set
2. `../techdev-cursor` (sibling of this repo)
3. Clone or open: https://github.com/wombat2006/techdev-cursor

If none exist, **stop** and ask me to provide the path.

### Step 2 — Read these files in order (techdev-cursor)

| # | Path |
|---|------|
| 0 | `meta/platform-integration/README.md` |
| 1 | `meta/platform-integration/01-repo-split.md` |
| 2 | `meta/platform-integration/02-genspark-aidrive-boundary.md` |
| 3 | `meta/platform-integration/03-glossary-consumer-contract.md` |

Confirm you have read all four before proposing code changes.

### Step 3 — Boundary rules (summary)

- **Platform owns:** glossary_extractor, registry, glossary-knowledge MCP, Google Drive mirror (Phase 0.5), Vector ingest (Phase 4.5), S3/OneDrive connectors.
- **Consumer owns:** Wall-Bounce, Layer A memory, `meta/glossary-*` config, Genspark Add-on (TS-30) including **aidrive**.
- **Never:** implement Genspark / `gsk` / `GSK_API_KEY` / aidrive on platform unless I explicitly request a new ADR.
- **Never:** use aidrive or Genspark `google_drive` tool as corpus canonical or Vector ingest source.
- **Never:** edit techdev-cursor from this workspace — ask me to apply consumer-side changes.
- **Never:** duplicate boundary docs into term-prep-platform unless I ask.

### Step 4 — My task

<YOUR TASK>

### Step 5 — How to respond

1. Short confirmation of ownership (what you will vs will not touch).
2. Plan scoped to **term-prep-platform** only.
3. List any **consumer-side** changes needed → ask me; do not edit techdev-cursor.
4. If aidrive / Genspark / Vector boundary is unclear → stop and ask before coding.
```

## Copy to here

---

## Example tasks (replace `<YOUR TASK>`)

**Phase 0.5 — Drive mirror**

```text
Implement Google Drive corpus mirror on platform, reusing patterns from consumer
`src/services/googledrive-connector.ts` as reference only. Output paths must
work with consumer `npm run glossary:extract` and `meta/glossary-config.json`.
Do not add Genspark or aidrive.
```

**Phase 4.5 — Vector connector**

```text
Design Vector Store ingest connector on platform (vector mode). Internal doc
semantic search only — ingest from platform mirror paths, not aidrive. Document
how consumer hooks when delegation is ready.
```

**Glossary extractor fix**

```text
Fix glossary_extractor so `filter.max_candidates_output` in consumer config is
respected. Consumer re-runs `npm run glossary:extract` after platform fix.
```
