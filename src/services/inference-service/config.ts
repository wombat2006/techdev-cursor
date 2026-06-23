import { TaskType } from '../../types/huggingface';
import { config as environmentConfig } from '../../config/environment';
import type { InferenceServiceConfig, ModelTierConfig } from './types';

export function buildInferenceServiceConfig(
  config?: Partial<InferenceServiceConfig>
): InferenceServiceConfig {
  return {
    defaultModel: 'microsoft/DialoGPT-medium',
    fallbackModels: [
      'rinna/japanese-gpt2-medium',
      'rinna/japanese-roberta-base',
      'cl-tohoku/bert-base-japanese-v3',
    ],
    maxRetries: 3,
    timeoutMs: environmentConfig.wallBounce.enableTimeout
      ? environmentConfig.wallBounce.timeoutMs || 60000
      : Number.MAX_SAFE_INTEGER,
    rateLimitPerMinute: 60,
    ...config,
  };
}

export function createDefaultModelTiers(): ModelTierConfig {
  return {
    [TaskType.BASIC]: ['rinna/japanese-gpt2-small', 'cl-tohoku/bert-base-japanese'],
    [TaskType.PREMIUM]: [
      'rinna/japanese-gpt2-medium',
      'microsoft/DialoGPT-medium',
      'cl-tohoku/bert-base-japanese-v3',
    ],
    [TaskType.CRITICAL]: [
      'rinna/japanese-gpt2-xsmall',
      'microsoft/DialoGPT-large',
      'cl-tohoku/bert-large-japanese-v2',
    ],
  };
}
