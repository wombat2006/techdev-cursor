import { JAPANESE_EMBEDDING_MODELS } from '../../types/huggingface';
import type { EmbeddingServiceConfig } from './types';

export function buildEmbeddingServiceConfig(
  config?: Partial<EmbeddingServiceConfig>
): EmbeddingServiceConfig {
  return {
    maxBatchSize: 50,
    defaultModel: JAPANESE_EMBEDDING_MODELS[0].modelPath,
    fallbackModels: JAPANESE_EMBEDDING_MODELS.slice(1, 3).map((model) => model.modelPath),
    cacheEnabled: true,
    cacheTTL: 3600000,
    ...config,
  };
}
