import type { MCPConfigContext } from '../mcp-config-manager/types';
import type { RiskLevel } from './types';

export function assessRiskLevel(
  toolName: string,
  operation: string,
  args: unknown,
  context: MCPConfigContext
): RiskLevel {
  if (['delete', 'remove', 'drop', 'destroy'].some((op) => operation.toLowerCase().includes(op))) {
    return 'critical';
  }

  if (
    ['send', 'create', 'update', 'modify', 'share', 'publish'].some((op) =>
      operation.toLowerCase().includes(op)
    )
  ) {
    return 'high';
  }

  if (context.securityLevel === 'critical' || context.taskType === 'critical') {
    return 'high';
  }

  const sensitiveTools = ['gmail', 'sharepoint', 'teams'];
  if (sensitiveTools.includes(toolName.toLowerCase())) {
    return 'medium';
  }

  if (args && typeof args === 'object') {
    const argString = JSON.stringify(args);
    if (argString.length > 1000) {
      return 'medium';
    }
  }

  return 'low';
}

export function detectSensitiveData(args: unknown): string[] {
  const sensitive: string[] = [];
  const argString = JSON.stringify(args ?? {}).toLowerCase();

  const patterns = [
    { pattern: /password|secret|key|token/i, type: 'credentials' },
    { pattern: /ssn|social.*security|tax.*id/i, type: 'pii' },
    { pattern: /credit.*card|bank.*account|routing/i, type: 'financial' },
    { pattern: /confidential|proprietary|internal.*only/i, type: 'business_sensitive' },
  ];

  for (const { pattern, type } of patterns) {
    if (pattern.test(argString)) {
      sensitive.push(type);
    }
  }

  return sensitive;
}
