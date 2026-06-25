# Implementation ownership — techdev-cursor vs term-prep-platform

**Read as:** Step 1 of [platform-integration index](./README.md)  
**Canonical consumer:** techdev-cursor — platform agents read; do not duplicate into term-prep-platform

---

## Summary

| Layer | Owner | Notes |
|-------|-------|-------|
| Wall-Bounce · multi-LLM analysis | **techdev-cursor** | Constitution: 2–5 rounds via `wall-bounce-analyzer.ts` only |
| Layer A orchestration memory | **techdev-cursor** | ADR done; Redis pending |
| Glossary **consumer** config | **techdev-cursor** | `meta/glossary-config.json`, adopt/hold JSON |
| Glossary **extractor** · registry | **term-prep-platform** | Consumer invokes via `npm run glossary:extract` |
| glossary-knowledge MCP | **term-prep-platform** | Consumer registers in `.cursor/mcp.json` only |
| Google Drive corpus mirror | **term-prep-platform** (Phase 0.5) | AS-IS legacy: consumer `googledrive-connector.ts` until delegation |
| OpenAI Vector Store ingest | **term-prep-platform** (Phase 4.5) | AS-IS partial legacy in consumer; unification target |
| S3 / OneDrive mirror | **term-prep-platform** | Consumer must **not** add new storage connectors |
| Genspark AI Drive (`aidrive`) | **techdev-cursor** (TS-30 idea) | **Mandatory** for Genspark tools when built; **not** platform |
| Genspark search / crawl / media | **techdev-cursor** | Grounding add-on; not Vector ingest |
| PromptAnalyzer · dictionary v0 | **term-prep-platform** | Consumer MCP connect only |

---

## Full ownership table

| Capability | techdev-cursor | term-prep-platform | Status |
|------------|----------------|-------------------|--------|
| **Wall-Bounce · `analyze_*` MCP** | ✅ Implement | — | Track B in progress |
| **Layer A orchestration memory** | ✅ Planned (M1) | — | ADR done; Redis pending |
| **Glossary consumer config** (`meta/glossary-*`) | ✅ Edit here | Schema mirror only | Phase 0 ✅ |
| **`glossary_extractor` · registry** | Invoke via npm | ✅ Own | Phase 0 ✅ |
| **`glossary-knowledge` MCP** | `.cursor/mcp.json` register | ✅ Own | stub |
| **Google Drive corpus mirror** | Legacy `googledrive-connector.ts` | ✅ **Delegation target** (Phase 0.5) | Planned |
| **OpenAI Vector Store ingest** | AS-IS legacy | ✅ **Unification target** (Phase 4.5) | Planned |
| **S3 / OneDrive mirror** | ❌ Do not add | ✅ Planned | Proposed |
| **Genspark AI Drive (`aidrive`)** | ✅ **Required** (TS-30 idea) | ❌ Do not implement | Not built |
| **Genspark search / crawl / media** | ✅ Add-on MCP | ❌ Do not implement | Not built |
| **PromptAnalyzer · dictionary v0** | MCP connect only | ✅ Implement | Gate C |

---

## Retrieval split (one line)

**Internal semantic search** → OpenAI Vector Store (ingest via **platform** path).  
**Genspark tool files** → **aidrive** (never Vector canonical source).

Details: [02-genspark-aidrive-boundary.md](./02-genspark-aidrive-boundary.md)

---

## Platform must not

1. Add Genspark, `GSK_API_KEY`, or `gsk` CLI unless user opens a **new ADR**.
2. Treat aidrive paths as `corpus.files` or Vector ingest sources.
3. Edit techdev-cursor from the platform workspace — **notify the user** instead.
4. Create a second Vector pipeline through Genspark tooling.

---

## Related

- [02-genspark-aidrive-boundary.md](./02-genspark-aidrive-boundary.md)
- [03-glossary-consumer-contract.md](./03-glossary-consumer-contract.md)
- Consumer README: `README_en.md` § Implementation ownership
