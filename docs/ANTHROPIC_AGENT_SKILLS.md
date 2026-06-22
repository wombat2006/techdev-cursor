# Anthropic Agent Skills Integration

**Status**: Documented — Skills API / container wiring not in `claude-adapter.ts` (Track E-5)  
**Platform**: [Agent Skills overview](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/overview) · [Skills guide (API)](https://platform.claude.com/docs/en/docs/build-with-claude/skills-guide) · [Quickstart](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/quickstart) · [Authoring best practices](./ANTHROPIC_SKILLS_AUTHORING.md)  
**Cookbook**: [Skills introduction](https://platform.claude.com/cookbook/skills-notebooks-01-skills-introduction)  
**Related**: [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

**Agent Skills** are modular, filesystem-shaped packages (`SKILL.md` + optional scripts, templates, reference files) that extend Claude with domain workflows. Claude loads skill **metadata** at startup and reads instructions/resources **on demand** when a request matches.

**ZDR:** **Not eligible** — skill definitions and execution data follow standard retention. See [capabilities overview](./ANTHROPIC_CAPABILITIES_OVERVIEW.md).

**Fork AS-IS:** `claude-sonnet-4-6` — primary Skills author/consumer (`llm_agent_edit`, document automation). Runtime is CLI-first per [SECURITY.md](./SECURITY.md); API `container` + `skill_id` path is reference only.

---

## Why Skills (vs one-off prompts)

| Benefit | Detail |
|---------|--------|
| Specialization | Reusable domain expertise without repeating system prompts |
| Progressive disclosure | Only relevant skill content enters context |
| Composability | Multiple skills; metadata ~100 tokens each at startup |

Authoring rules: [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md).

---

## Three levels of loading

| Level | When loaded | Token cost | Content |
|-------|-------------|------------|---------|
| **1 — Metadata** | Always (startup) | ~100 tokens/skill | YAML `name`, `description` in frontmatter |
| **2 — Instructions** | Skill triggered | Target &lt;5k in `SKILL.md` | Workflows, best practices |
| **3 — Resources** | As needed | Effectively unbounded | Extra `.md`, data, **scripts run via bash** (code not loaded) |

**Architecture:** Skills run in Claude's **code-execution VM** with filesystem + bash. Triggered skill → `read SKILL.md` → optional `read FORMS.md` / run `scripts/*.py` → only script **output** consumes tokens.

---

## Surfaces

| Surface | Pre-built Skills | Custom Skills | Notes |
|---------|------------------|---------------|--------|
| **Claude API** | pptx, xlsx, docx, pdf | Upload via `/v1/skills` | Workspace-shared; requires beta headers + code execution |
| **Claude Code** | — | `~/.claude/skills/` or `.claude/skills/` | Filesystem; full network — [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) |
| **claude.ai** | Background for docs | Settings zip upload | Per-user; no org-wide admin |

**Cross-surface:** Skills **do not sync** between API, claude.ai, and Claude Code — manage per surface.

---

## API integration (reference)

**Prerequisites** (beta headers):

- `code-execution-2025-08-25` — Skills run in code execution container
- `skills-2025-10-02` — Skills feature
- `files-api-2025-04-14` — Upload/download in container

Pass `skill_id` on the `container` parameter alongside code execution. Pre-built ids: `pptx`, `xlsx`, `docx`, `pdf`. Custom skills: `POST /v1/skills`.

Details: [Skills guide](https://platform.claude.com/docs/en/docs/build-with-claude/skills-guide).

---

## Pre-built document Skills

| `skill_id` | Use |
|------------|-----|
| `pptx` | Presentations — create, edit, analyze slides |
| `xlsx` | Spreadsheets — analysis, charts, reports |
| `docx` | Word documents — create, edit, format |
| `pdf` | Formatted PDF generation |

Pairs with [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) (Messages API document blocks) for **reading** PDFs; Skills `pdf` skill targets **generation**.

Open source examples: [anthropics/skills](https://github.com/anthropics/skills) (includes Claude API reference skill).

---

## SKILL.md structure (summary)

Required YAML frontmatter:

```yaml
---
name: pdf-processing
description: Extracts text and tables from PDF files. Use when working with PDFs or document extraction.
---
```

| Field | Rules |
|-------|--------|
| `name` | ≤64 chars; lowercase, digits, hyphens; no `anthropic`/`claude` |
| `description` | ≤1024 chars; what + when; third person |

Full authoring: [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md).

---

## Security

**Trust only skills you authored or Anthropic provides.** Malicious skills can abuse tools (bash, file I/O, code execution) for data exfiltration or harmful actions.

| Practice | Why |
|----------|-----|
| Audit all bundled files | Scripts, images, hidden network calls |
| Treat external-fetch skills as high risk | Remote content may inject instructions |
| Production: trusted sources only | Same bar as installing software |

Fork policy: [SECURITY.md](./SECURITY.md) — CLI/SDK only; no API keys in repo.

---

## Runtime constraints (by surface)

| Surface | Network | Packages |
|---------|---------|----------|
| **Claude API** | **No** external network | Pre-installed only — no runtime `pip install` |
| **claude.ai** | Varies by plan/admin | May install npm/PyPI per support docs |
| **Claude Code** | Full (user machine) | Prefer local-only installs; avoid global package pollution |

API Skills must bundle deps per [code execution tool](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool) allowlist.

---

## Fork use cases

| Scenario | Pattern |
|----------|---------|
| Customer proposal automation | Sonnet + pre-built `pptx` / `docx` (API reference) |
| Repo agent-edit Skills | `.claude/skills/<workflow>/` — [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) |
| PDF ingest vs generate | Document blocks for Q&A; Skills `pdf` for output |
| Wall-Bounce analyze | Text-only AS-IS — Skills not on hot path |

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills` | Supported, ZDR, pre-built ids, beta headers |
| `prompting.guidanceTopics[]` | Overview + authoring topics |
| `references[]` | Overview, guide, quickstart, cookbook |

| Topic slug | Focus |
|------------|-------|
| `skills-document-generation` | Pre-built pptx/xlsx/docx/pdf |
| `skills-progressive-disclosure` | 3-level loading |
| `skills-api-container` | Beta headers, `container.skill_id` |
| `skills-prebuilt-office-pdf` | pptx, xlsx, docx, pdf ids |
| `skills-security-audit` | Trust, audit bundled files |
| `skills-surface-constraints` | Cross-surface sync, sharing, runtime |
| `skills-authoring-best-practices` | SKILL.md authoring — see authoring doc |
| `skills-executable-scripts` | Bundled scripts, API no-network |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| `claude-adapter.ts` | No Skills API / container params |
| Repo | No canonical `skills/` tree for custom Skills |
| F-10 | Skill topics not injected at runtime |
| Proposals | `scripts/pptx-gen/` — not Anthropic Skills format |

---

## Backlog

- **E-5** — Repo Skills layout + optional API upload path for agent-edit.
- **F-10** — Inject `skills-api-container` when Sonnet + document preset.

---

## References

- [Agent Skills overview](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/overview)
- [Skills quickstart](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/quickstart)
- [Skills guide — API](https://platform.claude.com/docs/en/docs/build-with-claude/skills-guide)
- [Authoring best practices](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/best-practices) → [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Engineering blog — Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Open-source skills repo](https://github.com/anthropics/skills)
- [Cookbook — skills introduction](https://platform.claude.com/cookbook/skills-notebooks-01-skills-introduction)
