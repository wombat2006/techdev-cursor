import {
  JAPANESE_EMBEDDING_MODELS,
  TaskType,
  type JapaneseEmbeddingModel,
} from '../../types/huggingface';

export function findEmbeddingModelByPath(modelPath: string): JapaneseEmbeddingModel {
  return JAPANESE_EMBEDDING_MODELS.find((model) => model.modelPath === modelPath) || JAPANESE_EMBEDDING_MODELS[0];
}

export function detectSpecializedTerms(text: string): boolean {
  const specializedPatterns = [
    /システム|サーバ|データベース|ネットワーク/,
    /エラー|障害|異常|復旧/,
    /設定|構成|パラメータ|環境/,
    /ログ|監視|メトリクス|アラート/,
  ];

  return specializedPatterns.some((pattern) => pattern.test(text));
}

export function getRecommendedEmbeddingModel(
  text: string,
  taskType?: TaskType
): JapaneseEmbeddingModel {
  const textLength = text.length;
  const hasSpecializedTerms = detectSpecializedTerms(text);

  if (taskType === TaskType.CRITICAL || hasSpecializedTerms) {
    return JAPANESE_EMBEDDING_MODELS.find((model) => model.id === 'tohoku-bert-v3') || JAPANESE_EMBEDDING_MODELS[0];
  }

  if (textLength < 100) {
    return JAPANESE_EMBEDDING_MODELS.find((model) => model.useCase === 'sentence') || JAPANESE_EMBEDDING_MODELS[1];
  }

  if (textLength > 1000) {
    return JAPANESE_EMBEDDING_MODELS.find((model) => model.useCase === 'document') || JAPANESE_EMBEDDING_MODELS[0];
  }

  return JAPANESE_EMBEDDING_MODELS.find((model) => model.useCase === 'general') || JAPANESE_EMBEDDING_MODELS[0];
}
