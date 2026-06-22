import promClient from 'prom-client';
import { register } from './registry';

// LLMリクエスト総数
export const llmRequestsTotal = new promClient.Counter({
  name: 'techsapo_llm_requests_total',
  help: 'Total number of LLM provider requests',
  labelNames: ['provider', 'model', 'status', 'task_type'],
  registers: [register]
});

// LLM応答時間
export const llmResponseTime = new promClient.Histogram({
  name: 'techsapo_llm_response_time_seconds',
  help: 'LLM provider response time in seconds',
  buckets: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
  labelNames: ['provider', 'model'],
  registers: [register]
});

// LLMトークン使用量
export const llmTokenUsage = new promClient.Counter({
  name: 'techsapo_llm_token_usage_total',
  help: 'Total token usage by LLM providers',
  labelNames: ['provider', 'type', 'model'],
  registers: [register]
});

// LLM間合意スコア
export const llmAgreementScore = new promClient.Histogram({
  name: 'techsapo_llm_agreement_score',
  help: 'Agreement score between LLM providers',
  buckets: [0.0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0],
  labelNames: ['provider_pair'],
  registers: [register]
});

// LLM応答を記録
export function recordLLMResponse(
  provider: string,
  model: string,
  responseTime: number,
  inputTokens: number,
  outputTokens: number,
  _cost: number,
  _status: 'success' | 'error' | 'timeout'
): void {
  void _cost;
  void _status;
  llmResponseTime.observe({ provider, model }, responseTime / 1000);
  llmTokenUsage.inc({ provider, type: 'input', model }, inputTokens);
  llmTokenUsage.inc({ provider, type: 'output', model }, outputTokens);
}
