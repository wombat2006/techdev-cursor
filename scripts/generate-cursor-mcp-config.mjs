#!/usr/bin/env node
/**
 * Generate Cursor MCP config (portable linux or windows-wsl).
 *
 * Linux / WSL Remote: bash wrappers under scripts/ — same shape as tracked .cursor/mcp.json.
 * Windows host + WSL repo: wsl.exe runs the same wrapper scripts inside the distro.
 *
 * After git pull, mcp.json usually needs no regen and no Cursor MCP Reload.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MANAGED_SERVERS = new Set(['techsapo-providers', 'serena', 'brv']);
const STRIP_LEGACY_SERVERS = new Set(['cipher']);

const PORTABLE_LINUX = {
  'techsapo-providers': {
    command: 'bash',
    args: ['scripts/cursor-mcp-techsapo-providers.sh'],
  },
  serena: {
    command: 'bash',
    args: ['scripts/cursor-mcp-serena.sh'],
  },
  brv: {
    command: 'bash',
    args: ['scripts/start-brv-mcp.sh'],
  },
};

function parseArgs(argv) {
  const opts = {
    variant: null,
    repoRoot: REPO_ROOT,
    wslDistro: process.env.WSL_DISTRO || 'AlmaLinux-9',
    output: path.join(REPO_ROOT, '.cursor', 'mcp.json'),
    print: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--print') opts.print = true;
    else if (a === '--variant' && argv[i + 1]) opts.variant = argv[++i];
    else if (a === '--repo-root' && argv[i + 1]) opts.repoRoot = path.resolve(argv[++i]);
    else if (a === '--wsl-distro' && argv[i + 1]) opts.wslDistro = argv[++i];
    else if (a === '--output' && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/generate-cursor-mcp-config.mjs [options]

Options:
  --variant linux|windows-wsl   linux = portable bash wrappers (EC2, WSL Remote)
                                windows-wsl = Windows Cursor → WSL wrapper scripts
  --repo-root <path>            Repository root (windows-wsl only)
  --wsl-distro <name>           WSL distro for windows-wsl
  --output <path>               Write JSON here (default: .cursor/mcp.json)
  --print                       Print JSON to stdout only (no write)
`);
      process.exit(0);
    }
  }
  if (!opts.variant) {
    opts.variant = process.platform === 'win32' ? 'windows-wsl' : 'linux';
  }
  return opts;
}

function toWslPath(posixPath) {
  return posixPath.replace(/\\/g, '/');
}

function buildLinuxConfig() {
  return { mcpServers: { ...PORTABLE_LINUX } };
}

function buildWindowsWslConfig(repoRoot, wslDistro) {
  const wslRepo = toWslPath(repoRoot);
  const run = (script) =>
    [
      'export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"',
      `cd ${JSON.stringify(wslRepo)}`,
      `exec bash ${script}`,
    ].join(' && ');
  return {
    mcpServers: {
      'techsapo-providers': {
        command: 'C:\\Windows\\System32\\wsl.exe',
        args: ['-d', wslDistro, 'bash', '-lc', run('scripts/cursor-mcp-techsapo-providers.sh')],
      },
      serena: {
        command: 'C:\\Windows\\System32\\wsl.exe',
        args: ['-d', wslDistro, 'bash', '-lc', run('scripts/cursor-mcp-serena.sh')],
      },
      brv: {
        command: 'C:\\Windows\\System32\\wsl.exe',
        args: ['-d', wslDistro, 'bash', '-lc', run('scripts/start-brv-mcp.sh')],
      },
    },
  };
}

function mergeWithExisting(outputPath, generated) {
  let existing = {};
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch {
      // ignore invalid JSON
    }
  }
  const preserved = {};
  for (const [name, cfg] of Object.entries(existing.mcpServers || {})) {
    if (MANAGED_SERVERS.has(name) || STRIP_LEGACY_SERVERS.has(name)) continue;
    preserved[name] = cfg;
  }
  return {
    mcpServers: {
      ...preserved,
      ...generated.mcpServers,
    },
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  let config;
  if (opts.variant === 'linux') {
    config = buildLinuxConfig();
  } else if (opts.variant === 'windows-wsl') {
    config = buildWindowsWslConfig(opts.repoRoot, opts.wslDistro);
  } else {
    console.error(`error: unknown variant "${opts.variant}" (use linux or windows-wsl)`);
    process.exit(1);
  }

  const merged = mergeWithExisting(opts.output, config);
  const json = `${JSON.stringify(merged, null, 2)}\n`;
  if (opts.print) {
    process.stdout.write(json);
    return;
  }

  fs.mkdirSync(path.dirname(opts.output), { recursive: true });
  fs.writeFileSync(opts.output, json, 'utf8');
  console.log(`Wrote ${opts.output} (variant=${opts.variant}, portable wrappers)`);
}

main();
