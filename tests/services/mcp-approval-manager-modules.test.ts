import { createDefaultApprovalPolicies } from '../../src/services/mcp-approval-manager/default-policies';
import {
  assessRiskLevel,
  detectSensitiveData,
} from '../../src/services/mcp-approval-manager/risk-assessment';
import { computeApprovalStatistics } from '../../src/services/mcp-approval-manager/statistics';
import type { ApprovalAuditLogEntry } from '../../src/services/mcp-approval-manager/types';

describe('mcp-approval-manager SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports MCPApprovalManager and singleton from shim path', async () => {
      const mod = await import('../../src/services/mcp-approval-manager');
      expect(mod.MCPApprovalManager).toBeDefined();
      expect(mod.mcpApprovalManager).toBeDefined();
      expect(mod.default).toBe(mod.mcpApprovalManager);
    });
  });

  describe('default-policies', () => {
    it('creates policies for all risk levels', () => {
      const policies = createDefaultApprovalPolicies();
      expect(policies.size).toBe(4);
      expect(policies.has('low')).toBe(true);
      expect(policies.has('critical')).toBe(true);
    });
  });

  describe('risk-assessment', () => {
    const baseContext = {
      taskType: 'basic' as const,
      budgetTier: 'free' as const,
      securityLevel: 'public' as const,
    };

    it('assessRiskLevel flags destructive operations as critical', () => {
      expect(assessRiskLevel('tool', 'delete_file', {}, baseContext)).toBe('critical');
    });

    it('assessRiskLevel flags write operations as high', () => {
      expect(assessRiskLevel('tool', 'create_record', {}, baseContext)).toBe('high');
    });

    it('detectSensitiveData finds credential patterns', () => {
      expect(detectSensitiveData({ password: 'secret' })).toContain('credentials');
    });
  });

  describe('statistics', () => {
    it('computeApprovalStatistics aggregates audit log entries', () => {
      const logs: ApprovalAuditLogEntry[] = [
        {
          timestamp: Date.now(),
          action: 'approval_requested',
          request_id: 'r1',
          details: { tool: 'context7', risk_level: 'low' },
        },
        {
          timestamp: Date.now(),
          action: 'approval_granted',
          request_id: 'r1',
          details: { approved_by: 'system_policy' },
        },
      ];

      const stats = computeApprovalStatistics(logs, 0);
      expect(stats.total_requests).toBe(1);
      expect(stats.auto_approved).toBe(1);
      expect(stats.by_tool.context7).toBe(1);
    });
  });
});
