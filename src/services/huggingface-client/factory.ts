import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { HuggingFaceClient } from './client';

export function createHuggingFaceClient(): HuggingFaceClient {
  if (process.env.NODE_ENV === 'development' && process.env.USE_HF_MOCK === 'true') {
    const { HuggingFaceMockClient } = require('../huggingface-mock');
    logger.info('Using Hugging Face Mock Client for development');
    return new HuggingFaceMockClient(config.huggingface) as HuggingFaceClient;
  }

  return new HuggingFaceClient(config.huggingface);
}
