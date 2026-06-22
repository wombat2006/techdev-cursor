#!/usr/bin/env node
/**
 * Generate machine-local Cursor MCP config (techsapo-providers).
 *
 * Usage:
 *   npm run cursor-mcp:config                    # auto variant → .cursor/mcp.json
 *   npm run cursor-mcp:config -- --print           # stdout only
 *   npm run cursor-mcp:config -- --variant linux   # EC2 / WSL Remote / native Linux
 *   npm run cursor-mcp:config -- --variant windows-wsl --wsl-distro Ubuntu-22.04
 *
 * Merges into .cursor/mcp.json — preserves entries not managed here (e.g. glossary-knowledge).
 * Managed servers: techsapo-providers, serena, brv.
 * Strips legacy server name: cipher (@byterover/cipher, deprecated).
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_REL = 'dist/services/techsapo-providers-mcp-server.js';
const BRV_SCRIPT = path.join(REPO_ROOT, 'scripts', 'start-brv-mcp.sh');
const MANAGED_SERVERS = new Set(['techsapo-providers', 'serena', 'brv']);
const STRIP_LEGACY_SERVERS = new Set(['cipher']);

function parseArgs(argv) {
  const opts = {
    variant: null,
    repoRoot: REPO_ROOT,
    node: null,
    wslDistro: process.env.WSL_DISTRO || 'AlmaLinux-9',
    output: path.join(REPO_ROOT, '.cursor', 'mcp.json'),
    print: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--print') opts.print = true;
    else if (a === '--variant' && argv[i + 1]) opts.variant = argv[++i];
    else if (a === '--repo-root' && argv[i + 1]) opts.repoRoot = path.resolve(argv[++i]);
    else if (a === '--node' && argv[i + 1]) opts.node = path.resolve(argv[++i]);
    else if (a === '--wsl-distro' && argv[i + 1]) opts.wslDistro = argv[++i];
    else if (a === '--output' && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/generate-cursor-mcp-config.mjs [options]

Options:
  --variant linux|windows-wsl   linux = direct node (EC2, WSL Remote, Linux desktop)
                                windows-wsl = Windows Cursor spawns WSL bash
  --repo-root <path>            Repository root (default: auto)
  --node <path>                 node binary (default: command -v node)
  --wsl-distro <name>           WSL distro for windows-wsl (default: AlmaLinux-9 or WSL_DISTRO)
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

function resolveNode(explicit, repoRoot) {
  if (explicit) return explicit;
  const r = spawnSync('bash', ['-lc', 'command -v node'], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
  const node = (r.stdout || '').trim();
  if (!node) {
    console.error('error: node not found in PATH. Install Node ≥18 or pass --node <path>');
    process.exit(1);
  }
  return node;
}

function resolveUv(explicit, repoRoot) {
  if (explicit) return explicit;
  const r = spawnSync('bash', ['-lc', 'export PATH="$HOME/.local/bin:$PATH"; command -v uvx'], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
  const uvx = (r.stdout || '').trim();
  if (!uvx) {
    console.error('error: uvx not found. Run: npm run setup-mcp-prereqs');
    process.exit(1);
  }
  return uvx;
}

function resolveBrv(repoRoot) {
  const local = path.join(repoRoot, 'node_modules', '.bin', 'brv');
  if (fs.existsSync(local)) return local;
  const r = spawnSync('bash', ['-lc', 'command -v brv'], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
  const brv = (r.stdout || '').trim();
  if (!brv) {
    console.error('error: brv not found. Run: npm install (byterover-cli)');
    process.exit(1);
  }
  return brv;
}

function buildSerenaConfig(repoRoot, uvxExecutable) {
  return {
    serena: {
      command: uvxExecutable,
      args: [
        '--from',
        'git+https://github.com/oraios/serena',
        'serena',
        'start-mcp-server',
        '--transport',
        'stdio',
        '--context',
        'claude-code',
        '--project',
        repoRoot,
      ],
    },
  };
}

function buildBrvConfig(repoRoot, brvExecutable) {
  if (!fs.existsSync(BRV_SCRIPT)) {
    console.error(`error: ${BRV_SCRIPT} missing`);
    process.exit(1);
  }
  return {
    brv: {
      command: brvExecutable,
      args: ['mcp'],
      cwd: repoRoot,
    },
  };
}

function toWslPath(posixPath) {
  return posixPath.replace(/\\/g, '/');
}

function buildLinuxConfig(repoRoot, nodeExecutable, uvxExecutable, brvExecutable) {
  const serverPath = path.join(repoRoot, SERVER_REL);
  if (!fs.existsSync(serverPath)) {
    console.error(`error: ${serverPath} missing — run: npm run build`);
    process.exit(1);
  }
  return {
    mcpServers: {
      'techsapo-providers': {
        command: nodeExecutable,
        args: [serverPath],
        cwd: repoRoot,
      },
      ...buildSerenaConfig(repoRoot, uvxExecutable),
      ...buildBrvConfig(repoRoot, brvExecutable),
    },
  };
}

function buildWindowsWslConfig(repoRoot, wslDistro, uvxExecutable) {
  const serverPath = path.join(repoRoot, SERVER_REL);
  if (!fs.existsSync(serverPath)) {
    console.error(`error: ${serverPath} missing — run: npm run build (inside WSL)`);
    process.exit(1);
  }
  const wslRepo = toWslPath(repoRoot);
  const innerProviders = [
    'export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"',
    `cd ${JSON.stringify(wslRepo)}`,
    'exec node dist/services/techsapo-providers-mcp-server.js',
  ].join(' && ');
  const innerBrv = [
    'export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"',
    `cd ${JSON.stringify(wslRepo)}`,
    'exec node_modules/.bin/brv mcp',
  ].join(' && ');
  const innerSerena = [
    'export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"',
    `exec ${JSON.stringify(uvxExecutable)} --from git+https://github.com/oraios/serena serena start-mcp-server --transport stdio --context claude-code --project ${JSON.stringify(wslRepo)}`,
  ].join(' && ');
  return {
    mcpServers: {
      'techsapo-providers': {
        command: 'C:\\Windows\\System32\\wsl.exe',
        args: ['-d', wslDistro, 'bash', '-lc', innerProviders],
      },
      serena: {
        command: 'C:\\Windows\\System32\\wsl.exe',
        args: ['-d', wslDistro, 'bash', '-lc', innerSerena],
      },
      brv: {
        command: 'C:\\Windows\\System32\\wsl.exe',
        args: ['-d', wslDistro, 'bash', '-lc', innerBrv],
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
      // ignore invalid JSON — overwrite with generated only
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
    const node = resolveNode(opts.node, opts.repoRoot);
    const uvx = resolveUv(null, opts.repoRoot);
    const brv = resolveBrv(opts.repoRoot);
    config = buildLinuxConfig(opts.repoRoot, node, uvx, brv);
  } else if (opts.variant === 'windows-wsl') {
    const uvx = resolveUv(null, opts.repoRoot);
    resolveBrv(opts.repoRoot);
    config = buildWindowsWslConfig(opts.repoRoot, opts.wslDistro, uvx);
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
  console.log(`Wrote ${opts.output} (variant=${opts.variant})`);
  console.log('Next: Cursor Settings → MCP → enable project config, or paste JSON → Reload');
}

main();
