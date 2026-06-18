import { resolveInferenceProfile, resolveModelAlias } from '../../src/adapters/inference-profile-resolver';

describe('inference-profile-resolver', () => {
  it('resolves agy fast preset with flash model alias', () => {
    const profile = resolveInferenceProfile('agy', { preset: 'fast' });
    expect(profile.model).toBe('gemini-2.5-flash');
    expect(profile.cot).toBe('off');
  });

  it('resolves claude balanced default', () => {
    const profile = resolveInferenceProfile('claude', {});
    expect(profile.model).toBe('sonnet');
    expect(profile.effort).toBe('medium');
  });

  it('maps sonnet alias for claude', () => {
    expect(resolveModelAlias('claude', 'sonnet-4.5')).toBe('sonnet');
  });
});
