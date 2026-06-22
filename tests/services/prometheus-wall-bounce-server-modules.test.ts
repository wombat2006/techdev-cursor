import { getModelByProvider } from '../../src/metrics/prometheus/model-map';
import { register } from '../../src/metrics/prometheus/registry';
import { executeWallBounceWithSRP } from '../../src/wall-bounce-server/srp-executor';

jest.mock('../../src/config/feature-flags', () => ({
  shouldUseSRPArchitecture: jest.fn(() => false),
}));

jest.mock('../../src/services/wall-bounce-analyzer', () => ({
  wallBounceAnalyzer: {
    executeWallBounce: jest.fn(async () => ({
      consensus: { content: 'ok', confidence: 0.9, reasoning: 'test' },
      debug: { providers_used: ['Gemini'], tier_escalated: false },
      llm_votes: [],
      total_cost: 0,
      processing_time_ms: 1,
      flow_details: null,
    })),
  },
}));

describe('prometheus SRP modules', () => {
  it('register exposes default techsapo metrics', () => {
    const names = register.getMetricsAsArray().map((m) => m.name);
    expect(names.some((n) => n.includes('techsapo') || n.includes('process'))).toBe(true);
  });

  it('getModelByProvider maps known providers', () => {
    expect(getModelByProvider('Gemini')).toBe('gemini-2.5-pro');
    expect(getModelByProvider('unknown')).toBe('unknown');
  });
});

describe('wall-bounce-server SRP modules', () => {
  it('executeWallBounceWithSRP delegates to legacy analyzer when SRP flag off', async () => {
    const result = await executeWallBounceWithSRP('test prompt', 'basic', { mode: 'parallel' });
    expect(result.consensus.content).toBe('ok');
  });
});
