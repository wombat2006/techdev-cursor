/**
 * PM2 process definitions for TechSapo long-running daemons.
 *
 * Included: HTTP/API app, Codex MCP serve (ops), optional production monitor.
 * Excluded (stdio — spawned by Cursor/client, NOT PM2 daemons):
 *   - techsapo-providers-mcp-server.js
 *   - claude-code-mcp-server.js
 *   - node dist/services/codex-mcp-server.js (stdio MCP)
 */
const path = require('path');

const projectRoot = __dirname;

const logDir = path.join(projectRoot, 'logs/pm2');
const envFile = path.join(projectRoot, '.env');

module.exports = {
  apps: [
    {
      name: 'techsapo',
      cwd: projectRoot,
      script: 'dist/index.js',
      node_args: '--max-old-space-size=1024',
      env_file: envFile,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: path.join(logDir, 'techsapo-error.log'),
      out_file: path.join(logDir, 'techsapo-out.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'codex-mcp',
      cwd: projectRoot,
      script: 'codex',
      args: ['mcp', 'serve'],
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'development',
        RUST_LOG: 'info',
        CODEX_MCP_CONFIG: path.join(projectRoot, 'config/codex-mcp.toml'),
      },
      env_production: {
        NODE_ENV: 'production',
        RUST_LOG: 'warn',
      },
      error_file: path.join(logDir, 'codex-mcp-error.log'),
      out_file: path.join(logDir, 'codex-mcp-out.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'production-monitor',
      cwd: projectRoot,
      script: 'scripts/production-monitoring.js',
      interpreter: 'node',
      env_file: envFile,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: path.join(logDir, 'production-monitor-error.log'),
      out_file: path.join(logDir, 'production-monitor-out.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
