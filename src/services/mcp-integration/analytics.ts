import { mcpApprovalManager } from '../mcp-approval-manager';
import { mcpConfigManager } from '../mcp-config-manager';
import type { ExecutionHistoryEntry } from './types';

export function buildAnalytics(
  executionHistory: ExecutionHistoryEntry[],
  timeWindowMs: number = 24 * 60 * 60 * 1000
): {
  execution_stats: {
    total_executions: number;
    success_rate: number;
    average_cost: number;
    average_duration_ms: number;
  };
  tool_usage: Record<string, { count: number; total_cost: number }>;
  security_events: string[];
  cost_trends: Array<{ timestamp: number; cost: number }>;
  performance_trends: Array<{ timestamp: number; duration_ms: number }>;
} {
  const cutoff = Date.now() - timeWindowMs;
  const recentExecutions = executionHistory.filter((exec) => exec.timestamp >= cutoff);

  const totalExecutions = recentExecutions.length;
  const successfulExecutions = recentExecutions.filter((exec) => exec.result.success).length;
  const totalCost = recentExecutions.reduce(
    (sum, exec) => sum + exec.result.cost_analysis.actual_cost,
    0
  );
  const totalDuration = recentExecutions.reduce(
    (sum, exec) => sum + exec.result.performance_metrics.total_time_ms,
    0
  );

  const toolUsage: Record<string, { count: number; total_cost: number }> = {};
  const securityEvents: string[] = [];
  const costTrends: Array<{ timestamp: number; cost: number }> = [];
  const performanceTrends: Array<{ timestamp: number; duration_ms: number }> = [];

  for (const execution of recentExecutions) {
    for (const breakdown of execution.result.cost_analysis.tool_breakdown) {
      if (!toolUsage[breakdown.tool]) {
        toolUsage[breakdown.tool] = { count: 0, total_cost: 0 };
      }
      toolUsage[breakdown.tool].count += breakdown.calls;
      toolUsage[breakdown.tool].total_cost += breakdown.cost;
    }

    if (execution.result.security_events) {
      securityEvents.push(...execution.result.security_events);
    }

    costTrends.push({
      timestamp: execution.timestamp,
      cost: execution.result.cost_analysis.actual_cost,
    });

    performanceTrends.push({
      timestamp: execution.timestamp,
      duration_ms: execution.result.performance_metrics.total_time_ms,
    });
  }

  return {
    execution_stats: {
      total_executions: totalExecutions,
      success_rate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      average_cost: totalExecutions > 0 ? totalCost / totalExecutions : 0,
      average_duration_ms: totalExecutions > 0 ? totalDuration / totalExecutions : 0,
    },
    tool_usage: toolUsage,
    security_events: [...new Set(securityEvents)],
    cost_trends: costTrends,
    performance_trends: performanceTrends,
  };
}

export function buildSystemStatus(executionHistory: ExecutionHistoryEntry[]): {
  mcp_config_status: any;
  approval_stats: any;
  recent_execution_count: number;
  system_health: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
} {
  const configStatus = mcpConfigManager.getConfigurationStatus();
  const approvalStats = mcpApprovalManager.getApprovalStatistics();
  const recentExecutions = executionHistory.filter(
    (exec) => exec.timestamp >= Date.now() - 60 * 60 * 1000
  ).length;

  let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  const recommendations: string[] = [];

  if (configStatus.disabled_tools.length > configStatus.enabled_tools.length) {
    systemHealth = 'warning';
    recommendations.push('Many MCP tools are disabled. Check environment configuration.');
  }

  if (approvalStats.rejected > approvalStats.approved + approvalStats.auto_approved) {
    systemHealth = 'warning';
    recommendations.push('High rejection rate detected. Review approval policies.');
  }

  if (recentExecutions === 0) {
    recommendations.push('No recent MCP executions. System may be underutilized.');
  }

  return {
    mcp_config_status: configStatus,
    approval_stats: approvalStats,
    recent_execution_count: recentExecutions,
    system_health: systemHealth,
    recommendations,
  };
}
