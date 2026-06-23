import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { HuggingFaceConfig } from '../../types/huggingface';
import { logger } from '../../utils/logger';
import { mapAxiosErrorToHuggingFaceError } from './api-error';

export function createHuggingFaceHttpClient(huggingFaceConfig: HuggingFaceConfig): AxiosInstance {
  const httpClient = axios.create({
    baseURL: huggingFaceConfig.baseUrl,
    timeout: huggingFaceConfig.timeout || 30000,
    headers: {
      Authorization: `Bearer ${huggingFaceConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  httpClient.interceptors.request.use(
    (requestConfig) => {
      logger.info('HuggingFace API Request', {
        url: requestConfig.url,
        method: requestConfig.method,
        timestamp: new Date().toISOString(),
      });
      return requestConfig;
    },
    (error) => {
      logger.error('HuggingFace API Request Error', error);
      return Promise.reject(error);
    }
  );

  httpClient.interceptors.response.use(
    (response) => {
      logger.info('HuggingFace API Response', {
        status: response.status,
        url: response.config.url,
        timestamp: new Date().toISOString(),
      });
      return response;
    },
    (error: AxiosError) => {
      const huggingFaceError = mapAxiosErrorToHuggingFaceError(error);
      logger.error('HuggingFace API Error', huggingFaceError);
      return Promise.reject(huggingFaceError);
    }
  );

  return httpClient;
}
