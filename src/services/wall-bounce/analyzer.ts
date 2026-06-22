/**
 * Wall-Bounce analyzer — orchestration entry (SRP facade).
 * Provider invoke, prompts, and execution modes live in sibling modules.
 */

import { EventEmitter } from 'events';
import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { OPUS_AGGREGATE_PROVIDER_ESCALATION } from '../opus-aggregate-escalation';
import { runAggregateWithEscalation } from './aggregate-runner';
import { selectAggregatorByCognitiveAnalysis } from './cognitive-analysis';
import { DEFAULT_AGGREGATOR_PROVIDER, META_PROMPT_TEMPLATE, providersConfig } from './config';
import { invokeClaude } from './claude-invoker';
import { invokeGemini, invokeGeminiFlash } from './gemini-invoker';
import { invokeGPT5 } from './gpt5-invoker';
import type { WallBounceModeContext } from './mode-context';
import { executeParallelMode } from './parallel-mode';
import {
  applyOptimizations,
  buildAggregatorPrompt,
  buildProviderPrompt,
  buildWallBounceResult,
  extractImprovements,
  selectProvidersForDepth,
  updateSequentialSummary,
  validateDepth,
} from './prompt-builder';
import { getProviderOrder, invokeProvider } from './provider-dispatch';
import { registerWallBounceProviders } from './provider-registry';
import { isSimpleQuery } from './query-classifier';
import { executeSequentialMode } from './sequential-mode';
import { truncateForDisplay } from './text-utils';
import type {
  ExecuteOptions,
  LLMProvider,
  LLMResponse,
  StreamEmit,
  TaskType,
  WallBounceFlowDetails,
  WallBounceResult,
} from './types';

export type {
  ExecuteOptions,
  LLMProvider,
  LLMResponse,
  TaskType,
  WallBounceFlowDetails,
  WallBounceResult,
} from './types';

export class WallBounceAnalyzer extends EventEmitter implements WallBounceModeContext {
  readonly providers: Map<string, LLMProvider> = new Map();
  readonly providerOrder: string[] = [];

  constructor() {
    super();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const emit: StreamEmit = (event, payload) => {
      this.emit(event, payload);
    };

    registerWallBounceProviders(this.providers, this.providerOrder, {
      invokeGemini: (prompt) => invokeGemini(emit, prompt, '2.5-pro'),
      invokeGeminiFlash: (prompt) => invokeGeminiFlash(emit, prompt),
      invokeGPT5: (prompt, sessionContext) =>
        invokeGPT5(emit, isSimpleQuery, prompt, sessionContext as Record<string, unknown> | undefined),
      invokeClaude: (prompt, version) =>
        invokeClaude(prompt, typeof version === 'string' ? version : 'sonnet-4.6'),
    });
  }

  private streamEmit: StreamEmit = (event, payload) => {
    this.emit(event, payload);
  };

  async invokeProvider(
    provider: LLMProvider,
    prompt: string,
    providerName: string
  ): Promise<LLMResponse> {
    return invokeProvider(this.streamEmit, isSimpleQuery, provider, prompt, providerName);
  }

  buildProviderPrompt = buildProviderPrompt;
  buildAggregatorPrompt = buildAggregatorPrompt;
  buildWallBounceResult = buildWallBounceResult;
  updateSequentialSummary = updateSequentialSummary;
  selectProvidersForDepth = selectProvidersForDepth;
  truncateForDisplay = truncateForDisplay;

  runAggregateWithEscalation = (
    aggregator: LLMProvider,
    aggregatorKey: string,
    aggregatorPrompt: string,
    providerResponses: Array<LLMResponse & { provider: string }>,
    taskType: TaskType,
    options: ExecuteOptions = {}
  ) =>
    runAggregateWithEscalation(
      { providers: this.providers, invokeProvider: this.invokeProvider.bind(this) },
      aggregator,
      aggregatorKey,
      aggregatorPrompt,
      providerResponses,
      taskType,
      options
    );

  async executeWallBounce(prompt: string, options: ExecuteOptions = {}): Promise<WallBounceResult> {
    const startTime = Date.now();

    let taskType: TaskType = options.taskType || 'basic';
    if (isSimpleQuery(prompt)) {
      taskType = 'simple';
      logger.info('🎯 シンプルクエリ検出 - 軽量モデルへルーティング', {
        query: prompt,
        originalTaskType: options.taskType,
        detectedTaskType: 'simple',
      });
    }

    const mode = options.mode === 'sequential' ? 'sequential' : 'parallel';
    const depth = validateDepth(options.depth, mode);

    const emitThinking = (provider: string, step: string, content: string) => {
      options.onThinking?.(provider, step, content);
    };

    emitThinking(
      'Claude Code (Orchestrator)',
      'Analyzing User Request',
      `Received query: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}". Parsing intent and extracting key technical requirements.`
    );

    const flowDetails: WallBounceFlowDetails = {
      user_query: {
        original_prompt: prompt,
        timestamp: new Date().toISOString(),
        options,
      },
      llm_interactions: [],
      aggregation: {
        input_responses: [],
        aggregator_prompt: '',
        final_response: '',
        timestamp: '',
      },
    };

    logger.info('🚀 Wall-Bounce分析開始', {
      taskType,
      mode,
      depth: mode === 'sequential' ? depth : 'N/A',
      promptPreview: prompt.substring(0, 120),
      sessionId: `wb_${Date.now()}`,
    });

    emitThinking(
      'Claude Code (Orchestrator)',
      'Provider Selection',
      `Determining optimal LLM provider order based on task type: "${taskType}".`
    );

    const providerOrder = getProviderOrder(this.providerOrder, taskType);
    const aggregatorKey = await selectAggregatorByCognitiveAnalysis(prompt, taskType);
    const aggregator = this.providers.get(aggregatorKey);

    if (!aggregator) {
      throw new Error(`Aggregator provider (${aggregatorKey}) is not configured`);
    }

    const primaryProviders = providerOrder.filter(
      (name) =>
        name !== providersConfig.aggregatorSelection.defaultAggregator &&
        name !== providersConfig.aggregatorSelection.complexAggregator &&
        name !== OPUS_AGGREGATE_PROVIDER_ESCALATION
    );
    const taskBasedCount =
      taskType === 'basic' ? 2 : taskType === 'premium' ? 4 : primaryProviders.length;
    const minProviders = Math.max(options.minProviders ?? 2, 1);
    const maxProviders = Math.min(options.maxProviders ?? primaryProviders.length, primaryProviders.length);
    const targetCount = Math.min(Math.max(taskBasedCount, minProviders), maxProviders);

    const selectedPrimary = primaryProviders
      .slice(0, targetCount)
      .map((name) => ({ name, handler: this.providers.get(name) }))
      .filter((entry): entry is { name: string; handler: LLMProvider } => Boolean(entry.handler));

    const configMinProviders = Math.max(config.wallBounce.minProviders, 1);
    const effectiveMinProviders = Math.min(minProviders, configMinProviders);

    if (selectedPrimary.length === 0) {
      throw new Error('No available providers for wall-bounce analysis');
    }
    if (selectedPrimary.length < effectiveMinProviders) {
      throw new Error(
        `Insufficient providers available. Required: ${effectiveMinProviders}, Available: ${selectedPrimary.length}`
      );
    }

    if (mode === 'sequential') {
      return executeSequentialMode(
        this,
        prompt,
        selectedPrimary,
        aggregator,
        aggregatorKey,
        effectiveMinProviders,
        startTime,
        depth,
        flowDetails,
        options,
        taskType
      );
    }

    return executeParallelMode(
      this,
      prompt,
      selectedPrimary,
      aggregator,
      aggregatorKey,
      effectiveMinProviders,
      startTime,
      taskType,
      flowDetails,
      options
    );
  }

  async optimizePrompt(
    providerName: string,
    currentPrompt: string,
    taskType: TaskType
  ): Promise<{
    originalPrompt: string;
    optimizedPrompt: string;
    improvements: string[];
    confidence: number;
  }> {
    try {
      const metaPrompt = META_PROMPT_TEMPLATE.replace('{current_prompt}', currentPrompt)
        .replace('{provider_name}', providerName)
        .replace('{task_type}', taskType);

      if (!this.providers.get(DEFAULT_AGGREGATOR_PROVIDER)) {
        throw new Error('Aggregator provider not available for meta-prompting');
      }

      const metaResponse = await invokeClaude(metaPrompt, 'opus-4.8');
      const improvements = extractImprovements(metaResponse.content);
      const optimizedPrompt = applyOptimizations(currentPrompt, improvements);

      logger.info('✨ Meta-prompt optimization completed', {
        provider: providerName,
        improvementsCount: improvements.length,
        confidence: metaResponse.confidence,
      });

      return {
        originalPrompt: currentPrompt,
        optimizedPrompt,
        improvements,
        confidence: metaResponse.confidence,
      };
    } catch (error) {
      logger.error('❌ Meta-prompting failed', { error, providerName });
      return {
        originalPrompt: currentPrompt,
        optimizedPrompt: currentPrompt,
        improvements: [],
        confidence: 0,
      };
    }
  }
}

export const wallBounceAnalyzer = new WallBounceAnalyzer();
