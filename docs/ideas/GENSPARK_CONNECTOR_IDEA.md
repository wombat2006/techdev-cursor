# Idea: Genspark Add-on Connector (Hybrid A — `gsk` + Self-Implemented HTTP)

**Status:** **Idea only** — evaluate placement, security, and integration shape; not Accepted, not Implemented, no code obligation  
**Workspace ID (reserved):** TS-30 (if promoted to ADR)  
**Date:** 2026-06-23  
**Audience:** Maintainers considering a Genspark grounding / MCP tool extension for `techdev-cursor`

> **Just an idea.** This document captures a possible **Add-on connector** for [Genspark](https://www.genspark.ai/) (search, media, AI Drive, 90+ tools). It does **not** change AS-IS behavior, backlog priority, or implementation plans. **TS-28 P0**, **Track B**, and **SRP Phase 3** remain the active work ahead of any Genspark code.
>
> **Chosen direction (discussion, not ADR):** **Hybrid A** — primary transport via official `@genspark/cli` (`gsk` spawn, like `agy` / `codex`); **self-implemented TypeScript HTTP** only for integration gaps **D1–D7**; [nishlumi/genspark-api-client](https://github.com/nishlumi/genspark-api-client) is **reference only** (no runtime dependency, no fork).

Related: [TECH_STACK_CORE_VS_ADDON_COUPLING.md](../decisions/TECH_STACK_CORE_VS_ADDON_COUPLING.md) (TS-18) · [SECURITY.md](../SECURITY.md) · [PROVIDER_INTEGRATION_BACKLOG.md](../PROVIDER_INTEGRATION_BACKLOG.md) · [TECH_STACK_WORKSPACE.md](../TECH_STACK_WORKSPACE.md) · [FORK_STATUS.md](../FORK_STATUS.md)

---

## 0. Pre-doc review — logic, gates, TS, ADR, workspace, constitution

This section records the **impact assessment performed before** writing this idea doc. It is the basis for **not** changing constitution, ADR, or `src/` in this step.

### 0.1 Logic validity (Hybrid A + D1–D7)

| Check | Verdict | Notes |
|-------|---------|-------|
| Same backend for `gsk` and HTTP | **Valid** | Both target `https://www.genspark.ai/api/tool_cli/*`; nishlumi CHANGELOG 0.5.0 aligns with CLI **1.0.23** |
| “API fills missing Genspark capabilities” | **Misleading if stated that way** | **gsk covers more tools** than nishlumi; API is for **Node/MCP integration shape**, not capability gaps |
| Hybrid split | **Valid** | Stable, named operations → `gsk` spawn; dynamic/stream/in-memory patterns → thin HTTP layer |
| Add-on vs WB peer | **Valid** | Genspark is tooling/grounding, not multi-LLM consensus; must **not** join `analyze_*` or `ProviderAdapter` without a separate ADR |
| Reference-only nishlumi | **Valid** | ESM-only single file; npm unpublished; copying avoids CJS/ESM friction and license/maintenance coupling |
| D7 placement | **Valid** | Field unwrapping (`organic_results`, etc.) belongs in **connector layer**; not a separate HTTP transport requirement |

**Residual risks (accept for idea stage):**

- `gsk task` stderr progress vs structured NDJSON — **medium** confidence; smoke on real `GSK_API_KEY` before implementation.
- Full 90+ tool name ↔ subcommand map — use `gsk list-tools --output json` at implementation time; **D1 `executeTool`** avoids maintaining full map for MCP generic dispatch.

### 0.2 Gate impact (`FORK_STATUS`)

| Gate / track | Genspark idea doc now? | Genspark `src/` later? |
|--------------|------------------------|-------------------------|
| **Gate A→B** | No change | Already passed |
| **Track B** (M1, B-1, B-6) | **No competition** — idea is non-binding | **Blocked until** B minimum + TS-28 P0 |
| **Gate B→C** | No milestone row | Do not add FORK_STATUS row until promoted/implemented |
| **Track C** (constitution rounds in code) | Unrelated | Genspark does not substitute WB rounds |
| **Track D / P5+** (grounding) | **Conceptual fit** as optional `GroundingProvider` plug-in | After TS-18 Phase 0 contracts (Hard gate, `GroundingBundle`) |

**Gate order for implementation (if ever promoted):**

```text
TS-28 P0 (NAME-VN) → Track B M1/B-1 minimum → SRP #6–#8 (optional but recommended)
  → ADR TS-30 Proposed → spike `genspark-cli.ts` + HTTP transport → separate MCP server
```

### 0.3 Tech stack workspace (TS-30)

| Item | Action now | Action on promotion |
|------|------------|---------------------|
| **TS-30** row | **Reserved** in [TECH_STACK_WORKSPACE.md](../TECH_STACK_WORKSPACE.md) — Idea only | Target: Hybrid A Add-on; link to ADR |
| TS-18 | No change — idea **aligns** with loose add-on coupling | Optional: add Genspark as example in ADR sketch (P2 doc polish) |
| TS-17 | No change — Genspark HTTP is **add-on**, not LLM inter-provider transport | — |
| TS-21 / TS-23 | **Do not** add `genspark` to `ProviderId` or catalog as LLM peer | MCP tools only (`genspark_*`) |
| TS-28 | **Prerequisite** — do not register Genspark beside vendor-named routing debt | Register **neutral** MCP product name after P0 |

### 0.4 ADR impact

| Document | Now | If promoted |
|----------|-----|-------------|
| New `TECH_STACK_GENSPARK_CONNECTOR.md` | **Not created** | Copy from this idea → status **Proposed** → **Accepted** |
| [TECH_STACK_CORE_VS_ADDON_COUPLING.md](../decisions/TECH_STACK_CORE_VS_ADDON_COUPLING.md) | No edit | Optional cross-link under Grounding examples |
| [SECURITY.md](../SECURITY.md) | No edit | **Required:** peripheral API key policy for `GSK_API_KEY` (see §0.6) |
| [PROVIDER_INTEGRATION_BACKLOG.md](../PROVIDER_INTEGRATION_BACKLOG.md) | No edit | Add row under Add-ons / MCP extensions |
| [MCP_SERVICES.md](../MCP_SERVICES.md) | No edit | Document separate stdio MCP server |

### 0.5 Constitution (`AGENTS.md` § Constitution)

| Rule | Genspark impact | Change needed now? |
|------|-----------------|-------------------|
| Always Wall-Bounce | Genspark **does not** replace WB for analysis | **No** |
| 2–5 rounds | Unrelated | **No** |
| confidence / consensus thresholds | Unrelated | **No** |
| Implementation via `wall-bounce-analyzer.ts` | Genspark **must not** be wired into analyzer as LLM peer | **No** — enforce via TS-18 + code review |
| Japanese user-facing output | Applies to user-visible connector messages | **No** constitution edit |

**Constitution amendment policy (maintainer agreement, 2026-06-23):**

- Constitution is **not** immutable forever.
- Amendments require **traceability**: original definition · current definition · rationale (like “Article 1” amendment records).
- Changes require **maintainer explicit permission** after joint review; **not** changed casually or in this idea-only step.
- **This idea proposes zero constitution changes.** If Genspark were ever mistaken for a fourth WB peer, that would be a **process violation**, not a constitution amendment.

**Future doc hygiene (repo-wide, incremental):** AS-IS audit → todos → To-Be per domain; avoid big-bang MD rewrites. This file is one **bounded** idea artifact.

### 0.6 Security (`SECURITY.md`) — deferred ADR topic

AS-IS [SECURITY.md](../SECURITY.md) states: **“No API Keys in Code — All LLM access via CLI or internal SDK.”**

| Aspect | Stance for this idea |
|--------|----------------------|
| `GSK_API_KEY` in `.env` | **Required** when HTTP transport is used; `.gitignore` already lists `.env` / `.env.*` |
| Commit-time `.env` guard | **Not implemented** — promotion should include `scripts/check-env-gitignore.mjs` + pre-commit hook |
| Classification | **Peripheral add-on credential** (analogous to optional env keys for non-inference services), **not** a fourth LLM inference API key in `ProviderAdapter` |
| HTTP to Genspark | Allowed **only** behind Add-on connector + ADR exception text in SECURITY — **not** in this commit |

### 0.7 Pre-doc conclusion

| Area | This step |
|------|-----------|
| Logic (Hybrid A, D1–D7) | **Sound** for idea documentation |
| Gates | **No FORK_STATUS update**; implementation after Track B / TS-28 P0 |
| TS-30 | **Reserve** workspace row only |
| ADR | **Idea only** — no `docs/decisions/TECH_STACK_GENSPARK*.md` yet |
| Constitution | **No change**; no maintainer permission requested |
| SECURITY | **Note for promotion** — peripheral key policy |

---

## 1. Evaluation (idea — not a decision)

| Criterion | What “good enough” means | Promote? |
|-----------|--------------------------|----------|
| **Need** | Grounding/search/media tooling via one MCP or `GroundingProvider` adds value **after** core Track B | Need validated post B-1 |
| **Security** | `GSK_API_KEY` only in `.env`; hook verifies `.gitignore`; no keys in repo | Policy drafted in ADR |
| **Boundary** | Stays TS-18 Add-on; never default WB peer | Design review pass |
| **Cost** | Hybrid A smaller than full HTTP reimplementation | D1–D3 scope only initially |
| **Timing** | Does not compete with TS-28 P0 / Track B | Gates in §0.2 pass first |

**If “not needed”:** close idea — status **Closed (not pursued)**; remove index links.

**If promoted:** copy to `docs/decisions/TECH_STACK_GENSPARK_CONNECTOR.md`, **Proposed → Accepted**; then optional README row under 次に読むもの / Where to go next (**検討中・未採用**).

---

## 2. Architecture placement (TS-18 Add-on)

```text
┌─────────────────────────────────────────────┐
│ Core (unchanged)                             │
│ Wall-Bounce · analyze_* · ProviderAdapter    │
│ claude | codex | agy only                    │
└──────────────────┬──────────────────────────┘
                   │ explicit contract (optional)
                   ▼
┌─────────────────────────────────────────────┐
│ Genspark Add-on (this idea)                  │
│ genspark-cli.ts (spawn)                      │
│ connectors/genspark/http-transport.ts (D1–D6)│
│ services/genspark-mcp-server.ts (stdio MCP)  │
└─────────────────────────────────────────────┘
```

**Forbidden without separate ADR:**

- Extending `ProviderId` with `genspark`
- Adding `analyze_genspark` to unified `techsapo-providers` MCP
- Invoking Genspark inside `wall-bounce-analyzer.ts` as a consensus round peer

**Allowed target:**

- Separate MCP server (`genspark_search`, `genspark_execute_tool`, …)
- Future `GroundingProvider` implementation (Track D / P5+)

---

## 3. Hybrid A — transport split

Both layers call the same Genspark Tool API (`/api/tool_cli/*`). Official CLI: [`@genspark/cli`](https://www.npmjs.com/package/@genspark/cli) (`gsk`).

```text
GensparkConnector (facade)
├── GskCliTransport          # child_process spawn — default path
│     └── Named wrappers: search, crawl, summarize, analyze, transcribe,
│         drive *, img/video/audio -o, social, upload/download (path-based), …
└── GensparkHttpTransport    # self-implemented TS (reference nishlumi logic)
      ├── executeTool(name, args)           # D1
      ├── executeTaskStream(...)            # D2
      ├── generateMediaStream(...)          # D3
      ├── uploadFile(buffer | blob)         # D4
      ├── driveGetFile(typed)               # D5
      └── downloadFileAsResponse()          # D6
```

| Layer | Auth | Pattern reference in repo |
|-------|------|---------------------------|
| `gsk` | `GSK_API_KEY` env or `~/.genspark-tool-cli/config.json` | [antigravity-cli.ts](../../src/utils/antigravity-cli.ts), [agy-adapter.ts](../../src/adapters/agy-adapter.ts) |
| HTTP | `GSK_API_KEY` from `.env` only at runtime | [huggingface-client](../../src/services/huggingface-client/) (peripheral HTTP, not WB peer) |

---

## 4. D1–D7 — `gsk` vs API responsibility boundary

**Summary:** D1–D3 are **recommended** HTTP paths for MCP/generic integration. D4–D6 are **conditional**. D7 is **connector-only** (no extra HTTP).

### 4.1 Boundary table (primary)

| ID | Integration gap | `gsk` responsibility | API responsibility | API needed when |
|----|-----------------|----------------------|--------------------|-----------------|
| **D1** | Dynamic `executeTool(toolName, args)` | Map each tool to a subcommand (90+ entries) | Single `POST /api/tool_cli/{toolName}` wrapper | MCP generic tool dispatch; avoid maintaining full CLI map |
| **D2** | Task mid-stream events | `gsk task` — stdout = final JSON; stderr = human progress | `executeTaskStream` → `/agent_ask` NDJSON `yield` | Structured mid-stream events consumed in Node |
| **D3** | Media as in-memory Base64 chunks | `gsk img/video/audio -o <file>` | `generateMediaStream` — chunk generator in memory | No temp files; stream chunks to MCP client |
| **D4** | Upload from Buffer/Blob | Temp file + `gsk upload` | `uploadFile` — `/file/upload_url` + PUT | Diskless upload policy |
| **D5** | AI Drive read as buffer/blob/stream | `get_readable_url` + `gsk download -s` | Typed `driveGetFile` returns | Caller requires in-memory types without shell |
| **D6** | Download as `fetch Response` | Save to local path | `downloadFile` pipes `Response.body` | HTTP proxy or stream piping without disk |
| **D7** | Convenience field unwrapping | Parse `gsk --output json` stdout in connector | **Same** — mapping in connector facade | **Not** a separate HTTP transport; shared post-processing |

### 4.2 Priority tiers

| Tier | IDs | Implementation order (if promoted) |
|------|-----|-----------------------------------|
| **P0 (MCP minimum)** | D1 | Enables `genspark_execute_tool` |
| **P1 (streaming)** | D2, D3 | Only if product needs agent progress or memory media |
| **P2 (diskless)** | D4, D5, D6 | Only if security/policy forbids temp files |
| **Always** | D7 | Connector facade — no extra endpoint |

### 4.3 nishlumi reference map (what to read, not copy)

| nishlumi construct | Use in self-impl |
|--------------------|------------------|
| `_request` | Headers: `X-Api-Key`, `X-Project-ID`, timeout |
| `_executeToolRaw` | NDJSON line parse (0.5.0 text batching) |
| `executeTaskStream` | `/agent_ask` reader loop |
| `uploadFile` | Presigned URL + Azure PUT |
| `generateMediaStream` | URL extract + Base64 chunk generator |
| Named helpers (`webSearch`, …) | **D7** field maps only |

---

## 5. `gsk`-only scope (no HTTP reimplementation)

These Genspark capabilities are **wider than nishlumi** and should use **`gsk` spawn only**:

| Category | Examples | Notes |
|----------|----------|-------|
| Search & crawl | `search`, `img-search`, `crawl`, `summarize` | Stable subcommands |
| Media analysis | `analyze`, `media-analyze`, `transcribe` | Local path auto-upload via `-i` |
| AI Drive | `drive ls/mkdir/upload/download/...` | Full `aidrive` surface |
| Media generation | `img`, `video`, `audio` with `-o` | File output acceptable |
| Integrations | `gmail`, `slack`, `notion`, `github`, `google_drive`, … | 90+ tools |
| Social | `social twitter`, `instagram`, `reddit` | |
| Agents | `task sheets`, `website`, `meeting_notes`, `super_agent`, … | Final JSON via CLI unless D2 applies |
| Ops | `login`, `list-tools`, `init-skills`, `phone-call`, `mesh` | |

**Tool parity note:** Every tool name used by nishlumi maps to a `gsk` subcommand at CLI **1.0.23**. Capability gap is **not** the reason for HTTP — integration shape is.

---

## 6. nishlumi tool → `gsk` mapping (reference)

| nishlumi / API tool | `gsk` command | Transport |
|---------------------|---------------|-----------|
| `web_search` | `gsk search` | gsk |
| `image_search` | `gsk img-search` | gsk |
| `crawler` | `gsk crawl` | gsk |
| `summarize_large_document` | `gsk summarize` | gsk |
| `understand_images` | `gsk analyze -i …` | gsk |
| `analyze_media` | `gsk media-analyze` | gsk |
| `audio_transcribe` | `gsk transcribe` | gsk |
| `social_twitter` | `gsk social twitter …` | gsk |
| `aidrive` * | `gsk drive …` | gsk (D5/D6 if in-memory) |
| `image_generation` / `video_generation` / `audio_generation` | `gsk img/video/audio -o …` | gsk (D3 if in-memory) |
| arbitrary tool name | per-tool subcommand | **API (D1)** |
| `/agent_ask` stream | `gsk task` | **API (D2)** if structured stream |

---

## 7. Security and credentials

| Rule | Detail |
|------|--------|
| `GSK_API_KEY` | **Only** in `.env` (and `.env.example` placeholder); never committed |
| `.gitignore` | AS-IS includes `.env`, `.env.*` — verify on every commit via future hook |
| Spawn safety | Sanitize args like [antigravity-cli.ts](../../src/utils/antigravity-cli.ts); no shell string concat |
| Audit | Log MCP tool name + duration; **not** API key values |
| Degraded mode | Missing key → connector fails closed; **must not** block Wall-Bounce core (TS-18) |

---

## 8. Proposed code layout (not implemented)

```text
src/utils/genspark-cli.ts              # spawn helpers, --output json parsing
src/connectors/genspark/
  ├── types.ts
  ├── gsk-transport.ts                 # CLI path
  ├── http-transport.ts                # D1–D6
  └── connector.ts                     # facade + D7 unwrapping
src/services/genspark-mcp-server.ts    # separate stdio MCP (not techsapo-providers)
scripts/genspark-diff-smoke.mjs        # gsk JSON vs HTTP parity (future)
scripts/check-env-gitignore.mjs        # pre-commit .env guard (future)
```

---

## 9. Prerequisites and verification

### 9.1 Implementation gates

| # | Prerequisite | Rationale |
|---|--------------|-----------|
| G1 | **TS-28 P0** complete | Neutral MCP naming before new servers |
| G2 | **Track B** M1 + B-1 minimum | Core adapter/memory path stable |
| G3 | **ADR TS-30** at least **Proposed** | SECURITY peripheral key policy written |
| G4 | `.env` pre-commit hook | Maintainer policy from Hybrid A discussion |

### 9.2 Smoke verification (before coding transport)

```bash
# Canonical tool list
gsk list-tools --output json > /tmp/gsk-tools.json

# Same key for both paths
export GSK_API_KEY=...   # from .env locally only

# Per-tool: compare gsk JSON stdout vs HTTP _executeToolRaw status/fields
# (future scripts/genspark-diff-smoke.mjs)
```

| Evidence source | Confidence |
|-----------------|------------|
| nishlumi `genspark_api.js` + CHANGELOG 0.5.0 | High |
| `@genspark/cli` README 1.0.23 | High |
| `gsk task` stderr parseability | Medium — real-machine smoke |
| 90+ tool 1:1 CLI map | Medium — `list-tools` at impl time |

---

## 10. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Genspark mistaken as WB peer | TS-18 + code review; no `ProviderId` change without ADR |
| SECURITY policy clash on API key | ADR + SECURITY § peripheral keys before HTTP merge |
| Temp-file proliferation via gsk | Prefer HTTP D3–D6 only when policy demands |
| nishlumi drift vs Genspark API | Reference only; own tests + smoke script |
| Scope creep (reimplement 90 tools in HTTP) | **D1** generic call; everything else gsk |
| Competes with Track B | Status **Idea**; no FORK_STATUS milestone |

---

## 11. Promotion checklist (Idea → ADR)

- [ ] Maintainer agrees need (post Track B smoke)
- [ ] Copy to `docs/decisions/TECH_STACK_GENSPARK_CONNECTOR.md` — **Proposed**
- [ ] Update [SECURITY.md](../SECURITY.md) — peripheral `GSK_API_KEY` policy
- [ ] Update [TECH_STACK_WORKSPACE.md](../TECH_STACK_WORKSPACE.md) — TS-30 Target column
- [ ] Add [PROVIDER_INTEGRATION_BACKLOG.md](../PROVIDER_INTEGRATION_BACKLOG.md) row
- [ ] Optional [MCP_SERVICES.md](../MCP_SERVICES.md) + [ARCHITECTURE.md](../ARCHITECTURE.md) Add-on diagram
- [ ] Implement hook `check-env-gitignore` + `genspark-diff-smoke`
- [ ] **Accepted** → optional README 次に読むもの row; FORK_STATUS only when shipped

**Constitution:** If any proposal touches WB obligations, draft amendment block (original / current / why) and obtain **maintainer permission** before editing [AGENTS.md](../../AGENTS.md).

---

## 12. Summary

| Topic | Decision (idea stage) |
|-------|------------------------|
| Approach | **Hybrid A** — `gsk` default + HTTP for D1–D7 gaps |
| nishlumi | Reference only — no vendor fork |
| D1–D7 | See §4 boundary table |
| WB / constitution | **No change**; Genspark is Add-on only |
| TS-30 | Reserved; idea doc only |
| Implementation | **After** TS-28 P0 + Track B gates |
| Repo evolution | Incremental AS-IS → todos → To-Be; this doc is one safe step |
