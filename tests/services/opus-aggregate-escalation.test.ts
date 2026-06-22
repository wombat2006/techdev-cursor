import {
  OPUS_AGGREGATE_DEFAULT_MODEL_ID,
  OPUS_AGGREGATE_ESCALATION_MODEL_ID,
  shouldEscalateOpusAggregate,
} from '../../src/services/opus-aggregate-escalation';

describe('opus-aggregate-escalation', () => {
  it('escalates when aggregate confidence below 0.7 on Opus 4.6', () => {
    expect(
      shouldEscalateOpusAggregate({
        aggregatorModelId: OPUS_AGGREGATE_DEFAULT_MODEL_ID,
        aggregatorConfidence: 0.65,
        peerConfidences: [0.9, 0.85],
        taskType: 'basic',
      })
    ).toBe(true);
  });

  it('escalates when peer consensus below 0.6 on Opus 4.6', () => {
    expect(
      shouldEscalateOpusAggregate({
        aggregatorModelId: OPUS_AGGREGATE_DEFAULT_MODEL_ID,
        aggregatorConfidence: 0.85,
        peerConfidences: [0.55, 0.9],
        taskType: 'premium',
      })
    ).toBe(true);
  });

  it('does not escalate critical tasks (already on 4.8 path)', () => {
    expect(
      shouldEscalateOpusAggregate({
        aggregatorModelId: OPUS_AGGREGATE_DEFAULT_MODEL_ID,
        aggregatorConfidence: 0.5,
        peerConfidences: [0.4],
        taskType: 'critical',
      })
    ).toBe(false);
  });

  it('does not escalate when already on 4.8', () => {
    expect(
      shouldEscalateOpusAggregate({
        aggregatorModelId: OPUS_AGGREGATE_ESCALATION_MODEL_ID,
        aggregatorConfidence: 0.5,
        peerConfidences: [0.4],
        taskType: 'basic',
      })
    ).toBe(false);
  });

  it('passes when gates met on Opus 4.6', () => {
    expect(
      shouldEscalateOpusAggregate({
        aggregatorModelId: OPUS_AGGREGATE_DEFAULT_MODEL_ID,
        aggregatorConfidence: 0.8,
        peerConfidences: [0.75, 0.9],
        taskType: 'basic',
      })
    ).toBe(false);
  });
});
