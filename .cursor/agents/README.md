# Custom subagents (multi-model opinions)

Read-only opinion subagents for parallel second-opinion workflows.

| Subagent | Model | Invoke |
|----------|-------|--------|
| `gpt-opinion` | GPT-5.5 | `/gpt-opinion <question>` |
| `codex-opinion` | Codex 5.3 | `/codex-opinion <question>` |
| `gemini-opinion` | Gemini 3.1 Pro | `/gemini-opinion <question>` |

## Parallel comparison (example)

```text
Run /gpt-opinion, /codex-opinion, and /gemini-opinion in parallel on this design question:

<paste your question and minimal context>

Then compare the three opinions in a table: agreements, disagreements, and a merged recommendation.
```

## Requirements

- Enable **GPT-5.5**, **Codex 5.3**, and **Gemini 3.1 Pro** in Cursor **Settings → Models**.
- All three agents use `readonly: true` — opinions only, no file edits.
