/**
 * Codex MCP Server — orchestration entry (SRP facade).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ChildProcess } from 'child_process';
import os from 'os';
import path from 'path';
import { logger } from '../../utils/logger';
import { getCodexSessionManager } from '../codex-session-manager';
import { registerCodexMcpHandlers } from './mcp-handlers';
import type { CodexMcpHandlerContext } from './mcp-handler-context';
import { CodexPerformanceStore } from './performance-store';
import {
  handleCleanupTool,
  handleCodexReplyTool,
  handleCodexTool,
  handleSessionInfoTool,
  type CodexToolHandlerContext,
} from './tool-handlers';
import { CodexMCPConfig, mergeCodexMCPConfig } from './types';

export type { CodexExecutionContext, CodexMCPConfig } from './types';

export class CodexMCPServer {
  private readonly server: Server;
  private readonly sessionManager;
  private readonly config: CodexMCPConfig;
  private readonly activeProcesses = new Map<string, ChildProcess>();
  private readonly connectionPool = new Map<string, ChildProcess>();
  private readonly performance: CodexPerformanceStore;
  private readonly logDirectory: string;
  private readonly startTime = Date.now();
  private readonly toolCtx: CodexToolHandlerContext;
  private readonly handlerCtx: CodexMcpHandlerContext;

  constructor(config: CodexMCPConfig = {}) {
    this.config = mergeCodexMCPConfig(config);
    this.sessionManager = getCodexSessionManager();
    this.logDirectory = this.config.log_directory || path.join(os.homedir(), '.codex', 'log');
    this.performance = new CodexPerformanceStore(this.config);

    this.toolCtx = {
      config: this.config,
      sessionManager: this.sessionManager,
      executorOptions: {
        config: this.config,
        activeProcesses: this.activeProcesses,
      },
      activeProcesses: this.activeProcesses,
      connectionPool: this.connectionPool,
      performance: this.performance,
      startTime: this.startTime,
    };

    this.handlerCtx = {
      config: this.config,
      sessionManager: this.sessionManager,
      logDirectory: this.logDirectory,
      activeProcesses: this.activeProcesses,
      connectionPool: this.connectionPool,
      performance: this.performance,
      toolCtx: this.toolCtx,
    };

    this.server = new Server(
      {
        name: 'codex-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
        },
      }
    );

    registerCodexMcpHandlers(this.server, this.handlerCtx);
  }

  public async start(): Promise<void> {
    logger.info('🚀 Starting Codex MCP Server', {
      config: this.config,
      log_directory: this.logDirectory,
    });

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('✅ Codex MCP Server started successfully');
  }

  public async stop(): Promise<void> {
    logger.info('🛑 Stopping Codex MCP Server');

    if (this.performance.batchTimer) {
      clearTimeout(this.performance.batchTimer);
      this.performance.batchTimer = null;
    }

    if (this.performance.requestBatch.length > 0) {
      await this.performance.processBatch(this.toolCtx);
    }

    for (const [sessionId, proc] of this.activeProcesses) {
      logger.info('Terminating active process', { sessionId });
      proc.kill('SIGTERM');
    }
    this.activeProcesses.clear();
    this.connectionPool.clear();
    this.performance.responseCache.clear();

    await this.sessionManager.cleanupExpiredSessions();

    logger.info('✅ Codex MCP Server stopped with optimizations');
  }

  /** Facade for direct tool invocation (integration + tests). */
  public handleCodexTool(args: unknown) {
    return handleCodexTool(this.toolCtx, args);
  }

  public handleCodexReplyTool(args: unknown) {
    return handleCodexReplyTool(this.toolCtx, args);
  }

  public handleSessionInfoTool(args: unknown) {
    return handleSessionInfoTool(this.toolCtx, args);
  }

  public handleCleanupTool(args: unknown) {
    return handleCleanupTool(this.toolCtx, args);
  }
}

export const createCodexMCPServer = (config?: CodexMCPConfig): CodexMCPServer => {
  return new CodexMCPServer(config);
};

if (require.main === module) {
  const server = new CodexMCPServer();

  server.start().catch((error) => {
    logger.error('Failed to start Codex MCP Server', { error });
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });
}
