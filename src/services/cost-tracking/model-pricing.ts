import { TaskType } from '../../types/huggingface';

export type ModelPricing = { inputPrice: number; outputPrice: number };

export function createDefaultModelPricing(): Map<string, ModelPricing> {
  return new Map([
    ['cl-tohoku/bert-base-japanese-v3', { inputPrice: 0.00001, outputPrice: 0.00001 }],
    ['sonoisa/sentence-bert-base-ja-mean-tokens-v2', { inputPrice: 0.00001, outputPrice: 0.00001 }],
    ['colorfulscoop/sbert-base-ja', { inputPrice: 0.00001, outputPrice: 0.00001 }],
    ['rinna/japanese-roberta-base', { inputPrice: 0.00001, outputPrice: 0.00001 }],
    ['rinna/japanese-gpt2-medium', { inputPrice: 0.00002, outputPrice: 0.00004 }],
    ['microsoft/DialoGPT-medium', { inputPrice: 0.00002, outputPrice: 0.00004 }],
  ]);
}

export function calculateModelCost(
  modelPricing: Map<string, ModelPricing>,
  model: string,
  inputTokens: number,
  outputTokens: number,
  taskType: TaskType = TaskType.BASIC
): number {
  const pricing = modelPricing.get(model) || { inputPrice: 0.00001, outputPrice: 0.00002 };
  let baseCost = inputTokens * pricing.inputPrice + outputTokens * pricing.outputPrice;
  switch (taskType) {
    case TaskType.PREMIUM:
      baseCost *= 1.5;
      break;
    case TaskType.CRITICAL:
      baseCost *= 2.0;
      break;
    default:
      break;
  }
  return Number(baseCost.toFixed(6));
}
