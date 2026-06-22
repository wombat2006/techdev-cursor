/**
 * Wall-Bounce shared types (SRP module)
 */
export type TaskType = 'basic' | 'premium' | 'critical' | 'simple';
export type ExecutionMode = 'parallel' | 'sequential';

export interface LLMProvider {
  name: string;
  model: string;
  invoke: (prompt: string, options?: unknown) => Promise<LLMResponse>;
}

export interface LLMResponse {
  content: string;
  confidence: number;
  reasoning: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total?: number;
  };
  provider?: string;
}

export interface WallBounceResult {
  consensus: {
    content: string;
    confidence: number;
    reasoning: string;
  };
  llm_votes: Array<{
    provider: string;
    model: string;
    response: LLMResponse;
    agreement_score: number;
  }>;
  total_cost: number;
  processing_time_ms: number;
  debug: {
    wall_bounce_verified: boolean;
    providers_used: string[];
    tier_escalated: boolean;
    provider_errors?: string[];
    depth_executed?: number;
  };
  flow_details?: WallBounceFlowDetails;
}

export interface WallBounceFlowDetails {
  user_query: {
    original_prompt: string;
    timestamp: string;
    options: ExecuteOptions;
  };
  llm_interactions: Array<{
    step: number;
    provider: string;
    input_prompt: string;
    output_response: string;
    confidence: number;
    processing_time_ms: number;
    timestamp: string;
    accumulated_context?: string;
  }>;
  aggregation: {
    input_responses: Array<{
      provider: string;
      content: string;
      confidence: number;
    }>;
    aggregator_prompt: string;
    final_response: string;
    timestamp: string;
  };
}

export interface ExecuteOptions {
  taskType?: TaskType;
  minProviders?: number;
  maxProviders?: number;
  mode?: ExecutionMode;
  depth?: number;
  onThinking?: (provider: string, step: string, content: string) => void;
  onProviderResponse?: (provider: string, response: string) => void;
  onConsensusUpdate?: (score: number) => void;
}

export type StreamEmit = (event: string, payload: Record<string, unknown>) => void;

export interface ProviderEntry {
  name: string;
  handler: LLMProvider;
}

export interface AggregateEscalationResult {
  response: LLMResponse;
  aggregatorKey: string;
  tierEscalated: boolean;
}
