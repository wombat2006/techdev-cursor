import { HfInference } from '@huggingface/inference';
import type { AxiosInstance } from 'axios';
import {
  JAPANESE_EMBEDDING_MODELS,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type HuggingFaceConfig,
  type InferenceRequest,
  type InferenceResponse,
  type JapaneseEmbeddingModel,
  type ModelInfo,
} from '../../types/huggingface';
import { logger } from '../../utils/logger';
import { generateEmbeddingsWithClient } from './embeddings';
import { createHuggingFaceHttpClient } from './http-client';
import { generateInferenceWithClient } from './inference';
import { fetchModelInfo } from './model-info';
import { retryWithBackoff } from './retry-backoff';

export class HuggingFaceClient {
  private readonly hf: HfInference;
  private readonly httpClient: AxiosInstance;
  private readonly config: HuggingFaceConfig;

  constructor(huggingFaceConfig: HuggingFaceConfig) {
    this.config = huggingFaceConfig;
    this.hf = new HfInference(huggingFaceConfig.apiKey);
    this.httpClient = createHuggingFaceHttpClient(huggingFaceConfig);
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return generateEmbeddingsWithClient(this.hf, request);
  }

  async generateInference(request: InferenceRequest): Promise<InferenceResponse> {
    return generateInferenceWithClient(this.hf, request);
  }

  async getModelInfo(modelId: string): Promise<ModelInfo> {
    return fetchModelInfo(this.httpClient, modelId);
  }

  getAvailableEmbeddingModels(): JapaneseEmbeddingModel[] {
    return JAPANESE_EMBEDDING_MODELS;
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing HuggingFace connection');

      const testText = 'テスト';
      await this.generateEmbeddings({
        text: testText,
        model: JAPANESE_EMBEDDING_MODELS[0].modelPath,
      });

      logger.info('HuggingFace connection test successful');
      return true;
    } catch (error) {
      logger.error('HuggingFace connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retryAttempts || 3,
    initialDelay: number = 1000
  ): Promise<T> {
    return retryWithBackoff(operation, maxRetries, initialDelay);
  }
}

export default HuggingFaceClient;
