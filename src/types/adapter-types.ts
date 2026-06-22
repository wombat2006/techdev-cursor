import type { InferenceProfile } from './inference-profile';
import type { ProviderInvokeMetadata } from './provider-invoke-metadata';

export type { ProviderInvokeMetadata, TokenUsage } from './provider-invoke-metadata';

export type ProviderId = 'claude' | 'codex' | 'agy';

export interface AdapterRequest {
  prompt: string;
  context?: string;
  profile: InferenceProfile;
  workingDirectory?: string;
}

export interface AdapterResult {
  success: boolean;
  content?: string;
  error?: string;
  executionTimeMs: number;
  provider: ProviderId;
  model?: string;
  /** TS-26 — parsed CLI metadata when available. */
  metadata?: ProviderInvokeMetadata;
}

export interface ProviderAdapter {
  readonly providerId: ProviderId;
  invoke(request: AdapterRequest): Promise<AdapterResult>;
}
