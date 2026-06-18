/** TS-21 LLM Model Catalog — static vendor/model traits (not per-request InferenceProfile). */

export type VendorBillingModel =
  | 'subscription_cli'
  | 'api_key'
  | 'oauth_cli'
  | 'mixed';

export type ModelStatus = 'active' | 'planned' | 'deprecated';

export type InvocationType =
  | 'claude_cli'
  | 'codex_cli'
  | 'agy_cli'
  | 'responses_api'
  | 'openai_sdk'
  | 'anthropic_sdk'
  | 'openrouter';

export type ChildTaskRole =
  | 'llm_analyze'
  | 'llm_codegen'
  | 'llm_agent_edit'
  | 'llm_cross_critique'
  | 'llm_aggregate'
  | 'grounding_fetch'
  | 'embedding';

export type ReasoningTier =
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'frontier';

export interface VendorDescriptor {
  displayName: string;
  billingModel: VendorBillingModel;
  docsUrl?: string;
}

export interface ModelCapabilities {
  reasoning?: ReasoningTier;
  toolUse?: boolean;
  toolSearch?: boolean;
  computerUse?: boolean;
  compaction?: boolean;
  multimodal?: boolean;
  japaneseQuality?: 'unknown' | 'fair' | 'good' | 'excellent';
  codegen?: boolean;
  longWorkflow?: boolean;
}

export interface ModelLimits {
  contextTokens?: number;
  maxOutputTokens?: number;
}

export interface ModelTransport {
  invocationTypes: InvocationType[];
  preferredInvocation?: InvocationType;
  apiSurface?: 'responses_api' | 'chat_completions' | 'cli_only';
  nativeModelFlag?: string;
}

export interface ModelCatalogEntry {
  id: string;
  vendor: string;
  displayName: string;
  status: ModelStatus;
  replaces?: string;
  deprecatedBy?: string;
  tier: number;
  roles?: ChildTaskRole[];
  presetDefault?: 'fast' | 'balanced' | 'deep' | 'critical';
  capabilities: ModelCapabilities;
  limits?: ModelLimits;
  transport: ModelTransport;
  costHint?: 'nano' | 'mini' | 'standard' | 'flagship' | 'frontier';
  notes?: string;
}

export interface LlmModelCatalog {
  version: string;
  vendors: Record<string, VendorDescriptor>;
  models: ModelCatalogEntry[];
  aliases?: Record<string, string>;
}
