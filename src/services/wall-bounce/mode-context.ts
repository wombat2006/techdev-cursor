import type {
  AggregateEscalationResult,
  ExecuteOptions,
  LLMProvider,
  LLMResponse,
  ProviderEntry,
  TaskType,
  WallBounceFlowDetails,
  WallBounceResult,
} from './types';

/** Shared surface for parallel / sequential execution modules (SRP). */
export interface WallBounceModeContext {
  providers: Map<string, LLMProvider>;
  invokeProvider(
    provider: LLMProvider,
    prompt: string,
    providerName: string
  ): Promise<LLMResponse>;
  buildProviderPrompt(
    originalPrompt: string,
    providerName: string,
    mode: 'parallel' | 'sequential',
    previousResponses: Array<LLMResponse & { provider: string }>,
    accumulatedSummary?: string,
    currentDepth?: number,
    totalDepth?: number,
    taskType?: TaskType
  ): string;
  buildAggregatorPrompt(
    originalPrompt: string,
    responses: Array<LLMResponse & { provider: string }>,
    taskType?: TaskType,
    depth?: number
  ): string;
  buildWallBounceResult(
    providerResponses: Array<LLMResponse & { provider: string }>,
    aggregatorResponse: LLMResponse,
    aggregatorKey: string,
    providerErrors: string[],
    processingTimeMs: number,
    depth?: number,
    flowDetails?: WallBounceFlowDetails,
    tierEscalated?: boolean
  ): WallBounceResult;
  runAggregateWithEscalation(
    aggregator: LLMProvider,
    aggregatorKey: string,
    aggregatorPrompt: string,
    providerResponses: Array<LLMResponse & { provider: string }>,
    taskType: TaskType,
    options?: ExecuteOptions
  ): Promise<AggregateEscalationResult>;
  truncateForDisplay(text: string, length: number): string;
  updateSequentialSummary(
    previous: string,
    providerName: string,
    content: string,
    currentDepth?: number
  ): string;
  selectProvidersForDepth(
    providers: ProviderEntry[],
    depth: number
  ): ProviderEntry[];
}
