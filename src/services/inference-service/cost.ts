import type { InferenceResponse } from '../../types/huggingface';

export function calculateInferenceCost(response: InferenceResponse, model: string) {
  const baseCostPerToken = 0.00001;
  const inputCost = response.usage.inputTokens * baseCostPerToken;
  const outputCost = response.usage.outputTokens * baseCostPerToken * 2;
  const modelAdjustment = model.includes('critical') ? 1.75 : model.includes('premium') ? 1.3 : 1;
  const totalCost = (inputCost + outputCost) * modelAdjustment;

  return {
    inputCost,
    outputCost,
    totalCost,
    budgetUsed: 0.01,
  };
}
