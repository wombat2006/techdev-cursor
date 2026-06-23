import { TaskType } from '../../types/huggingface';
import { logger } from '../../utils/logger';
import type { HuggingFaceClient } from '../huggingface-client/client';
import { buildInferenceServiceConfig, createDefaultModelTiers } from './config';
import { prepareContextualInput } from './context-builder';
import {
  appendConversationTurn,
  buildConversationContext,
} from './conversation-store';
import { calculateInferenceCost } from './cost';
import { getDefaultMaxTokens, selectInferenceModel } from './model-selection';
import { checkRateLimit } from './rate-limit';
import { analyzeInferenceResponse } from './response-analysis';
import {
  buildInferenceRequestPayload,
  postProcessInferenceResponse,
} from './response-processing';
import type {
  ConversationContext,
  InferenceAnalysisRequest,
  InferenceAnalysisResponse,
  InferenceServiceConfig,
  ModelTierConfig,
  RateLimitEntry,
} from './types';

export class InferenceService {
  private readonly huggingFaceClient: HuggingFaceClient;
  private readonly config: InferenceServiceConfig;
  private readonly modelTiers: ModelTierConfig;
  private readonly conversationHistory = new Map<string, ConversationContext>();
  private readonly requestCounts = new Map<string, RateLimitEntry>();

  constructor(huggingFaceClient: HuggingFaceClient, config?: Partial<InferenceServiceConfig>) {
    this.huggingFaceClient = huggingFaceClient;
    this.config = buildInferenceServiceConfig(config);
    this.modelTiers = createDefaultModelTiers();
  }

  async generateInference(request: InferenceAnalysisRequest): Promise<InferenceAnalysisResponse> {
    const startTime = Date.now();

    if (!checkRateLimit(this.requestCounts, request.conversationId || 'anonymous', this.config.rateLimitPerMinute)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    const selectedModel = selectInferenceModel(
      this.modelTiers,
      request.taskType || TaskType.BASIC,
      this.config.defaultModel,
      request.model
    );

    const contextualInput = prepareContextualInput(request);

    logger.info('Starting inference generation', {
      model: selectedModel,
      taskType: request.taskType,
      conversationId: request.conversationId,
      inputLength: contextualInput.length,
    });

    try {
      const inferenceRequest = buildInferenceRequestPayload(
        request,
        contextualInput,
        selectedModel,
        getDefaultMaxTokens(request.taskType)
      );

      const response = await this.huggingFaceClient.retryWithBackoff(
        async () => this.huggingFaceClient.generateInference(inferenceRequest),
        this.config.maxRetries
      );

      const processedResponse = postProcessInferenceResponse(response, request);

      if (request.conversationId) {
        appendConversationTurn(
          this.conversationHistory,
          request.conversationId,
          request,
          processedResponse,
          this.config.defaultModel
        );
      }

      const cost = calculateInferenceCost(response, selectedModel);
      const analysis = analyzeInferenceResponse(processedResponse.generated_text, request);

      const result: InferenceAnalysisResponse = {
        ...processedResponse,
        analysis,
        conversation: request.conversationId
          ? {
              conversationId: request.conversationId,
              continuationAvailable: true,
            }
          : undefined,
        cost,
      };

      logger.info('Inference generation completed', {
        model: selectedModel,
        processingTime: Date.now() - startTime,
        outputLength: processedResponse.generated_text.length,
        confidence: analysis.confidence,
      });

      return result;
    } catch (error) {
      logger.error('Inference generation failed', {
        model: selectedModel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const fallbackResponse = await this.tryFallbackInference(request, selectedModel);
      if (fallbackResponse) {
        return fallbackResponse;
      }

      throw error;
    }
  }

  async generateMultiModelInference(
    request: InferenceAnalysisRequest,
    models?: string[]
  ): Promise<Array<InferenceAnalysisResponse & { model: string }>> {
    const targetModels = models || this.modelTiers[request.taskType || TaskType.BASIC];

    logger.info('Starting multi-model inference', {
      modelCount: targetModels.length,
      taskType: request.taskType,
    });

    const results = await Promise.allSettled(
      targetModels.map(async (model) => {
        const modelRequest = { ...request, model };
        const response = await this.generateInference(modelRequest);
        return { ...response, model };
      })
    );

    const successfulResults = results
      .filter(
        (result): result is PromiseFulfilledResult<InferenceAnalysisResponse & { model: string }> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);

    if (successfulResults.length === 0) {
      throw new Error('All models failed during multi-model inference');
    }

    successfulResults.sort((a, b) => b.analysis.confidence - a.analysis.confidence);

    logger.info('Multi-model inference completed', {
      successfulModels: successfulResults.length,
      bestModel: successfulResults[0]?.model,
      bestConfidence: successfulResults[0]?.analysis.confidence,
    });

    return successfulResults;
  }

  async continueConversation(
    conversationId: string,
    userInput: string,
    options?: Partial<InferenceAnalysisRequest>
  ): Promise<InferenceAnalysisResponse> {
    const context = this.conversationHistory.get(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const request: InferenceAnalysisRequest = {
      inputs: userInput,
      model: context.metadata.model,
      taskType: context.metadata.taskType,
      conversationId,
      context: buildConversationContext(context),
      ...options,
    };

    return this.generateInference(request);
  }

  getConversationHistory(conversationId: string): ConversationContext | undefined {
    return this.conversationHistory.get(conversationId);
  }

  clearConversationHistory(conversationId: string): boolean {
    return this.conversationHistory.delete(conversationId);
  }

  getActiveConversations(): string[] {
    return Array.from(this.conversationHistory.keys());
  }

  private async tryFallbackInference(
    request: InferenceAnalysisRequest,
    failedModel: string
  ): Promise<InferenceAnalysisResponse | null> {
    const fallbackModels = this.config.fallbackModels.filter((model) => model !== failedModel);

    for (const fallbackModel of fallbackModels) {
      try {
        logger.info(`Trying fallback inference model: ${fallbackModel}`);
        return await this.generateInference({ ...request, model: fallbackModel });
      } catch (error) {
        logger.warn(`Fallback model ${fallbackModel} also failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return null;
  }
}

export default InferenceService;
