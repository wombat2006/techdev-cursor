import type { EmbeddingRequest, EmbeddingResponse } from '../../types/huggingface';
import { logger } from '../../utils/logger';
import type { HuggingFaceClient } from '../huggingface-client/client';

export async function tryFallbackEmbeddingModels(
  huggingFaceClient: HuggingFaceClient,
  fallbackModels: string[],
  texts: string[],
  options?: EmbeddingRequest['options']
): Promise<EmbeddingResponse | null> {
  for (const fallbackModel of fallbackModels) {
    try {
      logger.info(`Trying fallback model: ${fallbackModel}`);

      const response = await huggingFaceClient.generateEmbeddings({
        text: texts,
        model: fallbackModel,
        options,
      });

      logger.info(`Fallback model ${fallbackModel} succeeded`);
      return response;
    } catch (error) {
      logger.warn(`Fallback model ${fallbackModel} also failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return null;
}
