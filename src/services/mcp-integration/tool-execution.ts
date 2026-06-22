import type { MCPConfigContext } from '../mcp-config-manager';

export async function executeApprovedTools(
  openaiClient: any,
  approvedTools: any[],
  context: MCPConfigContext
): Promise<{
  results: any[];
  mcp_calls: any[];
  actual_cost: number;
  tool_breakdown: Array<{ tool: string; calls: number; cost: number }>;
  tool_response_times: Record<string, number>;
}> {
  const results: any[] = [];
  const mcp_calls: any[] = [];
  const tool_breakdown: Array<{ tool: string; calls: number; cost: number }> = [];
  const tool_response_times: Record<string, number> = {};
  let actual_cost = 0;

  if (approvedTools.length === 0) {
    return { results, mcp_calls, actual_cost, tool_breakdown, tool_response_times };
  }

  const toolStartTime = Date.now();

  try {
    const response = await openaiClient.responses.create({
      model: 'gpt-5',
      tools: approvedTools,
      instructions: `Enterprise MCP Integration - Execute approved operations with:
        - Task Type: ${context.taskType}
        - Security Level: ${context.securityLevel}
        - Budget Tier: ${context.budgetTier}

        Use tools efficiently and provide comprehensive results.
        Note: Adaptive reasoning is enabled for optimal multi-LLM coordination.`,
      input: `Execute approved MCP operations for ${context.taskType} task`,
      store: true,
      reasoning: {
        effort:
          context.taskType === 'basic'
            ? 'minimal'
            : context.taskType === 'premium'
              ? 'medium'
              : 'high',
      },
      text: {
        verbosity:
          context.taskType === 'basic'
            ? 'low'
            : context.taskType === 'premium'
              ? 'medium'
              : 'high',
      },
    });

    tool_response_times['openai_api'] = Date.now() - toolStartTime;

    results.push({
      content: response.output_text || 'No response generated',
      success: true,
    });

    if (response.output) {
      const mcpCallItems = response.output.filter((item: any) => item.type === 'mcp_call');
      mcp_calls.push(...mcpCallItems);

      const toolUsage: Record<string, { calls: number; cost: number }> = {};

      for (const call of mcpCallItems) {
        const toolName = call.server_label;
        if (!toolUsage[toolName]) {
          toolUsage[toolName] = { calls: 0, cost: 0 };
        }
        toolUsage[toolName].calls++;
        toolUsage[toolName].cost += 0.001;
      }

      for (const [toolName, usage] of Object.entries(toolUsage)) {
        tool_breakdown.push({
          tool: toolName,
          calls: usage.calls,
          cost: usage.cost,
        });
        actual_cost += usage.cost;
      }
    }

    if (response.usage) {
      const tokenCost =
        response.usage.input_tokens * 0.0000015 + response.usage.output_tokens * 0.000006;
      actual_cost += tokenCost;
    }
  } catch (error) {
    results.push({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }

  return { results, mcp_calls, actual_cost, tool_breakdown, tool_response_times };
}
