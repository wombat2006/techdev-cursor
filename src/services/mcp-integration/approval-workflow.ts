import { logger } from '../../utils/logger';
import type { MCPConfigContext } from '../mcp-config-manager';
import { mcpApprovalManager } from '../mcp-approval-manager';
import type { MCPExecutionResult } from './types';

export function simulateApprovalDecision(
  toolName: string,
  operation: string,
  context: MCPConfigContext
): boolean {
  if (context.taskType === 'basic' && ['send', 'delete', 'modify'].includes(operation)) {
    return false;
  }

  if (['search', 'read', 'get', 'fetch'].includes(operation)) {
    return true;
  }

  if (context.taskType === 'critical' && context.securityLevel === 'critical') {
    return true;
  }

  return true;
}

export async function processApprovalWorkflow(
  tools: any[],
  context: MCPConfigContext,
  requestedBy: string
): Promise<{
  summary: MCPExecutionResult['approval_summary'];
  approvedTools: any[];
  hasRejections: boolean;
}> {
  const summary = {
    total_requests: 0,
    auto_approved: 0,
    manual_approved: 0,
    rejected: 0,
  };

  const approvedTools: any[] = [];
  let hasRejections = false;

  for (const tool of tools) {
    for (const allowedOperation of tool.allowed_tools) {
      summary.total_requests++;

      const approvalRequest = await mcpApprovalManager.requestApproval(
        tool.server_label,
        allowedOperation,
        { tool_config: tool },
        context,
        requestedBy
      );

      if (!approvalRequest.requiresApproval) {
        if (approvalRequest.autoApproved) {
          summary.auto_approved++;
        }

        if (!approvedTools.find((t) => t.server_label === tool.server_label)) {
          approvedTools.push(tool);
        }
      } else {
        const shouldApprove = simulateApprovalDecision(
          tool.server_label,
          allowedOperation,
          context
        );

        if (shouldApprove) {
          summary.manual_approved++;
          if (!approvedTools.find((t) => t.server_label === tool.server_label)) {
            approvedTools.push(tool);
          }
        } else {
          summary.rejected++;
          hasRejections = true;
        }
      }
    }
  }

  logger.info('📋 Approval workflow completed', {
    total_requests: summary.total_requests,
    auto_approved: summary.auto_approved,
    manual_approved: summary.manual_approved,
    rejected: summary.rejected,
    approved_tools: approvedTools.length,
  });

  return { summary, approvedTools, hasRejections };
}
