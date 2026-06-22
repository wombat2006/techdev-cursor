import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../utils/logger';
import { mcpApprovalManager } from '../mcp-approval-manager';
import { executeCodex } from './codex-executor';
import { assessRiskLevel, buildContextPrompt } from './prompt-utils';
import type { CodexExecutorOptions } from './codex-executor';
import type { CodexExecutionContext, CodexMCPConfig } from './types';
import type { CodexPerformanceStore } from './performance-store';
import type { ChildProcess } from 'child_process';

export interface CodexToolHandlerContext {
  config: CodexMCPConfig;
  sessionManager: ReturnType<typeof import('../codex-session-manager').getCodexSessionManager>;
  executorOptions: CodexExecutorOptions;
  activeProcesses: Map<string, ChildProcess>;
  connectionPool: Map<string, ChildProcess>;
  performance: CodexPerformanceStore;
  startTime: number;
}

export async function handleCodexTool(ctx: CodexToolHandlerContext, args: any): Promise<CallToolResult> {
  const {
    prompt,
    model = ctx.config.model,
    sandbox = ctx.config.sandbox,
    mode = 'interactive',
    full_auto = false,
    reasoning_effort,
    verbosity
  } = args;

  logger.info('🤖 Codex MCP: Starting new conversation', {
    model,
    sandbox,
    mode,
    full_auto,
    prompt_length: prompt.length
  });

  // Check approval if required
  if (ctx.config.approval_policy !== 'auto') {
    const approvalRequest = {
      id: `codex-${Date.now()}`,
      tool_name: 'codex',
      operation: 'start_conversation',
      arguments: { model, sandbox, mode, full_auto },
      context: { task_type: 'premium', cost_tier: 'medium' },
      requested_by: 'mcp-client',
      requested_at: Date.now(),
      risk_level: assessRiskLevel(sandbox, full_auto, mode) as any
    };

    const approval = await mcpApprovalManager.requestApproval(
      approvalRequest.tool_name,
      'execute',
      approvalRequest.arguments,
      {
        taskType: approvalRequest.context.task_type,
        budgetTier: approvalRequest.context.cost_tier,
        securityLevel: 'standard'
      } as any,
      approvalRequest.requested_by
    );

    if (!approval.requiresApproval || !approval.autoApproved) {
      const rejectionReason = approval.requestId ?
        `Manual approval required (ID: ${approval.requestId})` :
        'Request denied by policy';

      return {
        content: [
          {
            type: 'text',
            text: `Request denied: ${rejectionReason}`
          }
        ],
        isError: true
      };
    }
  }

  try {
    // Create session
    const sessionData = await ctx.sessionManager.createSession({
      prompt,
      model,
      sandbox
    });

    // Build execution context
    const context: CodexExecutionContext = {
      session_id: sessionData.sessionId,
      conversation_id: sessionData.conversationId,
      mode: mode as any,
      full_auto
    };

    // Execute Codex
    const result = await executeCodex(ctx.executorOptions, prompt, model, sandbox, context, {
      reasoning_effort,
      verbosity
    });

    // Store result in session
    if (result.success && result.response) {
      await ctx.sessionManager.addAssistantResponse(sessionData.sessionId, result.response);
      await ctx.sessionManager.updateSessionStatus(sessionData.sessionId, 'completed');
    } else {
      await ctx.sessionManager.updateSessionStatus(sessionData.sessionId, 'failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: result.response || result.error || 'No response received'
        }
      ],
      conversationId: sessionData.conversationId,
      sessionId: sessionData.sessionId,
      isError: !result.success
    };

  } catch (error) {
    logger.error('Codex execution failed', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle 'codex-reply' tool - continue conversation
 */
export async function handleCodexReplyTool(ctx: CodexToolHandlerContext, args: any): Promise<CallToolResult> {
  const { prompt, session_id, conversation_id } = args;
  const identifier = session_id || conversation_id;

  if (!identifier) {
    return {
      content: [
        {
          type: 'text',
          text: 'Either session_id or conversation_id must be provided'
        }
      ],
      isError: true
    };
  }

  logger.info('🔄 Codex MCP: Continuing conversation', {
    identifier,
    prompt_length: prompt.length
  });

  try {
    // Continue session
    const sessionData = await ctx.sessionManager.continueSession({
      sessionId: session_id,
      conversationId: conversation_id,
      prompt
    });

    if (!sessionData) {
      return {
        content: [
          {
            type: 'text',
            text: `Session not found: ${identifier}`
          }
        ],
        isError: true
      };
    }

    // Build context with conversation history
    const history = await ctx.sessionManager.getConversationHistory(sessionData.sessionId);
    const contextPrompt = buildContextPrompt(history, prompt);

    const context: CodexExecutionContext = {
      session_id: sessionData.sessionId,
      conversation_id: sessionData.conversationId,
      mode: 'interactive',
      resume_session: true
    };

    // Execute Codex with context
    const result = await executeCodex(ctx.executorOptions, 
      contextPrompt,
      sessionData.model,
      sessionData.sandbox,
      context
    );

    // Store result
    if (result.success && result.response) {
      await ctx.sessionManager.addAssistantResponse(sessionData.sessionId, result.response);
      await ctx.sessionManager.updateSessionStatus(sessionData.sessionId, 'completed');
    } else {
      await ctx.sessionManager.updateSessionStatus(sessionData.sessionId, 'failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: result.response || result.error || 'No response received'
        }
      ],
      conversationId: sessionData.conversationId,
      sessionId: sessionData.sessionId,
      isError: !result.success
    };

  } catch (error) {
    logger.error('Codex reply failed', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Reply failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle session info tool
 */
export async function handleSessionInfoTool(ctx: CodexToolHandlerContext, args: any): Promise<CallToolResult> {
  const { session_id, list_active = false } = args;

  try {
    if (list_active) {
      const stats = await ctx.sessionManager.getSessionStats();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2)
          }
        ]
      };
    }

    if (session_id) {
      const session = await ctx.sessionManager.getSession(session_id);
      const history = session ? await ctx.sessionManager.getConversationHistory(session_id) : null;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ session, history }, null, 2)
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Please provide session_id or set list_active to true'
        }
      ],
      isError: true
    };

  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to get session info: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle cleanup tool
 */
export async function handleCleanupTool(ctx: CodexToolHandlerContext, args: any): Promise<CallToolResult> {
  const { force = false } = args;

  try {
    const result = await ctx.sessionManager.cleanupExpiredSessions();

    if (force) {
      // Force cleanup all active processes
      for (const [sessionId, process] of ctx.activeProcesses) {
        process.kill('SIGTERM');
        ctx.activeProcesses.delete(sessionId);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Cleanup completed. Removed ${result.cleaned} expired sessions.${force ? ' Forced termination of active processes.' : ''}`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

export async function handleMetricsTool(ctx: CodexToolHandlerContext, args: any): Promise<CallToolResult> {
  const metrics = {
    ...ctx.performance.metrics,
    cache_size: ctx.performance.responseCache.size,
    active_connections: ctx.connectionPool.size,
    active_processes: ctx.activeProcesses.size,
    batch_queue_size: ctx.performance.requestBatch.length,
    uptime_ms: Date.now() - (ctx.startTime || Date.now()),
    cache_hit_rate: ctx.performance.metrics.cache_hits / ctx.performance.metrics.total_requests || 0
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(metrics, null, 2)
      }
    ]
  };
}
