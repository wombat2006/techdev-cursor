# Cursor MCP Config Template (Unified)

**Target repo:** `techdev-cursor` fork (not upstream `techdev`).  
**Server:** `techsapo-providers` — use **`node` directly** (WSL Remote) or **`wsl.exe`** (Windows Cursor host); do **not** use `npm run codex-mcp` (daemonizes, breaks stdio).

**Prerequisites:** [CURSOR_MCP_TODO Track A-0](./CURSOR_MCP_TODO.md#a-0-wsl-native-install--authentication) · [A-1 registration](./CURSOR_MCP_TODO.md#a-1-cursor-mcp-registration-unified--in-fork) · [FORK_CURSOR.md](./FORK_CURSOR.md)

---

## Which template? (read first)

| Your Cursor setup | Use | Do **not** use |
|-------------------|-----|----------------|
| Window connected via **WSL** (`vscode-remote://wsl+…` in path, or “WSL: AlmaLinux-9” in status bar) | **Variant B** — `node` direct, or repo [`.cursor/mcp.json`](../.cursor/mcp.json) | `cursor-mcp.windows.template.json` (`wsl.exe` → **ENOENT**) |
| Cursor on **Windows**, folder opened as `C:\…` or `\\wsl$\…` without Remote | **Variant A** — `wsl.exe` spawn | `node` + Linux `cwd` only (may miss WSL PATH) |

**Symptom:** `spawn C:\Windows\System32\wsl.exe ENOENT` → you are on **WSL Remote**; switch to Variant B.

---

## Variant A — Windows Cursor host (WSL spawn)

Cursor runs on **Windows**; MCP server runs **inside WSL** via `wsl.exe`.

1. Confirm WSL distro: `wsl.exe -l -v` (this environment: **`AlmaLinux-9`**)
2. Copy [config/cursor-mcp.windows.template.json](../config/cursor-mcp.windows.template.json) into **Cursor Settings → MCP**
3. Adjust in the template if needed:
   - `-d` distro name
   - Node path under `$HOME/.nvm/versions/node/...`
   - Repo path `/home/<USER>/techdev-cursor`
4. `npm run build` in WSL before first connect
5. Reload MCP; confirm **Connected** and tools `analyze_claude`, `analyze_codex`, `analyze_agy`

```json
{
  "mcpServers": {
    "techsapo-providers": {
      "command": "C:\\Windows\\System32\\wsl.exe",
      "args": [
        "-d",
        "AlmaLinux-9",
        "bash",
        "-lc",
        "export PATH=\"$HOME/.nvm/versions/node/v22.22.3/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin\" && cd /home/wombat/techdev-cursor && exec node dist/services/techsapo-providers-mcp-server.js"
      ]
    }
  }
}
```

**Why explicit PATH:** Windows-spawned WSL non-login shells may miss nvm / `~/.local/bin` (`claude`, `codex`, `agy`).

---

## Variant B — WSL Remote / Cursor opened in Linux

Cursor workspace runs **inside WSL**; spawn `node` directly.

**Fastest:** enable project MCP — [.cursor/mcp.json](../.cursor/mcp.json) is committed for this fork (`cwd` = `/home/wombat/techdev-cursor`). Reload MCP in Settings.

Or copy [config/cursor-mcp.template.json](../config/cursor-mcp.template.json). Replace `<USER>` with your WSL username.

```json
{
  "mcpServers": {
    "techsapo-providers": {
      "command": "/home/<USER>/.nvm/versions/node/v22.22.3/bin/node",
      "args": ["/home/<USER>/techdev-cursor/dist/services/techsapo-providers-mcp-server.js"],
      "cwd": "/home/<USER>/techdev-cursor"
    }
  }
}
```

Use **absolute** `args` path — Cursor may ignore `cwd` and resolve relative `dist/...` from `$HOME` (error: `Cannot find module /home/<USER>/dist/...`).

---

## Preflight (WSL)

```bash
cd ~/techdev-cursor && npm run build
npm run mcp:list-tools-smoke   # stdio JSON-RPC — no stdout log corruption
npm run g7:adapter-smoke       # adapter-path G7 (optional before Cursor UI)
```

MCP server logs (stdio-safe mode): `logs/mcp-providers.log`

---

## G7 smoke from Cursor Agent

| Tool | CallTool args |
|------|----------------|
| `analyze_claude` | `{ "prompt": "Reply with exactly one word: ok", "preset": "fast", "model": "haiku" }` |
| `analyze_codex` | `{ "prompt": "Reply with exactly one word: ok", "preset": "fast", "model": "gpt-5.5" }` |
| `analyze_agy` | `{ "prompt": "You are text-only. Reply with exactly one word: ok", "preset": "fast", "model": "gemini-2.5-flash", "workingDirectory": "/tmp" }` |

`workingDirectory: "/tmp"` for agy avoids repo-root agent exploration on short smoke prompts (see A-0.3). Production prompts from repo cwd are usually fine with explicit text-only instructions.

**Legacy:** Do not register dual-server `techsapo-codex` + `techsapo-claude`.
