import { findEmbeddingModelByPath } from './model-selection';
import type { EmbeddingAnalysisResultItem } from './types';

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function generateModelRecommendation(
  bestModel: EmbeddingAnalysisResultItem,
  averageSimilarity: number,
  texts: string[]
): string {
  const modelInfo = findEmbeddingModelByPath(bestModel.model);
  const textLength = texts.join(' ').length;
  const lengthDescriptor = textLength > 500 ? '長文' : '短文';

  if (averageSimilarity > 0.8) {
    return `高い一貫性（${(averageSimilarity * 100).toFixed(1)}%）。${modelInfo.name} を推奨します。（テキスト長: ${lengthDescriptor}）`;
  }

  if (averageSimilarity > 0.6) {
    return `中程度の一貫性（${(averageSimilarity * 100).toFixed(1)}%）。用途に応じてモデルを選択してください。（テキスト長: ${lengthDescriptor}）`;
  }

  return `低い一貫性（${(averageSimilarity * 100).toFixed(1)}%）。テキストの性質を考慮したモデル選択が重要です。（テキスト長: ${lengthDescriptor}）`;
}

export function compareEmbeddingModelResults(
  results: EmbeddingAnalysisResultItem[],
  texts: string[]
): {
  bestModel: string;
  averageSimilarity: number;
  recommendation: string;
} | null {
  if (results.length < 2) {
    return null;
  }

  const similarities: number[] = [];

  for (let i = 0; i < results.length - 1; i++) {
    for (let j = i + 1; j < results.length; j++) {
      similarities.push(
        calculateCosineSimilarity(results[i].embeddings[0], results[j].embeddings[0])
      );
    }
  }

  const averageSimilarity = similarities.reduce((sum, value) => sum + value, 0) / similarities.length;

  const bestModel = results.reduce((best, current) => {
    const bestScore = (best.dimensions * 1000) / best.metadata.processingTime;
    const currentScore = (current.dimensions * 1000) / current.metadata.processingTime;
    return currentScore > bestScore ? current : best;
  });

  return {
    bestModel: bestModel.model,
    averageSimilarity,
    recommendation: generateModelRecommendation(bestModel, averageSimilarity, texts),
  };
}
