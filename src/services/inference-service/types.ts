import type { InferenceRequest, InferenceResponse, TaskType } from '../../types/huggingface';

export interface InferenceServiceConfig {
  defaultModel: string;
  fallbackModels: string[];
  maxRetries: number;
  timeoutMs: number;
  rateLimitPerMinute: number;
}

export interface ModelTierConfig {
  [TaskType.BASIC]: string[];
  [TaskType.PREMIUM]: string[];
  [TaskType.CRITICAL]: string[];
}

export interface ConversationContext {
  conversationId: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  metadata: {
    model: string;
    taskType: TaskType;
    totalTokens: number;
    cost: number;
  };
}

export interface InferenceAnalysisRequest extends InferenceRequest {
  taskType?: TaskType;
  conversationId?: string;
  context?: string;
  options?: InferenceRequest['options'] & {
    includeSystemContext?: boolean;
    enforceJapanese?: boolean;
    maxContextLength?: number;
  };
}

export interface InferenceAnalysisResponse extends InferenceResponse {
  analysis: {
    confidence: number;
    relevance: number;
    completeness: number;
    recommendedFollowUp?: string[];
  };
  conversation?: {
    conversationId: string;
    continuationAvailable: boolean;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    budgetUsed: number;
  };
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}
