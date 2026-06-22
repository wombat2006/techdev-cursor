import {
  CallToolRequestSchema,
  CallToolResult,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { logger } from '../../utils/logger';
import { getRecentLogs, getPerformanceStats } from './log-utils';
import {
  handleCleanupTool,
  handleCodexReplyTool,
  handleCodexTool,
  handleMetricsTool,
  handleSessionInfoTool,
} from './tool-handlers';
import type { CodexMcpHandlerContext } from './mcp-handler-context';

export function registerCodexMcpHandlers(server: Server, ctx: CodexMcpHandlerContext): void {
  // Tool Handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'codex',
          description: 'Start a new Codex conversation with advanced GPT-5 capabilities',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The coding task or question for Codex'
              },
              model: {
                type: 'string',
                enum: ['gpt-5', 'gpt-5-codex', 'o1', 'o1-mini'],
                description: 'OpenAI model to use',
                default: 'gpt-5-codex'
              },
              sandbox: {
                type: 'string',
                enum: ['read-only', 'isolated', 'full-access'],
                description: 'Execution sandbox level',
                default: 'read-only'
              },
              mode: {
                type: 'string',
                enum: ['interactive', 'non-interactive', 'ci'],
                description: 'Execution mode',
                default: 'interactive'
              },
              full_auto: {
                type: 'boolean',
                description: 'Enable full autonomous execution (CI mode)',
                default: false
              },
              reasoning_effort: {
                type: 'string',
                enum: ['minimal', 'medium', 'high'],
                description: 'GPT-5 reasoning effort level'
              },
              verbosity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Response verbosity level'
              }
            },
            required: ['prompt']
          }
        },
        {
          name: 'codex-reply',
          description: 'Continue an existing Codex conversation',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Follow-up message or request'
              },
              session_id: {
                type: 'string',
                description: 'Session ID to continue'
              },
              conversation_id: {
                type: 'string',
                description: 'Conversation ID to continue'
              }
            },
            required: ['prompt'],
            oneOf: [
              { required: ['session_id'] },
              { required: ['conversation_id'] }
            ]
          }
        },
        {
          name: 'codex-session-info',
          description: 'Get information about Codex sessions',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: {
                type: 'string',
                description: 'Session ID to query'
              },
              list_active: {
                type: 'boolean',
                description: 'List all active sessions',
                default: false
              }
            }
          }
        },
        {
          name: 'codex-cleanup',
          description: 'Cleanup expired Codex sessions',
          inputSchema: {
            type: 'object',
            properties: {
              force: {
                type: 'boolean',
                description: 'Force cleanup all sessions',
                default: false
              }
            }
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const startTime = Date.now();
    ctx.performance.metrics.total_requests++;

    const { name, arguments: args } = request.params;

    try {
      // キャッシュチェック（読み取り専用操作のみ）
      if (ctx.config.enable_response_caching && ctx.performance.isReadOnlyOperation(name, args)) {
        const cacheKey = ctx.performance.generateCacheKey(name, args);
        const cached = ctx.performance.getCachedResponse(cacheKey);
        if (cached) {
          ctx.performance.metrics.cache_hits++;
          logger.debug('Cache hit for operation:', { name, cacheKey });
          return cached;
        }
      }

      let result: CallToolResult;

      // バッチ処理が有効な場合
      if (ctx.config.enable_request_batching && ctx.performance.isBatchableOperation(name)) {
        result = await ctx.performance.handleBatchedRequest(ctx.toolCtx, name, args);
      } else {
        // 通常の処理
        switch (name) {
          case 'codex':
            result = await handleCodexTool(ctx.toolCtx, args);
            break;
          case 'codex-reply':
            result = await handleCodexReplyTool(ctx.toolCtx, args);
            break;
          case 'codex-session-info':
            result = await handleSessionInfoTool(ctx.toolCtx, args);
            break;
          case 'codex-cleanup':
            result = await handleCleanupTool(ctx.toolCtx, args);
            break;
          case 'codex-metrics':
            result = await handleMetricsTool(ctx.toolCtx, args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      }

      // レスポンスキャッシュ（読み取り専用操作）
      if (ctx.config.enable_response_caching && ctx.performance.isReadOnlyOperation(name, args)) {
        const cacheKey = ctx.performance.generateCacheKey(name, args);
        ctx.performance.cacheResponse(cacheKey, result);
      }

      // パフォーマンスメトリクス更新
      const executionTime = Date.now() - startTime;
      ctx.performance.updatePerformanceMetrics(executionTime, true);

      return result;
    } catch (error) {
      ctx.performance.metrics.error_rate = (ctx.performance.metrics.error_rate * ctx.performance.metrics.total_requests + 1) / ctx.performance.metrics.total_requests;
      const executionTime = Date.now() - startTime;
      ctx.performance.updatePerformanceMetrics(executionTime, false);

      logger.error('Codex MCP tool execution failed', { tool: name, error });
      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  });

  // Prompt Handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'code-review',
          title: 'Code Review Assistant',
          description: 'Generate comprehensive code review with suggestions for improvement',
          arguments: [
            {
              name: 'code',
              description: 'Code to review',
              required: true
            },
            {
              name: 'language',
              description: 'Programming language',
              required: false
            }
          ]
        },
        {
          name: 'debug-helper',
          title: 'Debug Assistant',
          description: 'Help debug code issues and provide solutions',
          arguments: [
            {
              name: 'code',
              description: 'Code with issues',
              required: true
            },
            {
              name: 'error_message',
              description: 'Error message or description',
              required: false
            }
          ]
        },
        {
          name: 'refactor-code',
          title: 'Code Refactoring Assistant',
          description: 'Suggest refactoring improvements for better code quality',
          arguments: [
            {
              name: 'code',
              description: 'Code to refactor',
              required: true
            },
            {
              name: 'goal',
              description: 'Refactoring goal (performance, readability, etc.)',
              required: false
            }
          ]
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'code-review':
        return {
          description: 'Code review prompt for Codex',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please review the following ${args?.language || 'code'} and provide detailed feedback:\n\n${args?.code}\n\nFocus on:\n- Code quality and best practices\n- Potential bugs or issues\n- Performance improvements\n- Readability and maintainability`
              }
            }
          ]
        };
      case 'debug-helper':
        return {
          description: 'Debug assistance prompt for Codex',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me debug this code issue:\n\nCode:\n${args?.code}\n\n${args?.error_message ? `Error: ${args.error_message}\n\n` : ''}Please:\n- Identify the issue\n- Explain why it's happening\n- Provide a corrected version\n- Suggest prevention strategies`
              }
            }
          ]
        };
      case 'refactor-code':
        return {
          description: 'Code refactoring prompt for Codex',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please refactor this code${args?.goal ? ` with focus on ${args.goal}` : ''}:\n\n${args?.code}\n\nProvide:\n- Refactored version\n- Explanation of changes\n- Benefits of the refactoring\n- Any trade-offs to consider`
              }
            }
          ]
        };
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });

  // Resource Handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const stats = await ctx.sessionManager.getSessionStats();

    return {
      resources: [
        {
          uri: 'codex://sessions/active',
          name: 'Active Sessions',
          title: 'Active Codex Sessions',
          description: 'List of currently active Codex sessions',
          mimeType: 'application/json'
        },
        {
          uri: 'codex://config/current',
          name: 'Current Configuration',
          title: 'Codex MCP Server Configuration',
          description: 'Current server configuration and settings',
          mimeType: 'application/json'
        },
        {
          uri: 'codex://logs/recent',
          name: 'Recent Logs',
          title: 'Recent Codex Execution Logs',
          description: 'Recent execution logs and tracing information',
          mimeType: 'text/plain'
        },
        {
          uri: 'codex://stats/performance',
          name: 'Performance Statistics',
          title: 'Codex Performance Metrics',
          description: `Performance statistics (${stats.totalActiveSessions} active sessions)`,
          mimeType: 'application/json'
        }
      ]
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case 'codex://sessions/active':
        const stats = await ctx.sessionManager.getSessionStats();
        return {
          contents: [
            {
              uri,
              name: 'Active Sessions',
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };

      case 'codex://config/current':
        return {
          contents: [
            {
              uri,
              name: 'Current Configuration',
              mimeType: 'application/json',
              text: JSON.stringify(ctx.config, null, 2)
            }
          ]
        };

      case 'codex://logs/recent':
        const logs = await getRecentLogs(ctx.logDirectory);
        return {
          contents: [
            {
              uri,
              name: 'Recent Logs',
              mimeType: 'text/plain',
              text: logs
            }
          ]
        };

      case 'codex://stats/performance':
        const perfStats = await getPerformanceStats(ctx.sessionManager, ctx.activeProcesses, ctx.config);
        return {
          contents: [
            {
              uri,
              name: 'Performance Statistics',
              mimeType: 'application/json',
              text: JSON.stringify(perfStats, null, 2)
            }
          ]
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });
}

