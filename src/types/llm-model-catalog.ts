/** TS-21 LLM Model Catalog — static vendor/model traits (not per-request InferenceProfile). */

export type VendorBillingModel =
  | 'subscription_cli'
  | 'api_key'
  | 'oauth_cli'
  | 'mixed';

export type ModelStatus = 'active' | 'planned' | 'deprecated';

export type Modality = 'text' | 'vision' | 'document' | 'audio' | 'multimodal';

export type InvocationType =
  | 'claude_cli'
  | 'codex_cli'
  | 'agy_cli'
  | 'responses_api'
  | 'openai_sdk'
  | 'anthropic_sdk'
  | 'openrouter';

export type ApiEndpoint =
  | 'responses_api'
  | 'chat_completions'
  | 'realtime_api'
  | 'cli_only';

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

export type PromptingStyle = 'minimal' | 'balanced' | 'structured' | 'agentic';

export type PromptingApproach =
  | 'outcome_first'
  | 'minimal'
  | 'balanced'
  | 'process_heavy_legacy';

export type PromptGuidanceTopic =
  | 'personality-behavior'
  | 'preamble-streaming'
  | 'outcome-first-stopping'
  | 'formatting-verbosity'
  | 'retrieval-budget-citations'
  | 'creative-guardrails'
  | 'frontend-quality'
  | 'validation-loops'
  | 'assistant-phase'
  | 'output-contract'
  | 'follow-through-policy'
  | 'instruction-priority'
  | 'missing-context-gating'
  | 'tool-persistence'
  | 'codex-autonomy'
  | 'avoid-upfront-preamble'
  | 'phase-required'
  | 'compaction-guidance'
  | 'context-gathering-batch';

export type AssistantPhaseValue = 'commentary' | 'final_answer';

export type CatalogReferenceType = 'cookbook' | 'platform_docs' | 'pricing' | 'adr';

export interface VendorDescriptor {
  displayName: string;
  billingModel: VendorBillingModel;
  docsUrl?: string;
  cookbookUrl?: string;
}

export interface CatalogReference {
  type: CatalogReferenceType;
  title?: string;
  slug?: string;
  url: string;
  lastReviewed?: string;
}

export interface ParamSupport {
  supported?: boolean;
  values?: string[];
  default?: string;
}

export interface PromptCachingFeature {
  supported?: boolean;
  maxTtlHours?: number;
  minCacheTokens?: number;
  automaticCaching?: boolean;
  explicitBreakpointsMax?: number;
  notes?: string;
}

export interface ApiFeatures {
  supportedEndpoints?: ApiEndpoint[];
  recommendedEndpoint?: ApiEndpoint;
  reasoningEffort?: ParamSupport;
  verbosity?: ParamSupport;
  structuredOutputs?: boolean;
  reasoningItems?: boolean;
  promptCaching?: PromptCachingFeature;
  parallelToolCalls?: boolean;
  freeFormFunctionCalling?: boolean;
  contextFreeGrammar?: boolean;
  skillsApi?: boolean;
  goals?: boolean;
  adaptiveReasoning?: boolean;
  assistantPhase?: {
    supported?: boolean;
    values?: AssistantPhaseValue[];
  };
  /** OpenAI async Batch API — offline bulk ingest/eval only */
  batchApi?: {
    supported?: boolean;
    notes?: string;
  };
}

export interface BuiltinTools {
  mcp?: boolean;
  computerUse?: boolean;
  webSearch?: boolean;
  fileSearch?: boolean;
  codeInterpreter?: boolean;
  customTool?: boolean;
  terminal?: boolean;
  applyPatch?: boolean;
}

export interface PromptingProfile {
  style?: PromptingStyle;
  approach?: PromptingApproach;
  platformGuideUrl?: string;
  /** Content-switcher key on OpenAI prompt-guidance page */
  platformGuideModel?: string;
  guidanceTopics?: PromptGuidanceTopic[];
  notes?: string;
}

export interface TokenPricingRates {
  inputUsd?: number;
  cachedInputUsd?: number;
  outputUsd?: number;
}

export interface ApiPricing {
  currency?: 'USD';
  unit?: 'per_1m_tokens';
  lastReviewed?: string;
  pricingUrl?: string;
  standard?: TokenPricingRates;
  batch?: TokenPricingRates;
  flex?: TokenPricingRates;
  priority?: TokenPricingRates;
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
  spatialReasoning?: boolean;
  documentUnderstanding?: boolean;
}

export interface ModelLimits {
  contextTokens?: number;
  maxOutputTokens?: number;
  pricingContextNote?: string;
}

export interface ModelTransport {
  invocationTypes: InvocationType[];
  preferredInvocation?: InvocationType;
  apiSurface?: 'responses_api' | 'chat_completions' | 'cli_only';
  nativeModelFlag?: string;
  /** Adapter binding id — implementation lives in src/adapters, not catalog JSON */
  invocationBindingRef?: string;
}

export interface AggregateEscalationPolicy {
  targetModelId: string;
  confidenceBelow?: number;
  peerConsensusBelow?: number;
}

export interface ModelCatalogEntry {
  id: string;
  vendor: string;
  modelFamily?: string;
  displayName: string;
  status: ModelStatus;
  replaces?: string;
  deprecatedBy?: string;
  tier: number;
  roles?: ChildTaskRole[];
  modalities?: Modality[];
  presetDefault?: 'fast' | 'balanced' | 'deep' | 'critical';
  prompting?: PromptingProfile;
  capabilities: ModelCapabilities;
  builtinTools?: BuiltinTools;
  apiFeatures?: ApiFeatures;
  limits?: ModelLimits;
  transport: ModelTransport;
  references?: CatalogReference[];
  costHint?: 'nano' | 'mini' | 'standard' | 'flagship' | 'frontier';
  /** API token pricing for cost-aware TaskRouter (OpenAI models) */
  apiPricing?: ApiPricing;
  notes?: string;
  /** Default tier → escalation target (e.g. Opus 4.6 → 4.8) */
  escalation?: AggregateEscalationPolicy;
}

export interface LlmModelCatalog {
  version: string;
  vendors: Record<string, VendorDescriptor>;
  models: ModelCatalogEntry[];
  aliases?: Record<string, string>;
  /** OpenAI Cookbook slug → model ids (from registry.yaml) */
  cookbookIndex?: Record<string, string[]>;
  /** Platform prompt-guidance topic slug → model ids */
  promptGuidanceIndex?: Record<string, string[]>;
}
