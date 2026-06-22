# Anthropic Multilingual Support Integration

**Status**: Documented — catalog `japaneseQuality` aligned with platform MMLU relative scores  
**Platform**: [Multilingual support](https://platform.claude.com/docs/en/docs/build-with-claude/multilingual-support) · [Prompt engineering overview](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/overview)  
**Related**: [ANTHROPIC_PROMPT_GUIDANCE.md](./ANTHROPIC_PROMPT_GUIDANCE.md) · [ANTHROPIC_CAPABILITIES_OVERVIEW.md](./ANTHROPIC_CAPABILITIES_OVERVIEW.md) · [TS-21](./decisions/TECH_STACK_LLM_MODEL_CATALOG.md) · [WALL_BOUNCE_SYSTEM.md](./WALL_BOUNCE_SYSTEM.md)

---

## What it is

Claude maintains **strong cross-lingual performance** on zero-shot tasks relative to English. Benchmarks use human-translated [MMLU](https://en.wikipedia.org/wiki/MMLU) (methodology aligned with [OpenAI simple-evals multilingual results](https://github.com/openai/simple-evals/blob/main/multilingual_mmlu_benchmark_results.md)). Scores below use **extended thinking** chain-of-thought evaluation per platform footnote.

**This fork:** User-facing Wall-Bounce output is **Japanese** ([constitution](../AGENTS.md#constitution)). Use this doc for model selection and prompting — not to override output language policy.

---

## Catalog AS-IS — Japanese relative performance

English baseline = **100%**. Values from platform multilingual table (zero-shot CoT + extended thinking).

| Catalog id | Japanese (vs English) | `capabilities.japaneseQuality` |
|------------|----------------------|--------------------------------|
| `claude-sonnet-4-6` | **96.8%** | `excellent` |
| `claude-opus-4-8` | ~97% tier (Opus 4.8 row; major langs 97–98%) | `excellent` |
| `claude-haiku-4-5` | **93.5%** | `good` |

**Routing guidance:**

| Task | Preferred catalog id |
|------|-------------------|
| Japanese user-facing synthesis, agentic analyze | Sonnet 4.6 |
| Japanese aggregate / cross-critique | Opus 4.8 |
| Fast Japanese extract / summarize (lower quality bar OK) | Haiku 4.5 |
| Low-resource languages (e.g. Yoruba ~80% Sonnet) | Sonnet 4.6 over Haiku |

Platform supports many languages beyond the benchmark table — **evaluate your target locale** on representative prompts.

---

## Full benchmark snapshot (selected languages)

Relative % vs English (100%). Source: platform multilingual doc.

| Language | Sonnet 4.6 | Opus 4.8 | Haiku 4.5 |
|----------|------------|----------|-----------|
| Spanish | 98.2 | 98.1 | 96.4 |
| French | 97.5 | 97.9 | 95.7 |
| German | 97.0 | 97.7 | 94.3 |
| Chinese (Simplified) | 96.9 | 97.1 | 94.2 |
| Korean | 96.7 | 96.6 | 93.3 |
| **Japanese** | **96.8** | **96.9** | **93.5** |
| Hindi | 96.7 | 96.8 | 92.4 |
| Swahili | 91.1 | 89.8 | 78.3 |
| Yoruba | 79.7 | 80.3 | 52.7 |

Haiku drops more on low-resource languages — avoid Haiku for Yoruba-class locales without validation.

---

## Best practices (prompting)

1. **Explicit language context** — State desired input/output language even though Claude auto-detects. For natural phrasing: instruct idiomatic, native-speaker style.
2. **Native script** — Send text in the language's native script, not romanization/transliteration.
3. **Cultural context** — Translation alone is insufficient for many UX and compliance tasks; add locale-specific constraints in the system prompt.

**Fork-specific (Japanese output):**

```text
Respond in Japanese. Use natural, idiomatic expressions suitable for
technical documentation. Preserve English product names and API identifiers
where standard in the industry.
```

Apply in `InferenceProfile` system layer / character sheets — not hard-coded in adapters until F-10 guidance injection.

Also follow general [prompt engineering guidelines](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/overview).

---

## Platform considerations

- Standard **Unicode** input/output for most world languages.
- Performance varies by language; widely spoken languages score highest.
- Meaningful capability on **low-resource** languages — but validate per use case.

**ZDR:** Multilingual capability is model inference — eligible under standard ZDR when using API with ZDR contract. No separate feature flag.

---

## Catalog fields

| Field | Usage |
|-------|--------|
| `capabilities.japaneseQuality` | `excellent` (Sonnet/Opus) · `good` (Haiku) — maps to MMLU Japanese relative tier |
| `prompting.guidanceTopics[]` | `multilingual-prompting`, `multilingual-native-script`, `multilingual-japanese` |
| `references[]` | Platform multilingual-support doc |

---

## AS-IS gaps

- `claude-adapter.ts` does not inject multilingual guidance topics (F-10).
- No automatic locale detection — explicit Japanese output prompt required per constitution.
- Haiku fast path may need Sonnet escalation for high-stakes Japanese synthesis.

---

## Backlog

- **F-10** — Inject `multilingual-japanese` topic when `clientTimezone` is `Asia/Tokyo` or session locale is `ja`.
- **E-5** — Character sheet defaults for Japanese technical prose on Sonnet/Opus rounds.

---

## References

- [Multilingual support (platform)](https://platform.claude.com/docs/en/docs/build-with-claude/multilingual-support)
- [Prompt engineering overview](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/overview)
- [Extended thinking](./ANTHROPIC_EXTENDED_THINKING.md) (benchmark footnote: CoT evals used thinking)
