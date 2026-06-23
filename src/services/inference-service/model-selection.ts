import { TaskType } from '../../types/huggingface';
import type { ModelTierConfig } from './types';

export function selectInferenceModel(
  modelTiers: ModelTierConfig,
  taskType: TaskType,
  defaultModel: string,
  preferredModel?: string
): string {
  if (preferredModel && modelTiers[taskType].includes(preferredModel)) {
    return preferredModel;
  }

  const tierModels = modelTiers[taskType];
  return tierModels[0] || defaultModel;
}

export function getDefaultMaxTokens(taskType?: TaskType): number {
  switch (taskType) {
    case TaskType.CRITICAL:
      return 1024;
    case TaskType.PREMIUM:
      return 768;
    default:
      return 512;
  }
}

export function getExpectedMinLength(taskType?: TaskType): number {
  switch (taskType) {
    case TaskType.CRITICAL:
      return 200;
    case TaskType.PREMIUM:
      return 150;
    default:
      return 100;
  }
}
