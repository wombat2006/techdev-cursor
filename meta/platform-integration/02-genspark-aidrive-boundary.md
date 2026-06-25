# Genspark / AI Drive boundary (platform view)

**Read as:** Step 2 of [platform-integration index](./README.md)  
**Idea source:** `docs/ideas/GENSPARK_CONNECTOR_IDEA.md` §3 (TS-30 Add-on — not Wall-Bounce peer)

---

## Why platform agents need this

techdev-cursor plans a **Genspark Add-on (TS-30)** with **mandatory AI Drive (`aidrive`)**.  
Names overlap with “Drive” and “RAG” — this doc prevents **duplicate ingest**, **wrong canonical paths**, and **scope leaks** into term-prep-platform.

**You implement:** durable corpus mirror + Vector ingest.  
**You do not implement:** Genspark, aidrive, `gsk`, or live web grounding tools.

---

## Three “Drive” surfaces (do not conflate)

| Surface | Backend | Auth | Owner | Role |
|---------|---------|------|-------|------|
| **Google Drive (corpus / RAG)** | Google Drive API | OAuth / service account | **term-prep-platform** (Phase 0.5+) via `googledrive-connector.ts` reuse | Durable mirror → glossary → RAG Vector |
| **Genspark AI Drive (`aidrive`)** | Genspark cloud (`/api/tool_cli/aidrive`) | `GSK_API_KEY` | **techdev-cursor** Genspark Add-on | **Mandatory** staging for Genspark tools only |
| **Genspark `google_drive` tool** | Google via Genspark | `GSK_API_KEY` | Genspark Add-on — **non-canonical** | Agent convenience; **not** glossary/RAG ingest |

| Surface | Corpus / Vector canonical? |
|---------|---------------------------|
| Google Drive mirror | **Yes** |
| S3 / OneDrive (platform) | **Yes** (when added) |
| Genspark **aidrive** | **No** — tool staging only |
| Genspark **`google_drive` tool** | **No** — not `corpus.files` |

---

## aidrive vs OpenAI Vector Store

**Core rule:** **aidrive** = Genspark **tool file I/O**. **Vector Store** = **ingested internal corpus** semantic search. Different layers — not interchangeable.

### Layer diagram

```text
【Durable · canonical · semantic retrieval】     【Genspark runtime · tool I/O】
Google Drive mirror ─┐
S3 / in-repo corpus ─┼→ term-prep-platform     OpenAI Vector Store
(Phase 0.5+)         │   glossary_extractor          │
                     │         │                     │ file_search (RAG)
                     └─────────┼─────────────────────┤
                               │                     ▼
                               │            Wall-Bounce / RAG API
                               │
                     × no default wire from aidrive

Genspark tools (upload · analyze · img · task · drive)
        │
        ▼
   aidrive (mandatory)  ←→  gsk drive / HTTP D4–D6
        │
        ├─ gsk search / crawl / summarize → live grounding (not Vector DB)
        └─ × not a Vector Store substitute
```

| Layer | Technology | Owner repo | Purpose | Lifetime |
|-------|------------|------------|---------|----------|
| **Corpus mirror** | Google Drive API · S3 | **term-prep-platform** (+ legacy consumer until delegation) | Canonical source for prep + Vector ingest | Durable |
| **Semantic index** | OpenAI Vector Store (`vs_*`) | Ingest via platform Phase 4.5 | Similar paragraphs in **our** ingested KB | Durable |
| **Genspark staging** | **aidrive** | **techdev-cursor** Genspark Add-on | Files Genspark tools need | Session / tool scope |
| **Live grounding** | `gsk search` / `crawl` / `summarize` | **techdev-cursor** Genspark Add-on | External / live web facts | Per request |

### Decision flow

```text
Is the question about previously ingested INTERNAL documents?
  ├─ Yes → OpenAI Vector Store (file_search)
  │         Source ingest = platform mirror path, NOT aidrive
  └─ No
       └─ Does a Genspark tool need a file handle?
            ├─ Yes → aidrive (mandatory) — techdev-cursor only
            └─ No
                 └─ Need live web / external fetch?
                      ├─ Yes → gsk search / crawl — techdev-cursor only
                      └─ No → analyze_* / Wall-Bounce — techdev-cursor only
```

### Examples

| Scenario | Use | Do **not** use |
|----------|-----|----------------|
| “Find OAuth setup in our past design docs” | **Vector Store** (ingested corpus) | aidrive |
| “Analyze this PNG with Genspark” | **aidrive** (techdev-cursor) | Vector Store |
| “What changed in React 19 today?” | **gsk search / crawl** (techdev-cursor) | Vector (unless pre-ingested) |
| “Persist draft from aidrive into team KB” | **ADR bridge only:** export → platform mirror → Vector | aidrive → Vector direct |
| “Point `corpus.files` at cloud paths” | Platform mirror / in-repo paths | aidrive paths |

---

## Conflict matrix (platform vs Genspark)

| Topic | term-prep-platform | Genspark Add-on | Resolution |
|-------|-------------------|-----------------|------------|
| **Canonical corpus ingest** | Drive mirror; platform connectors | AI Drive for tool I/O only | Corpus = platform + `meta/glossary-config.json`; aidrive = session files |
| **Google Drive as data source** | `googledrive-connector.ts` → mirror | `google_drive` gsk tool | **Forbidden:** Genspark `google_drive` or crawl as canonical corpus without ADR bridge |
| **RAG Vector ingest** | Phase 4.5 connector `vector` mode | Search/crawl = grounding only | No second vector pipeline via Genspark |
| **S3 / OneDrive** | Platform adapters | May exist in gsk | Durable mirror = platform; Genspark = ephemeral unless bridged |
| **Consumer repo edits** | Platform implements; consumer escalates | `src/connectors/genspark/` only | AGENTS.md consumer boundary unchanged |

---

## Data flow (target separation)

```text
┌─ term-prep-platform (durable prep) ─────────────────────────┐
│ Google Drive / S3 mirror → glossary_extractor → adopt/hold   │
│ Phase 4.5: Vector connector (googledrive-connector reuse)   │
└───────────────────────────┬───────────────────────────────────┘
                            │ registry / optional RAG query
                            ▼
┌─ techdev-cursor core ───────────────────────────────────────┐
│ Wall-Bounce · analyze_* · Layer A                            │
└───────────────────────────┬───────────────────────────────────┘
                            │ optional GroundingProvider
                            ▼
┌─ Genspark Add-on (TS-30) ───────────────────────────────────┐
│ gsk + HTTP · AI Drive mandatory · search/media/task tools      │
│ NOT corpus canonical · NOT Vector ingest                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Platform rules (mandatory)

1. **Never** treat Genspark **aidrive** as corpus canonical or Vector ingest source.
2. **Never** add Genspark / `GSK_API_KEY` / `gsk` CLI unless user explicitly opens a new ADR.
3. **Do** keep Phase 0.5 Drive mirror and Phase 4.5 Vector connector as the **only** durable ingest path for the techdev-cursor consumer.
4. **Do not** edit techdev-cursor from this workspace — notify the user with open questions.
5. aidrive → KB bridge (export → mirror → Vector) is **out of scope** unless both repos agree via ADR.
6. **Do not** create or maintain a duplicate boundary MD in term-prep-platform unless the user explicitly requests it.

---

## Related

- [01-repo-split.md](./01-repo-split.md)
- [03-glossary-consumer-contract.md](./03-glossary-consumer-contract.md)
- Full idea: `docs/ideas/GENSPARK_CONNECTOR_IDEA.md` §3–4
