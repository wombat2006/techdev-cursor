---
name: platform-handoff
description: Prepare a term-prep-platform handoff prompt and reading checklist from techdev-cursor canonical docs. Use when the user mentions platform handoff, term-prep-platform, integration boundary, or wants to brief platform agents without editing the platform repo.
disable-model-invocation: true
---

# Platform handoff (term-prep-platform)

## Goal

Produce a **copy-paste prompt** the user can paste into a **term-prep-platform** agent chat so the agent fully understands the **consumer ↔ platform** boundary by reading **techdev-cursor canonical docs**.

## Non-negotiables

- Do **not** edit `term-prep-platform` from techdev-cursor tasks unless the user explicitly instructs otherwise.
- Do **not** mirror consumer boundary docs into `term-prep-platform` unless the user explicitly requests it.
- Keep the boundary canonical in **techdev-cursor** under `meta/platform-integration/`.

## Canonical docs to use (techdev-cursor)

These are already structured for platform-side reading. Prefer them over ad-hoc summaries:

- `meta/platform-integration/README.md` (index + path resolution + read order)
- `meta/platform-integration/01-repo-split.md` (implementation ownership)
- `meta/platform-integration/02-genspark-aidrive-boundary.md` (aidrive vs Vector Store; “Drive” surfaces)
- `meta/platform-integration/03-glossary-consumer-contract.md` (glossary + connector contract)
- `meta/platform-integration/PROMPT_START.md` (user-facing prompt template)

## Workflow

1. **Ask for the platform task** if not provided.
   - The prompt must contain a concrete `<YOUR TASK>` scoped to **term-prep-platform**.
2. **Output the exact prompt** the user should paste:
   - Base it on `meta/platform-integration/PROMPT_START.md`.
   - Replace `<YOUR TASK>` with the user’s concrete task.
3. **Add one short “what to do if missing sibling repo” line**:
   - If `../techdev-cursor` (or `$TECHDEV_CURSOR_ROOT`) is not available in the platform workspace, instruct the platform agent to stop and ask the user for the path.

## Output format (required)

Return **only**:

1. A short note (1–2 sentences) about when to use the prompt.
2. The final copy-paste prompt block (markdown fenced code block).

## Example task strings

- “Implement Google Drive corpus mirror on platform (Phase 0.5). Do not add Genspark or aidrive.”
- “Design Vector Store ingest connector on platform (Phase 4.5). Ingest from platform mirror paths, not aidrive.”
- “Fix glossary_extractor to respect `filter.max_candidates_output` from consumer config; consumer will re-run `npm run glossary:extract`.”

