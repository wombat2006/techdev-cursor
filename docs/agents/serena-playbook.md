# Serena Operations Playbook (TechSapo / Cursor)

Repo-specific Serena playbook for day-to-day engineering work in `techdev-cursor`.
This document is based on:

- Context7 docs for `"/oraios/serena"` (server startup, project indexing, MCP workflow)
- Verified behavior in this repository with `scripts/cursor-mcp-serena.sh` (`--context ide`)

---

## 1) Goal and Scope

Use Serena as the primary semantic navigator/editor for this repository, with a reliable reference-tracking workflow.
This playbook focuses on:

- startup and readiness checks
- reference tracing and declaration lookup patterns
- robust fallbacks when symbol tools are partial or unavailable

---

## 2) Baseline Environment (This Repo)

- MCP launcher: `scripts/cursor-mcp-serena.sh`
- Current context: `--context ide`
- Project path: `/home/wombat/techdev-cursor`
- Expected behavior in `ide` context: a reduced tool surface (semantic tools enabled, some file/system tools hidden)

Important: in this context, tools like `activate_project`, `list_dir`, `read_file`, and `execute_shell_command` may be intentionally excluded.

---

## 3) Official Serena Commands (Context7-Aligned)

From Context7 (`/oraios/serena`), operationally important commands are:

```bash
# Start MCP server
serena start-mcp-server --context=<client-context> --project <path>

# Build symbol index cache for a project (recommended once per project update cycle)
serena project index
```

In this repository, Cursor should invoke Serena through:

```bash
bash scripts/cursor-mcp-serena.sh
```

---

## 4) Session Boot Sequence (Mandatory)

For each new session, run tools in this order:

1. `initial_instructions`
2. `onboarding` (optional but recommended for memory awareness)
3. `search_for_pattern` or `find_symbol` as first code probe

Why: Serena explicitly requires `initial_instructions` before coding tasks.

---

## 5) Reference Tracking Playbook

Use this 4-step pattern for stable results.

### Step A: Locate the canonical symbol owner

Use `search_for_pattern` to find where the real implementation lives (not re-export shims).

Template:

```json
{
  "substring_pattern": "class\\s+WallBounceAnalyzer|executeWallBounce\\(",
  "relative_path": "src",
  "context_lines_before": 1,
  "context_lines_after": 1,
  "multiline": true
}
```

### Step B: Confirm symbol path with `find_symbol`

Template:

```json
{
  "name_path_pattern": "WallBounceAnalyzer",
  "relative_path": "src/services/wall-bounce/analyzer.ts",
  "substring_matching": true,
  "depth": 1
}
```

### Step C: Run reference tracing

Template (class or method):

```json
{
  "name_path": "WallBounceAnalyzer/initializeProviders",
  "relative_path": "src/services/wall-bounce/analyzer.ts"
}
```

Use this with `find_referencing_symbols`.

### Step D: Resolve declaration from a usage site

Use `find_declaration` with a single, unique regex group.

Template:

```json
{
  "relative_path": "src/services/wall-bounce/analyzer.ts",
  "regex": "this\\.(initializeProviders)\\(\\);",
  "include_info": true
}
```

---

## 6) High-Reliability Regex Patterns (Tested Here)

Patterns that worked in this repository:

- `this\\.(initializeProviders)\\(\\);`
- `(executeWallBounce)\\(prompt: string`

Patterns that failed (common reasons: non-unique matches or non-resolvable location):

- `new\\s+(WallBounceAnalyzer)\\(\\)` in files with multiple instantiations
- broad callsite patterns that match 2+ times

Rule: make regex specific enough to produce exactly one match.

---

## 7) Known Behavior in `--context ide`

Observed behavior in this repo:

- `find_symbol`, `search_for_pattern`, `find_referencing_symbols`, `find_declaration` are available
- class-level `find_referencing_symbols` may return partial/internal references
- method-level references can be stronger when `name_path` is exact
- cross-file resolution may still require pattern search fallback

This is normal for a reduced tool surface; do not treat it as a hard failure.

---

## 8) Fallback Strategy (When Reference Tracking Is Partial)

If semantic reference tracing is incomplete, use this fallback chain:

1. `search_for_pattern` for callsites across `src/`
2. `get_symbols_overview` on owning file to confirm symbol hierarchy
3. retry `find_referencing_symbols` with a refined `name_path`
4. if still partial, use `rg` to enumerate remaining callsites for verification

Recommended fallback query:

```json
{
  "substring_pattern": "executeWallBounce\\(",
  "relative_path": "src",
  "multiline": true
}
```

---

## 9) Practical Templates (Copy/Paste)

### A) Find class and immediate members

Tool: `find_symbol`

```json
{
  "name_path_pattern": "WallBounceAnalyzer",
  "relative_path": "src/services/wall-bounce/analyzer.ts",
  "substring_matching": true,
  "depth": 1
}
```

### B) Find references to a method

Tool: `find_referencing_symbols`

```json
{
  "name_path": "WallBounceAnalyzer/initializeProviders",
  "relative_path": "src/services/wall-bounce/analyzer.ts"
}
```

### C) Jump from usage to declaration

Tool: `find_declaration`

```json
{
  "relative_path": "src/services/wall-bounce/analyzer.ts",
  "regex": "this\\.(initializeProviders)\\(\\);",
  "include_info": true
}
```

### D) Enumerate callsites when semantic refs are incomplete

Tool: `search_for_pattern`

```json
{
  "substring_pattern": "executeWallBounce\\(",
  "relative_path": "src",
  "context_lines_before": 1,
  "context_lines_after": 1
}
```

---

## 10) Verification Checklist (Before Real Work)

- Serena MCP initialize succeeds via `scripts/cursor-mcp-serena.sh`
- `initial_instructions` returns successfully
- at least one `find_symbol` request returns expected class/method structure
- at least one `find_referencing_symbols` request returns non-empty result for a known method
- at least one `find_declaration` request resolves with `name_path` and location
- fallback `search_for_pattern` can enumerate callsites for the same target

If all pass, Serena is ready for production task flow in this repository.

---

## 11) Troubleshooting

- `Unknown tool: activate_project`  
  Expected in current `ide` context; continue with available semantic tools.

- `Match must be unique` (find_declaration)  
  Tighten regex with surrounding context until exactly one match remains.

- `No symbol declaration found at location`  
  Try declaration lookup from a local method call first; import/re-export lines may not resolve.

- empty references (`{}`) for expected symbol  
  Confirm canonical owner file, then retry with full `name_path` and fallback to pattern search.

---

## 12) Team Rule of Thumb

For this repository, the most reliable operational sequence is:

1. Serena semantic trace first
2. Serena pattern search second
3. `rg` validation last

This gives the best balance between semantic precision and practical completeness.
