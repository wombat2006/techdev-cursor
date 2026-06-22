# Claude Code — Plugins and Marketplaces

**Status**: Documented — fork has no committed plugin marketplace config (Track E-8)  
**Platform**: [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins) · [claude.com/plugins](https://claude.com/plugins) · [Create plugins](https://code.claude.com/docs/en/plugins) · [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_MCP_CONNECT.md](./CLAUDE_CODE_MCP_CONNECT.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_SCHEDULED_TASKS.md](./CLAUDE_CODE_SCHEDULED_TASKS.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

**Plugins** extend Claude Code with skills, agents, hooks, MCP servers, and LSP (code intelligence). **Marketplaces** are catalogs — adding a marketplace registers the catalog; you still **install plugins individually**.

Two-step flow:

1. **`/plugin marketplace add <source>`** — register catalog
2. **`/plugin install <name>@<marketplace>`** — install plugin

**Fork AS-IS:** Cursor uses `.cursor/mcp.json` and rules — **not** Claude Code `/plugin`. Plugin skills namespace as `plugin-name:skill-name` — see [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md).

---

## Plugin manager (`/plugin`)

Tabs (cycle with Tab / Shift+Tab):

| Tab | Purpose |
|-----|---------|
| **Discover** | Browse all marketplaces |
| **Installed** | Enable / disable / uninstall |
| **Marketplaces** | Add, update, remove catalogs |
| **Errors** | Load failures (e.g. LSP binary missing) |

Shortcuts: `/plugin market` = marketplace; `rm` = remove.

Other commands: `/plugin list`, `claude plugin details`, `/reload-plugins`.

---

## Official marketplace

**`claude-plugins-official`** — auto-available at Claude Code start. Discover tab or [claude.com/plugins](https://claude.com/plugins).

```shell
/plugin install github@claude-plugins-official
```

If not found: `/plugin marketplace update claude-plugins-official` or `/plugin marketplace add anthropics/claude-plugins-official`.

Curated by Anthropic; community submissions go to **community** marketplace, not official.

### Categories (subset)

| Category | Examples |
|----------|----------|
| **Code intelligence (LSP)** | `typescript-lsp`, `pyright-lsp`, `rust-analyzer-lsp`, `gopls-lsp`, … |
| **External integrations** | `github`, `gitlab`, `linear`, `notion`, `sentry`, `vercel`, … |
| **Security** | `security-guidance` — [security guidance](https://code.claude.com/docs/en/security-guidance) |
| **Workflows** | `commit-commands`, `pr-review-toolkit`, `plugin-dev` |
| **Output styles** | `explanatory-output-style`, `learning-output-style` |

---

## Code intelligence (LSP plugins)

Enables Claude's **LSP tool**: go-to-definition, references, diagnostics after edits.

| Language | Plugin | Binary |
|----------|--------|--------|
| TypeScript | `typescript-lsp` | `typescript-language-server` |
| Python | `pyright-lsp` | `pyright-langserver` |
| Rust | `rust-analyzer-lsp` | `rust-analyzer` |
| Go | `gopls-lsp` | `gopls` |
| Java | `jdtls-lsp` | `jdtls` |
| C/C++ | `clangd-lsp` | `clangd` |
| … | See platform table | Install binary on `$PATH` |

**Gains:** automatic diagnostics after edits; precise navigation vs grep-only.

**Errors tab:** `Executable not found in $PATH` → install language server binary.

Token savings: [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md#code-intelligence-plugins).

---

## Community and demo marketplaces

| Marketplace | Add command | Install suffix |
|-------------|-------------|----------------|
| Community | `/plugin marketplace add anthropics/claude-plugins-community` | `@claude-community` |
| Demo examples | `/plugin marketplace add anthropics/claude-code` | `@claude-code-plugins` |

Community plugins pinned to commit SHA; pass automated validation.

---

## Install scopes

| Scope | Who gets it |
|-------|-------------|
| **User** (default) | You, all projects |
| **Project** | All collaborators (`.claude/settings.json`) |
| **Local** | You, this repo only |
| **Managed** | Admin via managed settings — cannot modify |

```shell
/plugin install commit-commands@claude-code-plugins
claude plugin install formatter@your-org --scope project
```

Discover UI (v2.1.143+): **Context cost** estimate; v2.1.145+: **Will install** component list.

---

## Using installed plugins

After install: **`/reload-plugins`** — activates skills, hooks, MCP, LSP.

Plugin skills are **namespaced**: `/commit-commands:commit` not `/commit`.

```shell
/reload-plugins
```

**Reload cost (v2.1.163+):** New components append to context; MCP without deferred tool search can invalidate prompt cache — warning shown; use `--force` to apply anyway. See [prompt caching — enabling/disabling plugins](https://code.claude.com/docs/en/prompt-caching#enabling-or-disabling-a-plugin).

---

## Add marketplace sources

| Source | Example |
|--------|---------|
| GitHub | `/plugin marketplace add anthropics/claude-code` |
| Git URL | `https://gitlab.com/company/plugins.git` or `git@host:repo.git#v1.0.0` |
| Local dir | `./my-marketplace` or `./path/to/marketplace.json` |
| Remote URL | `https://example.com/marketplace.json` |

Requires `.claude-plugin/marketplace.json` in repo (or direct JSON path).

---

## Manage plugins and marketplaces

```shell
/plugin disable plugin@marketplace
/plugin enable plugin@marketplace
/plugin uninstall plugin@marketplace
/plugin marketplace list
/plugin marketplace update marketplace-name
/plugin marketplace remove marketplace-name   # uninstalls plugins from that catalog
```

**Installed tab:** `f` favorite; filter by name; errors/dependencies sorted first.

**Auto-update:** Per-marketplace toggle in UI; official on by default. `DISABLE_AUTOUPDATER` disables all; `FORCE_AUTOUPDATE_PLUGINS=1` keeps plugin updates when CC updates disabled.

---

## Team marketplaces

`.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "my-team-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  }
}
```

Managed: `pluginSuggestionMarketplaces` (v2.1.154+) pins directory-relevant plugins in Discover.

Full keys: [plugin settings](https://code.claude.com/docs/en/settings#plugin-settings).

---

## Security

Plugins run **arbitrary code** with your user privileges. Only install from **trusted** sources. Orgs can restrict marketplaces via [managed marketplace restrictions](https://code.claude.com/docs/en/plugin-marketplaces#managed-marketplace-restrictions).

Align with fork [SECURITY.md](./SECURITY.md) — no API keys in plugin configs committed to repo without review.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/plugin` unknown | Update Claude Code; restart terminal |
| Marketplace not loading | Verify `.claude-plugin/marketplace.json` path |
| Plugin skills missing | `rm -rf ~/.claude/plugins/cache`; reinstall |
| LSP not starting | Install binary; check Errors tab |
| High memory | Disable heavy LSP (`rust-analyzer`, `pyright`) on large repos |
| Relative paths in URL marketplace | See [plugin-marketplaces troubleshooting](https://code.claude.com/docs/en/plugin-marketplaces#troubleshooting) |

Config not loading: [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md).

---

## Fork mapping

| Claude Code | This fork |
|-------------|-----------|
| `/plugin` + marketplaces | Not available in Cursor |
| Plugin MCP | `.cursor/mcp.json` manual setup — [mcp-rules.md](./agents/mcp-rules.md) |
| Plugin skills | `.claude/skills/` or future team marketplace (E-8) |
| `security-guidance` plugin | Wall-Bounce + hooks backlog — not plugin AS-IS |
| LSP plugins | IDE/Cursor language services separately |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.plugins` | Marketplace IDs, `/plugin`, `/reload-plugins` |
| `prompting.guidanceTopics[]` | `claude-code-plugins-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No `extraKnownMarketplaces` in `.claude/settings.json` |
| Team | No org plugin distribution for techdev-cursor fork |
| Wall-Bounce | No plugin surface in adapters |

---

## Backlog

- **E-8** — Evaluate `typescript-lsp` + `commit-commands` for fork contributors using `claude` CLI.
- **E-5** — Document overlap: plugin hooks vs project `.claude/hooks/`.

---

## References

- [Discover plugins (platform)](https://code.claude.com/docs/en/discover-plugins)
- [Plugins](https://code.claude.com/docs/en/plugins) · [Plugins reference](https://code.claude.com/docs/en/plugins-reference)
- [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Security guidance plugin](https://code.claude.com/docs/en/security-guidance)
- [CLAUDE_CODE_SKILLS.md](./CLAUDE_CODE_SKILLS.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md)
