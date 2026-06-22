import type { ProviderId } from '../types/adapter-types';
import type {
  AnalyzeToolInput,
  InferencePreset,
  InferenceProfile,
} from '../types/inference-profile';
import {
  getNativeModelFlag,
  resolvePresetNativeModelForProvider,
} from '../services/llm-model-catalog-loader';

/** Effort / cot defaults per preset — catalog does not encode these yet. */
const PRESET_DEFAULTS: Record<InferencePreset, Pick<InferenceProfile, 'effort' | 'temperature' | 'cot'>> = {
  fast: { effort: 'low', temperature: 0.2, cot: 'off' },
  balanced: { effort: 'medium', temperature: 0.5, cot: 'brief' },
  deep: { effort: 'high', temperature: 0.3, cot: 'brief' },
  critical: { effort: 'max', temperature: 0.2, cot: 'brief' },
};

const PROVIDER_DEFAULT_PRESET: Record<ProviderId, InferencePreset> = {
  claude: 'balanced',
  codex: 'balanced',
  agy: 'fast',
};

/** Legacy alias fallbacks when name is not yet in catalog. */
const LEGACY_MODEL_ALIASES: Record<ProviderId, Record<string, string>> = {
  claude: {
    haiku: 'haiku',
    sonnet: 'sonnet',
    opus: 'opus',
    'sonnet-4.6': 'sonnet',
    'claude-sonnet-4-6': 'sonnet',
    'claude-sonnet-4-5-20250929': 'sonnet',
    'claude-opus-4-6': 'claude-opus-4-6',
    'opus-4.6': 'claude-opus-4-6',
    'opus-4.8': 'opus',
    'claude-opus-4-8': 'claude-opus-4-8',
    'claude-opus-4-1-20250805': 'opus',
  },
  codex: {
    codex: 'gpt-5-codex',
    'gpt-5-codex': 'gpt-5-codex',
    'gpt-5': 'gpt-5',
    'gpt-5.5': 'gpt-5.5',
  },
  agy: {
    flash: 'gemini-2.5-flash',
    pro: 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
  },
};

export function resolveModelAlias(provider: ProviderId, model?: string): string | undefined {
  if (!model) {
    return undefined;
  }
  const fromCatalog = getNativeModelFlag(model);
  if (fromCatalog) {
    return fromCatalog;
  }
  const key = model.toLowerCase();
  return LEGACY_MODEL_ALIASES[provider][key] ?? model;
}

export function resolveInferenceProfile(
  provider: ProviderId,
  input: Pick<
    AnalyzeToolInput,
    'preset' | 'model' | 'effort' | 'cot' | 'temperature'
  >
): InferenceProfile {
  const presetName = input.preset ?? PROVIDER_DEFAULT_PRESET[provider];
  const base: InferenceProfile = {
    ...PRESET_DEFAULTS[presetName],
    model: resolvePresetNativeModelForProvider(provider, presetName),
  };

  if (input.model) {
    base.model = resolveModelAlias(provider, input.model) ?? input.model;
  }

  if (input.effort) {
    base.effort = input.effort as InferenceProfile['effort'];
  }
  if (input.cot) {
    base.cot = input.cot;
  }
  if (input.temperature !== undefined) {
    base.temperature = input.temperature;
  }

  return base;
}

export function buildFullPrompt(prompt: string, context?: string, cot?: InferenceProfile['cot']): string {
  const parts: string[] = [];
  if (cot === 'brief') {
    parts.push('Think briefly before answering. Keep reasoning concise.');
  } else if (cot === 'full') {
    parts.push('Think step by step before giving your final answer.');
  }
  if (context) {
    parts.push(`Context:\n${context}`);
  }
  parts.push(prompt);
  return parts.join('\n\n');
}
