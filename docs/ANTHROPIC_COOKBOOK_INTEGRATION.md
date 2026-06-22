# Anthropic Cookbook Integration Guide

## Overview

This guide maps [Anthropic Claude Cookbooks](https://github.com/anthropics/claude-cookbooks) ([platform.claude.com/cookbook](https://platform.claude.com/cookbook)) into TechSapo's catalog and character sheets — mirroring [OPENAI_COOKBOOK_INTEGRATION.md](./OPENAI_COOKBOOK_INTEGRATION.md).

> **Platform hub:** Five capability areas (model, tools, tool infra, context, files) — [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md). Model family / tiers — [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md).

> **Model traits (machine-readable):** Findings normalize into [config/llm-model-catalog.json](../config/llm-model-catalog.json) per [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) — `capabilities`, `references[]`, `cookbookIndex`, and `prompting.*`. Human summaries: [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md).

> **Security (this fork):** Cookbook notebooks assume `ANTHROPIC_API_KEY` and the Python SDK. **Runtime default** remains subscription CLI (`claude` / Claude Code) per [SECURITY.md](./SECURITY.md). Treat API examples as **reference patterns only** until an explicit API path is approved.

**Last reviewed:** 2026-06-22 (batch 2: RAG, structured JSON, Haiku web, JSON mode, LlamaIndex, PDF, Wikipedia legacy)

---

## Cookbook registry (intake)

| Slug | Platform URL | Primary models | TechSapo relevance |
|------|--------------|----------------|-------------------|
| `patterns-agents-async-multi-agent-orchestration` | [link](https://platform.claude.com/cookbook/patterns-agents-async-multi-agent-orchestration) | Opus (cookbook 4.8 → fork default `claude-opus-4-6`, escalate `claude-opus-4-8`) | Multi-agent **messaging lifecycle** — Hub inbox, `send_message` / `wait_for_message`, fixed N-agent team vs dynamic `create_subagents` / `get_status` / `kill_subagents`. Character: **orchestrator / lead** persona for aggregator rounds. |
| `tool-use-context-engineering-context-engineering-tools` | [link](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools) | Sonnet | Three primitives: **compaction**, **tool-result clearing** (`clear_tool_uses`), **memory** (file-backed). Framework for diagnosing context rot vs token limit. |
| `tool-use-automatic-context-compaction` | [link](https://platform.claude.com/cookbook/tool-use-automatic-context-compaction) | Sonnet | Agent SDK `compaction_control` — threshold-triggered summary in `<summary>` tags, history reset. Long ticket-queue / tool-heavy workflows. |
| `tool-use-memory-cookbook` | [link](https://platform.claude.com/cookbook/tool-use-memory-cookbook) | Sonnet 4.6 | Memory tool + context editing for **cross-session** agents; code-review assistant demo pattern. |
| `extended-thinking-extended-thinking-with-tool-use` | [link](https://platform.claude.com/cookbook/extended-thinking-extended-thinking-with-tool-use) | Sonnet | Thinking blocks **before** tool calls; **preserve thinking blocks** on replay; no repeat thinking after `tool_result` until next user turn. |
| `skills-notebooks-01-skills-introduction` | [link](https://platform.claude.com/cookbook/skills-notebooks-01-skills-introduction) | Sonnet (Skills product) | Excel / PowerPoint / PDF Skills — [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · authoring [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md). |
| `misc-batch-processing` | [link](https://platform.claude.com/cookbook/misc-batch-processing) | All (API) | Message Batches API — 50% cost, async bulk. **Gated** offline path only — [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) (platform: [batch processing guide](https://platform.claude.com/docs/en/docs/build-with-claude/batch-processing)). Not ZDR-eligible. |
| `capabilities-contextual-embeddings-guide` | [link](https://platform.claude.com/cookbook/capabilities-contextual-embeddings-guide) | N/A (RAG pipeline) | Contextual Embeddings + BM25 hybrid + reranking — feeds [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md), not single-model character. |
| `capabilities-retrieval-augmented-generation-guide` | [link](https://platform.claude.com/cookbook/capabilities-retrieval-augmented-generation-guide) | N/A (RAG pipeline) | Basic RAG → eval suite → **summary indexing** + **Claude reranking**; Voyage embeddings. End-to-end accuracy 71% → 81% in cookbook benchmark. |
| `tool-use-extracting-structured-json` | [link](https://platform.claude.com/cookbook/tool-use-extracting-structured-json) | Haiku 4.5 | Structured output via **custom tool `input_schema`** (summarization, NER, sentiment, classification); `additionalProperties` for open-ended keys; `tool_choice` force. |
| `misc-read-web-pages-with-haiku` | [link](https://platform.claude.com/cookbook/misc-read-web-pages-with-haiku) | Haiku 4.5 | Fetch URL → wrap in `<content>` → concise summary. Fast **ingest + summarize** pattern (client-side fetch). |
| `misc-how-to-enable-json-mode` | [link](https://platform.claude.com/cookbook/misc-how-to-enable-json-mode) | Opus 4.8 | No constrained JSON mode — **assistant prefill** `{`, brace extraction, XML tags for multi-object output; stop sequences. Trade-off: prefill blocks chain-of-thought before JSON. |
| `third-party-llamaindex-multi-document-agents` | [link](https://platform.claude.com/cookbook/third-party-llamaindex-multi-document-agents) | Opus 4.8 | Per-corpus **ReAct agents** + `IndexNode` top-level retriever; vector vs summary tool per document. Multi-corpus routing character. |
| `misc-pdf-upload-summarization` | [link](https://platform.claude.com/cookbook/misc-pdf-upload-summarization) | Sonnet (4.6 in cookbook) | PDF **document blocks** (base64); multimodal text + charts. Platform: [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md). |
| `multimodal-getting-started-with-vision` | [link](https://platform.claude.com/cookbook/multimodal-getting-started-with-vision) | Sonnet | Image blocks — [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md). |
| `multimodal-best-practices-for-vision` | [link](https://platform.claude.com/cookbook/multimodal-best-practices-for-vision) | Sonnet | Prompt placement, quality — vision doc. |
| `multimodal-reading-charts-graphs-powerpoints` | [link](https://platform.claude.com/cookbook/multimodal-reading-charts-graphs-powerpoints) | Sonnet | Chart/screenshot analysis. |
| `third-party-wikipedia-wikipedia-search-cookbook` | [link](https://platform.claude.com/cookbook/third-party-wikipedia-wikipedia-search-cookbook) | Legacy (Claude 2) | **Legacy** iterative search via pseudo-tool XML (`<search_query>`). Still useful for atomic keyword queries + tool-description prompting; superseded by native tool use. |

GitHub repo layout: [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks/tree/main) — notebooks under `tool_use/`, `patterns/`, `skills/`, `capabilities/`, etc.

---

## Integration status vs TechSapo AS-IS

### Already aligned (conceptual)

| Cookbook theme | TechSapo AS-IS | Gap |
|----------------|----------------|-----|
| Multi-LLM orchestration | Wall-Bounce rounds, TaskRouter | Cookbook = **intra-Claude** subagents; Wall-Bounce = **cross-vendor** — different layer; borrow **messaging discipline** only. |
| Long context / memory | TS-22 `OrchestrationSession`, Layer A events | No server-side compaction or memory tool wired in adapters. |
| RAG | Legacy Drive connector → platform path in docs | Contextual Embeddings + summary indexing / reranking cookbooks not implemented. |
| Extended thinking | `InferenceProfile.cot` (TS-20) | Adapter does not pass thinking params or preserve blocks — [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) |

### Not implemented (Track F / character phase)

- [ ] **F-7b** — Anthropic cookbook slug sync (this doc + `cookbookIndex`; no `registry.yaml` equivalent yet — manual slug list).
- [ ] **E-5** — `llm-character-sheets.json` resync from catalog keys + cookbook traits (partial — see character sheets).
- [ ] Runtime prompt injection from `prompting.guidanceTopics[]` (same pending state as OpenAI F-10).

---

## Per-pattern character signals (for Wall-Bounce prompts)

### Haiku — fast tier + structured extract

Cookbooks now benchmark Haiku for **tool-schema JSON extraction** and **web-page summarization**:

- **Role:** Fast analyze, structured extraction, single-pass ingest.
- **Dos:** Define tight `input_schema` tools; use `tool_choice` when shape is fixed; wrap fetched HTML in `<content>` tags; one tool call per extraction task.
- **Donts:** Multi-document ReAct orchestration; JSON prefill orchestration (Opus pattern); long agent loops.

### Opus — async multi-agent lead + JSON synthesis

From [async multi-agent orchestration](https://platform.claude.com/cookbook/patterns-agents-async-multi-agent-orchestration) and [JSON mode](https://platform.claude.com/cookbook/misc-how-to-enable-json-mode):

- **Role:** Coordinator that spawns helpers, polls status, collects messages, dismisses subagents; also **reliable JSON** via prefill/tags when aggregating.
- **Tools mindset:** Explicit inter-agent messaging only (`send_message`); idle agents use `wait_for_message`.
- **JSON mindset:** Prefill assistant with `{` to skip preamble; use XML wrapper tags for multiple JSON objects; brace-slice parse for simple cases.
- **Dos:** Summarize team state; kill finished helpers; peer introductions before synthesis; use prefill when downstream needs parseable JSON without tool_use.
- **Donts:** Assume plain assistant text reaches other agents; prefill when you need visible chain-of-thought before JSON.

### Sonnet — long-horizon agent + documents

From context engineering cookbooks plus [PDF summarization](https://platform.claude.com/cookbook/misc-pdf-upload-summarization):

- **Role:** Primary **analyze / agent-edit** model with tool loops, session continuity, and **document** inputs.
- **Dos:** Enable extended thinking for multi-step tool plans; use PDF document blocks for reports; preserve thinking blocks across tool rounds; pick compaction vs clearing vs memory by workload.
- **Donts:** Stuff irreplaceable tool output then clear it; skip memory writes for facts needed in session 2; expect thinking after every `tool_result`.

---

## Catalog fields populated

| Field | Anthropic usage |
|-------|-----------------|
| `references[]` | `type: "cookbook"` rows with platform URL + slug |
| `prompting.approach` | `orchestrator` (Opus), `agentic_long_horizon` (Sonnet), `fast` (Haiku) |
| `prompting.guidanceTopics[]` | Slugs in `promptGuidanceIndex` |
| `capabilities.compaction` | Where cookbook demonstrates first-party API |
| `apiFeatures.extendedThinking` | Mode, interleaved beta, block preservation — [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · migration [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) |
| `apiFeatures.parallelToolCalls` | Multi `tool_use` per turn; result batching — [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) |
| `apiFeatures.fineGrainedToolStreaming` | `eager_input_streaming` + SSE deltas — [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) · requires [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) |
| `apiFeatures.messageStreaming` | SSE event flow, deltas, error recovery — [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) |
| `apiFeatures.programmaticToolCalling` | `code_execution_20260120` + `allowed_callers` — [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) |
| `apiFeatures.promptCaching` | Automatic + explicit `cache_control`; 5m/1h TTL — [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) |
| `apiFeatures.midConversationSystemMessages` | `role: system` in messages — Opus 4.8 — [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md) |
| `apiFeatures.tokenCounting` | `messages/count_tokens` preflight — [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) |
| `apiFeatures.pdfSupport` | Document blocks (url / base64 / file) — [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) |
| `apiFeatures.visionSupport` | Image blocks — limits, token math — [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) |
| `apiFeatures.agentSkills` | `supported`, `zdrEligible: false`, pre-built ids, beta headers — [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · authoring [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) |
| `limits.contextTokens` / `apiFeatures.contextAwareness` | Context window + budget signals — [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) |
| `cookbookIndex` | Reverse map slug → model ids |

---

## Related documents

| Doc | Purpose |
|-----|---------|
| [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) | Platform hub — 5 areas, ZDR, catalog mapping |
| [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md) | Model family — current tier, legacy, migration |
| [ANTHROPIC_MODEL_SYSTEM_CARDS.md](./ANTHROPIC_MODEL_SYSTEM_CARDS.md) | Safety evals — system card PDF links |
| [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) | Per-model prompting / personality summary |
| [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md) | Multilingual / Japanese MMLU routing |
| [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) | Messages API SSE streaming |
| [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) | Programmatic tool calling (Sonnet 4.6) |
| [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) | Prompt caching — automatic, explicit, pre-warm |
| [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md) | Mid-session system messages (Opus 4.8) |
| [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) | Token counting preflight API |
| [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) | PDF document blocks — limits, sources, caching |
| [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) | Image vision — limits, coordinates, multi-image |
| [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) | Adaptive thinking + effort (4.6+ migration) |
| [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) | Extended thinking — manual mode (4.5 AS-IS) |
| [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) | Parallel tool calls + message history (platform) |
| [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) | Eager tool input streaming (platform) |
| [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) | Claude Code filesystem skills |
| [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) | Claude Code lifecycle hooks |
| [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) | Claude Code config diagnostics |
| [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) | Claude Code token cost reduction |
| [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) | Claude Code plugin marketplaces |
| [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) | Claude Code `/loop` and cron |
| [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) | Claude Code `claude -p` / Agent SDK CLI |
| [CLAUDE_CODE_DEEP_LINKS.md](./CLAUDE_CODE_DEEP_LINKS.md) | Claude Code `claude-cli://` deep links |
| [CLAUDE_CODE_BEST_PRACTICES.md](./CLAUDE_CODE_BEST_PRACTICES.md) | Claude Code workflow best practices |
| [CLAUDE_CODE_GLOSSARY.md](./CLAUDE_CODE_GLOSSARY.md) | Claude Code terminology index |
| [CLAUDE_CODE_AUTO_MODE.md](./CLAUDE_CODE_AUTO_MODE.md) | Claude Code auto mode classifier config |
| [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) | Claude Code OpenTelemetry monitoring |
| [CLAUDE_CODE_CLI_REFERENCE.md](./CLAUDE_CODE_CLI_REFERENCE.md) | Claude Code CLI commands and flags |
| [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) | Agent Skills overview — API, surfaces, security |
| [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) | Agent Skills authoring best practices (platform) |
| [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md) | API pricing — MTok rates, batch, tools |
| [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) | Context windows + compaction strategy (platform) |
| [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) | Message Batches for offline RAG (gated) |
| [OPENAI_COOKBOOK_INTEGRATION.md](./OPENAI_COOKBOOK_INTEGRATION.md) | Parallel OpenAI intake |
| [PROVIDER_INTEGRATION_BACKLOG.md](./PROVIDER_INTEGRATION_BACKLOG.md) | E-5, F-7 tracking |
| [TECH_STACK_LLM_MODEL_CATALOG.md](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) | Schema ADR |
