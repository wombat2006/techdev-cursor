import promClient from 'prom-client';
import { register } from './registry';
import { llmRequestsTotal } from './llm-metrics';
import { getModelByProvider } from './model-map';

// 壁打ち分析リクエスト総数
export const wallbounceRequestsTotal = new promClient.Counter({
  name: 'techsapo_wallbounce_requests_total',
  help: 'Total number of wall-bounce analysis requests',
  labelNames: ['task_type', 'provider', 'status'],
  registers: [register]
});

// 壁打ち合意信頼度分布
export const wallbounceConsensusConfidence = new promClient.Histogram({
  name: 'techsapo_wallbounce_consensus_confidence',
  help: 'Distribution of wall-bounce consensus confidence scores',
  buckets: [0.1, 0.3, 0.5, 0.7, 0.8, 0.85, 0.9, 0.95, 1.0],
  registers: [register]
});

// 壁打ち処理時間
export const wallbounceProcessingDuration = new promClient.Histogram({
  name: 'techsapo_wallbounce_processing_duration_seconds',
  help: 'Wall-bounce analysis processing time in seconds',
  buckets: [0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
  labelNames: ['task_type'],
  registers: [register]
});

// 壁打ち分析コスト
export const wallbounceCostUsd = new promClient.Counter({
  name: 'techsapo_wallbounce_cost_usd',
  help: 'Total cost of wall-bounce analysis in USD',
  labelNames: ['provider', 'task_type'],
  registers: [register]
});

// 壁打ち分析結果を記録
export function recordWallBounceAnalysis(
  taskType: string,
  providers: string[],
  confidence: number,
  processingTime: number,
  totalCost: number,
  status: 'success' | 'error' | 'timeout'
): void {
  // 基本メトリクス
  wallbounceRequestsTotal.inc({ task_type: taskType, provider: 'ensemble', status });
  wallbounceConsensusConfidence.observe(confidence);
  wallbounceProcessingDuration.observe({ task_type: taskType }, processingTime / 1000);
  wallbounceCostUsd.inc({ provider: 'ensemble', task_type: taskType }, totalCost);

  // プロバイダー別メトリクス
  providers.forEach(provider => {
    llmRequestsTotal.inc({ 
      provider, 
      model: getModelByProvider(provider), 
      status, 
      task_type: taskType 
    });
  });
}
