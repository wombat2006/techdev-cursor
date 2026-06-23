import type { HfInference } from '@huggingface/inference';
import type { InferenceRequest, InferenceResponse } from '../../types/huggingface';
import { logger } from '../../utils/logger';
import { estimateTokenCount } from './token-estimation';

export async function generateInferenceWithClient(
  hf: HfInference,
  request: InferenceRequest
): Promise<InferenceResponse> {
  const startTime = Date.now();

  try {
    logger.info('Generating text inference', {
      model: request.model,
      inputLength: request.inputs.length,
    });

    const response = await hf.textGeneration({
      model: request.model,
      inputs: request.inputs,
      parameters: {
        max_new_tokens: request.parameters?.max_new_tokens || 512,
        temperature: request.parameters?.temperature || 0.7,
        top_p: request.parameters?.top_p || 0.9,
        repetition_penalty: request.parameters?.repetition_penalty || 1.1,
        return_full_text: false,
      },
      options: {
        wait_for_model: request.options?.wait_for_model ?? true,
        use_cache: request.options?.use_cache ?? true,
      },
    });

    const processingTime = Date.now() - startTime;
    const inputTokens = estimateTokenCount(request.inputs);
    const outputTokens = estimateTokenCount(response.generated_text);

    const result: InferenceResponse = {
      generated_text: response.generated_text,
      model: request.model,
      usage: {
        inputTokens,
        outputTokens,
        processingTime,
      },
    };

    logger.info('Inference generated successfully', {
      model: request.model,
      inputTokens,
      outputTokens,
      processingTime,
    });

    return result;
  } catch (error) {
    logger.error('Failed to generate inference', {
      model: request.model,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
