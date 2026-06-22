import { simulateApprovalDecision } from '../../src/services/mcp-integration/approval-workflow';
import { McpPerformanceStore } from '../../src/services/mcp-integration/performance-store';
import type { MCPExecutionRequest } from '../../src/services/mcp-integration/types';

describe('mcp-integration SRP modules', () => {
  describe('approval-workflow', () => {
    it('simulateApprovalDecision rejects destructive ops on basic tasks', () => {
      expect(
        simulateApprovalDecision('gmail', 'delete', {
          taskType: 'basic',
          securityLevel: 'standard',
          budgetTier: 'low',
        })
      ).toBe(false);
    });

    it('simulateApprovalDecision approves read operations', () => {
      expect(
        simulateApprovalDecision('drive', 'read', {
          taskType: 'basic',
          securityLevel: 'standard',
          budgetTier: 'low',
        })
      ).toBe(true);
    });
  });

  describe('performance-store', () => {
    it('generateCacheKey is stable for identical requests', () => {
      const store = new McpPerformanceStore();
      const request: MCPExecutionRequest = {
        tools: [{ name: 'search' }],
        context: { taskType: 'basic', securityLevel: 'standard', budgetTier: 'low' },
      };
      const keyA = store.generateCacheKey(request);
      const keyB = store.generateCacheKey(request);
      expect(keyA).toBe(keyB);
    });
  });
});
