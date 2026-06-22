import {
  calculateCacheEfficiency,
  calculateCostEfficiency,
  calculateQueueProcessingTime,
  estimateHourlyCost,
  getAverageConfidenceScore,
  getWallBounceConsensusRate,
} from './metric-calculations';
import { getSystemMetrics } from './system-metrics';
import type { IntegrationMetricsSnapshot, MCPPerformanceMetrics } from './types';

export async function buildPerformanceMetrics(
  integrationMetrics: IntegrationMetricsSnapshot
): Promise<MCPPerformanceMetrics> {
  const systemMetrics = await getSystemMetrics();
  const totalRequests = integrationMetrics.totalRequests || 0;
  const errorRate = integrationMetrics.errorRate || 0;

  return {
    timestamp: Date.now(),
    total_requests: totalRequests,
    successful_requests: totalRequests - totalRequests * errorRate || 0,
    failed_requests: totalRequests * errorRate || 0,
    average_response_time: integrationMetrics.averageExecutionTime || 0,
    cache_hit_rate: integrationMetrics.cache_hit_rate || 0,
    cache_size: integrationMetrics.cache_size || 0,
    cache_efficiency: calculateCacheEfficiency(integrationMetrics),
    circuit_breaker_activations: integrationMetrics.circuitBreakerActivations || 0,
    active_circuit_breakers: integrationMetrics.active_circuits || [],
    queue_size: integrationMetrics.queue_size || 0,
    queue_processing_time: calculateQueueProcessingTime(integrationMetrics),
    memory_usage: systemMetrics.memory_usage,
    cpu_usage: systemMetrics.cpu_usage,
    active_connections: systemMetrics.active_connections,
    wall_bounce_consensus_rate: await getWallBounceConsensusRate(),
    average_confidence_score: await getAverageConfidenceScore(),
    estimated_cost_per_hour: estimateHourlyCost(integrationMetrics),
    cost_efficiency_score: calculateCostEfficiency(integrationMetrics),
  };
}

export function trimMetricsHistory(
  metrics: MCPPerformanceMetrics[],
  retentionMs: number = 24 * 60 * 60 * 1000
): MCPPerformanceMetrics[] {
  const cutoff = Date.now() - retentionMs;
  return metrics.filter((m) => m.timestamp > cutoff);
}
