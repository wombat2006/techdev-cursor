#!/usr/bin/env node
/**
 * MCP stdio smoke — list tools via JSON-RPC (validates logger does not corrupt stdout).
 * Run after npm run build: node scripts/mcp-list-tools-smoke.js
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '../dist/services/techsapo-providers-mcp-server.js');

function send(proc, msg) {
  proc.stdin.write(`${JSON.stringify(msg)}\n`);
}

const proc = spawn('node', [serverPath], {
  cwd: path.join(__dirname, '..'),
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, TECHSAPO_MCP_STDIO: '1' },
});

let stdout = '';
proc.stdout.on('data', (chunk) => {
  stdout += chunk.toString();
});

proc.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

setTimeout(() => {
  send(proc, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'g7-smoke', version: '1.0.0' },
    },
  });
  send(proc, { jsonrpc: '2.0', method: 'notifications/initialized' });
  send(proc, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
}, 500);

setTimeout(() => {
  proc.kill('SIGTERM');
  const lines = stdout.trim().split('\n').filter(Boolean);
  let tools = [];
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.id === 2 && msg.result?.tools) {
        tools = msg.result.tools.map((t) => t.name);
      }
    } catch {
      console.error('Non-JSON stdout line (stdio corruption?):', line.slice(0, 120));
      process.exit(2);
    }
  }
  const expected = ['analyze_claude', 'analyze_codex', 'analyze_agy'];
  const missing = expected.filter((n) => !tools.includes(n));
  if (missing.length) {
    console.error('Missing tools:', missing, 'got:', tools);
    process.exit(1);
  }
  console.log('MCP tools/list OK:', tools.join(', '));
  process.exit(0);
}, 3000);
