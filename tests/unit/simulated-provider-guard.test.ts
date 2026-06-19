import {
  assertSimulatedProvidersAllowed,
  isSimulatedProvidersAllowed,
  SIMULATED_PROVIDER_LOG_TAG,
} from '../../src/utils/simulated-provider-guard';
import {
  mcp__gpt_5__deep_analysis,
  testMCPAvailability,
} from '../../src/utils/mcp-clients';

describe('simulated-provider-guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows simulate in NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TECHSAPO_ALLOW_SIMULATED_PROVIDERS;
    expect(isSimulatedProvidersAllowed()).toBe(true);
    expect(() => assertSimulatedProvidersAllowed('test')).not.toThrow();
  });

  it('blocks simulate in production-like env', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TECHSAPO_ALLOW_SIMULATED_PROVIDERS;
    expect(isSimulatedProvidersAllowed()).toBe(false);
    expect(() => assertSimulatedProvidersAllowed('mcp__gpt_5__deep_analysis')).toThrow(
      SIMULATED_PROVIDER_LOG_TAG
    );
  });

  it('testMCPAvailability never reports wallBounceReady true for simulate', async () => {
    process.env.NODE_ENV = 'test';
    const status = await testMCPAvailability();
    expect(status.simulated).toBe(true);
    expect(status.wallBounceReady).toBe(false);
  });

  it('simulated responses are tagged', async () => {
    process.env.NODE_ENV = 'test';
    const result = await mcp__gpt_5__deep_analysis({ input: 'test' });
    expect(result.simulated).toBe(true);
  });
});
