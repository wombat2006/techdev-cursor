import type { AxiosInstance } from 'axios';
import type { ModelInfo } from '../../types/huggingface';
import { logger } from '../../utils/logger';

export function mapModelInfoResponse(modelData: Record<string, unknown>): ModelInfo {
  const cardData = (modelData.cardData as Record<string, unknown> | undefined) ?? {};

  return {
    id: String(modelData.id ?? ''),
    name: String(modelData.id ?? ''),
    description: String(cardData.description ?? ''),
    pipeline_tag: String(modelData.pipeline_tag ?? ''),
    language: Array.isArray(cardData.language) ? (cardData.language as string[]) : [],
    license: String(cardData.license ?? 'unknown'),
    downloads: Number(modelData.downloads ?? 0),
    likes: Number(modelData.likes ?? 0),
    library_name: String(modelData.library_name ?? ''),
    tags: Array.isArray(modelData.tags) ? (modelData.tags as string[]) : [],
  };
}

export async function fetchModelInfo(
  httpClient: AxiosInstance,
  modelId: string
): Promise<ModelInfo> {
  try {
    logger.info('Fetching model information', { modelId });

    const response = await httpClient.get(`/models/${modelId}`);
    const modelInfo = mapModelInfoResponse(response.data as Record<string, unknown>);

    logger.info('Model information fetched successfully', { modelId });
    return modelInfo;
  } catch (error) {
    logger.error('Failed to fetch model information', {
      modelId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
