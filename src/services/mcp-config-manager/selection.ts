import type { MCPConfigContext, MCPToolConfig } from './types';

export function getToolPrioritiesForTask(taskType: string): [string, number][] {
  const priorities: Record<string, Record<string, number>> = {
    basic: {
      context7: 10,
      cipher: 8,
      google_drive: 6,
    },
    premium: {
      cipher: 10,
      context7: 9,
      google_drive: 8,
      sharepoint: 6,
    },
    critical: {
      cipher: 10,
      context7: 9,
      google_drive: 8,
      gmail: 7,
      sharepoint: 6,
    },
  };

  const taskPriorities = priorities[taskType] || priorities.basic;
  return Object.entries(taskPriorities).sort(([, a], [, b]) => b - a);
}

export function isSecurityLevelAllowed(toolLevel: string, contextLevel: string): boolean {
  const levels = ['public', 'internal', 'sensitive', 'critical'];
  const toolLevelIndex = levels.indexOf(toolLevel);
  const contextLevelIndex = levels.indexOf(contextLevel);

  return toolLevelIndex <= contextLevelIndex;
}

export function isToolEnvironmentReady(toolName: string): boolean {
  const envChecks: Record<string, () => boolean> = {
    cipher: () => process.env.CIPHER_MCP_ENABLED === 'true',
    context7: () =>
      process.env.CONTEXT7_MCP_ENABLED === 'true' && !!process.env.CONTEXT7_API_KEY,
    google_drive: () =>
      process.env.GOOGLE_DRIVE_MCP_ENABLED === 'true' && !!process.env.GOOGLE_OAUTH_TOKEN,
    gmail: () => process.env.GMAIL_MCP_ENABLED === 'true' && !!process.env.GMAIL_OAUTH_TOKEN,
    sharepoint: () =>
      process.env.SHAREPOINT_MCP_ENABLED === 'true' && !!process.env.SHAREPOINT_OAUTH_TOKEN,
  };

  return envChecks[toolName]?.() || false;
}

export function applyContextualOptimizations(
  config: MCPToolConfig,
  context: MCPConfigContext
): MCPToolConfig {
  const optimized = { ...config };

  if (context.taskType === 'basic') {
    optimized.allowed_tools = config.allowed_tools.slice(0, 3);
  } else if (context.taskType === 'critical') {
    if (typeof optimized.require_approval === 'string' && optimized.require_approval === 'never') {
      optimized.require_approval = {
        never: { tool_names: config.allowed_tools.slice(0, 2) },
        always: { tool_names: config.allowed_tools.slice(2) },
      };
    }
  }

  return optimized;
}
