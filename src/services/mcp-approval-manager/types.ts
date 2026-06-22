import type { MCPConfigContext } from '../mcp-config-manager/types';

export interface ApprovalRequest {
  id: string;
  tool_name: string;
  operation: string;
  arguments: unknown;
  context: MCPConfigContext;
  requested_by: string;
  requested_at: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  sensitive_data?: string[];
  business_justification?: string;
}

export interface ApprovalResponse {
  request_id: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: number;
  rejection_reason?: string;
  conditions?: string[];
  expires_at?: number;
}

export interface ApprovalPolicy {
  risk_level: string;
  required_approvers: number;
  approver_roles: string[];
  auto_approve_conditions?: Array<{
    condition: (request: ApprovalRequest) => boolean;
    description: string;
  }>;
  escalation_timeout_ms: number;
}

export interface ApprovalAuditLogEntry {
  timestamp: number;
  action: string;
  request_id: string;
  details: Record<string, unknown>;
}

export type RiskLevel = ApprovalRequest['risk_level'];
