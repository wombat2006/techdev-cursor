export { MCPApprovalManager } from './manager';
export { createDefaultApprovalPolicies } from './default-policies';
export { assessRiskLevel, detectSensitiveData } from './risk-assessment';
export { generateApprovalRequestId } from './request-id';
export { computeApprovalStatistics } from './statistics';
export { exportAuditLogEntries } from './audit-export';
export type {
  ApprovalAuditLogEntry,
  ApprovalPolicy,
  ApprovalRequest,
  ApprovalResponse,
  RiskLevel,
} from './types';

import { MCPApprovalManager } from './manager';

export const mcpApprovalManager = new MCPApprovalManager();
export default mcpApprovalManager;