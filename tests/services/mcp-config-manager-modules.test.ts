import {
  applyContextualOptimizations,
  getToolPrioritiesForTask,
  isSecurityLevelAllowed,
  isToolEnvironmentReady,
} from '../../src/services/mcp-config-manager/selection';
import { estimateToolCosts } from '../../src/services/mcp-config-manager/cost-estimation';
import type { MCPToolConfig } from '../../src/services/mcp-config-manager/types';

describe('mcp-config-manager SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports MCPConfigManager and singleton from shim path', async () => {
      const mod = await import('../../src/services/mcp-config-manager');
      expect(mod.MCPConfigManager).toBeDefined();
      expect(mod.mcpConfigManager).toBeDefined();
      expect(mod.default).toBe(mod.mcpConfigManager);
    });
  });

  describe('selection', () => {
    it('getToolPrioritiesForTask ranks context7 highest for basic tasks', () => {
      const priorities = getToolPrioritiesForTask('basic');
      expect(priorities[0][0]).toBe('context7');
    });

    it('isSecurityLevelAllowed permits public tools in internal context', () => {
      expect(isSecurityLevelAllowed('public', 'internal')).toBe(true);
      expect(isSecurityLevelAllowed('critical', 'internal')).toBe(false);
    });

    it('isToolEnvironmentReady returns false when env flags are unset', () => {
      expect(isToolEnvironmentReady('cipher')).toBe(false);
    });

    it('applyContextualOptimizations trims tools for basic tasks', () => {
      const config: MCPToolConfig = {
        type: 'mcp',
        server_label: 'test',
        require_approval: 'never',
        allowed_tools: ['a', 'b', 'c', 'd'],
      };
      const optimized = applyContextualOptimizations(config, {
        taskType: 'basic',
        budgetTier: 'free',
        securityLevel: 'public',
      });
      expect(optimized.allowed_tools).toHaveLength(3);
    });
  });

  describe('cost-estimation', () => {
    it('estimateToolCosts sums tier costs', () => {
      const tools: MCPToolConfig[] = [
        {
          type: 'mcp',
          server_label: 'free_tool',
          require_approval: 'never',
          allowed_tools: ['read'],
          cost_tier: 'free',
        },
        {
          type: 'mcp',
          server_label: 'high_tool',
          require_approval: 'never',
          allowed_tools: ['send'],
          cost_tier: 'high',
        },
      ];
      const result = estimateToolCosts(tools, 11);
      expect(result.total_cost).toBe(0.11);
      expect(result.budget_warning).toBeDefined();
    });
  });
});
