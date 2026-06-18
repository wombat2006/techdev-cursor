import type { InferenceProfile } from './inference-profile';

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
}

export interface ProviderAdapter {
  readonly providerId: ProviderId;
  invoke(request: AdapterRequest): Promise<AdapterResult>;
}
