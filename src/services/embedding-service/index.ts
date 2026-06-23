export { EmbeddingService } from './service';
export { buildEmbeddingServiceConfig } from './config';
export { createTextBatches } from './batch-utils';
export {
  buildEmbeddingCacheKey,
  estimateTextsTokenCount,
  readEmbeddingCache,
  writeEmbeddingCache,
} from './cache';
export {
  detectSpecializedTerms,
  findEmbeddingModelByPath,
  getRecommendedEmbeddingModel,
} from './model-selection';
export {
  calculateCosineSimilarity,
  compareEmbeddingModelResults,
  generateModelRecommendation,
} from './similarity';
export { tryFallbackEmbeddingModels } from './fallback';
export type {
  EmbeddingAnalysisRequest,
  EmbeddingAnalysisResponse,
  EmbeddingAnalysisResultItem,
  EmbeddingCacheEntry,
  EmbeddingServiceConfig,
} from './types';

export { default } from './service';