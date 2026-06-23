import { logger } from '../../utils/logger';
import type { InferenceRequest, InferenceResponse } from '../../types/huggingface';
import type { InferenceAnalysisRequest } from './types';

export function postProcessInferenceResponse(
  response: InferenceResponse,
  request: InferenceAnalysisRequest
): InferenceResponse {
  let processedText = response.generated_text;

  processedText = processedText
    .replace(/^(User:|Assistant:|\s*)/g, '')
    .replace(/\s*<\|endoftext\|>\s*$/g, '')
    .trim();

  if (request.options?.enforceJapanese && !/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(processedText)) {
    logger.warn('Non-Japanese output detected despite enforcement', {
      model: response.model,
      output: processedText.substring(0, 100),
    });
  }

  return {
    ...response,
    generated_text: processedText,
  };
}

export function buildInferenceRequestPayload(
  request: InferenceAnalysisRequest,
  contextualInput: string,
  selectedModel: string,
  defaultMaxTokens: number
): InferenceRequest {
  return {
    inputs: contextualInput,
    model: selectedModel,
    parameters: {
      max_new_tokens: request.parameters?.max_new_tokens || defaultMaxTokens,
      temperature: request.parameters?.temperature || 0.7,
      top_p: request.parameters?.top_p || 0.9,
      repetition_penalty: request.parameters?.repetition_penalty || 1.1,
      ...request.parameters,
    },
    options: {
      wait_for_model: true,
      use_cache: false,
      ...request.options,
    },
  };
}
