import type { LLMProvider, LLMResponse, StreamEmit, TaskType } from './types';
import { invokeGemini, invokeGeminiFlash } from './gemini-invoker';
import { invokeGPT5 } from './gpt5-invoker';
import { invokeClaude } from './claude-invoker';

export function getProviderOrder(
  providerOrder: string[],
  taskType: TaskType
): string[] {
  const baseOrder = [...providerOrder];
  
  switch (taskType) {
    case 'simple':
      // シンプルなクエリ: 軽量モデル優先で壁打ち実施
      return ['gemini-2.5-flash', 'gemini-2.5-pro']; // 最低2つで壁打ち
      
    case 'premium':
      return baseOrder.filter(p => !p.includes('flash')); // 軽量モデルを除外
      
    case 'critical':
      return baseOrder.filter(p => !p.includes('flash')); // 軽量モデルを除外
      
    case 'basic':
    default:
      // 基本的なクエリ: 標準モデル
      return ['gemini-2.5-pro', 'gpt-5-codex'];
  }
}

export async function invokeProvider(
  emit: StreamEmit,
  isSimpleQuery: (q: string) => boolean,
  provider: LLMProvider, prompt: string, providerName: string): Promise<LLMResponse> {
  // Emit event: Provider execution start
  emit('provider:start', {
    provider: providerName,
    prompt: prompt.substring(0, 200),
    timestamp: Date.now()
  });

  let response: LLMResponse;
  switch (providerName) {
    case 'gemini-2.5-pro':
      response = await invokeGemini(emit, prompt, '2.5-pro');
      break;
    case 'gpt-5-codex':
      response = await invokeGPT5(emit, isSimpleQuery, prompt, { model: 'gpt-5-codex', specialization: 'coding' });
      break;
    case 'gpt-5':
      response = await invokeGPT5(emit, isSimpleQuery, prompt, { model: 'gpt-5', specialization: 'general' });
      break;
    case 'sonnet-4':
      response = await invokeClaude(prompt, 'sonnet-4');
      break;
    case 'sonnet-4.6':
      response = await invokeClaude(prompt, 'sonnet-4.6');
      break;
    case 'opus-4.6':
      response = await invokeClaude(prompt, 'opus-4.6');
      break;
    case 'opus-4.8':
      response = await invokeClaude(prompt, 'opus-4.8');
      break;
    default:
      response = await provider.invoke(prompt);
  }

  // Emit event: Provider execution complete
  emit('provider:complete', {
    provider: providerName,
    response: response.content,
    confidence: response.confidence,
    timestamp: Date.now()
  });

  return response;
}