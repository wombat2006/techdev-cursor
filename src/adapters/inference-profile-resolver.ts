import type { ProviderId } from '../types/adapter-types';
import type {
  AnalyzeToolInput,
  InferencePreset,
  InferenceProfile,
} from '../types/inference-profile';

/** Hardcoded presets until config/inference-profiles.json (Track A-2). */
const PRESETS: Record<InferencePreset, InferenceProfile> = {
  fast: { model: 'gemini-2.5-flash', effort: 'low', temperature: 0.2, cot: 'off' },
  balanced: { model: 'sonnet', effort: 'medium', temperature: 0.5, cot: 'brief' },
  deep: { model: 'sonnet', effort: 'high', temperature: 0.3, cot: 'brief' },
  critical: { model: 'opus', effort: 'max', temperature: 0.2, cot: 'brief' },
};

const PROVIDER_DEFAULT_PRESET: Record<ProviderId, InferencePreset> = {
  claude: 'balanced',
  codex: 'balanced',
  agy: 'fast',
};

/** Provider-native default models per preset (shared PRESETS.model is legacy placeholder). */
const PROVIDER_PRESET_MODEL: Record<ProviderId, Record<InferencePreset, string>> = {
  claude: {
    fast: 'haiku',
    balanced: 'sonnet',
    deep: 'sonnet',
    critical: 'opus',
  },
  codex: {
    fast: 'gpt-5.5',
    balanced: 'gpt-5.5',
    deep: 'gpt-5.5',
    critical: 'gpt-5.5',
  },
  agy: {
    fast: 'gemini-2.5-flash',
    balanced: 'gemini-2.5-flash',
    deep: 'gemini-2.5-pro',
    critical: 'gemini-2.5-pro',
  },
};

const CLAUDE_MODEL_ALIASES: Record<string, string> = {
  haiku: 'haiku',
  sonnet: 'sonnet',
  opus: 'opus',
  'sonnet-4.5': 'sonnet',
  'claude-sonnet-4-5-20250929': 'sonnet',
};

const CODEX_MODEL_ALIASES: Record<string, string> = {
  codex: 'gpt-5-codex',
  'gpt-5-codex': 'gpt-5-codex',
  'gpt-5': 'gpt-5',
  'gpt-5.5': 'gpt-5.5',
};

const AGY_MODEL_ALIASES: Record<string, string> = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.5-pro': 'gemini-2.5-pro',
};

export function resolveModelAlias(provider: ProviderId, model?: string): string | undefined {
  if (!model) return undefined;
  const key = model.toLowerCase();
  switch (provider) {
    case 'claude':
      return CLAUDE_MODEL_ALIASES[key] ?? model;
    case 'codex':
      return CODEX_MODEL_ALIASES[key] ?? model;
    case 'agy':
      return AGY_MODEL_ALIASES[key] ?? model;
    default:
      return model;
  }
}

export function resolveInferenceProfile(
  provider: ProviderId,
  input: Pick<
    AnalyzeToolInput,
    'preset' | 'model' | 'effort' | 'cot' | 'temperature'
  >
): InferenceProfile {
  const presetName = input.preset ?? PROVIDER_DEFAULT_PRESET[provider];
  const base = { ...PRESETS[presetName] };

  if (input.model) {
    base.model = resolveModelAlias(provider, input.model);
  } else {
    base.model = resolveModelAlias(provider, PROVIDER_PRESET_MODEL[provider][presetName]);
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
