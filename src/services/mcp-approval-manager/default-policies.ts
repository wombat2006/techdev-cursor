import type { ApprovalPolicy } from './types';

export function createDefaultApprovalPolicies(): Map<string, ApprovalPolicy> {
  const policies = new Map<string, ApprovalPolicy>();

  policies.set('low', {
    risk_level: 'low',
    required_approvers: 0,
    approver_roles: [],
    auto_approve_conditions: [
      {
        condition: (req) =>
          ['search', 'read', 'get', 'fetch'].some((op) =>
            req.operation.toLowerCase().includes(op)
          ),
        description: 'Read-only operations are auto-approved',
      },
      {
        condition: (req) => req.context.taskType === 'basic' && req.tool_name === 'context7',
        description: 'Context7 documentation access for basic tasks',
      },
    ],
    escalation_timeout_ms: 0,
  });

  policies.set('medium', {
    risk_level: 'medium',
    required_approvers: 1,
    approver_roles: ['tech_lead', 'senior_engineer', 'system_admin'],
    auto_approve_conditions: [
      {
        condition: (req) =>
          req.context.taskType === 'basic' && req.requested_by.includes('system'),
        description: 'System-initiated basic tasks with medium risk',
      },
    ],
    escalation_timeout_ms: 5 * 60 * 1000,
  });

  policies.set('high', {
    risk_level: 'high',
    required_approvers: 1,
    approver_roles: ['security_officer', 'engineering_manager', 'cto'],
    escalation_timeout_ms: 15 * 60 * 1000,
  });

  policies.set('critical', {
    risk_level: 'critical',
    required_approvers: 2,
    approver_roles: ['security_officer', 'cto', 'compliance_officer'],
    escalation_timeout_ms: 30 * 60 * 1000,
  });

  return policies;
}
