# Anthropic Agent Skills — Authoring Best Practices

**Status**: Documented — repo-local Skills / agent-edit wiring pending (Track E-5 / F-10)  
**Platform**: [Skill authoring best practices](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/best-practices) · [Skills overview](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/overview) · [Skills guide (API)](https://platform.claude.com/docs/en/docs/build-with-claude/skills-guide)  
**Overview**: [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) — API/container, ZDR, surfaces  
**Claude Code**: [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) — filesystem skills, frontmatter, `/run` bundled skills  
**Cookbook**: [Introduction to Claude Skills](https://platform.claude.com/cookbook/skills-notebooks-01-skills-introduction)  
**Related**: [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [ANTHROPIC_COOKBOOK_INTEGRATION.md](./ANTHROPIC_COOKBOOK_INTEGRATION.md) · [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

**Agent Skills** are filesystem-bundled packages (`SKILL.md` + optional reference files and scripts). At startup, only **metadata** (`name`, `description`) loads into context; Claude reads `SKILL.md` when a skill is relevant and pulls other files **on demand**.

This doc captures **authoring** rules from Anthropic platform guidance — how to write skills Claude discovers and uses effectively. For architecture, API wiring, pre-built Skills, and ZDR: [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md).

**This fork:** Primary consumer is **Claude Sonnet 4.6** (`llm_agent_edit`, document Skills). Opus/Haiku: test skills across tiers before shipping. Runtime remains CLI-first per [SECURITY.md](./SECURITY.md); API upload path is reference only.

---

## Core principles

### Concise is key

Default assumption: **Claude is already capable.** Add only context Claude lacks. Every paragraph in `SKILL.md` competes with system prompt, history, other skills' metadata, and the user request when loaded.

| Ask | Action |
|-----|--------|
| Does Claude need this explanation? | Omit if yes to "already knows" |
| Worth the token cost? | Cut boilerplate (what PDFs are, how pip works) |

### Degrees of freedom

| Level | When | Example |
|-------|------|---------|
| **High** (text steps) | Multiple valid approaches; judgment-heavy | Code review checklist |
| **Medium** (pseudocode / parameterized script) | Preferred pattern with acceptable variation | Report generator template |
| **Low** (fixed script, no extra flags) | Fragile ops; consistency critical | `python scripts/migrate.py --verify --backup` |

### Test all target models

| Model | Check |
|-------|-------|
| Haiku | Enough guidance? |
| Sonnet | Clear and efficient? |
| Opus | Not over-explained? |

---

## SKILL.md structure

### YAML frontmatter (required)

```yaml
---
name: pdf-processing          # max 64; lowercase, digits, hyphens only
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---
```

| Field | Rules |
|-------|--------|
| `name` | ≤64 chars; no XML; not `anthropic` / `claude` reserved |
| `description` | ≤1024 chars; **non-empty**; **third person**; what + when/triggers; no XML |

**Description voice:**

- ✓ 「Excelファイルを処理し、レポートを生成します」
- ✗ 「お手伝いできます」 / 「これを使って処理できます」

**Naming:** Prefer **gerund** (`processing-pdfs`, `analyzing-spreadsheets`). Avoid `helper`, `utils`, vague `documents`.

### Body budget

- Keep `SKILL.md` **under 500 lines** — split into sibling files when approaching limit
- Reference depth: **one level** from `SKILL.md` only (no `advanced.md` → `details.md` chains)
- Long reference files (>100 lines): **table of contents** at top
- Paths: **forward slashes** (`reference/guide.md`), never Windows backslashes

### Progressive disclosure layout

```text
pdf/
├── SKILL.md              # Loaded when triggered
├── FORMS.md              # On demand
├── reference.md
└── scripts/
    ├── analyze_form.py   # Executed — not loaded into context
    └── fill_form.py
```

**Patterns:**

1. **High-level guide + links** — quick start in `SKILL.md`; detail in `FORMS.md`, `REFERENCE.md`
2. **Domain split** — `reference/finance.md`, `reference/sales.md` (avoid unrelated context)
3. **Conditional detail** — basic in `SKILL.md`; `REDLINING.md` only when needed

---

## Workflows and quality loops

### Complex tasks

Provide **numbered steps** + copy-paste **checklist** Claude can tick in replies.

### Feedback loops

**Run validator → fix → repeat** before destructive or publish steps.

- Code skills: `validate.py` must pass before `pack.py`
- Non-code skills: review against `STYLE_GUIDE.md` checklist

### Eval-driven development

1. Run task **without** skill — document failures  
2. Build **3 eval scenarios**  
3. Write **minimal** skill content that passes evals  
4. Iterate on real usage (Claude A authors, Claude B executes)

---

## Executable scripts (advanced)

| Do | Don't |
|----|-------|
| Handle errors in bundled scripts | `open(path).read()` and punt to Claude |
| Document magic numbers | `TIMEOUT = 47` without rationale |
| Say **run** `analyze_form.py` | Ambiguous "use the script" |
| List `pip install` deps explicitly | Assume packages exist |
| MCP tools: `ServerName:tool_name` | Bare tool name |

**Plan–validate–execute:** For batch/destructive ops, write intermediate `changes.json`, validate with script, then apply.

**Runtime note:** claude.ai can install npm/PyPI; **Claude API** code execution has no network — bundle deps per [code execution tool](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool) docs.

---

## Anti-patterns

- Vague descriptions (`Helps with documents`)
- Too many library choices without a default
- Time-sensitive "before August 2025" — use **Old patterns** collapsible section
- Inconsistent terminology across the skill
- Deeply nested file references
- Assuming tools/packages are installed

---

## Catalog alignment

| Catalog id | Role |
|------------|------|
| `claude-sonnet-4-6` | Primary Skills author + consumer (agent-edit, Excel/PPT/PDF cookbook) |
| `claude-opus-4-8` | Review orchestration skills; avoid over-long SKILL bodies |
| `claude-haiku-4-5` | Fast-tier skill smoke tests |

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills` | See [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) |
| `prompting.guidanceTopics[]` | `skills-*` topics — overview + authoring |
| `references[]` | Overview, guide, quickstart, best-practices, cookbook |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo Skills tree | No canonical `skills/` authoring layout in this fork |
| F-10 | Skill authoring topics not injected into agent-edit prompts |
| Customer proposals | PPTX path uses `scripts/pptx-gen/` — not Anthropic Skills format |

---

## Backlog

- **E-5** — Align any future repo Skills with this checklist before agent-edit integration.
- **F-10** — Inject `skills-authoring-best-practices` when Sonnet + document/agent-edit preset.
- **Proposals** — Optional: map customer deliverable templates to Skills progressive-disclosure pattern.

---

## Checklist (share-ready)

**Core:** Specific third-person description · body <500 lines · 1-level refs · progressive disclosure · consistent terms · concrete examples · no time-bombs  

**Scripts:** Explicit error handling · no magic constants · deps listed · forward-slash paths · validation before destructive steps  

**Testing:** 3+ evals · Haiku/Sonnet/Opus · real workflows  

---

## References

- [Skill authoring best practices (platform)](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/best-practices)
- [Skills overview](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/overview)
- [Skills quickstart](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/quickstart)
- [Skills guide — API](https://platform.claude.com/docs/en/docs/build-with-claude/skills-guide)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Cookbook — Skills introduction](https://platform.claude.com/cookbook/skills-notebooks-01-skills-introduction)
