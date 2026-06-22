# Documentation Policy — `techdev-cursor`

**Status:** v0.1 — README slim + legacy phase 1 complete (2026-06-19)  
**Owner:** TechSapo Development Team  
**Last updated:** 2026-06-19 (B2 ja repo top)  
**Related:** [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) · [FORK_CURSOR.md](./FORK_CURSOR.md) · [.cursor/rules/documentation-sync.mdc](../.cursor/rules/documentation-sync.mdc)

---

## 1. Purpose

This fork (`techdev-cursor`) maintains documentation for **humans other than the primary maintainer** — teammates, reviewers, and future contributors — without duplicating upstream platform bulk or stale AS-IS claims.

**Goals:**

- A **thin, stable README** as the human entry point
- **English logic docs** + **Japanese human onboarding** where appropriate
- **Rolling status** separated from static onboarding
- **Legacy docs** quarantined, not deleted
- **Tiered sync** so commits stay practical

---

## 2. Audience model

| Audience | Primary entry | Language | Notes |
|----------|---------------|----------|-------|
| **Other humans** (policy target) | [README.md](../README.md) · [README_en.md](../README_en.md) | **ja** / en | Thin onboarding; **GitHub repo top = Japanese** |
| **Executing developer** | [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) | English | **Authoritative runbook** for Tracks and Gates |
| **AI coding agents** | [AGENTS.md](../AGENTS.md) → [docs/agents/](./agents/) | English | Skeleton top; details in Layer 2 |
| **Architecture / decisions** | [docs/decisions/](./decisions/) · [ARCHITECTURE.md](./ARCHITECTURE.md) | English | ADR for accepted design |
| **Customers** | [docs/proposals/](./proposals/) | Japanese OK | Proposals and PPTX |

The primary maintainer uses the same docs; policy optimizes for **first-time external readers**, not daily maintainer shortcuts.

---

## 3. Document layers (Plan A)

```
Root (minimal)
  README.md          — thin human entry (Japanese — GitHub repo top)
  README_en.md       — thin human entry (English)
  README_ja.md       — shim → README.md (legacy links)
  AGENTS.md          — agent skeleton only
  CLAUDE.md          — shim → AGENTS.md

docs/ (active)
  DOCUMENTATION_POLICY.md   — this file
  FORK_STATUS.md            — rolling AS-IS / To-Be (human status)
  FORK_ONBOARDING.md        — design depth & maturity (human onboarding)
  ja/                       — Japanese human doc pairs (B2b)
  CURSOR_MCP_TODO.md        — executable runbook
  FORK_CURSOR.md            — fork identity and layout
  agents/                   — agent detail (English)
  decisions/                — ADRs (English)
  … domain guides …

docs/legacy/ (inactive)
  README.md                 — “not maintained for fork” banner
  … moved upstream / stale platform docs …
```

**Do not add new long-form guides at repository root.**

---

## 4. README policy (A1 + B2)

### A1 — Thin entry

README files answer only ( **parallel headings** in `README.md` / `README_en.md` ):

1. **Goal (To-Be)** — target Wall-Bounce behavior; link [WALL_BOUNCE_TO_BE.md](./WALL_BOUNCE_TO_BE.md)
2. **Where we are (AS-IS)** — explicit “code matches AS-IS doc; repair in progress”; link [WALL_BOUNCE_AS_IS.md](./WALL_BOUNCE_AS_IS.md)
3. **What we need** — prioritized Track summary; links to [WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md](./WALL_BOUNCE_IMPLEMENTATION_BACKLOG.md) and [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md)
4. **What** is this repo? (DevAssist; not IT incident analysis)
5. **Why** does it exist? (coding accuracy + workload reduction)
6. **Where** to go next? (links table)
7. **Current Gate progress?** → link to [ja/FORK_STATUS.md](./ja/FORK_STATUS.md) or [FORK_STATUS.md](./FORK_STATUS.md) (not rolling milestone tables)

**Do not put in README:**

- Step-by-step runbooks (→ `CURSOR_MCP_TODO.md`)
- Rolling Gate milestone tables / Changelog (→ `FORK_STATUS.md`)
- Full code-derived AS-IS inventory (→ `WALL_BOUNCE_AS_IS.md`)
- Long processing-flow mermaid (→ `ARCHITECTURE.md` or runbook)
- Legacy platform ops (PM2/Grafana/IT-incident examples) (→ `docs/legacy/` or remove links)
- Design depth / maturity bars (→ `FORK_CURSOR.md` or future `FORK_ONBOARDING.md`)

**Target size:** concise; **Goal / AS-IS / What we need** sections are mandatory even if total exceeds ~80 lines.

### B2 — Language split

| File | Language | Role |
|------|----------|------|
| `README.md` | **Japanese** | **GitHub repo top** — primary human audience (Japanese teammates) |
| `README_en.md` | **English** | International / English-first readers; same structure as `README.md` |
| `README_ja.md` | shim | Redirect only — do not duplicate body; links to `README.md` |

Keep **heading parity** between `README.md` and `README_en.md` so P1 sync stays cheap.

### B2b — Human docs (`docs/ja/` pairs)

**Human-facing** fork docs (status, onboarding, identity) use **paired files**, not a single bilingual file. GitHub markdown does not support interactive language dropdowns; `<details>` blocks are discouraged for logic/agent docs.

| English (canonical) | Japanese (human readers) | Sync rule |
|---------------------|----------------------------|-----------|
| `docs/FORK_STATUS.md` | `docs/ja/FORK_STATUS.md` | Gate/milestone updates: **both** (P0) |
| `docs/FORK_ONBOARDING.md` | `docs/ja/FORK_ONBOARDING.md` | Design/maturity changes: **both** (P1) |
| `docs/FORK_CURSOR.md` | `docs/ja/FORK_CURSOR.md` | Fork identity/layout: **both** (P1) |
| `docs/RAG_SETUP_GUIDE.md` | `docs/ja/rag-setup-guide.md` | Touch-only when RAG guide edits (P2) |

**Required on every pair:**

1. **Language bar** on line 1–5: `*[English](../FORK_STATUS.md) | **日本語***` (ja file) and reverse on en file.
2. **Heading parity** — same section order; ja prose may localize examples.
3. **`README.md`** links **ja paths only** for paired human docs; **`README_en.md`** links English paths (may note ja sibling).

**Not paired (English only):**

- `CURSOR_MCP_TODO.md` — execution truth; optional `docs/ja/CURSOR_MCP_TODO_ja.md` **summary** with links to English steps
- `docs/agents/*`, `docs/decisions/*`, `AGENTS.md`, ADRs — logic / agent docs stay **English**

**Do not:** embed en+ja in one markdown file for navigation-tier docs; do not point `README.md` at English-only human status prose without `docs/ja/` links.

---

## 5. Rolling status (C3)

### `docs/FORK_STATUS.md`

Human-readable **rolling** snapshot (see [FORK_STATUS.md](./FORK_STATUS.md)):

- Gate pass/fail timestamps — **`YYYY/MM/DD HH:mm:ss JST`** (see convention in [FORK_STATUS.md](./FORK_STATUS.md))
- Track focus (e.g. Track B)
- AS-IS vs To-Be summary tables
- “Completed” and “Next” bullets

| File | Updates when | Reader |
|------|--------------|--------|
| `FORK_STATUS.md` | Gate reviews, major Track milestones | Humans |
| `CURSOR_MCP_TODO.md` § Current known state | Task-level execution | Implementers |
| `.serena/memories/project_overview.md` | Agent session context | Agents (may link to FORK_STATUS) |

**Rule:** Gate or Track milestone changes update **FORK_STATUS + runbook** (P0). Do **not** rewrite README body for progress alone.

### Date and timestamp formats (scope)

Gate and milestone **progress appeal** uses JST timestamps in **one place only** — [FORK_STATUS.md](./FORK_STATUS.md). Do **not** propagate that format to every human-facing markdown file.

| Doc / layer | Format | When to use | Do not |
|-------------|--------|-------------|--------|
| **[FORK_STATUS.md](./FORK_STATUS.md)** | `YYYY/MM/DD HH:mm:ss JST` | Gate Pass/Fail, Track milestones, Completed table, Changelog | Duplicate full tables in README |
| **[README.md](../README.md)** · **[README_en.md](../README_en.md)** | *(none for progress)* | Link to FORK_STATUS (ja from README.md, en from README_en.md) | Gate timestamps, AS-IS/To-Be tables |
| **[CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md)** | `YYYY-MM-DD` (calendar day) | Task notes, sign-off memos, reproducible execution context | Replace FORK_STATUS as human progress dashboard |
| **[docs/decisions/](./decisions/)** ADR | `Date: YYYY-MM-DD` | Decision acceptance / revision | Time-of-day or JST suffix (ADR convention) |
| **[docs/proposals/](./proposals/)** | `日付: YYYY-MM-DD` | Customer-facing version date (Japanese OK) | Gate/milestone JST timestamps |
| **Domain guides** (`ARCHITECTURE.md`, `OPENAI_*.md`, …) | `Last updated` / `Last reviewed`: `YYYY-MM-DD` | Doc freshness metadata | Gate progress narrative |
| **This policy** | `Last updated: YYYY-MM-DD` | Policy revision only | — |
| **Orchestration events (TS-22)** | UTC `ts` / `tsEnd` in JSON/schema | Runtime Layer A events | Not a markdown display format |

**Milestone time source (FORK_STATUS):** Use merge/sign-off commit time in `+0900` (JST) — `node scripts/fork-status-timestamp.mjs <commit>`. Do **not** invent, round up, or write future times.

**Cross-link rule:** Runbook and README may cite a Gate **by name and calendar day** (`Gate A→B Pass 2026-06-18`) with a link to FORK_STATUS for the authoritative JST timestamp — do not maintain parallel timestamp tables.

---

## 6. Legacy quarantine (D2)

### Move to `docs/legacy/` when any applies:

- Unrelated to **DevAssist / Cursor MCP** fork goal
- Describes upstream **techsapo / techdev** platform AS-IS that this fork does not maintain
- Known **implementation drift** with no planned fix in Track B/C
- IT incident / InfraOps specialization (explicit non-goal of this fork)

### Keep in active `docs/`:

- Runbook, ADR, `agents/`, `FORK_CURSOR.md`, `ARCHITECTURE.md`, `SECURITY.md`, `WALL_BOUNCE_SYSTEM.md`, current integration guides tied to Track work

### Required:

- `docs/legacy/README.md` — states **not maintained**, link rot expected, do not use for fork decisions
- **Do not** list legacy paths in main README link table
- `DOCUMENTATION_INDEX.md` — legacy under a separate **Archived / legacy** section (or legacy README only)

**Migration:** staged batches (2–3 PRs); fix inbound links from active docs only.

---

## 7. Commit sync tiers (E2)

Implementation and documentation stay in the **same commit** unless the user explicitly requests a docs-only split.

### P0 — Behavior, Gates, ADR (required)

**Trigger:** Code behavior, API contract, Gate result, accepted ADR, security policy.

**Minimum updates:**

- Implementation
- [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) (and Gate memo if applicable)
- Relevant [docs/decisions/](./decisions/) ADR
- [FORK_STATUS.md](./FORK_STATUS.md) when milestone visible to humans
- Domain guide named in [documentation-sync.mdc](../.cursor/rules/documentation-sync.mdc) “What to Update” table

### P1 — Human entry / fork scope (README summary)

**Trigger:** Fork identity, primary links, one-line goal, status **link target** change.

**Minimum updates:**

- `README.md` + `README_en.md` **summary sections only** (parallel headings)
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) if navigation changes

### P2 — Long guides (touch-only)

**Trigger:** Edits confined to a single long guide (e.g. `DEVELOPMENT_GUIDE.md`, `RAG_SETUP_GUIDE.md`).

**Minimum updates:**

- The edited guide(s) only — **both READMEs not required**

### Examples

```
# ✅ P0 — Gate B milestone
feat: wire wall-bounce to codex adapter
  src/...
  docs/CURSOR_MCP_TODO.md
  docs/FORK_STATUS.md
  docs/decisions/… (if applicable)

# ✅ P1 — README slim: new link to FORK_STATUS
docs: slim README entry; add FORK_STATUS
  README.md, README_en.md
  docs/FORK_STATUS.md
  docs/DOCUMENTATION_INDEX.md

# ✅ P2 — RAG guide typo
docs: fix RAG_SETUP_GUIDE webhook steps
  docs/RAG_SETUP_GUIDE.md only
```

---

## 8. Adding new documents (F1 + F3 + F4)

### F1 — Decision tree

```
Need a new markdown file?
├─ Design decision accepted?        → docs/decisions/ ADR
├─ Executable step / Gate / Track?    → CURSOR_MCP_TODO.md or docs/agents/commands.md
├─ Agent-only rule?                 → docs/agents/
├─ Human onboarding or fork story?  → FORK_CURSOR.md or FORK_ONBOARDING.md (future)
├─ Rolling progress / AS-IS?        → FORK_STATUS.md (JST timestamps — §5)
├─ External review (other repo)?    → Do NOT vendor MD; runbook crosswalk section only
├─ Upstream / stale / out of scope? → docs/legacy/
└─ Customer-facing narrative?       → docs/proposals/ (Japanese OK)
```

### F3 — One doc, one role (prohibited)

| Do not | Instead |
|--------|---------|
| Put runbook steps in README | `CURSOR_MCP_TODO.md` |
| Bloat AGENTS.md with procedures | `docs/agents/*` |
| Put checklists in ADR | ADR = decision; runbook = steps |
| Copy review MD from other repos | Crosswalk link in runbook ([example](./CURSOR_MCP_TODO.md#codex-review-crosswalk-2026-06-18)) |

### F4 — INDEX listing

| Location | Listed in |
|----------|-----------|
| Active fork-scoped doc | `DOCUMENTATION_INDEX.md` main tables |
| Legacy / archived | `docs/legacy/README.md` only (optional short “Archived” block in INDEX) |
| Draft / personal | Not indexed |

New **active** docs: add one row to `DOCUMENTATION_INDEX.md` in the same commit.

---

## 9. Unchanged principles (explicit)

These remain in force; this policy **refines** README and sync scope, does not replace:

| Principle | Where |
|-----------|--------|
| Wall-Bounce constitution | [AGENTS.md](../AGENTS.md) · [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md) |
| AGENTS.md skeleton only | [AGENTS.md](../AGENTS.md) · [documentation-sync.mdc](../.cursor/rules/documentation-sync.mdc) |
| Runbook = execution truth | [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) |
| Logic / rule docs in **English** | [documentation-sync.mdc](../.cursor/rules/documentation-sync.mdc) |
| ADR for stack decisions | [docs/decisions/README.md](./decisions/README.md) |
| Implementation + docs same commit | P0–P2 tiers above |
| External Codex review not vendored | [CURSOR_MCP_TODO § crosswalk](./CURSOR_MCP_TODO.md#codex-review-crosswalk-2026-06-18) |

---

## 10. Migration checklist (policy adoption)

Execute in order; each step may be its own commit.

| # | Task | Status |
|---|------|--------|
| 1 | Adopt this policy (v0.1) | `[x]` draft |
| 2 | Update [documentation-sync.mdc](../.cursor/rules/documentation-sync.mdc) → link here; E2 tiers | `[x]` 2026-06-19 |
| 3 | Create [FORK_STATUS.md](./FORK_STATUS.md); move content from README “Current goals & completed work” | `[x]` 2026-06-19 |
| 4 | Slim README (ja top + README_en parallel) | `[x]` 2026-06-19 — README.md = ja; README_en.md = en |
| 5 | Create `docs/legacy/README.md`; batch-move legacy docs (phase 1) | `[x]` 2026-06-19 — 12 files |
| 6 | Trim [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md); split legacy section | `[x]` 2026-06-19 — 134 lines |
| 7 | Optional: `FORK_ONBOARDING.md` for Design depth / maturity content | `[x]` 2026-06-19 |
| 8 | B2b — `docs/ja/` human doc pairs + README ja links | `[x]` 2026-06-19 |
| 9 | B2 — GitHub repo top = `README.md` (Japanese); `README_en.md` English | `[x]` 2026-06-19 |

---

## 11. Related documents

| Doc | Role |
|-----|------|
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Full map of active docs |
| [FORK_CURSOR.md](./FORK_CURSOR.md) | Fork identity and directory layout |
| [CURSOR_MCP_TODO.md](./CURSOR_MCP_TODO.md) | Tracks, Gates, execution |
| [decisions/README.md](./decisions/README.md) | ADR index |
| [documentation-sync.mdc](../.cursor/rules/documentation-sync.mdc) | Cursor pre-commit hook (thin) |
