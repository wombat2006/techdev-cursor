import type { JapaneseEmbeddingModel } from '../../types/huggingface';

export interface EmbeddingServiceConfig {
  maxBatchSize: number;
  defaultModel: string;
  fallbackModels: string[];
  cacheEnabled: boolean;
  cacheTTL: number;
}

export interface EmbeddingAnalysisRequest {
  text: string | string[];
  models?: string[];
  options?: {
    compareModels?: boolean;
    normalizeResults?: boolean;
    includeMetadata?: boolean;
  };
}

export interface EmbeddingAnalysisResultItem {
  model: string;
  embeddings: number[][];
  dimensions: number;
  similarity?: number;
  metadata: {
    modelInfo: JapaneseEmbeddingModel;
    processingTime: number;
    tokenCount: number;
  };
}

export interface EmbeddingAnalysisResponse {
  results: EmbeddingAnalysisResultItem[];
  comparison?: {
    bestModel: string;
    averageSimilarity: number;
    recommendation: string;
  };
}

export interface EmbeddingCacheEntry {
  embeddings: number[][];
  timestamp: number;
}
