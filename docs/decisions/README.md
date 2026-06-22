# Architecture Decision Records (ADR)

Index of design decisions for TechSapo. Logic/rule ADRs are written in **English**; customer-facing proposals may remain in Japanese.

---

## Active Records

| ID | Document | Status | Topic |
|----|----------|--------|-------|
| P5 | [WALL_BOUNCE_P5_ARCHITECTURE.md](./WALL_BOUNCE_P5_ARCHITECTURE.md) | Accepted | P5+ roadmap, Orchestrator, Grounding |
| TS-13 | [TECH_STACK_AWS_PERIPHERAL.md](./TECH_STACK_AWS_PERIPHERAL.md) | **Accepted (direction)** | AWS for SES, S3, Secrets Manager, KMS |
| TS-17 | [TECH_STACK_LLM_PROVIDER_TRANSPORT.md](./TECH_STACK_LLM_PROVIDER_TRANSPORT.md) | **Accepted** | stdio/MCP same-node; HTTP SSE at API boundary |
| TS-18 | [TECH_STACK_CORE_VS_ADDON_COUPLING.md](./TECH_STACK_CORE_VS_ADDON_COUPLING.md) | **Accepted (direction)** | Loose add-ons; cohesive Wall-Bounce core |
| TS-19 | [WALL_BOUNCE_P5_ARCHITECTURE.md §7](./WALL_BOUNCE_P5_ARCHITECTURE.md#7-形態素解析の位置づけ) | **Accepted (direction)** | Morphological analysis for PromptAnalyzer (Phase 0) |
| TS-20 | [TECH_STACK_INFERENCE_PROFILES.md](./TECH_STACK_INFERENCE_PROFILES.md) | **Accepted (direction)** | InferenceProfile: model, effort, CoT, temperature |
| TS-21 | [TECH_STACK_LLM_MODEL_CATALOG.md](./TECH_STACK_LLM_MODEL_CATALOG.md) | **Accepted (direction)** | Multi-vendor LLM model capability catalog schema |
| TS-23 | [TECH_STACK_USER_EXTENSIBLE_LLM.md](./TECH_STACK_USER_EXTENSIBLE_LLM.md) | **Accepted (direction)** | User L1–L2 catalog/matrix extensions; L3 adapter code |
| TS-24 | [TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md](./TECH_STACK_SESSION_CONTINUATION_AND_RETRY.md) | **Accepted (direction)** | Layer A continuation; negative retry with upward temperature jitter |
| TS-25 | [TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md](./TECH_STACK_WALL_BOUNCE_MODE_ROUTING.md) | **Accepted (direction)** | Default parallel-first; threshold branch; keyword/MCP mode overrides |
| TS-26 | [TECH_STACK_CLI_INVOKE_METADATA.md](./TECH_STACK_CLI_INVOKE_METADATA.md) | **Accepted (direction)** | CLI usage / stop_reason / session_id at adapter boundary (no API keys) |
| TS-22 | [TECH_STACK_MEMORY_SUBSTRATE.md](./TECH_STACK_MEMORY_SUBSTRATE.md) | **Accepted** — G-MEM 2026-06-18 | Layer A/B/C; event temporal metadata; idle 7d / max 30d TTL |
| — | [TECH_STACK_WORKSPACE.md](../TECH_STACK_WORKSPACE.md) | **Preparation** | Tech stack refinement workspace |
| — | [_TEMPLATE_TECH_STACK.md](./_TEMPLATE_TECH_STACK.md) | Template | New stack decision template |

## Planned (backlog)

Tech stack decisions will be added as `TECH_STACK_<topic>.md` when accepted. See workspace backlog TS-01 … TS-20.

---

## Adding a Decision

1. Copy `_TEMPLATE_TECH_STACK.md` → `TECH_STACK_<topic>.md`
2. Fill sections; set status to **Accepted** when agreed
3. Update this index and [TECH_STACK_WORKSPACE.md](../TECH_STACK_WORKSPACE.md)
4. Sync ARCHITECTURE + README + CLAUDE in same commit ([documentation-sync](../../.cursor/rules/documentation-sync.mdc))

---

## Related

- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
- [AGENTS.md](../../AGENTS.md)
- [CLAUDE.md](../../CLAUDE.md) (Claude Code shim)
