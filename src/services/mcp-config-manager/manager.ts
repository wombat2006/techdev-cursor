import { logger } from '../../utils/logger';
import { buildDefaultToolConfigurations } from './defaults';
import { estimateToolCosts } from './cost-estimation';
import {
  applyContextualOptimizations,
  getToolPrioritiesForTask,
  isSecurityLevelAllowed,
  isToolEnvironmentReady,
} from './selection';
import { COST_THRESHOLDS, type MCPConfigContext, type MCPToolConfig } from './types';

export class MCPConfigManager {
  private toolConfigurations: Map<string, MCPToolConfig> = new Map();

  constructor() {
    this.toolConfigurations = buildDefaultToolConfigurations();
    logger.info('🔧 MCP Configuration Manager initialized', {
      configured_tools: this.toolConfigurations.size,
      available_tools: Array.from(this.toolConfigurations.keys()),
    });
  }

  getOptimizedToolsForContext(context: MCPConfigContext): MCPToolConfig[] {
    const availableTools: MCPToolConfig[] = [];
    const budgetLimits = COST_THRESHOLDS[context.budgetTier];

    logger.info('🎯 Selecting optimized MCP tools', {
      taskType: context.taskType,
      budgetTier: context.budgetTier,
      securityLevel: context.securityLevel,
      maxTools: budgetLimits.maxTools,
    });

    const toolPriorities = getToolPrioritiesForTask(context.taskType);

    for (const [toolName, priority] of toolPriorities) {
      if (availableTools.length >= budgetLimits.maxTools) break;

      const toolConfig = this.toolConfigurations.get(toolName);
      if (!toolConfig) continue;

      if (!isSecurityLevelAllowed(toolConfig.security_level!, context.securityLevel)) {
        logger.debug('🚫 Tool filtered out by security level', {
          tool: toolName,
          tool_security: toolConfig.security_level,
          context_security: context.securityLevel,
        });
        continue;
      }

      if (!isToolEnvironmentReady(toolName)) {
        logger.debug('⚠️ Tool skipped - environment not ready', { tool: toolName });
        continue;
      }

      const optimizedConfig = applyContextualOptimizations(toolConfig, context);
      availableTools.push(optimizedConfig);

      logger.debug('✅ Tool selected', {
        tool: toolName,
        priority,
        cost_tier: toolConfig.cost_tier,
        allowed_tools_count: optimizedConfig.allowed_tools.length,
      });
    }

    logger.info('🎯 Tool selection completed', {
      selected_tools: availableTools.map((t) => t.server_label),
      total_count: availableTools.length,
      budget_utilization: `${availableTools.length}/${budgetLimits.maxTools}`,
    });

    return availableTools;
  }

  estimateToolCosts(tools: MCPToolConfig[], estimatedCalls: number = 10) {
    return estimateToolCosts(tools, estimatedCalls);
  }

  getApprovalRequirement(
    toolName: string,
    operation: string,
    context: MCPConfigContext
  ): 'always' | 'never' | 'conditional' {
    const config = this.toolConfigurations.get(toolName);
    if (!config) return 'always';

    const approval = config.require_approval;

    if (typeof approval === 'string') {
      return approval;
    }

    if (approval.never?.tool_names.includes(operation)) {
      return 'never';
    }

    if (approval.always?.tool_names.includes(operation)) {
      return 'always';
    }

    if (approval.conditional?.tool_names.includes(operation)) {
      return approval.conditional.conditions(context) ? 'always' : 'never';
    }

    return 'always';
  }

  updateToolConfiguration(toolName: string, updates: Partial<MCPToolConfig>): void {
    const existing = this.toolConfigurations.get(toolName);
    if (!existing) {
      throw new Error(`Tool configuration not found: ${toolName}`);
    }

    const updated = { ...existing, ...updates };
    this.toolConfigurations.set(toolName, updated);

    logger.info('🔄 Tool configuration updated', {
      tool: toolName,
      updates: Object.keys(updates),
    });
  }

  getConfigurationStatus(): {
    total_tools: number;
    enabled_tools: string[];
    disabled_tools: string[];
    cost_distribution: Record<string, number>;
  } {
    const allTools = Array.from(this.toolConfigurations.keys());
    const enabledTools = allTools.filter((tool) => isToolEnvironmentReady(tool));
    const disabledTools = allTools.filter((tool) => !enabledTools.includes(tool));

    const costDistribution: Record<string, number> = {};
    for (const [, config] of this.toolConfigurations) {
      const tier = config.cost_tier || 'medium';
      costDistribution[tier] = (costDistribution[tier] || 0) + 1;
    }

    return {
      total_tools: allTools.length,
      enabled_tools: enabledTools,
      disabled_tools: disabledTools,
      cost_distribution: costDistribution,
    };
  }
}
