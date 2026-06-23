import type { HfInference } from '@huggingface/inference';
import {
  JAPANESE_EMBEDDING_MODELS,
  type EmbeddingRequest,
  type EmbeddingResponse,
} from '../../types/huggingface';
import { logger } from '../../utils/logger';
import { estimateTokenCount } from './token-estimation';

export async function generateEmbeddingsWithClient(
  hf: HfInference,
  request: EmbeddingRequest
): Promise<EmbeddingResponse> {
  const startTime = Date.now();
  const model = request.model || JAPANESE_EMBEDDING_MODELS[0].modelPath;

  try {
    logger.info('Generating embeddings', {
      model,
      textCount: Array.isArray(request.text) ? request.text.length : 1,
    });

    const response = await hf.featureExtraction({
      model,
      inputs: request.text,
    });

    const embeddings = Array.isArray(response[0])
      ? (response as number[][])
      : [response as number[]];
    const processingTime = Date.now() - startTime;

    const result: EmbeddingResponse = {
      embeddings,
      model,
      usage: {
        tokenCount: estimateTokenCount(request.text),
        processingTime,
      },
    };

    logger.info('Embeddings generated successfully', {
      model,
      embeddingCount: embeddings.length,
      dimensions: embeddings[0]?.length,
      processingTime,
    });

    return result;
  } catch (error) {
    logger.error('Failed to generate embeddings', {
      model,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
