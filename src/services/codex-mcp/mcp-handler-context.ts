import type { ChildProcess } from 'child_process';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { getCodexSessionManager } from '../codex-session-manager';
import type { CodexExecutorOptions } from './codex-executor';
import type { CodexPerformanceStore } from './performance-store';
import type { CodexToolHandlerContext } from './tool-handlers';
import type { CodexMCPConfig } from './types';

export interface CodexMcpHandlerContext {
  config: CodexMCPConfig;
  sessionManager: ReturnType<typeof getCodexSessionManager>;
  logDirectory: string;
  activeProcesses: Map<string, ChildProcess>;
  connectionPool: Map<string, ChildProcess>;
  performance: CodexPerformanceStore;
  toolCtx: CodexToolHandlerContext;
  server?: Server;
}

export interface CodexServerDeps {
  executorOptions: CodexExecutorOptions;
}
