import type { IntegrationMetricsSnapshot } from './types';

export function calculateCacheEfficiency(metrics: IntegrationMetricsSnapshot): number {
  if (!metrics.cache_hit_rate) return 0;
  return Math.min(metrics.cache_hit_rate * 1.2, 1.0);
}

export function calculateQueueProcessingTime(metrics: IntegrationMetricsSnapshot): number {
  return (metrics.queue_size || 0) * 100;
}

export async function getWallBounceConsensusRate(): Promise<number> {
  return 0.75;
}

export async function getAverageConfidenceScore(): Promise<number> {
  return 0.82;
}

export function estimateHourlyCost(metrics: IntegrationMetricsSnapshot): number {
  const requestsPerHour = (metrics.totalRequests || 0) * 120;
  return requestsPerHour * 0.001;
}

export function calculateCostEfficiency(metrics: IntegrationMetricsSnapshot): number {
  const successRate = 1 - (metrics.errorRate || 0);
  const cacheBonus = (metrics.cache_hit_rate || 0) * 0.3;
  return Math.min(successRate + cacheBonus, 1.0);
}
