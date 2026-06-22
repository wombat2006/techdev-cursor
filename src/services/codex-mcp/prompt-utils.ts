export function buildContextPrompt(history: any[], newPrompt: string): string {
  let context = '# Conversation History\n\n';

  // Add recent messages (last 5 for context management)
  const recentHistory = history.slice(-5);
  for (const message of recentHistory) {
    if (message.type === 'user') {
      context += `**User**: ${message.content}\n\n`;
    } else if (message.type === 'assistant') {
      context += `**Assistant**: ${message.content}\n\n`;
    }
  }

  context += `# Current Request\n\n${newPrompt}`;
  return context;
}

/**
 * Assess risk level for approval workflow
 */
export function assessRiskLevel(
  sandbox: string,
  fullAuto: boolean,
  mode: string
): 'low' | 'medium' | 'high' | 'critical' {
  if (fullAuto && sandbox === 'full-access') return 'critical';
  if (sandbox === 'full-access') return 'high';
  if (fullAuto || mode === 'ci') return 'medium';
  return 'low';
}
