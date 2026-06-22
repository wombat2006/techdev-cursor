# Anthropic — Model System Cards

**Status**: Reference — AS-IS catalog models linked; safety evals not replicated in fork  
**Platform**: [Model system cards](https://www.anthropic.com/system-cards)  
**Related**: [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [SECURITY.md](./SECURITY.md) · [decisions/TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## What it is

**System cards** document each Claude model's capabilities, **safety evaluations**, and responsible deployment decisions. They complement API docs ([models overview](./ANTHROPIC_MODELS_OVERVIEW.md), [pricing](./ANTHROPIC_PRICING.md)) with risk framing and eval methodology — not prompt recipes.

**Fork AS-IS:** Wall-Bounce does not ingest system card text at runtime. Use cards for **model selection**, **customer proposals**, and **compliance conversations**; wire eval claims only after human review.

---

## Index

Canonical list (updated by Anthropic): [anthropic.com/system-cards](https://www.anthropic.com/system-cards)

---

## Catalog system cards

| Catalog id | Model | Card date | Link |
|------------|-------|-----------|------|
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | Feb 2026 | [System card](http://anthropic.com/claude-sonnet-4-6-system-card) |
| `claude-opus-4-6` | Claude Opus 4.6 | Apr 2026 | [System card](https://anthropic.com/claude-opus-4-6-system-card) |
| `claude-opus-4-8` | Claude Opus 4.8 | May 2026 | [System card](https://anthropic.com/claude-opus-4-8-system-card) |
| `claude-haiku-4-5` | Claude Haiku 4.5 | Oct 2025 | [PDF](https://www-cdn.anthropic.com/7aad69bf12627d42234e01ee7c36305dc2f6a970.pdf) |

Catalog `references[]` on each model uses `type: system_card`.

---

## Legacy system cards (not in catalog)

| Model | Date | Link |
|-------|------|------|
| Claude Sonnet 4.5 | Sep 2025 | [PDF](https://www-cdn.anthropic.com/963373e433e489a87a10c823c52a0a013e9172dd.pdf) |
| Claude Opus 4.1 | Aug 2025 | [PDF](https://www-cdn.anthropic.com/9fa30625273bafdf5af82c93719d7ca606485a16.pdf) |
| Claude Fable 5 + Mythos 5 | Jun 2026 | [System card](https://anthropic.com/claude-fable-5-mythos-5-system-card) |
| Claude Opus 4.7 | Apr 2026 | [System card](https://anthropic.com/claude-opus-4-7-system-card) |

When upgrading catalog ids, add matching `system_card` references and re-read eval sections for aggregator vs agent roles.

---

## How to use in this fork

| Use case | Action |
|----------|--------|
| Wall-Bounce role assignment | Cross-check Sonnet (agent) vs Opus (aggregate) capability claims in cards |
| Customer / proposal material | Cite card date + URL; logic docs stay English per policy |
| Security review | Pair with [SECURITY.md](./SECURITY.md) — CLI-only, no API keys in repo |
| ZDR / enterprise | Cards ≠ data retention policy — see [capabilities hub](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) ZDR table |

**Not in scope:** Automated ingestion of PDFs into RAG or prompt injection at runtime (F-10 backlog).

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `vendors.anthropic.systemCardsUrl` | Index URL |
| `references[]` `type: system_card` | Per-model PDF or HTML card |
| `prompting.guidanceTopics[]` | `anthropic-system-cards-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Runtime | No system card content in `claude-adapter` or Wall-Bounce prompts |
| Summaries | No fork-authored card summaries (unlike OpenAI `gpt-5-system-card-summary.md` pattern) |
| F-10 | System card topics not injected at runtime |

---

## See also

- [Model system cards (index)](https://www.anthropic.com/system-cards)
- [Transparency Hub](https://www.anthropic.com/transparency)
- [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- [Models overview](./ANTHROPIC_MODELS_OVERVIEW.md)
