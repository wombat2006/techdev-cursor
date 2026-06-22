import { logger } from '../../utils/logger';
import { mcpConfigManager } from '../mcp-config-manager';
import { processApprovalWorkflow } from './approval-workflow';
import { buildAnalytics, buildSystemStatus } from './analytics';
import { McpPerformanceStore } from './performance-store';
import { executeApprovedTools } from './tool-execution';
import type { ExecutionHistoryEntry, MCPExecutionRequest, MCPExecutionResult } from './types';

export class MCPIntegrationService {
  private executionHistory: ExecutionHistoryEntry[] = [];
  private readonly performance = new McpPerformanceStore();

  async executeMCPTools(
    openaiClient: any,
    request: MCPExecutionRequest
  ): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    this.performance.metrics.totalRequests++;

    logger.info('🚀 MCP Integration Service - Optimized Execution Started', {
      tools_requested: request.tools.length,
      context: request.context,
      requested_by: request.requestedBy || 'system',
      dry_run: request.dryRun || false,
      priority: request.priority || 'medium',
      caching_enabled: request.enableCaching !== false,
      batching_enabled: request.enableBatching !== false,
    });

    if (request.enableCaching !== false) {
      const cacheKey = this.performance.generateCacheKey(request);
      const cached = this.performance.getCachedResult(cacheKey);
      if (cached) {
        this.performance.metrics.cacheHits++;
        logger.debug('Cache hit for MCP request', { cacheKey });
        return cached;
      }
    }

    const circuitKey = this.performance.getCircuitBreakerKey(request);
    if (this.performance.isCircuitOpen(circuitKey)) {
      logger.warn('Circuit breaker is open, rejecting request', { circuitKey });
      throw new Error(`Circuit breaker is open for ${circuitKey}`);
    }

    if (request.priority === 'low' && this.performance.shouldQueue()) {
      return this.performance.queueRequest(request, (req) => this.executeMCPTools(openaiClient, req));
    }

    const result: MCPExecutionResult = {
      success: false,
      results: [],
      mcp_calls: [],
      cost_analysis: {
        estimated_cost: 0,
        actual_cost: 0,
        tool_breakdown: [],
      },
      approval_summary: {
        total_requests: 0,
        auto_approved: 0,
        manual_approved: 0,
        rejected: 0,
      },
      performance_metrics: {
        total_time_ms: 0,
        approval_time_ms: 0,
        execution_time_ms: 0,
        tool_response_times: {},
      },
      security_events: [],
    };

    try {
      const optimizedTools = mcpConfigManager.getOptimizedToolsForContext(request.context);
      const costEstimate = mcpConfigManager.estimateToolCosts(optimizedTools, 5);

      result.cost_analysis.estimated_cost = costEstimate.total_cost;

      if (costEstimate.budget_warning) {
        result.security_events?.push(`Budget Warning: ${costEstimate.budget_warning}`);
        logger.warn('💰 Budget Warning', { warning: costEstimate.budget_warning });
      }

      const approvalStartTime = Date.now();
      const approvalResults = await processApprovalWorkflow(
        optimizedTools,
        request.context,
        request.requestedBy || 'system'
      );

      result.approval_summary = approvalResults.summary;
      result.performance_metrics.approval_time_ms = Date.now() - approvalStartTime;

      if (approvalResults.hasRejections) {
        result.error = 'Critical operations rejected by approval workflow';
        result.security_events?.push('Execution blocked by approval rejection');
        return result;
      }

      if (request.dryRun) {
        logger.info('🧪 Dry Run Mode - Simulating execution', {
          approved_tools: approvalResults.approvedTools.length,
          estimated_cost: result.cost_analysis.estimated_cost,
        });

        result.success = true;
        result.results = [
          {
            type: 'dry_run',
            message: 'Execution simulated successfully',
            approved_tools: approvalResults.approvedTools.map((t) => t.server_label),
            would_execute: approvalResults.approvedTools.length > 0,
          },
        ];

        return result;
      }

      const executionStartTime = Date.now();
      const executionResult = await executeApprovedTools(
        openaiClient,
        approvalResults.approvedTools,
        request.context
      );

      result.performance_metrics.execution_time_ms = Date.now() - executionStartTime;
      result.results = executionResult.results;
      result.mcp_calls = executionResult.mcp_calls;
      result.cost_analysis.actual_cost = executionResult.actual_cost;
      result.cost_analysis.tool_breakdown = executionResult.tool_breakdown;
      result.performance_metrics.tool_response_times = executionResult.tool_response_times;

      result.success = true;

      logger.info('✅ MCP Integration Service - Execution Completed', {
        success: true,
        tools_executed: approvalResults.approvedTools.length,
        mcp_calls: result.mcp_calls.length,
        actual_cost: result.cost_analysis.actual_cost,
        total_time_ms: Date.now() - startTime,
      });
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.security_events?.push(`Execution error: ${result.error}`);

      logger.error('❌ MCP Integration Service - Execution Failed', {
        error: result.error,
        context: request.context,
      });
    }

    result.performance_metrics.total_time_ms = Date.now() - startTime;

    this.executionHistory.push({
      timestamp: startTime,
      context: request.context,
      result,
    });

    return result;
  }

  getAnalytics(timeWindowMs?: number) {
    return buildAnalytics(this.executionHistory, timeWindowMs);
  }

  getSystemStatus() {
    return buildSystemStatus(this.executionHistory);
  }

  getPerformanceMetrics(): any {
    return this.performance.getPerformanceMetrics();
  }

  resetOptimizations() {
    this.performance.reset();
  }
}

export const mcpIntegrationService = new MCPIntegrationService();

export default mcpIntegrationService;
