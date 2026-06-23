import { TaskType } from '../../types/huggingface';
import type { InferenceAnalysisRequest } from './types';

export function buildSystemContext(taskType?: TaskType): string {
  const baseContext =
    'あなたはIT技術支援の専門家です。技術的な問題に対して正確で実用的な回答を提供してください。';

  switch (taskType) {
    case TaskType.CRITICAL:
      return `${baseContext} これは緊急度の高い問題です。迅速かつ確実な解決策を提示してください。`;
    case TaskType.PREMIUM:
      return `${baseContext} 詳細で包括的な分析と解決策を提供してください。`;
    default:
      return baseContext;
  }
}

export function prepareContextualInput(request: InferenceAnalysisRequest): string {
  let input = request.inputs;

  if (request.options?.includeSystemContext) {
    const systemContext = buildSystemContext(request.taskType);
    input = `${systemContext}\n\n${input}`;
  }

  if (request.conversationId && request.context) {
    input = `${request.context}\n\nUser: ${input}\nAssistant:`;
  }

  if (request.options?.enforceJapanese) {
    input = `日本語で回答してください。\n\n${input}`;
  }

  const maxLength = request.options?.maxContextLength || 2048;
  if (input.length > maxLength) {
    input = input.substring(input.length - maxLength);
  }

  return input;
}
