# term-prep-platform integration — read-first index

**Audience:** Agents and maintainers working in **term-prep-platform**  
**Canonical location:** techdev-cursor only — **do not** mirror this tree into term-prep-platform unless the user explicitly requests it  
**Status:** Active (2026-06-25) — boundary memo, not an ADR

---

## Purpose

techdev-cursor is the **consumer** fork. term-prep-platform is the **platform** for glossary extraction, storage mirrors, and RAG Vector ingest.  
This directory is the **single entry** for platform-side agents to understand scope, boundaries, and what **not** to implement (Genspark / aidrive).

**Cross-repo policy**

| Repo | Agent may edit? | Agent must read? |
|------|-----------------|------------------|
| term-prep-platform | **Yes** (platform workspace) | Platform `meta/consumer-handoff/` + this index (from platform) |
| techdev-cursor | **Yes** (consumer workspace) | This index + task-specific docs below |

**Bidirectional packs**

| Direction | Canonical pack | Cursor skill (techdev-cursor) |
|-----------|----------------|------------------------------|
| Consumer → platform (boundary) | `meta/platform-integration/` | `platform-handoff` |
| Platform → consumer (status) | `term-prep-platform/meta/consumer-handoff/` | `consumer-integration` · `consumer-handoff` |

Shim: [meta/TERM_PREP_PLATFORM_STATUS.md](../TERM_PREP_PLATFORM_STATUS.md)

---

## Resolve techdev-cursor path

Use the first path that exists on your machine:

| Priority | Path | When |
|----------|------|------|
| 1 | `$TECHDEV_CURSOR_ROOT` | Env override (recommended in CI) |
| 2 | `../techdev-cursor` | Default sibling layout next to term-prep-platform |
| 3 | GitHub raw / clone | `https://github.com/wombat2006/techdev-cursor` |

All paths in this index are **relative to techdev-cursor repo root**.

---

## Mandatory read order (platform work)

Read **in order** before coding anything that touches ingest, connectors, glossary, RAG Vector, or techdev-cursor integration.

| Step | File | Covers |
|------|------|--------|
| **0** | This file | Index, paths, policy |
| **1** | [01-repo-split.md](./01-repo-split.md) | Who implements what — full ownership table |
| **2** | [02-genspark-aidrive-boundary.md](./02-genspark-aidrive-boundary.md) | Genspark / aidrive vs Google Drive / Vector Store |
| **3** | [03-glossary-consumer-contract.md](./03-glossary-consumer-contract.md) | Glossary CLI, MCP, connector delegation phases |

**User prompt:** After reading 0–3, apply the task block from [PROMPT_START.md](./PROMPT_START.md) (user pastes into your chat).

---

## Optional deep reference (techdev-cursor)

| Topic | Path |
|-------|------|
| Genspark idea (Hybrid A, D1–D7, MCP shape) | `docs/ideas/GENSPARK_CONNECTOR_IDEA.md` |
| Genspark §3 only (if 02 is not enough) | same file, §3.2–3.3 |
| Consumer glossary pipeline (full) | `meta/TO-BE-GLOSSARY-PIPELINE.md` |
| RAG setup (legacy consumer AS-IS) | `docs/RAG_SETUP_GUIDE.md` |
| README ownership table (human summary) | `README_en.md` § Implementation ownership |
| TS-18 Add-on coupling | `docs/decisions/TECH_STACK_CORE_VS_ADDON_COUPLING.md` |

---

## Task-specific shortcuts

| Your task | Minimum read set |
|-----------|------------------|
| Glossary extract / adopt-hold only | 01 (glossary rows) + 03 |
| Google Drive mirror (Phase 0.5) | 01 + 02 + 03 § Connector delegation |
| Vector Store ingest (Phase 4.5) | 01 + 02 + 03 |
| Avoid Genspark scope leak | 02 (full) |
| New storage connector (S3, OneDrive) | 01 + 03 — **do not** add aidrive |

---

## When to stop and notify the user

1. Work requires editing **techdev-cursor** (`meta/glossary-config.json`, consumer npm scripts, Wall-Bounce, Genspark Add-on).
2. Boundary is ambiguous — propose ADR before bridging aidrive → platform mirror → Vector.
3. User asked to add Genspark / `gsk` / `GSK_API_KEY` to term-prep-platform (forbidden without new ADR).

---

## Consumer-side sync (for techdev-cursor maintainers)

When boundary changes, update **techdev-cursor in one commit:**

- [ ] `meta/platform-integration/*` (this tree)
- [ ] `meta/TERM_PREP_PLATFORM_HANDOFF_GENSPARK.md` (shim → this README)
- [ ] `docs/ideas/GENSPARK_CONNECTOR_IDEA.md` §3 if Genspark detail changed
- [ ] `meta/TO-BE-GLOSSARY-PIPELINE.md` § Genspark boundary
- [ ] `README.md` / `README_en.md` § Implementation ownership
- [ ] `docs/DOCUMENTATION_INDEX.md` Integration section
