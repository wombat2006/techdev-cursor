import type { SafetyMetrics } from './types';

export function getRecentMetrics(
  metricsHistory: SafetyMetrics[],
  minutes: number
): SafetyMetrics[] {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  return metricsHistory.filter((m) => m.timestamp >= cutoffTime);
}

export function calculateAverageLatency(metrics: SafetyMetrics[]): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((total, m) => total + m.avgLatency, 0);
  return Math.round(sum / metrics.length);
}

export function calculate5MinuteErrorRate(metricsHistory: SafetyMetrics[]): number {
  const recentMetrics = getRecentMetrics(metricsHistory, 5);
  if (recentMetrics.length === 0) return 0;

  const totalRequests = recentMetrics.reduce((sum, m) => sum + m.srpRequests, 0);
  const totalErrors = recentMetrics.reduce((sum, m) => sum + m.srpErrorCount, 0);

  return totalRequests > 0 ? totalErrors / totalRequests : 0;
}

export function trimMetricsHistory(
  metrics: SafetyMetrics[],
  maxEntries: number = 100
): SafetyMetrics[] {
  return metrics.length > maxEntries ? metrics.slice(-maxEntries) : metrics;
}
