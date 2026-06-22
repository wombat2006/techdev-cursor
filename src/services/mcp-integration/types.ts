import type { MCPConfigContext } from '../mcp-config-manager';

export interface MCPExecutionRequest {
  tools: any[];
  context: MCPConfigContext;
  requestedBy?: string;
  timeout?: number;
  dryRun?: boolean;
  enableCaching?: boolean;
  enableBatching?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  maxRetries?: number;
  fallbackProvider?: string;
}

export interface MCPExecutionResult {
  success: boolean;
  results: any[];
  mcp_calls: any[];
  cost_analysis: {
    estimated_cost: number;
    actual_cost: number;
    tool_breakdown: Array<{ tool: string; calls: number; cost: number }>;
  };
  approval_summary: {
    total_requests: number;
    auto_approved: number;
    manual_approved: number;
    rejected: number;
  };
  performance_metrics: {
    total_time_ms: number;
    approval_time_ms: number;
    execution_time_ms: number;
    tool_response_times: Record<string, number>;
  };
  security_events?: string[];
  error?: string;
}

export type ExecutionHistoryEntry = {
  timestamp: number;
  context: MCPConfigContext;
  result: MCPExecutionResult;
};
