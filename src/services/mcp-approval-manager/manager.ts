import { logger } from '../../utils/logger';
import { mcpConfigManager } from '../mcp-config-manager/index';
import type { MCPConfigContext } from '../mcp-config-manager/types';
import { exportAuditLogEntries } from './audit-export';
import { createDefaultApprovalPolicies } from './default-policies';
import { generateApprovalRequestId } from './request-id';
import { assessRiskLevel, detectSensitiveData } from './risk-assessment';
import { computeApprovalStatistics } from './statistics';
import type {
  ApprovalAuditLogEntry,
  ApprovalPolicy,
  ApprovalRequest,
  ApprovalResponse,
} from './types';

export class MCPApprovalManager {
  private readonly pendingRequests = new Map<string, ApprovalRequest>();
  private readonly approvalResponses = new Map<string, ApprovalResponse>();
  private readonly approvalPolicies: Map<string, ApprovalPolicy>;
  private readonly auditLog: ApprovalAuditLogEntry[] = [];

  constructor(policies: Map<string, ApprovalPolicy> = createDefaultApprovalPolicies()) {
    this.approvalPolicies = policies;
    logger.info('🔐 MCP Approval Manager initialized', {
      policies_loaded: this.approvalPolicies.size,
      risk_levels: Array.from(this.approvalPolicies.keys()),
    });
  }

  async requestApproval(
    toolName: string,
    operation: string,
    operationArgs: unknown,
    context: MCPConfigContext,
    requestedBy: string = 'system'
  ): Promise<{ requiresApproval: boolean; requestId?: string; autoApproved?: boolean }> {
    const approvalRequirement = mcpConfigManager.getApprovalRequirement(
      toolName,
      operation,
      context
    );

    if (approvalRequirement === 'never') {
      logger.debug('✅ Auto-approved: No approval required', { toolName, operation });
      return { requiresApproval: false };
    }

    const requestId = generateApprovalRequestId();
    const riskLevel = assessRiskLevel(toolName, operation, operationArgs, context);

    const request: ApprovalRequest = {
      id: requestId,
      tool_name: toolName,
      operation,
      arguments: operationArgs,
      context,
      requested_by: requestedBy,
      requested_at: Date.now(),
      risk_level: riskLevel,
      sensitive_data: detectSensitiveData(operationArgs),
      business_justification: `${context.taskType} task requiring ${toolName}:${operation}`,
    };

    const policy = this.approvalPolicies.get(riskLevel);
    if (policy?.auto_approve_conditions) {
      for (const condition of policy.auto_approve_conditions) {
        if (condition.condition(request)) {
          logger.info('✅ Auto-approved by policy', {
            requestId,
            toolName,
            operation,
            condition: condition.description,
            riskLevel,
          });

          this.recordApprovalDecision(requestId, {
            request_id: requestId,
            approved: true,
            approved_by: 'system_policy',
            approved_at: Date.now(),
          });

          return { requiresApproval: false, requestId, autoApproved: true };
        }
      }
    }

    this.pendingRequests.set(requestId, request);

    this.auditLog.push({
      timestamp: Date.now(),
      action: 'approval_requested',
      request_id: requestId,
      details: {
        tool: toolName,
        operation,
        risk_level: riskLevel,
        requested_by: requestedBy,
        context: context.taskType,
      },
    });

    logger.info('📋 Approval request created', {
      requestId,
      toolName,
      operation,
      riskLevel,
      requiredApprovers: policy?.required_approvers || 1,
      approverRoles: policy?.approver_roles || [],
    });

    if (policy?.escalation_timeout_ms) {
      setTimeout(() => {
        this.handleApprovalTimeout(requestId);
      }, policy.escalation_timeout_ms);
    }

    return { requiresApproval: true, requestId };
  }

  async processApproval(
    requestId: string,
    approved: boolean,
    approverRole: string,
    approverIdentity: string,
    rejectionReason?: string,
    conditions?: string[]
  ): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    const policy = this.approvalPolicies.get(request.risk_level);
    if (!policy) {
      throw new Error(`No policy found for risk level: ${request.risk_level}`);
    }

    if (!policy.approver_roles.includes(approverRole)) {
      throw new Error(
        `Insufficient permissions. Required roles: ${policy.approver_roles.join(', ')}`
      );
    }

    const response: ApprovalResponse = {
      request_id: requestId,
      approved,
      approved_by: `${approverRole}:${approverIdentity}`,
      approved_at: Date.now(),
      rejection_reason: rejectionReason,
      conditions,
      expires_at: approved ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
    };

    this.recordApprovalDecision(requestId, response);
    this.pendingRequests.delete(requestId);

    logger.info(approved ? '✅ Request approved' : '❌ Request rejected', {
      requestId,
      approver: response.approved_by,
      tool: request.tool_name,
      operation: request.operation,
      reason: rejectionReason,
      conditions: conditions?.length || 0,
    });

    return approved;
  }

  async isOperationApproved(requestId: string): Promise<{
    approved: boolean;
    response?: ApprovalResponse;
    expired?: boolean;
  }> {
    const response = this.approvalResponses.get(requestId);

    if (!response) {
      return { approved: false };
    }

    if (response.expires_at && Date.now() > response.expires_at) {
      logger.warn('⏰ Approval expired', { requestId });
      return { approved: false, expired: true };
    }

    return { approved: response.approved, response };
  }

  getApprovalStatistics(timeWindow: number = 24 * 60 * 60 * 1000) {
    return computeApprovalStatistics(this.auditLog, this.pendingRequests.size, timeWindow);
  }

  exportAuditLog(startTime?: number, endTime?: number) {
    return exportAuditLogEntries(this.auditLog, startTime, endTime);
  }

  private recordApprovalDecision(requestId: string, response: ApprovalResponse): void {
    this.approvalResponses.set(requestId, response);

    this.auditLog.push({
      timestamp: Date.now(),
      action: response.approved ? 'approval_granted' : 'approval_denied',
      request_id: requestId,
      details: {
        approved_by: response.approved_by,
        conditions: response.conditions,
        reason: response.rejection_reason,
      },
    });
  }

  private handleApprovalTimeout(requestId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return;
    }

    logger.warn('⏰ Approval request timed out', {
      requestId,
      tool: request.tool_name,
      operation: request.operation,
      age_minutes: Math.floor((Date.now() - request.requested_at) / 60000),
    });

    this.recordApprovalDecision(requestId, {
      request_id: requestId,
      approved: false,
      rejection_reason:
        'Request timed out - no approval received within allowed timeframe',
      approved_at: Date.now(),
    });

    this.pendingRequests.delete(requestId);
  }
}

export default MCPApprovalManager;
