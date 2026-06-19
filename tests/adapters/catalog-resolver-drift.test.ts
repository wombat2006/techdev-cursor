import type { InferencePreset } from '../../src/types/inference-profile';
import { resolveInferenceProfile } from '../../src/adapters/inference-profile-resolver';
import {
  assertConstitutionPeerMatrixComplete,
  getNativeModelFlag,
  listConstitutionPeerAdapterIds,
  listMatrixAdapterIds,
  loadAdapterPresetMatrix,
  resetCatalogLoaderCache,
} from '../../src/services/llm-model-catalog-loader';

const PRESETS: InferencePreset[] = ['fast', 'balanced', 'deep', 'critical'];

describe('catalog-resolver drift (Contract Layer)', () => {
  beforeEach(() => {
    resetCatalogLoaderCache();
  });

  it('constitution peer adapters have full preset matrix rows', () => {
    expect(() => assertConstitutionPeerMatrixComplete()).not.toThrow();
  });

  it('every matrix adapter preset references a catalog entry with nativeModelFlag', () => {
    const matrix = loadAdapterPresetMatrix();
    for (const adapterId of listMatrixAdapterIds()) {
      for (const preset of PRESETS) {
        const catalogId = matrix.adapters[adapterId][preset];
        const flag = getNativeModelFlag(catalogId);
        expect(flag).toBeDefined();
        expect(flag!.length).toBeGreaterThan(0);
      }
    }
  });

  it('resolver preset output matches matrix + catalog (no silent drift)', () => {
    const matrix = loadAdapterPresetMatrix();
    for (const adapterId of listConstitutionPeerAdapterIds()) {
      for (const preset of PRESETS) {
        const profile = resolveInferenceProfile(adapterId as 'claude' | 'codex' | 'agy', { preset });
        const expected = getNativeModelFlag(matrix.adapters[adapterId][preset]);
        expect(profile.model).toBe(expected);
      }
    }
  });

  it('explicit model aliases resolve through catalog when registered', () => {
    expect(resolveInferenceProfile('claude', { model: 'sonnet' }).model).toBe('sonnet');
    expect(resolveInferenceProfile('claude', { model: 'haiku' }).model).toBe('haiku');
    expect(resolveInferenceProfile('agy', { model: 'gemini-flash' }).model).toBe('gemini-2.5-flash');
  });
});
