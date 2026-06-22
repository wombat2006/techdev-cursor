import type { MCPToolConfig } from './types';

const COST_PER_CALL: Record<NonNullable<MCPToolConfig['cost_tier']>, number> = {
  free: 0,
  low: 0.0001,
  medium: 0.001,
  high: 0.01,
};

export function estimateToolCosts(
  tools: MCPToolConfig[],
  estimatedCalls: number = 10
): {
  total_cost: number;
  cost_breakdown: Array<{ tool: string; estimated_cost: number }>;
  budget_warning?: string;
} {
  let totalCost = 0;
  const breakdown = tools.map((tool) => {
    const tier = tool.cost_tier || 'medium';
    const toolCost = COST_PER_CALL[tier] * estimatedCalls;
    totalCost += toolCost;

    return {
      tool: tool.server_label,
      estimated_cost: toolCost,
    };
  });

  const result: {
    total_cost: number;
    cost_breakdown: Array<{ tool: string; estimated_cost: number }>;
    budget_warning?: string;
  } = {
    total_cost: Math.round(totalCost * 10000) / 10000,
    cost_breakdown: breakdown,
  };

  if (totalCost > 0.1) {
    result.budget_warning = `High cost estimated: $${totalCost.toFixed(4)}. Consider reducing tool usage or switching to lower-cost alternatives.`;
  }

  return result;
}
