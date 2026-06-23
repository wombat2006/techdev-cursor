import { TaskType } from '../../types/huggingface';
import { getExpectedMinLength } from './model-selection';
import type { InferenceAnalysisRequest } from './types';

export function calculateConfidence(text: string, request: InferenceAnalysisRequest): number {
  let confidence = 0.5;

  if (text.length > 50) confidence += 0.1;
  if (text.length > 200) confidence += 0.1;

  const japaneseRatio =
    (text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length / text.length;
  confidence += japaneseRatio * 0.2;

  const technicalTerms = ['システム', 'サーバ', 'エラー', '設定', '解決', '対処'];
  const techTermCount = technicalTerms.filter((term) => text.includes(term)).length;
  confidence += (techTermCount / technicalTerms.length) * 0.1;

  if (request.taskType === TaskType.CRITICAL) {
    confidence += 0.05;
  } else if (request.taskType === TaskType.PREMIUM) {
    confidence += 0.025;
  }

  return Math.min(confidence, 1.0);
}

export function calculateRelevance(response: string, input: string): number {
  const inputWords = input.split(/\s+/);
  const responseWords = response.split(/\s+/);

  const commonWords = inputWords.filter((word) =>
    responseWords.some((responseWord) => responseWord.includes(word) || word.includes(responseWord))
  );

  return Math.min(commonWords.length / Math.max(inputWords.length, 1), 1.0);
}

export function calculateCompleteness(text: string, request: InferenceAnalysisRequest): number {
  const expectedMinLength = getExpectedMinLength(request.taskType);
  const lengthRatio = Math.min(text.length / expectedMinLength, 1.0);

  const sentenceCount = (text.match(/[。！？]/g) || []).length;
  const sentenceScore = Math.min(sentenceCount / 2, 0.5);

  return lengthRatio * 0.7 + sentenceScore * 0.3;
}

export function generateFollowUpSuggestions(
  text: string,
  request: InferenceAnalysisRequest
): string[] {
  const suggestions: string[] = [];

  if (text.includes('エラー') || text.includes('問題')) {
    suggestions.push('エラーログの詳細を確認してください');
    suggestions.push('追加の診断手順を実行しますか？');
  }

  if (text.includes('設定') || text.includes('構成')) {
    suggestions.push('設定変更の前にバックアップを作成してください');
    suggestions.push('この設定の影響範囲を確認しますか？');
  }

  if (request.taskType === TaskType.CRITICAL) {
    suggestions.push('緊急対応手順の詳細を確認しますか？');
    suggestions.push('関係者への報告は完了していますか？');
  }

  return suggestions.slice(0, 3);
}

export function analyzeInferenceResponse(text: string, request: InferenceAnalysisRequest) {
  return {
    confidence: calculateConfidence(text, request),
    relevance: calculateRelevance(text, request.inputs),
    completeness: calculateCompleteness(text, request),
    recommendedFollowUp: generateFollowUpSuggestions(text, request),
  };
}
