# Anthropic Capabilities Overview (Platform Hub)

**Status**: Index documented — per-feature adapter wiring varies (see linked integration docs)  
**Platform**: [Capabilities overview](https://platform.claude.com/docs/en/docs/build-with-claude/overview) · [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [Models API](https://platform.claude.com/docs/en/docs/api/models/list) · [Data retention / ZDR](https://platform.claude.com/docs/en/docs/manage-claude/api-and-data-retention)  
**Related**: [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md) · [ANTHROPIC_COOKBOOK_INTEGRATION.md](./ANTHROPIC_COOKBOOK_INTEGRATION.md) · [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [SECURITY.md](./SECURITY.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md)

---

## Purpose

Anthropic groups Claude Platform capabilities into **five areas**. This doc is the **TechSapo fork hub**: where each platform feature lands in our catalog, integration guides, and AS-IS gaps.

**Runtime default:** Subscription CLI (`claude` / Claude Code) per [SECURITY.md](./SECURITY.md). API-key examples are **reference only** unless an approved API path exists.

**Catalog AS-IS ids:** `claude-sonnet-4-6`, `claude-opus-4-6` (aggregate default), `claude-opus-4-8` (escalation / `critical`), `claude-haiku-4-5`. Platform **current** tier: Sonnet 4.6 / Opus 4.6–4.8 — see [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md). Safety evals: [ANTHROPIC_MODEL_SYSTEM_CARDS.md](./ANTHROPIC_MODEL_SYSTEM_CARDS.md). Opus **4.1** deprecated (retire 2026-08-05).

---

## Feature availability tiers

| Tier | Meaning | Fork implication |
|------|---------|----------------|
| **Beta** | Preview; may change; often needs [beta headers](https://platform.claude.com/docs/en/docs/api/beta-headers) | Document in integration guide; do not assume GA stability |
| **GA** | Production-ready; standard versioning | Safe target for catalog `apiFeatures` when wired |
| **Deprecated** | Still works; migrate | Track in catalog notes + ADR if we depend on it |
| **Retired** | Unavailable | Remove from presets |

---

## ZDR quick reference (fork decisions)

| Feature area | ZDR (typical) | Fork note |
|--------------|---------------|-----------|
| Model: extended thinking, context window, effort, PDF, citations | Yes | CLI path eligible when using API with ZDR contract |
| Model: **batch processing** | **No** | [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) — gated offline only |
| Model: fallback credits / server-side fallback | No* | Not cataloged; Fable 5 refusals |
| Tools: code execution, MCP connector, programmatic tool calling | No | API-only; not CLI default |
| Tools: memory, bash, text editor | Yes | Cookbook + platform; adapter pending |
| Tool infra: **Agent Skills** | **No** | [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · authoring [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) |
| Tool infra: fine-grained tool streaming, tool search | Yes | [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) |
| Context: compaction, context editing, prompt caching, token counting | Yes (feature-dependent) | [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) |
| Files: Files API | No | Beta; not in fork adapters |

\* See platform footnotes for model-specific ZDR on structured outputs, web tools with dynamic filtering.

---

## 1. Model capabilities

Control reasoning depth, response shape, and input modalities.

| Platform feature | ZDR | TechSapo integration doc | Catalog / AS-IS |
|------------------|-----|------------------------|-----------------|
| [Context windows](https://platform.claude.com/docs/en/docs/build-with-claude/context-windows) | Yes | [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) | `limits.contextTokens` 200k; `contextAwareness` Sonnet/Haiku |
| Model capabilities (multilingual) | — | [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md) · `capabilities.japaneseQuality` |
| [Adaptive thinking](https://platform.claude.com/docs/en/docs/build-with-claude/adaptive-thinking) | Yes | [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) | `adaptive-thinking-migration` topic; 4.6+ target |
| [Extended thinking](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking) | Yes | [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) | `apiFeatures.extendedThinking`; manual on 4.5 AS-IS |
| [Effort](https://platform.claude.com/docs/en/docs/build-with-claude/effort) | Yes | Extended thinking / Opus notes | `claude-adapter` passes `--effort` today |
| [Batch processing](https://platform.claude.com/docs/en/docs/build-with-claude/batch-processing) | No | [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) | `apiFeatures.batchApi` all Claude ids |
| [PDF support](https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support) | Yes | [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · cookbook `misc-pdf-upload-summarization` | Sonnet `document` modality; `apiFeatures.pdfSupport` |
| [Vision](https://platform.claude.com/docs/en/docs/build-with-claude/vision) | Yes | [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) · cookbook `multimodal-getting-started-with-vision` | Sonnet `vision` modality; `apiFeatures.visionSupport` |
| [Structured outputs](https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs) | Conditional | Haiku: tool `input_schema`; Opus: JSON prefill cookbook | No native JSON mode on Opus 4.8 |
| Citations, search results, data residency, fallback | Yes / No | — | **Not cataloged** — add when product needs |

**Programmatic detection:** [Models API `capabilities`](https://platform.claude.com/docs/en/docs/api/models/list) — use when catalog upgrades to 4.6+.

---

## 2. Tools

### Server-side (platform executes)

| Feature | ZDR | Fork |
|---------|-----|------|
| Code execution | No | Not wired |
| Web search / web fetch | Yes* | Not wired; Haiku uses client-side fetch cookbook |
| Advisor tool | Yes | Beta; not cataloged |

### Client-side (you implement)

| Feature | ZDR | Fork |
|---------|-----|------|
| [Memory](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/memory-tool) | Yes | Cookbook + `memory-tool-cross-session` topic; TS-22 session store |
| Bash / text editor | Yes | Claude Code CLI covers locally; Messages API path pending |
| Computer use | Yes | Beta; not cataloged |

**Tool use patterns:** [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) · [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md)

---

## 3. Tool infrastructure

| Feature | ZDR | TechSapo doc |
|---------|-----|--------------|
| [Agent Skills](https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/overview) | No | [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) · cookbook intro |
| [Fine-grained tool streaming](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/fine-grained-tool-streaming) | Yes | [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) |
| [Tool search](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-search-tool) | Yes | Context window doc (manage tool context) |
| MCP connector | No | [MCP_SERVICES.md](./MCP_SERVICES.md) — separate MCP layer |
| [Programmatic tool calling](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/programmatic-tool-calling) | No | [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) · Sonnet 4.6 AS-IS |

---

## 4. Context management

| Feature | ZDR | TechSapo doc |
|---------|-----|--------------|
| [Compaction](https://platform.claude.com/docs/en/docs/build-with-claude/compaction) | Yes | [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · SDK cookbook on 4.5 |
| [Context editing](https://platform.claude.com/docs/en/docs/build-with-claude/context-editing) | Yes | Context engineering cookbook · `tool-result-clearing` |
| [Prompt caching](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) | Yes | [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · `apiFeatures.promptCaching` |
| [Mid-conversation system messages](https://platform.claude.com/docs/en/docs/build-with-claude/mid-conversation-system-messages) | Yes | [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md) · Opus 4.8 migration |
| [Token counting](https://platform.claude.com/docs/en/docs/build-with-claude/token-counting) | Yes | [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) · `apiFeatures.tokenCounting` |

---

## 5. Files and assets

| Feature | ZDR | Fork |
|---------|-----|------|
| [Files API](https://platform.claude.com/docs/en/docs/build-with-claude/files) | No | Beta; PDF via document blocks (cookbook) instead |

---

## Catalog model → capability focus

| Catalog id | Primary platform areas | Integration docs |
|------------|------------------------|------------------|
| `claude-sonnet-4-6` | Context, tools, thinking, Skills, PDF | Context, extended thinking, parallel/fine-grained tools, Skills authoring, cookbooks |
| `claude-opus-4-8` | Model (aggregate), multi-agent, JSON prefill | Cookbook orchestration, extended thinking, parallel tools |
| `claude-haiku-4-5` | Fast tool-schema extract, web summarize | Structured JSON + Haiku web cookbooks; context awareness |

---

## AS-IS adapter surface

| Path | What works today |
|------|------------------|
| `claude-adapter.ts` | CLI `--print`, `--model`, `--effort` |
| Not wired | Thinking params, tool loops, token count, compaction, memory tool, batch API, Skills upload |

Wall-Bounce orchestration uses **cross-vendor** peers — platform subagent patterns are **messaging discipline only** ([cookbook integration](./ANTHROPIC_COOKBOOK_INTEGRATION.md)).

---

## Backlog (by platform area)

| Area | Track | Next doc / code touch |
|------|-------|------------------------|
| Model — thinking | B-0 / F-10 | `ANTHROPIC_EXTENDED_THINKING.md` → adapter |
| Model — batch | F-14 | `ANTHROPIC_BATCH_API_RAG.md` (gated) |
| Tools — memory / clearing | B-0 | Context engineering cookbooks → session store |
| Tool infra — Skills | E-5 | `ANTHROPIC_SKILLS_AUTHORING.md` → repo layout |
| Context — compaction | B-0 | `ANTHROPIC_CONTEXT_WINDOW.md` → SDK or 4.6+ API |
| Context — token count | B-0 | Preflight before long rounds |

---

## Child integration docs (this fork)

| Doc | Platform slice |
|-----|----------------|
| [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) | Programmatic tool calling |
| [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) | Messages API SSE streaming |
| [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md) | Multilingual / Japanese routing |
| [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) | Adaptive thinking (4.6+ migration) |
| [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) | Extended thinking — manual mode (4.5 AS-IS) |
| [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) | Context windows, compaction, awareness |
| [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) | Parallel `tool_use` |
| [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) | `eager_input_streaming` |
| [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) | Agent Skills overview |
| [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) | Agent Skills authoring |
| [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) | Message Batches (non-ZDR) |
| [ANTHROPIC_COOKBOOK_INTEGRATION.md](./ANTHROPIC_COOKBOOK_INTEGRATION.md) | Cookbook registry |
| [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) | Per-model prompting |

---

## References

- [Capabilities overview (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/overview)
- [Feature availability](https://platform.claude.com/docs/en/docs/build-with-claude/overview#feature-availability)
- [Models API](https://platform.claude.com/docs/en/docs/api/models/list)
- [API and data retention](https://platform.claude.com/docs/en/docs/manage-claude/api-and-data-retention)
