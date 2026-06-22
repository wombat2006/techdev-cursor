/**
 * Opus aggregator tier: 4.6 default → 4.8 escalation (constitution quality gates).
 */

import { getAggregateEscalationPolicy } from './llm-model-catalog-loader';

export const OPUS_AGGREGATE_DEFAULT_MODEL_ID = 'claude-opus-4-6';
export const OPUS_AGGREGATE_ESCALATION_MODEL_ID = 'claude-opus-4-8';

export const OPUS_AGGREGATE_PROVIDER_DEFAULT = 'opus-4.6';
export const OPUS_AGGREGATE_PROVIDER_ESCALATION = 'opus-4.8';

export interface AggregateEscalationInput {
  aggregatorModelId: string;
  aggregatorConfidence: number;
  peerConfidences: number[];
  taskType?: string;
}

export function shouldEscalateOpusAggregate(input: AggregateEscalationInput): boolean {
  if (input.taskType === 'critical') {
    return false;
  }
  if (input.aggregatorModelId !== OPUS_AGGREGATE_DEFAULT_MODEL_ID) {
    return false;
  }

  const policy = getAggregateEscalationPolicy(OPUS_AGGREGATE_DEFAULT_MODEL_ID);
  const confidenceBelow = policy?.confidenceBelow ?? 0.7;
  const peerBelow = policy?.peerConsensusBelow ?? 0.6;

  const peerConsensus =
    input.peerConfidences.length > 0 ? Math.min(...input.peerConfidences) : 1;

  return input.aggregatorConfidence < confidenceBelow || peerConsensus < peerBelow;
}
