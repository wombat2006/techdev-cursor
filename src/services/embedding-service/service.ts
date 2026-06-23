import {
  JAPANESE_EMBEDDING_MODELS,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type JapaneseEmbeddingModel,
  type TaskType,
} from '../../types/huggingface';
import { logger } from '../../utils/logger';
import type { HuggingFaceClient } from '../huggingface-client/client';
import { createTextBatches } from './batch-utils';
import {
  buildEmbeddingCacheKey,
  estimateTextsTokenCount,
  readEmbeddingCache,
  writeEmbeddingCache,
} from './cache';
import { buildEmbeddingServiceConfig } from './config';
import { tryFallbackEmbeddingModels } from './fallback';
import {
  findEmbeddingModelByPath,
  getRecommendedEmbeddingModel,
} from './model-selection';
import { compareEmbeddingModelResults } from './similarity';
import type {
  EmbeddingAnalysisRequest,
  EmbeddingAnalysisResponse,
  EmbeddingAnalysisResultItem,
  EmbeddingCacheEntry,
  EmbeddingServiceConfig,
} from './types';

export class EmbeddingService {
  private readonly huggingFaceClient: HuggingFaceClient;
  private readonly config: EmbeddingServiceConfig;
  private readonly embeddingCache = new Map<string, EmbeddingCacheEntry>();

  constructor(huggingFaceClient: HuggingFaceClient, config?: Partial<EmbeddingServiceConfig>) {
    this.huggingFaceClient = huggingFaceClient;
    this.config = buildEmbeddingServiceConfig(config);
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || this.config.defaultModel;
    const texts = Array.isArray(request.text) ? request.text : [request.text];

    if (this.config.cacheEnabled) {
      const cacheKey = buildEmbeddingCacheKey(texts, model);
      const cachedEmbeddings = readEmbeddingCache(
        this.embeddingCache,
        cacheKey,
        this.config.cacheTTL
      );

      if (cachedEmbeddings) {
        logger.info('Using cached embeddings', { model, textCount: texts.length });
        return {
          embeddings: cachedEmbeddings,
          model,
          usage: {
            tokenCount: estimateTextsTokenCount(texts),
            processingTime: 0,
          },
        };
      }
    }

    const batches = createTextBatches(texts, this.config.maxBatchSize);
    const allEmbeddings: number[][] = [];
    let totalProcessingTime = 0;
    let totalTokenCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing embedding batch ${i + 1}/${batches.length}`, {
        model,
        batchSize: batch.length,
      });

      try {
        const batchResponse = await this.huggingFaceClient.retryWithBackoff(async () =>
          this.huggingFaceClient.generateEmbeddings({
            text: batch,
            model,
            options: request.options,
          })
        );

        allEmbeddings.push(...batchResponse.embeddings);
        totalProcessingTime += batchResponse.usage.processingTime;
        totalTokenCount += batchResponse.usage.tokenCount;
      } catch (error) {
        logger.error(`Failed to process embedding batch ${i + 1}`, {
          model,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        const fallbackResult = await tryFallbackEmbeddingModels(
          this.huggingFaceClient,
          this.config.fallbackModels,
          batch,
          request.options
        );

        if (fallbackResult) {
          allEmbeddings.push(...fallbackResult.embeddings);
          totalProcessingTime += fallbackResult.usage.processingTime;
          totalTokenCount += fallbackResult.usage.tokenCount;
        } else {
          throw error;
        }
      }
    }

    const response: EmbeddingResponse = {
      embeddings: allEmbeddings,
      model,
      usage: {
        tokenCount: totalTokenCount,
        processingTime: totalProcessingTime,
      },
    };

    if (this.config.cacheEnabled) {
      const cacheKey = buildEmbeddingCacheKey(texts, model);
      writeEmbeddingCache(this.embeddingCache, cacheKey, allEmbeddings);
    }

    return response;
  }

  async analyzeWithMultipleModels(
    request: EmbeddingAnalysisRequest
  ): Promise<EmbeddingAnalysisResponse> {
    const models = request.models || JAPANESE_EMBEDDING_MODELS.slice(0, 3).map((model) => model.modelPath);
    const texts = Array.isArray(request.text) ? request.text : [request.text];

    logger.info('Starting multi-model embedding analysis', {
      modelCount: models.length,
      textCount: texts.length,
    });

    const results = await Promise.allSettled(
      models.map(async (modelPath): Promise<EmbeddingAnalysisResultItem> => {
        const modelInfo = findEmbeddingModelByPath(modelPath);
        const startTime = Date.now();

        const response = await this.generateEmbeddings({
          text: request.text,
          model: modelPath,
          options: {
            normalize: request.options?.normalizeResults,
          },
        });

        return {
          model: modelPath,
          embeddings: response.embeddings,
          dimensions: response.embeddings[0]?.length || 0,
          metadata: {
            modelInfo,
            processingTime: Date.now() - startTime,
            tokenCount: response.usage.tokenCount,
          },
        };
      })
    );

    const successfulResults = results
      .filter(
        (result): result is PromiseFulfilledResult<EmbeddingAnalysisResultItem> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);

    if (successfulResults.length === 0) {
      throw new Error('All embedding models failed during analysis');
    }

    const comparison =
      request.options?.compareModels && successfulResults.length > 1
        ? compareEmbeddingModelResults(successfulResults, texts) || undefined
        : undefined;

    logger.info('Multi-model embedding analysis completed', {
      successfulModels: successfulResults.length,
      totalModels: models.length,
      bestModel: comparison?.bestModel,
    });

    return {
      results: successfulResults,
      comparison,
    };
  }

  async getRecommendedModel(text: string, taskType?: TaskType): Promise<JapaneseEmbeddingModel> {
    return getRecommendedEmbeddingModel(text, taskType);
  }

  clearCache(): void {
    this.embeddingCache.clear();
    logger.info('Embedding cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.embeddingCache.size,
      keys: Array.from(this.embeddingCache.keys()),
    };
  }
}

export default EmbeddingService;
