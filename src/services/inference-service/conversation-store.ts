import { TaskType } from '../../types/huggingface';
import type { ConversationContext } from './types';

export function buildConversationContext(context: ConversationContext): string {
  const recentHistory = context.history.slice(-5);
  return recentHistory.map((entry) => `${entry.role}: ${entry.content}`).join('\n');
}

export function appendConversationTurn(
  conversationHistory: Map<string, ConversationContext>,
  conversationId: string,
  request: { inputs: string; model?: string; taskType?: ConversationContext['metadata']['taskType'] },
  response: { generated_text: string; usage: { inputTokens: number; outputTokens: number } },
  defaultModel: string
): void {
  let context = conversationHistory.get(conversationId);

  if (!context) {
    context = {
      conversationId,
      history: [],
      metadata: {
        model: request.model || defaultModel,
        taskType: request.taskType || TaskType.BASIC,
        totalTokens: 0,
        cost: 0,
      },
    };
  }

  context.history.push(
    {
      role: 'user',
      content: request.inputs,
      timestamp: new Date(),
    },
    {
      role: 'assistant',
      content: response.generated_text,
      timestamp: new Date(),
    }
  );

  context.metadata.totalTokens += response.usage.inputTokens + response.usage.outputTokens;

  if (context.history.length > 20) {
    context.history = context.history.slice(-20);
  }

  conversationHistory.set(conversationId, context);
}
