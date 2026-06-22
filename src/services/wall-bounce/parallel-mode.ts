import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { OPUS_AGGREGATE_PROVIDER_ESCALATION } from '../opus-aggregate-escalation';
import { providersConfig } from './config';
import type { ExecuteOptions, LLMProvider, LLMResponse, TaskType, WallBounceFlowDetails, WallBounceResult } from './types';
import type { WallBounceModeContext } from './mode-context';

export async function executeParallelMode(
  ctx: WallBounceModeContext,
  
  prompt: string,
  providers: Array<{ name: string; handler: LLMProvider }>,
  aggregator: LLMProvider,
  aggregatorKey: string,
  minProviders: number,
  startTime: number,
  taskType: 'basic' | 'premium' | 'critical' | 'simple',
  flowDetails: WallBounceFlowDetails,
  options: ExecuteOptions = {}
): Promise<WallBounceResult> {
  const providerResponses: Array<LLMResponse & { provider: string }> = [];
  const providerErrors: string[] = [];

  // Streaming thinking callback helper
  const emitThinking = (provider: string, step: string, content: string) => {
    if (options.onThinking) {
      options.onThinking(provider, step, content);
    }
  };

  const emitProviderResponse = (provider: string, response: string) => {
    if (options.onProviderResponse) {
      options.onProviderResponse(provider, response);
    }
  };

  // Wall-Bounce用のパラレル実行（タイムアウト無し）
  const providerPromises = providers.map(async ({ name, handler }) => {
    try {
      // Thinking: Provider invocation start
      emitThinking(
        'Claude Code (Orchestrator)',
        `Invoking ${name}`,
        `Preparing prompt for ${name}. Building context-aware query optimized for this provider's strengths.`
      );

      const providerPrompt = ctx.buildProviderPrompt(prompt, name, 'parallel', providerResponses, '', undefined, undefined, taskType);
      
      // Thinking: Provider execution
      emitThinking(
        name,
        'Analysis Started',
        `${name} is now processing the query. Leveraging model-specific capabilities for optimal analysis.`
      );

      // タイムアウト無しで実行
      const response = await ctx.invokeProvider(handler, providerPrompt, name);
      
      providerResponses.push({ ...response, provider: name });

      // Thinking: Provider response received
      emitThinking(
        'Claude Code (Orchestrator)',
        `${name} Response Received`,
        `Received response from ${name}. Confidence: ${(response.confidence * 100).toFixed(0)}%. Response length: ${response.content.length} characters.`
      );

      // Emit provider response for display
      emitProviderResponse(name, response.content);

    } catch (error) {
      const message = `${name}: ${error instanceof Error ? error.message : String(error)}`;
      providerErrors.push(message);
      logger.error('❌ Provider failed in parallel mode', { provider: name, error: message });

      // Thinking: Provider error
      emitThinking(
        'Claude Code (Orchestrator)',
        `${name} Error`,
        `Provider ${name} encountered an error: ${error instanceof Error ? error.message : String(error)}. Will attempt fallback if needed.`
      );
    }
  });

  await Promise.allSettled(providerPromises);

  // フォールバック機構を設定ファイルで制御
  if (config.wallBounce.enableFallback && providerResponses.length < minProviders) {
    // Thinking: Fallback initiation
    emitThinking(
      'Claude Code (Orchestrator)',
      'Fallback Initiated',
      `Only ${providerResponses.length}/${minProviders} providers succeeded. Initiating Claude Internal SDK fallback mechanism.`
    );

    logger.warn('⚠️ 外部プロバイダー不足、Claude Internalフォールバック実行', {
      available: providerResponses.length,
      required: minProviders,
      errors: providerErrors
    });

    // Claude Internalプロバイダーをフォールバックとして実行
    const fallbackProviders = [OPUS_AGGREGATE_PROVIDER_ESCALATION, 'sonnet-4'];
    for (const fallbackName of fallbackProviders) {
      if (providerResponses.length >= minProviders) break;
      
      try {
        emitThinking(
          'Claude Code (Orchestrator)',
          `Fallback: ${fallbackName}`,
          `Invoking fallback provider ${fallbackName} to meet minimum provider requirement.`
        );

        const fallbackPrompt = ctx.buildProviderPrompt(prompt, fallbackName, 'parallel', providerResponses, '', undefined, undefined, taskType);
        const fallbackResponse = await ctx.invokeProvider(
          ctx.providers.get(fallbackName)!,
          fallbackPrompt,
          fallbackName
        );
        providerResponses.push({ ...fallbackResponse, provider: fallbackName });

        emitThinking(
          'Claude Code (Orchestrator)',
          `Fallback Success: ${fallbackName}`,
          `Fallback provider ${fallbackName} completed successfully. Confidence: ${(fallbackResponse.confidence * 100).toFixed(0)}%.`
        );

        emitProviderResponse(fallbackName, fallbackResponse.content);

        logger.info('✅ Claude Internalフォールバック成功', { provider: fallbackName });
      } catch (error) {
        const message = `${fallbackName}: ${error instanceof Error ? error.message : String(error)}`;
        providerErrors.push(message);
        logger.error('❌ Claude Internalフォールバック失敗', { provider: fallbackName, error: message });

        emitThinking(
          'Claude Code (Orchestrator)',
          `Fallback Failed: ${fallbackName}`,
          `Fallback provider ${fallbackName} failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  if (providerResponses.length < minProviders) {
    const detail = providerErrors.length ? providerErrors.join('; ') : 'no provider responses';
    throw new Error(`Wall-bounce failed: Need at least ${minProviders} providers, got ${providerResponses.length}. ${detail}`);
  }

  // Thinking: Aggregation start
  emitThinking(
    'Claude Code (Orchestrator)',
    'Consensus Synthesis',
    `All providers completed. Preparing to synthesize ${providerResponses.length} responses using aggregator. Calculating consensus metrics.`
  );

  const aggregatorPrompt = ctx.buildAggregatorPrompt(prompt, providerResponses, taskType);

  emitThinking(
    aggregatorKey,
    'Final Synthesis',
    `Aggregator analyzing all provider responses. Identifying consensus patterns, resolving conflicts, and generating unified response.`
  );

  const {
    response: aggregatorResponse,
    aggregatorKey: finalAggregatorKey,
    tierEscalated,
  } = await ctx.runAggregateWithEscalation(
    aggregator,
    aggregatorKey,
    aggregatorPrompt,
    providerResponses,
    taskType,
    options
  );
  const processingTimeMs = Date.now() - startTime;

  emitThinking(
    'Claude Code (Orchestrator)',
    'Analysis Complete',
    `Wall-Bounce analysis completed in ${processingTimeMs}ms. ${providerResponses.length} providers contributed. Final consensus confidence: ${(aggregatorResponse.confidence * 100).toFixed(0)}%.${tierEscalated ? ' (Opus tier escalated 4.6→4.8)' : ''}`
  );

  if (options.onConsensusUpdate) {
    options.onConsensusUpdate(aggregatorResponse.confidence);
  }

  return ctx.buildWallBounceResult(
    providerResponses,
    aggregatorResponse,
    finalAggregatorKey,
    providerErrors,
    processingTimeMs,
    undefined,
    flowDetails,
    tierEscalated
  );
}
