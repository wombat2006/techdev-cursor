# Anthropic Prompt Guidance Integration

**Status**: Catalog + character sheets documented — runtime wiring pending (Track E-5 / F-10)  
**Source hub**: [Claude Cookbook](https://platform.claude.com/cookbook) · [GitHub](https://github.com/anthropics/claude-cookbooks)  
**Last reviewed**: 2026-06-22  
**Related**: [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md) · [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) · [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) · [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md) · [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) · [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) · [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · [ANTHROPIC_COOKBOOK_INTEGRATION.md](./ANTHROPIC_COOKBOOK_INTEGRATION.md) · [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) · [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md) · [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) · [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md) · [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md) · [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) · [config/llm-model-catalog.json](../config/llm-model-catalog.json)

---

## Per-model summary

### Claude Opus 4.6 (`claude-opus-4-6`) — default orchestrator / aggregator

- **Approach**: `orchestrator` — multi-agent lead, cross-critique, strategic synthesis (pre-4.7 tokenizer; lower effective cost vs 4.8 on identical payloads).
- **Wall-Bounce role**: `llm_aggregate` (default). Escalate to `claude-opus-4-8` when `confidence < 0.7` or `consensus < 0.6` after first pass — [ANTHROPIC_MODELS_OVERVIEW.md § Opus tier](./ANTHROPIC_MODELS_OVERVIEW.md#opus-tier-selection--aggregator).
- **Cookbook / prompting**: Same orchestration patterns as 4.8 below; prefer **`effort: medium`** on aggregate unless escalation warrants `high`.

### Claude Opus 4.8 (`claude-opus-4-8`) — escalation / `critical` aggregate

- **Approach**: `orchestrator` — multi-agent lead, cross-critique, strategic synthesis.
- **Cookbook anchors**:
  - [Async multi-agent orchestration](https://platform.claude.com/cookbook/patterns-agents-async-multi-agent-orchestration)
  - [JSON mode (prompting)](https://platform.claude.com/cookbook/misc-how-to-enable-json-mode)
  - [Multi-document agents (LlamaIndex)](https://platform.claude.com/cookbook/third-party-llamaindex-multi-document-agents)
- **Strengths**: Dynamic subagent spawn, hub messaging, status polling, team summary; reliable JSON via prefill/XML tags; per-corpus ReAct routing.
- **Prompting dos**:
  - Assign explicit peer/helper roles; require structured handoffs (`send_message` discipline).
  - Use `get_status` / collect-then-`kill_subagents` pattern for parallel work.
  - Finish with one consolidated summary after all helpers report.
  - For parseable JSON without tools: prefill assistant content with `{`; use XML tags when multiple JSON objects; brace-slice for simple outputs.
  - For large document collections: one ReAct agent per corpus with vector + summary tools; top-level retriever picks agent.
- **Prompting donts**:
  - Do not rely on free-form assistant prose to coordinate other agents.
  - Do not leave orphaned subagents running after synthesis.
  - Do not use JSON prefill when you need visible chain-of-thought before the JSON body.
- **Wall-Bounce role**: `llm_aggregate`, `llm_cross_critique` (aggregator-only in DevAssist fork).
- **Multilingual / Japanese**: MMLU Japanese ~97% tier; `japaneseQuality: excellent` — [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md).
- **Extended thinking**: Manual mode for hard synthesis; preserve thinking blocks when tool-using aggregate paths run. **Migration:** Opus 4.8+ requires `thinking: {type: "adaptive"}` + `effort` — [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md). AS-IS manual: [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).
- **Prompt caching:** Cache static orchestrator system + tool defs across rounds; explicit breakpoints preferred — [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md).
- **Mid-conversation system (Opus 4.8 migration):** Append `role: system` after cache breakpoint for mid-session policy without busting prefix — [ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md](./ANTHROPIC_MID_CONVERSATION_SYSTEM_MESSAGES.md). AS-IS Opus 4.8: edit top-level `system` or use `user` turn.

### Claude Sonnet 4.6 (`claude-sonnet-4-6`) — agentic long horizon

- **Approach**: `agentic_long_horizon` — tool loops, extended thinking, context engineering.
- **Cookbook anchors**:
  - [Extended thinking with tool use](https://platform.claude.com/cookbook/extended-thinking-extended-thinking-with-tool-use)
  - [Context engineering tools](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)
  - [Automatic context compaction](https://platform.claude.com/cookbook/tool-use-automatic-context-compaction)
  - [Memory cookbook](https://platform.claude.com/cookbook/tool-use-memory-cookbook)
  - [PDF upload summarization](https://platform.claude.com/cookbook/misc-pdf-upload-summarization)
  - [Getting started with vision](https://platform.claude.com/cookbook/multimodal-getting-started-with-vision)
- **Strengths**: Transparent pre-tool reasoning; compaction / clearing / memory selection; multi-session memory tool; PDF document blocks and image vision (charts, screenshots).
- **Prompting dos**:
  - Enable extended thinking for multi-step tool plans; **preserve thinking blocks** on API replay.
  - Diagnose context problem first: re-fetchable tool bloat → clearing; long chat → compaction; cross-session facts → memory files.
  - Guide memory paths (`/memories`) for facts that must survive session boundaries.
  - Pass PDFs as document blocks when analyzing reports; pass screenshots/charts as image blocks — [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md).
  - **Agent Skills:** Pre-built pptx/xlsx/docx/pdf (API) or `.claude/skills/` (Claude Code) — [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · authoring [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md).
  - **Claude Code hooks:** Deterministic format/guard/compact reminders via `.claude/settings.json` — [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md).
  - **Claude Code debug:** `/context`, `/doctor`, `--safe-mode` when config does not load — [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md).
  - **Claude Code costs:** `/usage`, `/clear`, model/MCP/hooks discipline — [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md).
  - **Claude Code plugins:** `/plugin` marketplaces, LSP code intelligence, `/reload-plugins` — [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md).
  - **Claude Code scheduled:** `/loop`, `loop.md`, cron tools — session-scoped; use Routines for cloud — [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md).
  - **Claude Code programmatic:** `claude -p`, `--bare` for CI, `--output-format json` — [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md); adapter uses `--print` AS-IS.
  - **Claude Code deep links:** `claude-cli://open` for runbooks/alerts — [CLAUDE_CODE_DEEP_LINKS.md](./CLAUDE_CODE_DEEP_LINKS.md).
  - **Claude Code best practices:** context budget, verify loops, plan mode, lean CLAUDE.md — [CLAUDE_CODE_BEST_PRACTICES.md](./CLAUDE_CODE_BEST_PRACTICES.md).
  - **Claude Code CLI:** commands/flags; adapter uses `--print --model --strict-mcp-config` — [CLAUDE_CODE_CLI_REFERENCE.md](./CLAUDE_CODE_CLI_REFERENCE.md).
  - **Claude Code glossary:** term index (agentic loop, compaction, hooks, MCP, skills) — [CLAUDE_CODE_GLOSSARY.md](./CLAUDE_CODE_GLOSSARY.md).
  - **Claude Code auto mode:** `autoMode` trusted infra, deny/allow overrides, `claude auto-mode` inspect — [CLAUDE_CODE_AUTO_MODE.md](./CLAUDE_CODE_AUTO_MODE.md).
  - **Claude Code monitoring:** OTel metrics/events/traces; SIEM audit via logs exporter — [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) (server stack: [MONITORING_OPERATIONS.md](./MONITORING_OPERATIONS.md)).
- **Prompting donts**:
  - Do not expect a new thinking block immediately after every `tool_result` (only after next non-tool user turn).
  - Do not clear tool results that cannot be re-fetched.
  - Do not stack all three primitives blindly — compose by workload (see context engineering cookbook framework).
- **Wall-Bounce role**: `llm_analyze`, `llm_agent_edit`, default balanced preset.
- **Multilingual / Japanese**: MMLU Japanese **96.8%**; `japaneseQuality: excellent` — primary Japanese agent path — [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md).
- **Context window**: 200k; context-aware token budget; diagnose rot vs limit — compaction / clearing / memory by workload — [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md).
- **Token counting:** Preflight PDF/image/agent payloads via `messages/count_tokens` — [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md).
- **Programmatic tool calling:** Fan-out / filter workloads via `code_execution_20260120` + `allowed_callers` — Sonnet 4.6 only in catalog; **not ZDR** — [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md).
- **Prompt caching:** Automatic multi-turn or explicit breakpoints on static system/tools; min 1024 tokens; 1h TTL for batch — [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) · rates [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md).
- **Extended thinking**: Manual `enabled` + `budget_tokens` (min 1024); interleaved tool loops need beta header `interleaved-thinking-2025-05-14`; `display: "omitted"` for low-latency automation. **Migration (4.6+):** `thinking: {type: "adaptive"}` + `effort`; interleaved automatic — [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md). **Parallel tools:** batch all `tool_result` in one user message — [ANTHROPIC_PARALLEL_TOOL_USE.md](./ANTHROPIC_PARALLEL_TOOL_USE.md). **Large tool payloads:** `eager_input_streaming: true` + SSE `input_json_delta` — [ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md](./ANTHROPIC_FINE_GRAINED_TOOL_STREAMING.md). AS-IS manual details: [ANTHROPIC_EXTENDED_THINKING.md](./ANTHROPIC_EXTENDED_THINKING.md).

### Claude Haiku 4.5 (`claude-haiku-4-5`) — fast extract + summarize

- **Approach**: `fast` — low reasoning tier, tool-capable, cost-sensitive.
- **Cookbook anchors**:
  - [Extracting structured JSON](https://platform.claude.com/cookbook/tool-use-extracting-structured-json)
  - [Read web pages with Haiku](https://platform.claude.com/cookbook/misc-read-web-pages-with-haiku)
- **Strengths**: Custom tool schemas for NER / sentiment / classification / summarization; single-pass web ingest + summary.
- **Prompting dos**:
  - Define explicit `input_schema` per extraction task; use `tool_choice` when output shape is fixed.
  - Wrap page body in `<content>` or `<article>` tags; instruct `Use the <tool_name> tool`.
  - Use `additionalProperties: true` only when field names are unknown; guide via prompt.
- **Prompting donts**: Subagent orchestration lead; long compaction-heavy sessions; extended thinking budgets; Opus-style JSON prefill (prefer tool_use for Haiku).
- **Multilingual / Japanese**: MMLU Japanese **93.5%**; `japaneseQuality: good` — fast extract only; escalate synthesis to Sonnet — [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md).
- **Status**: `planned` in catalog — Contract Layer preset binding pending.

---

## Guidance topics → catalog mapping

| Topic slug | Primary models | Cookbook source |
|------------|----------------|-----------------|
| `hub-peer-messaging` | claude-opus-4-8 | async-multi-agent-orchestration |
| `subagent-lifecycle` | claude-opus-4-8 | async-multi-agent-orchestration |
| `extended-thinking-tool-use` | claude-sonnet-4-6 | extended-thinking-with-tool-use |
| `preserve-thinking-blocks` | claude-sonnet-4-6, claude-opus-4-8 | extended-thinking platform + cookbook |
| `interleaved-thinking-beta` | claude-sonnet-4-6, claude-opus-4-8 | extended-thinking platform |
| `thinking-display-omitted` | claude-sonnet-4-6, claude-opus-4-8 | extended-thinking platform |
| `adaptive-thinking-migration` | claude-sonnet-4-6, claude-opus-4-8 | [ANTHROPIC_ADAPTIVE_THINKING.md](./ANTHROPIC_ADAPTIVE_THINKING.md) — target 4.6+ |
| `adaptive-thinking-effort` | claude-sonnet-4-6, claude-opus-4-8 | adaptive-thinking + effort platform |
| `thinking-prompt-steering` | claude-sonnet-4-6, claude-opus-4-8 | adaptive-thinking platform |
| `thinking-mode-cache-invalidation` | claude-sonnet-4-6, claude-opus-4-8 | adaptive-thinking platform |
| `multilingual-prompting` | all Claude catalog ids | [ANTHROPIC_MULTILINGUAL_SUPPORT.md](./ANTHROPIC_MULTILINGUAL_SUPPORT.md) |
| `multilingual-native-script` | all Claude catalog ids | multilingual-support platform |
| `multilingual-japanese` | all Claude catalog ids | multilingual-support + fork constitution |
| `message-streaming-sse` | all Claude catalog ids | [ANTHROPIC_MESSAGE_STREAMING.md](./ANTHROPIC_MESSAGE_STREAMING.md) |
| `streaming-thinking-delta` | claude-sonnet-4-6, claude-opus-4-8 | message-streaming + extended-thinking |
| `streaming-error-recovery` | claude-sonnet-4-6, claude-opus-4-8 | message-streaming (4.5 vs 4.6+ strategies) |
| `streaming-final-message` | all Claude catalog ids | SDK get_final_message / accumulator |
| `programmatic-tool-calling` | claude-sonnet-4-6 | [ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md](./ANTHROPIC_PROGRAMMATIC_TOOL_CALLING.md) |
| `allowed-callers-field` | claude-sonnet-4-6 | programmatic-tool-calling platform |
| `programmatic-container-lifecycle` | claude-sonnet-4-6 | container id / expires_at |
| `programmatic-tool-result-only` | claude-sonnet-4-6 | tool_result-only user turns |
| `programmatic-async-await` | claude-sonnet-4-6 | await in sandbox-generated code |
| `programmatic-token-efficiency` | claude-sonnet-4-6 | fan-out / filter vs sequential overhead |
| `programmatic-error-handling` | claude-sonnet-4-6 | container timeout, tool_choice errors |
| `prompt-caching-automatic` | all Claude catalog ids | [ANTHROPIC_PROMPT_CACHING.md](./ANTHROPIC_PROMPT_CACHING.md) |
| `prompt-caching-explicit-breakpoints` | all Claude catalog ids | prompt-caching platform · misc-prompt-caching cookbook |
| `prompt-caching-1h-ttl` | claude-sonnet-4-6, claude-opus-4-8 | prompt-caching platform · batch RAG |
| `prompt-caching-pre-warm` | claude-sonnet-4-6, claude-opus-4-8 | max_tokens: 0 pre-warm |
| `prompt-caching-usage-fields` | all Claude catalog ids | cache_read / cache_creation / input_tokens |
| `prompt-caching-invalidation` | claude-sonnet-4-6, claude-opus-4-8 | thinking + tool_choice invalidation |
| `mid-conversation-system-message` | claude-opus-4-8 | Opus 4.8 migration — role:system in messages |
| `mid-conversation-placement` | claude-opus-4-8 | after user/tool_result; not between tool_use and result |
| `mid-conversation-prompt-caching` | claude-opus-4-8 | append after cache breakpoint |
| `mid-conversation-tool-relay` | claude-opus-4-8 | user input during agent loop |
| `token-counting-api` | all Claude catalog ids | [ANTHROPIC_TOKEN_COUNTING.md](./ANTHROPIC_TOKEN_COUNTING.md) |
| `token-counting-tools-modality` | all Claude catalog ids | tools, images, PDFs in count |
| `token-counting-extended-thinking` | claude-sonnet-4-6, claude-opus-4-8 | prior thinking ignored in count |
| `token-counting-vs-prompt-cache` | claude-sonnet-4-6, claude-opus-4-8 | count does not simulate cache |
| `token-counting-rate-limits` | all Claude catalog ids | free; separate RPM from create |
| `parallel-tool-use` | all Claude catalog ids | parallel-tool-use platform |
| `parallel-tool-result-batching` | all Claude catalog ids | parallel-tool-use platform |
| `parallel-tool-prompting` | claude-sonnet-4-6, claude-opus-4-8 | parallel-tool-use platform |
| `fine-grained-tool-streaming` | all Claude catalog ids | fine-grained-tool-streaming platform |
| `tool-input-json-delta` | all Claude catalog ids | fine-grained-tool-streaming platform |
| `context-window-management` | all Claude catalog ids | context-windows platform |
| `context-awareness` | claude-sonnet-4-6, claude-haiku-4-5 | context-windows platform |
| `context-window-overflow` | all Claude catalog ids | context-windows platform |
| `context-compaction` | claude-sonnet-4-6 | automatic-context-compaction, context-engineering-tools |
| `tool-result-clearing` | claude-sonnet-4-6 | context-engineering-tools |
| `memory-tool-cross-session` | claude-sonnet-4-6 | memory-cookbook, context-engineering-tools |
| `skills-document-generation` | claude-sonnet-4-6 | skills-introduction · pre-built pptx/xlsx/docx/pdf |
| `skills-progressive-disclosure` | claude-sonnet-4-6 | [ANTHROPIC_AGENT_SKILLS.md](./ANTHROPIC_AGENT_SKILLS.md) 3-level loading |
| `skills-api-container` | claude-sonnet-4-6 | Beta headers + container.skill_id |
| `skills-prebuilt-office-pdf` | claude-sonnet-4-6 | pptx, xlsx, docx, pdf skill ids |
| `skills-security-audit` | claude-sonnet-4-6 | Trust + audit bundled files |
| `skills-surface-constraints` | claude-sonnet-4-6 | API vs Code vs claude.ai runtime |
| `claude-code-skills-layout` | claude-sonnet-4-6 | [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) paths, precedence |
| `claude-code-skills-frontmatter` | claude-sonnet-4-6 | disable-model-invocation, allowed-tools, fork |
| `claude-code-skills-shell-injection` | claude-sonnet-4-6 | `` !`cmd` `` dynamic context |
| `claude-code-skills-subagent-fork` | claude-sonnet-4-6 | context: fork + agent |
| `claude-code-skills-skill-overrides` | claude-sonnet-4-6 | skillOverrides, Skill tool permissions |
| `claude-code-bundled-run-verify` | claude-sonnet-4-6 | /run, /verify, /run-skill-generator |
| `claude-code-mcp-scopes` | claude-sonnet-4-6 | [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) local/user/project |
| `claude-code-mcp-transports` | claude-sonnet-4-6 | http vs stdio; `--` separator |
| `claude-code-mcp-oauth-auth` | claude-sonnet-4-6 | `/mcp` Authenticate; Bearer header |
| `claude-code-mcp-troubleshooting` | claude-sonnet-4-6 | MCP_TIMEOUT, wrong config paths |
| `claude-code-hooks-events` | claude-sonnet-4-6 | [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) lifecycle table |
| `claude-code-hooks-command-io` | claude-sonnet-4-6 | stdin JSON, exit 0/2, structured output |
| `claude-code-hooks-matchers` | claude-sonnet-4-6 | Edit\|Write, `if` field (v2.1.85+) |
| `claude-code-hooks-compaction` | claude-sonnet-4-6 | SessionStart compact + [ANTHROPIC_CONTEXT_WINDOW.md](./ANTHROPIC_CONTEXT_WINDOW.md) |
| `claude-code-hooks-permissions` | claude-sonnet-4-6 | PreToolUse deny vs bypass; PermissionRequest |
| `claude-code-debug-context-commands` | claude-sonnet-4-6 | [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) `/context` `/memory` `/doctor` |
| `claude-code-debug-settings-scope` | claude-sonnet-4-6 | settings.json vs ~/.claude.json; scope precedence |
| `claude-code-debug-isolation` | claude-sonnet-4-6 | `--safe-mode`, `CLAUDE_CONFIG_DIR` clean session |
| `claude-code-debug-common-causes` | claude-sonnet-4-6 | Symptom table — hooks, MCP, skills, CLAUDE.md |
| `claude-code-cost-usage-tracking` | claude-sonnet-4-6 | [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) `/usage`, workspace limits |
| `claude-code-cost-context-management` | claude-sonnet-4-6 | `/clear`, `/compact`, CLAUDE.md under ~200 lines |
| `claude-code-cost-model-mcp` | claude-sonnet-4-6 | Sonnet vs Opus; MCP deferred; CLI over MCP |
| `claude-code-cost-hooks-skills` | claude-sonnet-4-6 | PreToolUse preprocess; skills on-demand |
| `claude-code-cost-thinking-teams` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | `/effort`, agent teams ~7×, subagent model |
| `anthropic-pricing-catalog-as-is` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | [ANTHROPIC_PRICING.md](./ANTHROPIC_PRICING.md) catalog MTok rates |
| `anthropic-pricing-prompt-caching-multipliers` | all Claude catalog ids | 1.25×/2× write, 0.1× read |
| `anthropic-pricing-batch-discount` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | 50% batch input/output |
| `anthropic-pricing-tool-features` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | web search, code execution, tool overhead |
| `anthropic-pricing-cloud-billing` | claude-sonnet-4-6, claude-opus-4-8 | CCU, Bedrock/Vertex +10% regional |
| `anthropic-models-overview-current-tier` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md) Opus 4.8 / Sonnet 4.6 / Haiku 4.5 |
| `anthropic-models-overview-lineup` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | [ANTHROPIC_MODELS_OVERVIEW.md](./ANTHROPIC_MODELS_OVERVIEW.md) § Model lineup — Sonnet 4.6 / Opus 4.8 + costs |
| `anthropic-models-overview-version-policy` | claude-sonnet-4-6, claude-opus-4-6, claude-opus-4-8, claude-haiku-4-5 | Sonnet latest; Opus **4.6** aggregate default, **4.8** escalate |
| `anthropic-models-overview-id-versioning` | all Claude catalog ids | dated vs dateless pinned snapshots |
| `anthropic-models-overview-fable-mythos` | claude-sonnet-4-6, claude-opus-4-6, claude-opus-4-8 | Fable 5 GA; Mythos 5 Glasswing |
| `anthropic-models-overview-migration` | claude-sonnet-4-6, claude-opus-4-6, claude-opus-4-8 | Opus 4.1 → 4.6/4.8 (2026-08-05); Sonnet 4 / Opus 4 → 4.6/4.8 (2026-06-15) |
| `anthropic-system-cards-index` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | [ANTHROPIC_MODEL_SYSTEM_CARDS.md](./ANTHROPIC_MODEL_SYSTEM_CARDS.md) index |
| `anthropic-system-cards-catalog-as-is` | claude-sonnet-4-6, claude-opus-4-8, claude-haiku-4-5 | Per-model PDF links in catalog references |
| `anthropic-system-cards-migration-tier` | claude-sonnet-4-6, claude-opus-4-8 | Opus 4.8 / Sonnet 4.6 cards when upgrading |
| `claude-code-plugins-marketplaces` | claude-sonnet-4-6 | [CLAUDE_CODE_PLUGINS.md](./CLAUDE_CODE_PLUGINS.md) official vs community |
| `claude-code-plugins-install-scopes` | claude-sonnet-4-6 | user / project / local / managed; `plugin-name:skill` |
| `claude-code-plugins-code-intelligence` | claude-sonnet-4-6 | LSP plugins; binary on PATH; diagnostics |
| `claude-code-plugins-reload-cost` | claude-sonnet-4-6 | `/reload-plugins`; cache invalidation v2.1.163 |
| `claude-code-plugins-team-config` | claude-sonnet-4-6 | `extraKnownMarketplaces` in settings.json |
| `claude-code-scheduled-loop` | claude-sonnet-4-6 | [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) `/loop` fixed vs dynamic |
| `claude-code-scheduled-loop-md` | claude-sonnet-4-6 | `.claude/loop.md` default maintenance prompt |
| `claude-code-scheduled-cron-tools` | claude-sonnet-4-6 | CronCreate/List/Delete; 50 max |
| `claude-code-scheduled-jitter-expiry` | claude-sonnet-4-6 | Jitter rules; 7-day recurring expiry |
| `claude-code-scheduled-vs-cloud` | claude-sonnet-4-6 | Routines vs Desktop vs `/loop` |
| `claude-code-programmatic-print-mode` | claude-sonnet-4-6 | [CLAUDE_CODE_PROGRAMMATIC.md](./CLAUDE_CODE_PROGRAMMATIC.md) `claude -p` basics |
| `claude-code-programmatic-bare-mode` | claude-sonnet-4-6 | `--bare` CI; explicit flags only |
| `claude-code-programmatic-structured-output` | claude-sonnet-4-6 | json / stream-json / json-schema |
| `claude-code-programmatic-permissions-ci` | claude-sonnet-4-6 | `--allowedTools`, permission-mode |
| `claude-code-programmatic-sessions` | claude-sonnet-4-6 | `--continue`, `--resume`, session_id |
| `claude-code-deeplink-build` | claude-sonnet-4-6 | [CLAUDE_CODE_DEEP_LINKS.md](./CLAUDE_CODE_DEEP_LINKS.md) `claude-cli://open?q=` |
| `claude-code-deeplink-cwd-repo` | claude-sonnet-4-6 | `cwd` vs `repo`; most-recent clone |
| `claude-code-deeplink-runbooks` | claude-sonnet-4-6 | PagerDuty/incident runbook embed; GitHub MD caveat |
| `claude-code-deeplink-registration` | claude-sonnet-4-6 | OS handler; disableDeepLinkRegistration |
| `claude-code-deeplink-troubleshooting` | claude-sonnet-4-6 | Plain text on GitHub; home dir fallback |
| `claude-code-best-practices-context` | claude-sonnet-4-6 | [CLAUDE_CODE_BEST_PRACTICES.md](./CLAUDE_CODE_BEST_PRACTICES.md) context as scarce resource |
| `claude-code-best-practices-verification` | claude-sonnet-4-6 | tests, /goal, Stop hook, subagent review |
| `claude-code-best-practices-plan-workflow` | claude-sonnet-4-6 | explore → plan → implement; when to skip |
| `claude-code-best-practices-claude-md` | claude-sonnet-4-6 | /init, prune, skills vs CLAUDE.md |
| `claude-code-best-practices-session-management` | claude-sonnet-4-6 | /clear, /rewind, subagents, checkpoints |
| `claude-code-best-practices-automation` | claude-sonnet-4-6 | -p fan-out, parallel sessions, auto mode |
| `claude-code-cli-commands-core` | claude-sonnet-4-6 | [CLAUDE_CODE_CLI_REFERENCE.md](./CLAUDE_CODE_CLI_REFERENCE.md) claude, -p, auth, mcp |
| `claude-code-cli-print-flags` | claude-sonnet-4-6 | --bare, --output-format, --json-schema, budget |
| `claude-code-cli-session-resume` | claude-sonnet-4-6 | -c, -r, --name, --worktree |
| `claude-code-cli-permissions` | claude-sonnet-4-6 | --allowedTools, --permission-mode |
| `claude-code-cli-background-agents` | claude-sonnet-4-6 | --bg, agents, attach, daemon |
| `claude-code-glossary-core` | claude-sonnet-4-6 | [CLAUDE_CODE_GLOSSARY.md](./CLAUDE_CODE_GLOSSARY.md) agentic loop, harness, tools |
| `claude-code-glossary-context` | claude-sonnet-4-6 | context window, compaction, CLAUDE.md, auto memory |
| `claude-code-glossary-extensions` | claude-sonnet-4-6 | hooks, skills, MCP, plugins, subagents |
| `claude-code-glossary-permissions` | claude-sonnet-4-6 | permission mode, rules, sandbox, auto mode |
| `claude-code-glossary-deprecated` | claude-sonnet-4-6 | headless→non-interactive, commands→skills |
| `claude-code-auto-mode-scopes` | claude-sonnet-4-6 | [CLAUDE_CODE_AUTO_MODE.md](./CLAUDE_CODE_AUTO_MODE.md) settings scopes, not .claude/settings.json |
| `claude-code-auto-mode-environment` | claude-sonnet-4-6 | `autoMode.environment` prose + `$defaults` |
| `claude-code-auto-mode-rules` | claude-sonnet-4-6 | hard_deny / soft_deny / allow precedence |
| `claude-code-auto-mode-inspect` | claude-sonnet-4-6 | `claude auto-mode defaults|config|critique` |
| `claude-code-monitoring-otel-setup` | claude-sonnet-4-6 | [CLAUDE_CODE_MONITORING.md](./CLAUDE_CODE_MONITORING.md) CLAUDE_CODE_ENABLE_TELEMETRY + OTLP |
| `claude-code-monitoring-metrics` | claude-sonnet-4-6 | token/cost/session metrics; cardinality flags |
| `claude-code-monitoring-events-audit` | claude-sonnet-4-6 | tool_decision, MCP, hooks; prompt.id correlation |
| `claude-code-monitoring-traces` | claude-sonnet-4-6 | ENHANCED_TELEMETRY_BETA spans + TRACEPARENT |
| `claude-code-monitoring-privacy` | claude-sonnet-4-6 | OTEL_LOG_USER_PROMPTS / TOOL_DETAILS / RAW_API_BODIES |
| `skills-authoring-best-practices` | claude-sonnet-4-6 | [ANTHROPIC_SKILLS_AUTHORING.md](./ANTHROPIC_SKILLS_AUTHORING.md) |
| `skills-executable-scripts` | claude-sonnet-4-6 | Bundled scripts; API no network |
| `pdf-document-blocks` | claude-sonnet-4-6 | [ANTHROPIC_PDF_SUPPORT.md](./ANTHROPIC_PDF_SUPPORT.md) · misc-pdf-upload-summarization |
| `pdf-source-url-base64-file` | claude-sonnet-4-6 | pdf-support platform — url, base64, file_id |
| `pdf-limits-chunking` | claude-sonnet-4-6 | 32MB / 600p / dense-PDF chunking |
| `pdf-caching-batch` | claude-sonnet-4-6 | cache_control on document + Message Batches |
| `vision-image-blocks` | claude-sonnet-4-6 | [ANTHROPIC_VISION.md](./ANTHROPIC_VISION.md) · multimodal-getting-started-with-vision |
| `vision-source-url-base64-file` | claude-sonnet-4-6 | url, base64, file_id image sources |
| `vision-limits-token-cost` | claude-sonnet-4-6 | 28×28 patches; 1568 cap on 4.5 AS-IS |
| `vision-prompt-placement` | claude-sonnet-4-6 | Image before text; Image 1/2 labels |
| `vision-coordinates-bounding-box` | claude-sonnet-4-6 | Pixel coords; pre-resize; PDF caveat |
| `vision-multi-image-comparison` | claude-sonnet-4-6 | Multi-image + multi-turn vision |
| `vision-high-resolution-migration` | claude-sonnet-4-6, claude-opus-4-8 | Opus 4.7+ 2576/4784 — migration note |
| `structured-json-tool-use` | claude-haiku-4-5 | extracting-structured-json |
| `web-page-summarization` | claude-haiku-4-5 | read-web-pages-with-haiku |
| `json-mode-prefill` | claude-opus-4-8 | how-to-enable-json-mode |
| `multi-document-react-agents` | claude-opus-4-8 | llamaindex-multi-document-agents |
| `iterative-search-tool-use` | claude-sonnet-4-6, claude-haiku-4-5 | wikipedia-search-cookbook (legacy) |
| `contextual-embeddings-rag` | (pipeline) | contextual-embeddings-guide |
| `rag-summary-indexing-reranking` | (pipeline) | retrieval-augmented-generation-guide |
| `batch-api-offline` | all Claude (gated) | misc-batch-processing · [ANTHROPIC_BATCH_API_RAG.md](./ANTHROPIC_BATCH_API_RAG.md) |

Full reverse index: `promptGuidanceIndex` in catalog JSON.

---

## Opus orchestration prompt fragment (cookbook-derived)

```xml
<orchestration_contract>
- Coordinate helpers only via explicit structured messages, not inline prose.
- After parallel work: poll status, collect all reports, then dismiss helpers.
- End with a single team-level summary.
</orchestration_contract>
```

## Sonnet long-horizon prompt fragment (cookbook-derived)

```xml
<context_engineering>
- Re-fetchable tool output dominating context → prefer tool-result clearing.
- Long in-session thread → server-side compaction with custom summary prompt.
- Facts needed next session → memory tool / file-backed notes, not full chat replay.
- Multi-step tools → extended thinking before first tool call; preserve thinking blocks on replay.
</context_engineering>
```

## Haiku structured extraction prompt fragment (cookbook-derived)

```xml
<extraction_contract>
- Use a single named tool with an explicit input_schema matching the desired JSON shape.
- Wrap source text in <article> or <document> tags; instruct: "Use the `print_*` tool."
- Prefer tool_use over free-form JSON in assistant text for reliable parsing.
</extraction_contract>
```

## Opus JSON prefill fragment (cookbook-derived)

```xml
<json_output>
- Prefill assistant message with "Here is the JSON requested:\n{" to skip preamble.
- Parse with brace slice or require XML wrapper tags for multiple objects.
- Note: prefill prevents chain-of-thought before JSON — use tools or thinking when reasoning must be visible.
</json_output>
```

---

## CLI mapping (this fork)

| Cookbook transport | TechSapo path |
|--------------------|---------------|
| `anthropic.AsyncAnthropic()` + API key | **Reference only** — not default |
| Claude Agent SDK compaction | **To-Be** — adapter / session layer |
| `claude` CLI / Claude Code | **AS-IS** preferred per `transport.preferredInvocation` |

---

## Sync checklist (on cookbook updates)

1. Re-fetch platform cookbook page or GitHub notebook diff.
2. Update `references[]` + `cookbookIndex` on affected model rows.
3. Refresh `prompting.guidanceTopics[]` and this doc's per-model section.
4. Resync [src/config/llm-character-sheets.json](../src/config/llm-character-sheets.json) keys to catalog `id`.
5. Run `npm run validate:config`.
