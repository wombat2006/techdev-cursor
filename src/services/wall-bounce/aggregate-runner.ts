import { OPUS_AGGREGATE_PROVIDER_ESCALATION, shouldEscalateOpusAggregate } from '../opus-aggregate-escalation';
import type { AggregateEscalationResult, ExecuteOptions, LLMProvider, LLMResponse, TaskType } from './types';

export interface AggregateRunnerContext {
  providers: Map<string, import('./types').LLMProvider>;
  invokeProvider(provider: LLMProvider, prompt: string, providerName: string): Promise<LLMResponse>;
}

export async function runAggregateWithEscalation(
  ctx: AggregateRunnerContext,
  aggregator: LLMProvider,
  aggregatorKey: string,
  aggregatorPrompt: string,
  providerResponses: Array<LLMResponse & { provider: string }>,
  taskType: 'basic' | 'premium' | 'critical' | 'simple',
  options: ExecuteOptions = {}
): Promise<{
  response: LLMResponse;
  aggregatorKey: string;
  tierEscalated: boolean;
}> {
  let response = await ctx.invokeProvider(aggregator, aggregatorPrompt, aggregatorKey);
  let key = aggregatorKey;
  let tierEscalated = false;

  const aggregatorModelId = ctx.providers.get(aggregatorKey)?.model ?? aggregatorKey;
  const escalate = shouldEscalateOpusAggregate({
    aggregatorModelId,
    aggregatorConfidence: response.confidence,
    peerConfidences: providerResponses.map((r) => r.confidence),
    taskType,
  });

  if (escalate) {
    const escalated = ctx.providers.get(OPUS_AGGREGATE_PROVIDER_ESCALATION);
    if (escalated) {
      if (options.onThinking) {
        options.onThinking(
          OPUS_AGGREGATE_PROVIDER_ESCALATION,
          'Opus Tier Escalation',
          `Aggregate confidence ${response.confidence.toFixed(2)} or peer consensus below gate — retrying with Opus 4.8.`
        );
      }
      response = await ctx.invokeProvider(
        escalated,
        aggregatorPrompt,
        OPUS_AGGREGATE_PROVIDER_ESCALATION
      );
      key = OPUS_AGGREGATE_PROVIDER_ESCALATION;
      tierEscalated = true;
    }
  }

  return { response, aggregatorKey: key, tierEscalated };
}
