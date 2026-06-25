# Handoff: Genspark / AI Drive scope vs term-prep-platform

**From:** techdev-cursor (consumer)  
**To:** [term-prep-platform](https://github.com/wombat2006/term-prep-platform) maintainers / agents  
**Status:** Active boundary memo (2026-06-25) — not an ADR

---

## Start here (platform agents)

**Canonical integration pack:** [meta/platform-integration/README.md](./platform-integration/README.md)

| Step | File |
|------|------|
| Index + read order | [platform-integration/README.md](./platform-integration/README.md) |
| Repo ownership | [01-repo-split.md](./platform-integration/01-repo-split.md) |
| Genspark / aidrive vs Vector | [02-genspark-aidrive-boundary.md](./platform-integration/02-genspark-aidrive-boundary.md) |
| Glossary + connector contract | [03-glossary-consumer-contract.md](./platform-integration/03-glossary-consumer-contract.md) |
| **User paste prompt** | [PROMPT_START.md](./platform-integration/PROMPT_START.md) |

Platform agents **read** techdev-cursor (sibling `../techdev-cursor` or `$TECHDEV_CURSOR_ROOT`). **Do not** mirror this tree into term-prep-platform unless the user explicitly requests it.

**Cross-repo policy:** Consumer agents edit techdev-cursor only. Platform agents edit term-prep-platform only. Cross-repo changes → **notify the user**.

---

## Why this exists

techdev-cursor plans a **Genspark Add-on (TS-30)** with **mandatory AI Drive (`aidrive`)**.  
term-prep-platform owns **corpus mirror + OpenAI Vector Store ingest**.  
Names overlap (“Drive”) — the integration pack prevents **duplicate ingest**, **wrong canonical paths**, and **scope leaks**.

Deep Genspark idea (D1–D7, MCP): [GENSPARK_CONNECTOR_IDEA.md](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) · Consumer glossary: [TO-BE-GLOSSARY-PIPELINE.md](./TO-BE-GLOSSARY-PIPELINE.md)

---

## Sync checklist (when consumer boundary changes)

Update **techdev-cursor only** (same commit):

- [ ] `meta/platform-integration/*`
- [ ] This shim (`meta/TERM_PREP_PLATFORM_HANDOFF_GENSPARK.md`)
- [ ] [GENSPARK_CONNECTOR_IDEA.md](../docs/ideas/GENSPARK_CONNECTOR_IDEA.md) §3 if Genspark detail changed
- [ ] [TO-BE-GLOSSARY-PIPELINE.md](./TO-BE-GLOSSARY-PIPELINE.md) § Genspark boundary
- [ ] [README.md](../README.md) / [README_en.md](../README_en.md) § Implementation ownership
- [ ] [DOCUMENTATION_INDEX.md](../docs/DOCUMENTATION_INDEX.md) Integration section
- [ ] Notify user if platform implementation is required
