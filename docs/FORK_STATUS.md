# Fork Status — `techdev-cursor`

*[English](FORK_STATUS.md) | [日本語](./ja/FORK_STATUS.md)*

**Rolling snapshot for human readers** (maintainers, teammates, reviewers).  
**Last updated:** 2026/06/23 04:30:28 JST  
**Execute from:** [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) · **Policy:** [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md)

> Update this file at **Gate reviews** and **major Track milestones** (P0). Do not duplicate progress in README body.  
> **Timestamps:** `YYYY/MM/DD HH:mm:ss JST` (Asia/Tokyo). Milestone times follow sign-off / merge commit when recorded — **never invent or round forward**. Source: `node scripts/fork-status-timestamp.mjs <commit>`.

---

## Snapshot

| Field | Value |
|-------|-------|
| **Repo** | `wombat2006/techdev-cursor` (DevAssist fork) |
| **Current focus** | **Track B** — Layer A memory (M1) · InferenceProfile file (B-0) · adapter wiring (B-1) |
| **Last Gate** | **Gate A→B Pass** — 2026/06/18 17:22:09 JST · G1–G7 + G-MEM |
| **Next Gate** | Gate B→C (after Track B complete) |
| **North star** | Daily Cursor coding via **one MCP** (`analyze_*`); hard multi-LLM via **Wall-Bounce API** + same adapters + Layer A |

---

## Gate progress

| Gate | Status | Timestamp (JST) | Notes |
|------|--------|-----------------|-------|
| **G-MEM** (TS-22 design) | ✅ Closed | 2026/06/18 16:49:20 | ADR v1.3 accepted; M1 Redis store = Track B |
| **Gate A→B** | ✅ **Pass** | 2026/06/18 17:22:09 | G1–G7 + G-MEM all Yes |
| **Gate B→C** | `[ ]` Open | — | After B-0…B-3 + memory M1–M3 minimum |
| **Gate C** (P5 Phase 0) | `[ ]` Open | — | After Gate B→C Pass |

Gate order **A → B → C** is fixed — see [CURSOR_MCP_TODO § Track priority](./CURSOR_MCP_TODO.md#track-priority-devassist--2026-06-review).

---

## Track status

| Track | Priority | Status | Summary |
|-------|----------|--------|---------|
| **A** — Cursor MCP | P0 | `[~]` Remaining only | A-0/A-1/G7 ✅; **A-2** MCP schemas · **A-3** team registration open — **do not block B** |
| **B** — InferenceProfile + adapters + memory | P1 | `[ ]` **Active** | B-0 partial (matrix+catalog resolver ✅); M1 store pending; B-1 WB wiring pending |
| **C** — P5 Phase 0 platform | P3 | `[ ]` Blocked | Hard gate · PromptAnalyzer · constitution rounds · orchestrator merge |
| **E / F** — catalog / cost routing | P2 | `[~]` Partial | F-1 ✅ · F-2 loader partial · F-3+ pending |
| **D / P5+** — cache · Batch RAG · grounding | P4 | `[~]` Partial | Glossary consumer **Phase 0** ✅ (RAG prep); platform storage/Vector connectors · Batch RAG · grounding pending |

---

## Immediate goals (Track B)

| # | Goal | Deliverable | Status |
|---|------|-------------|--------|
| **M1** | Durable orchestration transcript (Layer A) | `OrchestrationSessionStore` + Redis `orch:session:*` | `[ ]` Types/schema/config ✅; Redis pending |
| **B-0** | Request-level model / effort / CoT presets | `inference-profiles.json` + TS-20 + TS-24 `retryOnNegative` | `[~]` Matrix+catalog resolver ✅; preset JSON file pending |
| **B-4** | Execution mode routing (TS-25) | Parallel-first → threshold branch; keyword/MCP overrides | `[ ]` |
| **B-5** | SSE + Layer A observability | Extended SSE events; round stream | `[ ]` |
| **B-6** | CLI invoke metadata (TS-26) | `usage` / `stop_reason` / `session_id` at adapter boundary | `[~]` ADR + wire/normalized schemas ✅; adapter parse pending |
| **B-1** | One transport for Cursor + Wall-Bounce | `wall-bounce-analyzer.ts` + `rag-endpoint.ts` → `src/adapters/*` | `[ ]` |
| **M2–M6** | Session continuity + legacy migration | `sessionId` · round events in Layer A · TS-22 codex-session fold | `[ ]` |

**Suggested order:** M1 → B-0 → B-1 (see [Codex review crosswalk](./CURSOR_MCP_TODO.md#codex-review-crosswalk-2026-06-18)).

---

## Completed (fork)

| Area | Timestamp (JST) | Notes |
|------|-----------------|-------|
| Fork Day 0 | 2026/06/18 08:14:02 | `forkProfile.yaml`, `config/fork/*`, adapter layout |
| **A-0** WSL CLI auth | 2026/06/18 14:39:15 | `claude` / `codex` / `agy` probes pass |
| **A-1** Unified MCP + adapters | 2026/06/18 14:50:36 | `techsapo-providers-mcp-server.ts`, `src/adapters/*`, resolver tests |
| **A-1 ops** + **G7** | 2026/06/18 17:22:09 | Cursor Connected; Cursor Agent `analyze_*` ×3 OK |
| Portable MCP config | 2026/06/18 17:15:53 | `npm run cursor-mcp:config` (Linux / WSL Remote / Windows+WSL) |
| Codex adapter (MCP cwd) | 2026/06/18 17:22:09 | `--skip-git-repo-check` for non-repo cwd |
| **TS-21** model catalog | 2026/06/18 09:37:54 | `config/llm-model-catalog.json` + schema; runtime loader = Track F |
| **TS-22** memory substrate | 2026/06/18 16:49:20 | ADR v1.3, session schema/types, `orchestration-memory.json`; G-MEM closed |
| README AS-IS/To-Be flow | 2026/06/18 17:36:22 | Processing flow clarified → [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) |
| Codex review crosswalk | 2026/06/19 10:54:25 | Runbook mapping only ([techsapo PR #3](https://github.com/wombat2006/techsapo/pull/3)) |
| **DOCUMENTATION_POLICY** v0.1 | 2026/06/19 11:13:24 | Thin README plan; P0/P1/P2 sync tiers |
| **Doc migration** (POLICY §10) | 2026/06/19 11:31:42 | README slim 55L · legacy phase 1 · INDEX trim · FORK_ONBOARDING |
| **Human docs ja pairs** (B2b) | 2026/06/19 11:47:05 | `docs/ja/` FORK_STATUS · ONBOARDING · CURSOR · runbook summary |
| **Contract Layer** | 2026/06/19 13:22:54 | F-1 validate:config · catalog loader · adapter-preset-matrix · contract tests · simulate guard |
| **TS-23** user-extensible LLM | 2026/06/19 13:30:04 | ADR L1–L2 config extensions — [TECH_STACK_USER_EXTENSIBLE_LLM.md](./decisions/TECH_STACK_USER_EXTENSIBLE_LLM.md) |
| **TS-24** session continuation + retry | 2026/06/19 13:46:26 | Layer A follow-up + upward jitter negative retry — [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./decisions/TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) |
| **Glossary-knowledge MCP** (initial) | 2026/06/21 18:26:39 | `.cursor/mcp.json` — `glossary-knowledge` registration (absolute paths) |
| **Glossary consumer Phase 0** (config) | 2026/06/21 18:59:51 | `meta/glossary-config.json`, adopt/hold split, legacy candidates gitignored — [TO-BE-GLOSSARY-PIPELINE.md](../meta/TO-BE-GLOSSARY-PIPELINE.md) |
| **Glossary Phase 0 docs sync** | 2026/06/21 19:12:00 | README, MCP_SERVICES, RAG_SETUP_GUIDE, mcp-rules, TO-BE verification sections |
| **Glossary-knowledge MCP** (tracked) | 2026/06/21 19:20:43 | `.cursor/mcp.json` sibling `../term-prep-platform` relative paths |
| **Glossary first extract** | 2026/06/21 19:28:52 | Interim in-repo corpus (11 md); adopt/hold populated via `npm run glossary:extract` |
| **Glossary consumer boundary** | 2026/06/21 19:48:06 | Consumer-only edits; platform read-only invoke; escalation policy |
| **Glossary portable output paths** | 2026/06/21 19:59:15 | `normalize-glossary-output.py`; repo-relative `corpus_files` in adopt/hold |
| **ByteRover CLI** (Cipher migration) | 2026/06/22 18:57:50 JST | `byterover-cli`; `brv` MCP; `setup-brv-provider` |
| **Portable MCP wrappers** (tracked) | 2026/06/22 19:17:51 JST | `.cursor/mcp.json` + `scripts/cursor-mcp-*.sh`; no regen/reload after routine pull |
| **Wall-Bounce AS-IS / To-Be docs** | 2026/06/22 19:47:16 JST | Code audit → AS-IS/To-BE/BACKLOG + TS-25; README Goal·AS-IS·roadmap |
| **TS-26 CLI metadata + README arch** | 2026/06/22 22:05:40 JST | TS-26 ADR; B-6 runbook/backlog; README code-accurate mermaid (index.ts · legacy spawn · SRP branch) |
| **TS-26 wire schemas + Codex verify** | 2026/06/22 22:41:19 JST | Per-provider JSON Schema; normalized `ProviderInvokeMetadata`; Codex JSONL fixture + contract test |
| **TS-27 Ollama gateway ADR** | 2026/06/22 22:50:56 JST | Proposed: local HTTP adapter for cloud (`*:cloud`) + local models; WB-19 |
| **Anthropic catalog + docs** | 2026/06/23 02:59:52 JST | Sonnet 4.6; Opus 4.6 aggregate default + 4.8 escalation; platform integration guides |
| **SRP monolith refactor (Phase 0–2 + monitors)** | 2026/06/23 04:09:50 JST | 13 monoliths → module dirs + shims; Phase 2: `mcp-config-manager/`, `ultra-conservative-monitor/`, `mcp-performance-monitor/`; 80 module tests; [SRP_MONOLITH_REFACTOR.md](./SRP_MONOLITH_REFACTOR.md) · [SRP_REFACTOR_DEPENDENCY_ORDER.md](./SRP_REFACTOR_DEPENDENCY_ORDER.md) |

---

## Not done yet (explicit)

| Item | Track | Notes |
|------|-------|-------|
| Redis `OrchestrationSessionStore` | M1 | Layer A mandatory for production sessions |
| Wall-Bounce → adapter wiring | B-1 | Legacy spawn in `wall-bounce-analyzer.ts` remains |
| RAG `/search` legacy MCP parallel | B-1 | `rag-endpoint.ts` not via unified adapters |
| Constitution enforce (2–5 rounds, Hard Gate loop) | C | AS-IS: 1-pass; rounds only in To-Be wall-bounce mode ([TS-25](./decisions/TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md)) |
| simulate / legacy MCP paths | B-1 | `mcp-clients` guarded; rag-endpoint still simulate until adapters |
| A-2 InferenceProfile in MCP schemas | A | Non-blocking |
| A-3 team MCP registration | A | Non-blocking |
| Glossary Phase 2.5 knowledge filter | RAG prep | MCP classify beyond NullProvider — **platform change** (notify user) |
| Glossary Phase 4 storage / Vector connectors | RAG prep | Legacy `googledrive-connector/` shim in this repo → **term-prep-platform** (Drive, S3, OneDrive, RAG Vector) |
| Google Drive local mirror corpus | RAG prep | Replace interim `corpus.files` in consumer config |
| `filter.max_candidates_output` cap | RAG prep | Config present; platform extractor ignores — **platform change** |
| `docs/legacy/` phase 2 | docs migration | Exploratory `mcp-*.md` cluster (optional) |
| Ollama gateway adapter | TS-27 L3 | [TS-27](./decisions/TECH_STACK_OLLAMA_GATEWAY.md) proposed — `ollama signin` + `localhost:11434` |

---

## AS-IS vs To-Be (summary)

| Area | AS-IS (today) | To-Be (planned) |
|------|---------------|-----------------|
| **Cursor daily dev** | Single MCP (`analyze_*`) via subscription CLI | Same — by design |
| **Unified MCP + adapters** | Implemented + G7 pass | A-2/A-3 remainder; continue MCP/adapter operational checks |
| **Wall-Bounce API** | Legacy spawn; 1-pass parallel/sequential; no threshold branch | B-4 TS-25 routing · B-1 adapters · Track C constitution rounds in wall-bounce mode |
| **Orchestration memory** | ADR + schema/types only (Redis pending) | M1 Redis + M2–M6 wiring; TS-24 continuation/retry |
| **InferenceProfile** | Matrix+catalog resolver (Contract Layer) | B-0 `inference-profiles.json` file |
| **Model catalog (TS-21)** | Rich JSON + schema; F-1 validate; F-2 loader partial | F-3 TaskRouter + cost routing |
| **Glossary prep (RAG)** | Phase 0 — consumer config, extract, adopt/hold; `googledrive-connector/` modular shim (legacy) | Phase 2.5 filter · platform storage + RAG Vector connectors |
| **Docs entry** | Thin README → FORK_STATUS + FORK_ONBOARDING | Same — rolling status stays in FORK_STATUS |
| **Legacy platform docs** | `docs/legacy/` quarantine (phase 1 done) | Phase 2 optional (remaining cluster cleanup) |

Details: [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Track A remainder (non-blocking)

| Task | Status |
|------|--------|
| **A-2** — InferenceProfile fields in unified MCP tool schemas | `[ ]` |
| **A-3** — At least one teammate registered from generated MCP config | `[ ]` |

---

## Later tracks (reference)

| Track | Scope |
|-------|--------|
| **C** | Hard gate · PromptAnalyzer · dictionary v0 · 2–5 round enforce · orchestrator merge |
| **E / F** | OpenAI model ID migration · catalog loader · cost-aware TaskRouter |
| **D / P5+** | Tokenizer · response cache · Batch RAG · Grounding |

---

## Related documents

| Need | Document |
|------|----------|
| **How to execute** | [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) |
| **Fork identity** | [FORK_CURSOR.md](./FORK_CURSOR.md) |
| **Doc rules** | [DOCUMENTATION_POLICY.md](./DOCUMENTATION_POLICY.md) |
| **Design depth** | [FORK_ONBOARDING.md](./FORK_ONBOARDING.md) |
| **Architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Memory ADR** | [decisions/TECH_STACK_MEMORY_SUBSTRATE.md](./decisions/TECH_STACK_MEMORY_SUBSTRATE.md) |
| **Glossary consumer** | [TO-BE-GLOSSARY-PIPELINE.md](../meta/TO-BE-GLOSSARY-PIPELINE.md) · [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md) |

---

**Changelog**

| Timestamp (JST) | Change |
|-----------------|--------|
| 2026/06/23 04:30:05 JST | SRP Phase 2 #3 — `mcp-performance-monitor/` split; README/ARCHITECTURE/MCP_SERVICES sync; 80 module tests (12 suites) |
| 2026/06/23 04:20:16 JST | SRP Phase 2 #2 — `ultra-conservative-monitor/` split; 75 module tests (11 suites) |
| 2026/06/23 04:09:50 JST | SRP monolith refactor Phase 0–2 — 11 splits (incl. mcp-config-manager), 70 module tests, SRP_* docs + README sync |
| 2026/06/23 03:00:14 JST | SRP monolith refactor Phase 0–1 — 10 splits, module tests, SRP_* docs; README + DEVELOPMENT_GUIDE sync |
| 2026/06/22 22:50:56 JST | TS-27 Ollama gateway ADR (proposed); TO-BE gap + WB-19 backlog |
| 2026/06/22 22:41:19 JST | TS-26 per-provider wire JSON Schemas + normalized metadata; Codex JSONL verified; contract test |
| 2026/06/22 22:05:40 JST | TS-26 CLI invoke metadata ADR; B-6 Track B; README code-accurate architecture diagram; doc cross-sync |
| 2026/06/22 19:47:16 | Wall-Bounce code audit — AS-IS/To-BE/BACKLOG + TS-25; README Goal/AS-IS/roadmap; Track B-4/B-5 + Gate realign |
| 2026/06/22 19:17:51 | Portable MCP — tracked `.cursor/mcp.json` + bash wrappers; drop routine `cursor-mcp:config`/Reload after pull (reverts 007e0f90 policy) |
| 2026/06/21 23:26:30 | Document connector delegation to term-prep-platform (Drive, S3, OneDrive, RAG Vector); legacy googledrive-connector AS-IS |
| 2026/06/21 21:28:26 | Replace "daily smoke" with explicit MCP/adapter operational checks (en/ja FORK_STATUS, ONBOARDING) |
| 2026/06/21 21:24:03 | Replace Track A "tail/尾" jargon with remainder/残タスク (en/ja FORK_STATUS, ONBOARDING, runbook summary) |
| 2026/06/21 21:18:49 | Fix AS-IS vs To-Be summary — legacy docs phase 1 AS-IS, Wall-Bounce/memory rows; en/ja sync |
| 2026/06/21 19:59:15 | Glossary Phase 0 — extract, consumer boundary, portable adopt/hold paths; FORK_ONBOARDING sync |
| 2026/06/19 13:46:26 | TS-24 — session continuation + upward-jitter negative retry ADR |
| 2026/06/19 13:30:04 | Contract Layer + TS-23 — FORK_STATUS / runbook Known state sync |
| 2026/06/19 11:47:05 | B2b — `docs/ja/` human doc pairs (FORK_* + runbook summary) |
| 2026/06/19 11:31:42 | Doc migration complete — README slim, legacy phase 1, INDEX trim, FORK_ONBOARDING |
| 2026/06/19 11:22:09 | Timestamps → `YYYY/MM/DD HH:mm:ss JST`; milestone times from sign-off commits |
| 2026/06/19 11:22:09 | JST date convention for Snapshot, Gate progress, Completed, Changelog |
| 2026/06/19 11:22:09 | Initial FORK_STATUS — migrated from README “Current goals & completed work” snapshot |
