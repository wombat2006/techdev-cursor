/** TS-20 InferenceProfile — preset + override model for provider adapters. */

export type InferencePreset = 'fast' | 'balanced' | 'deep' | 'critical';

export type CotPolicy = 'off' | 'brief' | 'full';

export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'minimal';

export interface InferenceProfile {
  model?: string;
  temperature?: number;
  effort?: EffortLevel;
  cot?: CotPolicy;
}

export interface AnalyzeToolInput {
  prompt: string;
  context?: string;
  preset?: InferencePreset;
  model?: string;
  effort?: string;
  cot?: CotPolicy;
  temperature?: number;
  workingDirectory?: string;
}
