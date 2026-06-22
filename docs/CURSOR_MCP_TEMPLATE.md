# Cursor MCP Config (Unified, portable)

**Target repo:** `techdev-cursor` fork.  
**Server:** `techsapo-providers` — stdio MCP; tools `analyze_claude`, `analyze_codex`, `analyze_agy`.

**`techsapo-providers`:** use the generator (recommended) or placeholder templates — Node path is host-specific.  
**`serena` + `brv`:** registered by the same generator (`ide-assistant` context; ByteRover CLI — successor to `@byterover/cipher`).  
**`glossary-knowledge`:** tracked in `.cursor/mcp.json` with sibling `../term-prep-platform` paths (read-only runtime; consumer agents do not commit platform changes).

**Prerequisites:** [CURSOR_MCP_TODO Track A-0](./CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication) · [A-1](./CURSOR_MCP_TODO.md#a-1-cursor-mcp-registration-unified--in-fork) · `npm install` · `npm run build` · `npm run setup-mcp-prereqs` (Serena / `uvx`) · `brv providers connect` (memory tools)

---

## Recommended: generate config for this machine

```bash
cd <REPO_ROOT>
npm run setup-mcp-prereqs          # uv + uvx for Serena (once per machine)
npm install                        # byterover-cli (brv)
cp .env.brv.local.example .env.brv.local   # one cloud API key (not Ollama)
npm run setup-brv-provider         # connect brv to API
npm run build
npm run cursor-mcp:config              # merges techsapo-providers, serena, brv into .cursor/mcp.json
npm run serena-brv-mcp:smoke        # optional local launch probe
# or paste into Cursor Settings → MCP:
npm run cursor-mcp:config -- --print
```

| Flag | Purpose |
|------|---------|
| `--variant linux` | **EC2**, Linux VM, **WSL Remote**, native Linux desktop |
| `--variant windows-wsl` | **Windows Cursor host** → spawn server inside WSL |
| `--wsl-distro AlmaLinux-9` | WSL distro name (`wsl.exe -l -v`) |
| `--repo-root /path/to/clone` | Non-default clone location |
| `--node /path/to/node` | Override Node binary (default: `command -v node`) |
| `--output /path/to/mcp.json` | Custom output path |

Then: Cursor **Settings → MCP** → enable project MCP or paste JSON → **Reload** → **Connected** + 3 tools.

---

## Which variant? (by environment)

| Environment | Variant | Generator |
|-------------|---------|-----------|
| **EC2 / Linux VM** (SSH, Cursor Remote SSH) | `linux` | `npm run cursor-mcp:config -- --variant linux` |
| **WSL Remote** (Cursor window in Linux, `vscode-remote://wsl+…`) | `linux` | same — **not** `wsl.exe` |
| **Developer laptop — Linux native** | `linux` | same |
| **Developer laptop — Windows Cursor, repo in WSL** | `windows-wsl` | `npm run cursor-mcp:config -- --variant windows-wsl --wsl-distro <name>` |

| Symptom | Fix |
|---------|-----|
| `spawn wsl.exe ENOENT` | You are on WSL Remote — use **`linux`**, not windows template |
| `Cannot find module …/dist/…` | Run `npm run build`; regenerate config (absolute `args`) |
| `node not found` | Install Node ≥20 or `nvm install`; or `--node $(which node)` |

---

## Manual templates (placeholders only)

| File | Use |
|------|-----|
| [cursor-mcp.linux.template.json](../config/cursor-mcp.linux.template.json) | EC2 / Linux / WSL Remote (same shape) |
| [cursor-mcp.template.json](../config/cursor-mcp.template.json) | Alias of linux shape |
| [cursor-mcp.windows.template.json](../config/cursor-mcp.windows.template.json) | Windows host + WSL |
| [.cursor/mcp.json.example](../.cursor/mcp.json.example) | Example output shape |

Replace `<REPO_ROOT>`, `<NODE_EXECUTABLE>`, `<WSL_DISTRO>` — or prefer **generator** to avoid typos.

### Linux / EC2 / WSL Remote (shape)

```json
{
  "mcpServers": {
    "techsapo-providers": {
      "command": "<NODE_EXECUTABLE>",
      "args": ["<REPO_ROOT>/dist/services/techsapo-providers-mcp-server.js"],
      "cwd": "<REPO_ROOT>"
    }
  }
}
```

Discover values:

```bash
command -v node          # NODE_EXECUTABLE
cd "$(git rev-parse --show-toplevel)" && pwd   # REPO_ROOT
```

### Windows Cursor host + WSL (shape)

```json
{
  "mcpServers": {
    "techsapo-providers": {
      "command": "C:\\Windows\\System32\\wsl.exe",
      "args": [
        "-d",
        "<WSL_DISTRO>",
        "bash",
        "-lc",
        "export PATH=\"$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin\" && cd <REPO_ROOT_WSL> && exec node dist/services/techsapo-providers-mcp-server.js"
      ]
    }
  }
}
```

`wsl.exe -l -v` for distro name. Build must exist **inside WSL** at `<REPO_ROOT>/dist/...`.

---

## EC2 notes

1. Clone repo on instance; install Node ≥20 (`nvm` or distro package).
2. Complete Track A-0 CLIs on that instance (or use CI-only MCP — usually **dev laptop + WSL** is the target).
3. `npm run build && npm run cursor-mcp:config -- --variant linux`
4. Cursor **Remote SSH** to EC2 → use generated `.cursor/mcp.json` or paste `--print` output.
5. Ensure security group / SSO allows your Cursor SSH path — MCP is local stdio on the remote host (TS-17).

---

## Preflight

```bash
npm run build
npm run mcp:list-tools-smoke
npm run g7:adapter-smoke    # optional before Cursor UI (G7)
```

Logs: `logs/mcp-providers.log`

### Smoke test failures (sandbox vs WSL)

| Check | Use when |
|-------|----------|
| `npm run mcp:list-tools-smoke` | **MCP connection only** — stdio + `tools/list` |
| `npm run g7:adapter-smoke` | Adapter + CLI path — run from **your WSL terminal** |

**Recorded 2026-06-18:** In a **restricted/sandbox** runner, `g7:adapter-smoke` failed for **claude** (GitKraken `SessionEnd` hook cancelled) and **codex** (`Permission denied` on `~/.codex/tmp`). The same command **passed in a normal WSL shell**. This is not an MCP config defect — see [CURSOR_MCP_TODO § MCP smoke test failures](./CURSOR_MCP_TODO.md#mcp-smoke-test-failures-recorded-2026-06-18).

---

## G7 smoke from Cursor Agent

| Tool | CallTool args |
|------|----------------|
| `analyze_claude` | `{ "prompt": "Reply with exactly one word: ok", "preset": "fast", "model": "haiku" }` |
| `analyze_codex` | `{ "prompt": "Reply with exactly one word: ok", "preset": "fast", "model": "gpt-5.5" }` |
| `analyze_agy` | `{ "prompt": "You are text-only. Reply with exactly one word: ok", "preset": "fast", "model": "gemini-2.5-flash", "workingDirectory": "/tmp" }` |

**Legacy:** Do not register dual-server `techsapo-codex` + `techsapo-claude`.

---

## External reference: Context7 · Serena · Cipher install

Community walkthrough (Claude Code CLI, Japanese):  
[Claude CodeでMCPツール（Context7、Serena、Cipher）を活用してAIコーディングを次のレベルへ](https://qiita.com/sukimaengineer/items/845ad14a3ec2d3c39930) (2025-08).

**Mapping to this repo (Cursor, 2026):**

| Tool | Qiita article (Claude Code) | This fork (Cursor) |
|------|----------------------------|-------------------|
| **Context7** | `claude mcp add context7 -- npx --yes @upstash/context7-mcp` | Cursor plugin / built-in MCP (no repo generator entry) |
| **Serena** | `uv run --from git+… serena-mcp-server --port 32123` (HTTP port) | `uvx --from git+… serena start-mcp-server --transport stdio --context ide-assistant --project <REPO>` via `npm run cursor-mcp:config` — **stdio required for Cursor**; `.serena/project.yml` already present |
| **Cipher** | `npm i -g @byterover/cipher` + `OPENAI_API_KEY` (deprecated npm pkg) | **`byterover-cli`** (`brv mcp`) via `npm run cursor-mcp:config` — tools `brv-query`, `brv-curate`; provider via `brv providers connect` |

**Notes from the article (still applicable):**

- Serena: `pip install uv` (or `npm run setup-mcp-prereqs` here); first `uvx` run downloads Serena from GitHub.
- ByteRover (`brv`): use **cloud API** via `npm run setup-brv-provider` + `.env.brv.local`. Local Ollama often fails `brv curate` (RAM / tool-call parsing).
- **Simultaneous use:** article warns Context7 + Serena + Cipher together need care — see the author’s follow-up linked from that post.
- Serena TS/LSP can be flaky on some platforms; WSL Remote + `linux` variant is the supported path here.

**Serena project config:** extend [`.serena/project.yml`](../.serena/project.yml) per [serena-toolkit.md](./serena-toolkit.md) and the article’s `.serena/project.yml` examples (`ignored_paths`, `read_only`, etc.) when indexing this monorepo feels slow.

